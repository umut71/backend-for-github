import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import type { user as UserRecord, file as FileRecord } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { getFileUrl } from '../lib/s3';

type UserWithPicture = UserRecord & { profilePicture: FileRecord | null };

/** Refresh token lifetime in days. */
const REFRESH_TOKEN_TTL_DAYS = 30;

/** Password reset token lifetime in minutes. */
const RESET_TOKEN_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, username } = signupDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
      include: { profilePicture: true },
    });

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: await this.formatUserResponse(user),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profilePicture: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: await this.formatUserResponse(user),
    };
  }

  /**
   * Rotates a refresh token: validates it, revokes it, and issues a
   * brand-new access + refresh token pair (single-use tokens).
   */
  async refresh(refreshToken: string) {
    const tokenhash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshtoken.findUnique({
      where: { tokenhash },
    });

    if (!stored || stored.revokedat || stored.expiresat < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotation: the old token can never be reused.
    await this.prisma.refreshtoken.update({
      where: { id: stored.id },
      data: { revokedat: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userid },
      include: { profilePicture: true },
    });

    if (!user || user.isbanned) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: await this.formatUserResponse(user),
    };
  }

  /** Revokes the given refresh token (idempotent, best effort). */
  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshtoken.updateMany({
        where: { tokenhash: this.hashToken(refreshToken), revokedat: null },
        data: { revokedat: new Date() },
      });
    }
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profilePicture: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.formatUserResponse(user);
  }

  /**
   * Şifre sıfırlama isteği. Migration gerektirmemek için DB'de token
   * saklamak yerine kısa ömürlü (15 dk), tek kullanımlık JWT kullanılır:
   * payload'daki `pwh` (mevcut şifre hash'inin parmak izi) sayesinde
   * şifre değiştiği anda eski token otomatik geçersiz olur.
   *
   * Yanıt her zaman generic'tir (user enumeration önlenir).
   * SMTP yapılandırılmışsa (SMTP_HOST vb.) nodemailer ile e-posta atılır;
   * değilse token log'a yazılır (dev ortamı için).
   */
  async forgotPassword(email: string) {
    const genericResponse = {
      success: true,
      message:
        'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return genericResponse;

    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        purpose: 'password_reset',
        pwh: this.passwordFingerprint(user.password),
      },
      { expiresIn: `${RESET_TOKEN_TTL_MINUTES}m` },
    );

    const sent = await this.sendResetEmail(user.email, resetToken);
    if (!sent) {
      // SMTP yok: dev/test ortamında token'ı log'a yaz.
      this.logger.warn(
        `SMTP yapılandırılmamış — reset token (dev): userId=${user.id} token=${resetToken}`,
      );
    }

    return genericResponse;
  }

  /** Reset token'ı doğrular ve yeni şifreyi kaydeder. */
  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; purpose?: string; pwh?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Geçersiz veya süresi dolmuş token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new BadRequestException('Geçersiz token türü');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş token');
    }

    // Tek kullanımlık: şifre bu token üretildikten sonra değiştiyse reddet.
    if (payload.pwh !== this.passwordFingerprint(user.password)) {
      throw new BadRequestException(
        'Bu sıfırlama bağlantısı artık geçerli değil',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Güvenlik: tüm aktif oturumları (refresh token'ları) iptal et.
    await this.prisma.refreshtoken.updateMany({
      where: { userid: user.id, revokedat: null },
      data: { revokedat: new Date() },
    });

    return { success: true, message: 'Şifreniz başarıyla güncellendi.' };
  }

  /** Mevcut şifre hash'inden kısa parmak izi (token tek-kullanımlıklığı için). */
  private passwordFingerprint(passwordHash: string): string {
    return crypto
      .createHash('sha256')
      .update(passwordHash)
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * SMTP env değişkenleri tanımlıysa nodemailer ile reset e-postası atar.
   * nodemailer kurulu değilse veya SMTP yoksa false döner (graceful).
   */
  private async sendResetEmail(to: string, token: string): Promise<boolean> {
    const host = process.env.SMTP_HOST;
    if (!host) return false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });

      const appOrigin = process.env.APP_ORIGIN || 'https://buzz.app';
      const resetUrl = `${appOrigin}/reset-password?token=${encodeURIComponent(token)}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'Buzz <no-reply@buzz.app>',
        to,
        subject: 'Buzz — Şifre Sıfırlama',
        text:
          `Şifrenizi sıfırlamak için bu bağlantıyı kullanın (${RESET_TOKEN_TTL_MINUTES} dk geçerli):\n\n` +
          `${resetUrl}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayın.`,
        html:
          `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın ` +
          `(<b>${RESET_TOKEN_TTL_MINUTES} dakika</b> geçerli):</p>` +
          `<p><a href="${resetUrl}">Şifremi Sıfırla</a></p>` +
          `<p>Bu isteği siz yapmadıysanız bu e-postayı yok sayın.</p>`,
      });
      return true;
    } catch (err) {
      this.logger.warn(
        `Reset e-postası gönderilemedi: ${(err as Error).message}`,
      );
      return false;
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Issues a JWT access token + a persisted, hashed refresh token. */
  private async issueTokens(user: { id: string; email: string }) {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresat = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshtoken.create({
      data: {
        userid: user.id,
        tokenhash: this.hashToken(refreshToken),
        expiresat,
      },
    });

    return { token, refreshToken };
  }

  private async formatUserResponse(user: UserWithPicture) {
    let profilePictureUrl: string | null = null;
    if (user.profilePicture) {
      profilePictureUrl = await getFileUrl(
        user.profilePicture.cloud_storage_path,
        user.profilePicture.ispublic,
      );
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePictureUrl,
    };
  }
}
