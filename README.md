# AI SOP & Operations Assistant

A portfolio operations writing tool with four modes: Draft SOP, Summarize Ops Notes, Extract Action Items, and Business Rewrite. The UI runs in the browser; **AI generation goes through a small Express backend** so your Gemini API key never touches client-side code.

## Features

- Enterprise-style tabbed UI with human review (approve / request changes / edit)
- **Load sample** — offline demo content, no API call
- **Generate** — calls `POST /api/generate` (Gemini) for custom input
- Access code gate, rate limiting, and input/output size limits on the server

## Security warning

- Put `GEMINI_API_KEY` and `ACCESS_CODE` **only** in `.env` on the server.
- **Never** commit `.env`, paste keys into `app.js`, or expose keys in GitHub Pages / static hosting.
- The access code is a simple shared secret for a prototype — use real auth (SSO, API keys per user) in production.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- A [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key

## Setup

1. Clone the repository and open the project folder.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and set at least:

   | Variable | Description |
   |----------|-------------|
   | `GEMINI_API_KEY` | Your Gemini API key (server only) |
   | `ACCESS_CODE` | Passphrase users enter in the app header before generating |

   Optional tuning: `PORT`, `GEMINI_MODEL`, `MAX_INPUT_LENGTH`, `MAX_OUTPUT_TOKENS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`.

5. Start the server:

   ```bash
   npm start
   ```

   For auto-restart on file changes (Node 18+):

   ```bash
   npm run dev
   ```

6. Open **http://localhost:3000** (or the `PORT` you set).

7. Enter the same **Access code** in the header as `ACCESS_CODE` in `.env`.

8. Use **Load sample** for instant portfolio demos, or type your own text and click **Generate**.

## Project structure

| Path | Purpose |
|------|---------|
| `index.html`, `style.css`, `app.js`, `samples.js` | Frontend UI and demo samples |
| `server.js` | Express app: static files + `/api/generate` |
| `server/prompts.js` | Per-tool prompt templates |
| `server/gemini.js` | Gemini API client (server-side) |
| `server/validate.js` | Request validation |
| `.env.example` | Environment variable template |
| `package.json` | Dependencies and npm scripts |

## API

**`POST /api/generate`**

Headers:

- `Content-Type: application/json`
- `X-Access-Code: <your ACCESS_CODE>`

Body:

```json
{
  "toolId": "draft-sop",
  "input": "Your operational notes here..."
}
```

Response:

```json
{ "text": "Generated content..." }
```

Errors return JSON: `{ "error": "Friendly message" }` with 400 / 401 / 429 / 500 as appropriate.

## Static-only demo (no backend)

Opening `index.html` directly still shows the UI, but **Generate** on custom input will fail without the API. **Load sample** continues to work from `samples.js`.

## License

Use and modify for your portfolio as you like.
