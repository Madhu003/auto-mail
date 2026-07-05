import { Module } from '@nestjs/common';
import { MAIL_SENDER_SERVICE } from './mail-sender.interface';
import { NodemailerMailSenderService } from './nodemailer-mail-sender.service';

@Module({
  providers: [{ provide: MAIL_SENDER_SERVICE, useClass: NodemailerMailSenderService }],
  exports: [MAIL_SENDER_SERVICE],
})
export class MailSenderModule {}
