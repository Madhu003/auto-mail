import { SendMailOptions } from 'nodemailer';
import path from 'path';
import { transporter } from './config.js';
import { Recipient, EmailResult } from './types.js';
import { createEmailTemplate } from './utils.js';

// Renders plain-text body (with **bold** markdown and bare URLs) into HTML
// for the email's html part — the text part keeps the raw markdown as-is.
function renderHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>')
    .replace(/\n/g, '<br>');
}

// Send email to a single recipient
export async function sendEmail(recipient: Recipient): Promise<EmailResult> {
  const { subject, body } = createEmailTemplate(recipient);
  
  // Path to the resume PDF
  const resumePath = path.join(process.cwd(), 'src', 'Resume - 2025.pdf');
  
  const mailOptions: SendMailOptions = {
    from: process.env.EMAIL_USER || '',
    to: "madhusudanarya003@gmail.com", //recipient.email,
    subject: subject,
    text: body,
    html: renderHtml(body),
    attachments: [
      {
        filename: 'Resume - 2026.pdf',
        path: resumePath
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipient.email} (${recipient.name || 'N/A'}) - Message ID: ${info.messageId}`);
    return { 
      success: true, 
      recipient: recipient.email, 
      messageId: info.messageId || undefined 
    };
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Failed to send email to ${recipient.email}:`, err.message);
    return { 
      success: false, 
      recipient: recipient.email, 
      error: err.message 
    };
  }
}

