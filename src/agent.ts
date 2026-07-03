import dotenv from 'dotenv';
import { transporter } from './config.js';
import { findHiringPostsWithEmail } from './mcp/linkedinAgent.js';
import { processPosts, printSummary } from './pipeline.js';
import { closeMongo } from './db/mongo.js';

dotenv.config();

async function runAgent(): Promise<void> {
  console.log('🚀🤖 Starting LinkedIn hiring-post agent...\n');

  console.log('🔐 Checking required environment variables...');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY must be set in .env file');
    process.exit(1);
  }
  // MongoDB is temporarily disabled in src/pipeline.ts (MONGO_ENABLED = false),
  // so it's not required to run right now — re-add this check when re-enabled.
  // if (!process.env.MONGODB_URI) {
  //   console.error('❌ Error: MONGODB_URI must be set in .env file');
  //   process.exit(1);
  // }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Error: EMAIL_USER and EMAIL_PASSWORD must be set in .env file');
    process.exit(1);
  }
  console.log('✅ All required env vars present\n');

  console.log('📡 Verifying email (SMTP) connection...');
  await transporter.verify();
  console.log('✅ Email server connection verified\n');

  console.log('🔎🔗 Searching LinkedIn for hiring posts (via MCP)...\n');
  const posts = await findHiringPostsWithEmail();
  console.log(`\n📋 Found ${posts.length} candidate post(s) with a contact email\n`);

  if (posts.length === 0) {
    console.log('🤷 Nothing to do this run — no matching posts found.');
  }

  const summary = await processPosts(posts);

  await closeMongo();

  printSummary(summary);
  console.log('🏁 Agent run complete.');
}

runAgent().catch(async (error: Error) => {
  console.error('💀 Fatal error:', error);
  await closeMongo();
  process.exit(1);
});
