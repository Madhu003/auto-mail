export const MAIL_SENDER_SERVICE = Symbol('MAIL_SENDER_SERVICE');

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Abstraction EntriesService depends on — swap Nodemailer for another
// provider (SES, Postmark, ...) later without touching EntriesService.
export interface MailSenderService {
  send(to: string, subject: string, body: string): Promise<SendResult>;
}
