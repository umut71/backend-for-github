import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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

@Injectable()
export class AuthService {
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
