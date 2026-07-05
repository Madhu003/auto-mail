import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OllamaHealthService {
  private readonly logger = new Logger(OllamaHealthService.name);

  constructor(private readonly config: ConfigService) {}

  // Pings the local Ollama server so a not-yet-started/still-starting Ollama
  // surfaces as a clear health result instead of a raw ECONNREFUSED deep in
  // whatever request happened to trigger it first.
  async check(): Promise<{ ok: boolean; baseUrl: string; error?: string }> {
    const baseUrl = this.config.get<string>('ollama.baseUrl')!;
    try {
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        return { ok: false, baseUrl, error: `Ollama responded with HTTP ${res.status}` };
      }
      return { ok: true, baseUrl };
    } catch {
      return {
        ok: false,
        baseUrl,
        error: `Can't reach Ollama at ${baseUrl}. Make sure the Ollama app (or \`ollama serve\`) is running.`,
      };
    }
  }

  async logStartupCheck(): Promise<void> {
    const result = await this.check();
    if (result.ok) {
      this.logger.log(`✅ Ollama reachable at ${result.baseUrl}`);
    } else {
      this.logger.warn(`⚠️ ${result.error}`);
    }
  }
}
