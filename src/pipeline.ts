import { getEmailDelay } from './config.js';
import { sendDynamicEmail } from './email.js';
import { generateColdEmail } from './llm/generateEmail.js';
import { alreadySentForPost, saveEmailRecord } from './db/mongo.js';
import { JobPost } from './types.js';

export interface PipelineSummary {
  sent: number;
  skipped: number;
  failed: number;
}

// MongoDB is temporarily disabled (Atlas auth not sorted out yet) — flip
// this back to true to re-enable the dedupe check + record saving below.
const MONGO_ENABLED = false;

// Shared per-post pipeline used by both the MCP (LinkedIn-browsing) agent and
// the markdown-paste agent: dedupe against MongoDB, draft with the LLM, send,
// and log the result — regardless of where the JobPost came from.
export async function processPosts(posts: JobPost[]): Promise<PipelineSummary> {
  const delay = getEmailDelay();
  const summary: PipelineSummary = { sent: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n────────────────────────────────────────`);
    console.log(`📨 [${i + 1}/${posts.length}] Processing post: ${post.postLink}`);

    if (MONGO_ENABLED) {
      console.log('🔍 Checking MongoDB for a previous "sent" record...');
      const alreadyHandled = await alreadySentForPost(post.postLink);
      if (alreadyHandled) {
        console.log(`⏭️  Already sent for this post — marking as done, skipping.`);
        summary.skipped++;
        continue;
      }
      console.log('🆕 No prior send found — proceeding.');
    } else {
      console.log('🚧 MongoDB dedupe check skipped (MONGO_ENABLED = false)');
    }

    console.log(`✍️  Generating email for ${post.contactEmail} (🏢 ${post.company || 'unknown company'})...`);
    const { subject, body } = await generateColdEmail(post);

    console.log(`📤 Sending email to ${post.contactEmail}...`);
    const result = await sendDynamicEmail(post.contactEmail, subject, body);

    if (result.success) {
      summary.sent++;
      console.log(`🎉 Email sent successfully to ${post.contactEmail}`);
    } else {
      summary.failed++;
      console.log(`💥 Email failed for ${post.contactEmail}: ${result.error}`);
    }

    if (MONGO_ENABLED) {
      await saveEmailRecord({
        to: post.contactEmail,
        subject,
        body,
        postLink: post.postLink,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
        sentAt: new Date(),
      });
    } else {
      console.log('🚧 MongoDB record save skipped (MONGO_ENABLED = false)');
    }

    if (i < posts.length - 1) {
      console.log(`⏳ Waiting ${delay}ms before next email...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return summary;
}

export function printSummary(summary: PipelineSummary): void {
  console.log(`\n============================================`);
  console.log('📊 SUMMARY');
  console.log(`============================================`);
  console.log(`✅ Sent:    ${summary.sent}`);
  console.log(`⏭️  Skipped: ${summary.skipped} (already sent)`);
  console.log(`❌ Failed:  ${summary.failed}`);
  console.log(`============================================`);
}
