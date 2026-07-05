export interface Recipient {
  email: string;
  name?: string;
  company?: string;
  emailSubject?: string;
  emailBody?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailResult {
  success: boolean;
  recipient: string;
  messageId?: string;
  error?: string;
}

export interface EmailResults {
  successful: EmailResult[];
  failed: EmailResult[];
}

