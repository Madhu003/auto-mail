import { ChatOllama } from "@langchain/ollama";
import { z } from "zod";
import { JobPost, EmailTemplate } from "../types.js";
import { CANDIDATE_PROFILE, CANDIDATE_SIGNATURE } from "./candidateProfile.js";

const EmailSchema = z.object({
  subject: z.string().describe("A short, specific cold-email subject line, with 1-2 relevant emojis"),
  body: z
    .string()
    .describe(
      "The full email body (greeting through closing line only, no signature/sign-off — that is appended separately). Personalized to the job post, mentioning the CV is attached. Use several relevant emojis throughout, and wrap the most important details (role title, key matching skills, availability) in **bold** markdown. Structured as 3-4 short paragraphs (greeting, why you're reaching out, matching experience, closing), separated by a blank line (two newline characters) between each paragraph — never run two sentences or paragraphs together with no space or newline between them.",
    ),
});

// Defensive fixup: the model occasionally glues a paragraph straight into the
// next with zero whitespace (e.g. "Team,I'm reaching out..."). Insert a space
// wherever punctuation is immediately followed by an uppercase letter — i.e.
// a genuine new sentence, not an inline token like "Node.js" or "e.g." where
// the next character is lowercase.
function fixMissingWhitespace(text: string): string {
  return text.replace(/([,.!?:])(?=[A-Z])/g, "$1 ");
}

let model: ChatOllama | undefined;

function getModel(): ChatOllama {
  if (!model) {
    model = new ChatOllama({
      model: process.env.OLLAMA_MODEL || "llama3.2:3b",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      // Keep RAM usage down: small context window (less KV-cache memory),
      // lowVram mode, and unload the model from memory shortly after use
      // instead of Ollama's default 5m keep-alive.
      numCtx: 2048,
      lowVram: true,
      keepAlive: "2m",
    });
  }
  return model;
}

export async function generateColdEmail(post: JobPost): Promise<EmailTemplate> {
  console.log(`🤖 Generating cold email for ${post.contactEmail} via local Ollama (${process.env.OLLAMA_MODEL || "llama3.2:3b"})...`);

  const structuredModel = getModel().withStructuredOutput(EmailSchema, {
    name: "cold_email",
  });

  const result = await structuredModel.invoke([
    {
      role: "system",
      content:
        "You write concise, personalized, upbeat cold emails from a job candidate to a recruiter/hiring contact, referencing specifics from the LinkedIn hiring post. Mention that a resume/CV is attached. Keep it under 200 words, professional but warm tone. Use several relevant emojis throughout (not excessive/spammy, but noticeably present) and **bold** the most important details — the role title, the key skills that match, and availability/notice period. Do NOT include a signature, sign-off name, or closing salutation (\"Best regards\", \"Sincerely\", etc.) at the end — end right after the closing line of the message, the signature is appended separately.",
    },
    {
      role: "user",
      content: `Candidate profile:\n${CANDIDATE_PROFILE}\n\nLinkedIn hiring post (company: ${
        post.company || "unknown"
      }, role: ${post.role || "unknown"}, category: ${post.category}):\n${
        post.postText
      }\n\nWrite the subject and body for a cold email to send to ${
        post.contactEmail
      }.`,
    },
  ]);

  // Fix applied only to the LLM-generated body — never to CANDIDATE_SIGNATURE,
  // which contains URLs that a "," "." "-space" fixup would otherwise mangle.
  const body = `${fixMissingWhitespace(result.body.trim())}\n\n${CANDIDATE_SIGNATURE}`;

  console.log(`📝 Draft ready — subject: "${result.subject}"`);
  return { subject: result.subject, body };
}
