import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import { JobPost } from '../types.js';

const ExtractedPostSchema = z.object({
  postText: z.string().describe('The relevant text of this specific post, trimmed of unrelated pasted content'),
  company: z.string().optional().describe('Hiring company name, if mentioned'),
  role: z.string().optional().describe('Role/job title being hired for, if mentioned'),
  category: z.enum(['fullstack', 'frontend', 'backend', 'other']),
  contactEmail: z
    .string()
    .describe('The email address mentioned in the post for sending a resume/CV or cold email'),
});

const ResultSchema = z.object({
  posts: z.array(ExtractedPostSchema),
});

function stableId(post: z.infer<typeof ExtractedPostSchema>): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${post.company || ''}|${post.role || ''}|${post.contactEmail}|${post.postText}`)
    .digest('hex')
    .slice(0, 16);
  return `manual:${hash}`;
}

// Parses a markdown file where the user has pasted one or more raw LinkedIn
// post texts, extracts hiring posts for full stack/frontend/backend roles
// that mention a contact email, and returns them as JobPosts. Also writes
// the extracted data to a JSON file (same idea as recipients_final.json) so
// you can inspect/edit what was picked up before emails go out.
export async function extractPostsFromMarkdown(): Promise<JobPost[]> {
  const mdPath = path.join(process.cwd(), process.env.POSTS_MARKDOWN_PATH || 'posts.md');
  console.log(`📄 Reading pasted LinkedIn posts from ${mdPath}...`);

  if (!fs.existsSync(mdPath)) {
    console.error(`❌ Error: markdown file not found at ${mdPath}`);
    return [];
  }

  const markdown = fs.readFileSync(mdPath, 'utf8').trim();
  if (!markdown) {
    console.log('🤷 The markdown file is empty — nothing to parse.');
    return [];
  }

  console.log(`🤖 Asking ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'} to parse posts out of the file...`);

  const model = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
  });
  const structuredModel = model.withStructuredOutput(ResultSchema, { name: 'extracted_posts' });

  const result = await structuredModel.invoke([
    {
      role: 'system',
      content:
        'You extract individual LinkedIn hiring posts from a block of pasted text that may contain one or many posts, possibly with extra clutter (LinkedIn UI text, "· 2nd", like/comment counts, etc). Only include posts that are about hiring for a full stack, frontend, or backend developer role AND that explicitly mention an email address to send a resume/CV or a cold email to. Ignore posts with no email address. Split multiple posts correctly even if there is no clear delimiter between them.',
    },
    {
      role: 'user',
      content: markdown,
    },
  ]);

  const extracted: z.infer<typeof ExtractedPostSchema>[] = result.posts;
  console.log(`🧹 Extracted ${extracted.length} matching post(s) with a contact email`);

  const posts: JobPost[] = extracted.map((p) => ({ ...p, postLink: stableId(p) }));

  const outPath = path.join(process.cwd(), 'extracted_posts.json');
  fs.writeFileSync(outPath, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`💾 Wrote extracted posts to ${outPath}`);

  posts.forEach((p, i) => {
    console.log(`   ${i + 1}. 🏢 ${p.company || 'Unknown company'} — 💼 ${p.role || 'Unknown role'} (${p.category}) — ✉️ ${p.contactEmail}`);
  });

  return posts;
}
