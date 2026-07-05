import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OllamaHealthService } from './ollama-health.service';

@Module({
  controllers: [HealthController],
  providers: [OllamaHealthService],
  exports: [OllamaHealthService],
})
export class HealthModule {}
