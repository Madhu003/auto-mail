# Auto-Mail — Cold Email Drafting Web App

Paste a LinkedIn hiring post, get a personalized cold email drafted by a local LLM, review/edit it, then send — one at a time or all at once.

## Architecture

```text
backend/    NestJS REST API — draft/send orchestration
frontend/   React + Vite UI — paste posts, watch status, edit, send
```

- **Backend** (`backend/`) uses local Ollama (`llama3.2:3b` by default) to read a pasted LinkedIn post and, in one call, extract the hiring company/role/category/contact email and draft a subject+body cold email. Sending goes through nodemailer. Entries are stored in memory behind a repository interface (swappable for a real database later).
- **Frontend** (`frontend/`) is a single page: paste a post → a card appears with an async "Working…" status → once drafted, edit the subject/body inline → Send (or Send All), each with its own async status.

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) running locally with a model pulled: `ollama pull llama3.2:3b`
- A Gmail (or other SMTP) account with an [App Password](https://support.google.com/accounts/answer/185833)

## Setup

```bash
npm install   # installs both backend/ and frontend/ via npm workspaces
```

Configure `backend/.env` (already present in this repo, edit as needed):

```env
PORT=3001
EMAIL_SERVICE=gmail
EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_DELAY=1000
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://127.0.0.1:11434
YOUR_NAME=Your Name
YOUR_EMAIL=you@gmail.com
YOUR_PHONE=+1 555 123 4567
RESUME_PATH=./assets/Resume.pdf
```

Put your resume PDF at `backend/assets/` and point `RESUME_PATH` at it — it's attached to every sent email.

Edit `backend/src/email-drafting/candidate-profile.ts` to reflect your actual background — this grounds the LLM's drafts.

## Run

```bash
npm run dev:backend    # NestJS on http://localhost:3001
npm run dev:frontend   # Vite on http://localhost:5173 (proxies /api to the backend)
```

Open `http://localhost:5173`, paste a post, and go.

## API (backend)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/entries` | Create an entry from raw post text; drafting runs async |
| GET | `/api/entries` | List all entries |
| GET | `/api/entries/:id` | Get one entry (for polling status) |
| PATCH | `/api/entries/:id` | Edit `subject`/`body` before sending |
| POST | `/api/entries/:id/send` | Send one entry; send runs async |
| POST | `/api/entries/send-all` | Send all drafted-but-unsent entries sequentially, rate-limited by `EMAIL_DELAY` |
| GET | `/api/health/ollama` | Check whether Ollama is reachable |

## Disclaimer

Make sure to comply with the CAN-SPAM Act (US), GDPR (EU), and your local email marketing regulations. Respect recipient preferences and unsubscribe requests.
