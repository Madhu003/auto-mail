import fs from "fs";
import path from "path";
import { ChatAnthropic } from "@langchain/anthropic";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { JobPost } from "../types.js";

const JobPostSchema = z.object({
  postLink: z.string().describe("Direct URL to the LinkedIn post"),
  postText: z.string().describe("The relevant text/content of the post"),
  company: z.string().optional(),
  role: z.string().optional(),
  category: z.enum(["fullstack", "frontend", "backend", "other"]),
  contactEmail: z
    .string()
    .describe("The email address mentioned in the post for sending a resume/CV or cold email"),
});

const ResultSchema = z.object({
  posts: z.array(JobPostSchema),
});

let mcpClient: MultiServerMCPClient | undefined;

function loadMcpConfig(): Record<string, unknown> {
  const configPath = path.join(process.cwd(), "mcp-config.json");
  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw);
}

async function getMcpTools() {
  if (!mcpClient) {
    console.log('🔌 Connecting to LinkedIn MCP server (mcp-config.json)...');
    const config = loadMcpConfig();
    mcpClient = new MultiServerMCPClient(config as any);
  }
  const tools = await mcpClient.getTools();
  console.log(`🧰 Loaded ${tools.length} MCP tool(s): ${tools.map((t) => t.name).join(', ')}`);
  return tools;
}

// Uses the LinkedIn MCP server's tools to search for recent hiring posts for
// full stack / frontend / backend roles that mention an email address for
// sending a resume/CV or cold email, and returns them as structured JobPosts.
export async function findHiringPostsWithEmail(): Promise<JobPost[]> {
  const tools = await getMcpTools();

  const model = new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const agent = createReactAgent({
    llm: model,
    tools,
    responseFormat: ResultSchema,
  });

  const query =
    process.env.LINKEDIN_SEARCH_QUERY ||
    "full stack developer OR frontend developer OR backend developer hiring";

  console.log(`🔍 Asking the agent to search LinkedIn for: "${query}"`);
  console.log('🕵️  Agent is browsing LinkedIn via MCP tools, this may take a bit...');

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Use the available LinkedIn tools to find recent LinkedIn posts about hiring for full stack, frontend, or backend developer roles (search query: "${query}"). Only include posts that explicitly mention an email address to send a resume/CV or a cold email to. For each matching post, extract: the post URL, the relevant post text, the company (if mentioned), the role title (if mentioned), a category of fullstack/frontend/backend/other, and the contact email address. Ignore posts that don't mention an email address.`,
      },
    ],
  });

  const structured = (result as { structuredResponse?: { posts: JobPost[] } })
    .structuredResponse;
  const posts = structured?.posts ?? [];

  console.log(`📥 Agent returned ${posts.length} post(s) with a contact email:`);
  posts.forEach((p, i) => {
    console.log(`   ${i + 1}. 🏢 ${p.company || 'Unknown company'} — 💼 ${p.role || 'Unknown role'} (${p.category}) — ✉️ ${p.contactEmail}`);
    console.log(`      🔗 ${p.postLink}`);
  });

  return posts;
}
