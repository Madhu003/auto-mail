import { Module } from '@nestjs/common';
import { EMAIL_DRAFTING_SERVICE } from './email-drafting.interface';
import { OllamaEmailDraftingService } from './ollama-email-drafting.service';

@Module({
  providers: [{ provide: EMAIL_DRAFTING_SERVICE, useClass: OllamaEmailDraftingService }],
  exports: [EMAIL_DRAFTING_SERVICE],
})
export class EmailDraftingModule {}
