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

// A LinkedIn hiring post found by the agent, matched to a contact email
export interface JobPost {
  postLink: string;
  postText: string;
  company?: string;
  role?: string;
  category: "fullstack" | "frontend" | "backend" | "other";
  contactEmail: string;
}

export type EmailStatus = "sent" | "failed" | "skipped";

// A record of an email the agent has sent, stored in MongoDB for dedup + audit
export interface EmailRecord {
  to: string;
  subject: string;
  body: string;
  postLink: string;
  status: EmailStatus;
  error?: string;
  sentAt: Date;
  createdAt: Date;
}

