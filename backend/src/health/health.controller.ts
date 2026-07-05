import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OllamaHealthService } from './ollama-health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly ollamaHealth: OllamaHealthService) {}

  @Get('ollama')
  async ollama(@Res() res: Response) {
    const result = await this.ollamaHealth.check();
    res.status(result.ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(result);
  }
}
