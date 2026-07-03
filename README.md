# Auto-Mail - Cold Email Sender for Job Hunting

An automated TypeScript/Node.js application to send personalized cold emails to multiple recipients for job hunting purposes.

## Features

- ✅ Send emails to multiple recipients automatically
- ✅ Configurable email templates with personalization
- ✅ Rate limiting with delay between emails
- ✅ Support for Gmail, Outlook, Yahoo, and other email services
- ✅ JSON-based recipient management
- ✅ Environment variable configuration
- ✅ Development mode with nodemon and TypeScript support
- ✅ Fully typed with TypeScript for better development experience
- 🤖 **Agent mode** — autonomously finds LinkedIn hiring posts, drafts a personalized cold email with Claude, and sends it (see [AI Agent Mode — Option A: LinkedIn MCP](#ai-agent-mode--option-a-linkedin-mcp) below)

## AI Agent Mode — Option A: LinkedIn MCP

On top of the static `recipients_final.json` sender above, `npm run agent` runs an autonomous pipeline: it browses LinkedIn for hiring posts, uses an LLM to write a personalized cold email per post, and keeps a MongoDB record so it never emails the same post twice.

### Option A Flow

```text
1. 🔌 Connect to a LinkedIn MCP server (mcp-config.json)
        │
        ▼
2. 🔎 A LangGraph ReAct agent (Claude + MCP tools) searches LinkedIn for
      recent posts hiring for full stack / frontend / backend roles
        │
        ▼
3. 🧹 Agent keeps only posts that explicitly mention an email address
      to send a resume/CV or cold email to, and extracts:
      postLink, postText, company, role, category, contactEmail
        │
        ▼
   For each matching post:
        │
        ├─ 4. 🗄️  Check MongoDB (`sent_emails` collection) — has this
        │        postLink already been emailed (status "sent")?
        │        ├─ Yes → ⏭️  skip (already marked done)
        │        └─ No  → continue
        │
        ├─ 5. ✍️  Claude drafts a personalized {subject, body} using the
        │        post content + your candidate profile (src/llm/candidateProfile.ts)
        │
        ├─ 6. 📤 Send the email via nodemailer, with your resume attached
        │
        └─ 7. 💾 Save a record to MongoDB:
                 { to, subject, body, postLink, status, sentAt, createdAt }
        │
        ▼
8. 📊 Print a summary (sent / skipped / failed) when all posts are processed
```

### Files involved

| File | Role |
| --- | --- |
| `mcp-config.json` | LinkedIn MCP server connection config (you fill in the real server) |
| `src/mcp/linkedinAgent.ts` | Runs the LangGraph agent that searches LinkedIn via MCP tools |
| `src/llm/generateEmail.ts` + `src/llm/candidateProfile.ts` | Drafts the cold email with Claude, grounded in your background |
| `src/db/mongo.ts` | Dedup check (`alreadySentForPost`) + `saveEmailRecord` |
| `src/email.ts` (`sendDynamicEmail`) | Sends the generated email with your resume attached |
| `src/agent.ts` | Orchestrates the whole pipeline end-to-end — the entrypoint for `npm run agent` |

### Option A Setup before running

1. Pick a LinkedIn MCP server package, `npm install` it, and fill in the `command`/`args`/`env` in `mcp-config.json`.
2. Set `ANTHROPIC_API_KEY` in `.env`.
3. Set `MONGODB_URI` (your cluster connection string) in `.env`.
4. Fill in `YOUR_NAME`, `YOUR_PHONE`, and `RESUME_PATH` in `.env` if you want the generated emails and attachment to reflect you.

### Option A Run it

```bash
npm run agent
```

## AI Agent Mode — Option B: Paste Posts Manually

If you don't want to trust a LinkedIn scraper MCP server with your credentials, there's a second entrypoint that skips MCP entirely: you paste LinkedIn post text yourself into `posts.md`, and the agent extracts the structured data with Claude instead of an MCP browsing tool. **Everything downstream is identical** — same MongoDB dedupe, same email-drafting LLM call, same send + record-save pipeline (both entrypoints call the shared `src/pipeline.ts`).

### Option B Flow

```text
1. 📄 You paste one or more raw LinkedIn post texts into posts.md
        │
        ▼
2. 🤖 Claude parses posts.md and extracts only posts that are about
      full stack / frontend / backend hiring AND mention a contact
      email for a resume/CV or cold email
        │
        ▼
3. 💾 Extracted posts are written to extracted_posts.json (for review),
      each with a stable synthetic postLink (manual:<hash>) since pasted
      posts have no real URL
        │
        ▼
   Same as Option A from here — for each matching post:
   🗄️  check Mongo dedupe → ✍️  draft email → 📤 send → 💾 save record
        │
        ▼
4. 📊 Print a summary (sent / skipped / failed)
```

### Option B Setup before running

1. Paste raw LinkedIn post text into `posts.md` (one or many posts — separators are optional, Claude splits them). Only posts mentioning a contact email will be picked up.
2. Same `.env` requirements as Option A, minus the LinkedIn MCP server: `ANTHROPIC_API_KEY`, `MONGODB_URI`, `EMAIL_USER`/`EMAIL_PASSWORD`.
3. Optionally set `POSTS_MARKDOWN_PATH` in `.env` if you want a different file than `posts.md`.

### Option B Run it

```bash
npm run agent:md
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Credentials

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` and fill in your details:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
YOUR_NAME=Your Name
YOUR_EMAIL=your-email@gmail.com
YOUR_PHONE=+1 (555) 123-4567
EMAIL_SUBJECT=Application for Software Developer Position
EMAIL_DELAY=5000
```

**Important Notes:**
- For Gmail, you need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- For other email services, check their documentation for SMTP configuration
- Keep your `.env` file secure and never commit it to version control

### 3. Configure Recipients

Edit `recipients.json` with your target companies and email addresses. You can include custom `emailSubject` and `emailBody` for each recipient:

```json
[
  {
    "email": "hr@company1.com",
    "name": "Hiring Manager",
    "company": "Company 1",
    "emailSubject": "Custom Subject Line for Company 1",
    "emailBody": "I hope this email finds you well. I am writing to express my interest in software development opportunities at Company 1.\n\nI am a passionate developer with experience in modern web technologies and I believe my skills would be a great fit for your team.\n\nI have attached my resume for your review and would welcome the opportunity to discuss how my background and expertise can contribute to your organization.\n\nThank you for your time and consideration."
  },
  {
    "email": "recruiting@company2.com",
    "name": "Recruiting Team",
    "company": "Company 2"
  }
]
```

**Note:** 
- The `emailSubject` field is optional. If not provided, it will use `EMAIL_SUBJECT` from `.env` or a default subject.
- The `emailBody` field is optional. If not provided, a default email body will be used.
- The `recipients.json` file is pre-populated with 20 top companies and personalized cold emails for each.

## Usage

### Development Mode (with nodemon and TypeScript)

```bash
npm run dev
```

This will automatically restart the script when you make changes to TypeScript files.

### Build TypeScript

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production Mode

First build the project, then run:

```bash
npm run build
npm start
```

Or run type checking without building:

```bash
npm run type-check
```

## Customization

### Email Template

You can customize both the email subject and body for each recipient by adding `emailSubject` and `emailBody` fields in `recipients.json`. If not provided, default templates will be used. You can also modify the default template in `src/index.ts` by editing the `createEmailTemplate` function.

### Email Delay

Control the delay between emails (in milliseconds) using `EMAIL_DELAY` in `.env`:

```env
EMAIL_DELAY=5000  # 5 seconds between emails
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_SERVICE` | Email service provider | `gmail` |
| `EMAIL_USER` | Your email address | Required |
| `EMAIL_PASSWORD` | Your email password/app password | Required |
| `YOUR_NAME` | Your full name | Optional |
| `YOUR_EMAIL` | Your email for signature | Optional |
| `YOUR_PHONE` | Your phone number | Optional |
| `EMAIL_SUBJECT` | Email subject line | `Application for Software Developer Position` |
| `EMAIL_DELAY` | Delay between emails (ms) | `5000` |

## File Structure

```
auto-mail/
├── src/
│   └── index.ts      # Main email sending script (TypeScript)
├── dist/             # Compiled JavaScript (generated after build)
├── recipients.json   # List of email recipients
├── package.json      # Project dependencies
├── tsconfig.json     # TypeScript configuration
├── .env              # Environment variables (create from env.example)
├── .gitignore        # Git ignore file
└── README.md         # This file
```

## Security Tips

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use App Passwords** - For Gmail and other services that support it
3. **Rate Limiting** - Use appropriate delays to avoid being flagged as spam
4. **Personalize Emails** - Generic emails are more likely to be marked as spam

## Troubleshooting

### Email not sending

- Verify your email credentials are correct
- For Gmail, ensure you're using an App Password
- Check your email service's SMTP settings
- Verify your network connection

### Connection timeout

- Check if your email service requires specific ports
- Some networks block SMTP connections
- Try using a different email service

## License

ISC

## Disclaimer

Make sure to comply with:
- CAN-SPAM Act (US)
- GDPR (EU)
- Your local email marketing regulations
- Respect recipient preferences and unsubscribe requests

Happy job hunting! 🚀

['LinkedIn', 'Google', 'Microsoft', 'Meta', 'Amazon', 'Flipkart', 'Walmart Global Tech', 'Atlassian', 'Salesforce', 'Adobe', 'PayPal', 'Visa', 'D.E. Shaw', 'Goldman Sachs', 'Uber', 'Razorpay', 'CRED', 'Zerodha', 'MakeMyTrip', 'Swiggy']
['Netflix', 'Apple', 'Airbnb', 'Stripe', 'Intuit', 'Oracle', 'VMware', 'Cisco', 'NVIDIA', 'Intel', 'Dropbox', 'Spotify', 'Coinbase', 'Shopify', 'Postman', 'Zoho', 'Freshworks', 'BrowserStack', 'Thoughtworks', 'Zoom', 'DoorDash', 'Instacart', 'PhonePe', 'Groww', 'Meesho', 'Nykaa', 'PolicyBazaar', 'Zomato', 'Paytm', 'Hasura', 'InMobi', 'FirstCry', 'Pinterest', 'Reddit', 'eBay', 'Roblox', 'Snapchat', 'Discord', 'Twitch', 'Square', 'Robinhood', 'Lyft', 'Yahoo', 'Qualcomm', 'AMD', 'BigBasket', 'Pine Labs', 'Ola', 'X (Twitter)', 'ByteDance', 'Slack']

Notion, Uber, Dropbox, Spotify,MongoDB, Datadog, Cloudera