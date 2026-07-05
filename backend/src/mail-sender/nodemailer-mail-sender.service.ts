import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import { renderHtml } from '../common/utils/html-render';
import { MailSenderService, SendResult } from './mail-sender.interface';

@Injectable()
export class NodemailerMailSenderService implements MailSenderService {
  private readonly logger = new Logger(NodemailerMailSenderService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: this.config.get<string>('email.service'),
        auth: {
          user: this.config.get<string>('email.user'),
          pass: this.config.get<string>('email.password'),
        },
      });
    }
    return this.transporter;
  }

  async send(to: string, subject: string, body: string): Promise<SendResult> {
    const resumePathConfig = this.config.get<string>('resumePath')!;
    const resumePath = path.isAbsolute(resumePathConfig)
      ? resumePathConfig
      : path.join(process.cwd(), resumePathConfig);

    try {
      const info = await this.getTransporter().sendMail({
        from: this.config.get<string>('email.user'),
        to,
        subject,
        text: body,
        html: renderHtml(body),
        attachments: [{ filename: path.basename(resumePath), path: resumePath }],
      });
      this.logger.log(`Email sent to ${to} — Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
