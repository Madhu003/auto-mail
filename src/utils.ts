import fs from 'fs';
import path from 'path';
import { Recipient, EmailTemplate } from './types.js';

// Load recipients from JSON file
export function loadRecipients(): Recipient[] {
  try {
    const recipientsPath = path.join(process.cwd(), 'recipients_final.json');
    const data = fs.readFileSync(recipientsPath, 'utf8');
    return JSON.parse(data) as Recipient[];
  } catch (error) {
    const err = error as Error;
    console.error('Error reading recipients.json:', err.message);
    return [];
  }
}

// Create email template from recipient data
export function createEmailTemplate(recipient: Recipient): EmailTemplate {
  if (!recipient.emailSubject) {
    throw new Error(`Missing emailSubject for recipient: ${recipient.email}`);
  }
  if (!recipient.emailBody) {
    throw new Error(`Missing emailBody for recipient: ${recipient.email}`);
  }

  return {
    subject: recipient.emailSubject,
    body: recipient.emailBody
  };
}

