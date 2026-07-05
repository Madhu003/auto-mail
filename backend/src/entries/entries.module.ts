import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { ENTRY_REPOSITORY } from './repository/entry-repository.interface';
import { InMemoryEntryRepository } from './repository/in-memory-entry.repository';
import { EmailDraftingModule } from '../email-drafting/email-drafting.module';
import { MailSenderModule } from '../mail-sender/mail-sender.module';

@Module({
  imports: [EmailDraftingModule, MailSenderModule],
  controllers: [EntriesController],
  providers: [EntriesService, { provide: ENTRY_REPOSITORY, useClass: InMemoryEntryRepository }],
})
export class EntriesModule {}
