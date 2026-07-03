import { transporter, getEmailDelay } from './config.js';
import { loadRecipients } from './utils.js';
import { sendEmail } from './email.js';
import { EmailResults } from './types.js';

// Main function to send emails with delay between sends
async function sendEmails(): Promise<void> {
  console.log('🚀 Starting email sending process...\n');
  
  // Verify email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Error: EMAIL_USER and EMAIL_PASSWORD must be set in .env file');
    process.exit(1);
  }

  // Verify transporter
  try {
    await transporter.verify();
    console.log('✅ Email server connection verified\n');
  } catch (error) {
    const err = error as Error;
    console.error('❌ Email server connection failed:', err.message);
    process.exit(1);
  }

  const recipients = loadRecipients();
  
  if (recipients.length === 0) {
    console.error('❌ No recipients found in recipients.json');
    process.exit(1);
  }

  console.log(`📧 Found ${recipients.length} recipient(s)\n`);

  const delay = getEmailDelay();
  const results: EmailResults = { successful: [], failed: [] };

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    // recipient.email = "madhusudanarya003@gmail.com"
    // console.log(recipient);
    // continue
    const result = await sendEmail(recipient);
    
    if (result.success) {
      results.successful.push(result);
    } else {
      results.failed.push(result);
    }

    // Wait before sending next email (except for the last one)
    if (i < recipients.length - 1) {
      console.log(`⏳ Waiting 1 seconds before next email...\n`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(50));

  if (results.failed.length > 0) {
    console.log('\nFailed recipients:');
    results.failed.forEach(r => {
      console.log(`  - ${r.recipient}: ${r.error}`);
    });
  }
}

// Run the script
sendEmails().catch((error: Error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
