import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { OllamaHealthService } from './health/ollama-health.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Non-fatal — Ollama may be started after the backend; just warn if it's down.
  await app.get(OllamaHealthService).logStartupCheck();

  const config = app.get(ConfigService);
  const port = config.get<number>('port')!;
  await app.listen(port);
  console.log(`🚀 Backend listening on http://localhost:${port}/api`);
}

bootstrap();
