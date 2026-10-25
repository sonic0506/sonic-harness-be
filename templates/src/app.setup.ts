import {
  HttpStatus,
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { AppException } from './common/exceptions/app.exception.js';
import { env } from './config/env.js';

// main.ts와 e2e 테스트가 같은 설정으로 앱을 띄우도록 여기에 모아요.
export function configureApp(app: INestApplication): void {
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new AppException(
          'VALIDATION_FAILED',
          HttpStatus.BAD_REQUEST,
          '요청 값이 올바르지 않아요.',
          errors.map((error) => ({
            field: error.property,
            messages: Object.values(error.constraints ?? {}),
          })),
        ),
    }),
  );
  app.enableShutdownHooks();
  // @IsCommonCode 같은 검증기가 Nest DI로 service를 받게 해요.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  return SwaggerModule.createDocument(app, config);
}
