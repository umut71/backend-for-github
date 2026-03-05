import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { GiftsService } from './gifts/gifts.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Helmet for HTTP headers protection
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        mediaSrc: ["'self'", 'https:', 'http:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS configuration - Restrict to your domains in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8081',
    'http://localhost:19006',
    'exp://192.168.1.1',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // In development, allow all localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => allowed && origin.startsWith(allowed))) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Buzz API')
    .setDescription('Short-form vertical video sharing platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Prevent CDN/browser caching of Swagger docs
  app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Buzz API Documentation',
    customfavIcon: 'https://cdn-icons-png.flaticon.com/512/3468/3468377.png',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui { background: #fafafa; }
      .swagger-ui .info .title { color: #000000; font-weight: 700; }
      .swagger-ui .info .description { color: #333333; }
      .swagger-ui .scheme-container { background: #ffffff; }
      .swagger-ui .opblock { border: 1px solid #e0e0e0; margin: 10px 0; }
      .swagger-ui .opblock-tag { border-bottom: 2px solid #FFD700; }
      .swagger-ui .opblock.opblock-post { background: #fff8dc; border-color: #FFD700; }
      .swagger-ui .opblock.opblock-get { background: #f0f8ff; border-color: #4a90e2; }
      .swagger-ui .opblock.opblock-put { background: #fff5e6; border-color: #ff9800; }
      .swagger-ui .opblock.opblock-delete { background: #ffe6e6; border-color: #f44336; }
      .swagger-ui .btn.execute { background-color: #FFD700; color: #000000; border-color: #FFD700; }
      .swagger-ui .btn.execute:hover { background-color: #FFC700; }
    `,
  });

  await app.listen(3000);
  console.log('🚀 Buzz API is running on http://localhost:3000');
  console.log('📚 API Documentation available at http://localhost:3000/api-docs');

  // Initialize gift types on startup
  try {
    const giftsService = app.get(GiftsService);
    await giftsService.initializeGiftTypes();
    console.log('🎁 Gift types initialized');
  } catch (error) {
    console.error('❌ Failed to initialize gift types:', error?.message ?? 'Unknown error');
  }
}
bootstrap();
