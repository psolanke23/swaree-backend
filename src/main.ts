import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // CORS — must be configured BEFORE helmet
  // Allow Firebase hosting domains + localhost for dev
  const allowedOrigins = [
    'https://swaree-owner.web.app',
    'https://swaree-admin.web.app',
    'https://swaree.web.app',
    'https://swaree-de3c5.web.app',
    'https://swaree-de3c5.firebaseapp.com',
    // Add any additional origins from env var
    ...(process.env.FRONTEND_URLS ?? '').split(',').map(s => s.trim()).filter(Boolean),
  ];

  console.log('🔐 CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow all localhost ports in development
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      // Allow configured production frontend URLs
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Log rejected origins for debugging
      console.warn(`⚠️ CORS rejected origin: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Security headers — AFTER CORS setup
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Sawree API running on http://localhost:${port}/api/v1`);
}
bootstrap();
