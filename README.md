# AI SOP & Operations Assistant

Operations writing UI (SOP drafts, shift summaries, action items, business rewrites) with a **secure local AI stack**: the browser calls your Express server; the server calls Gemini using keys from `.env` only.

## What works without AI

- **Load sample** — fills input + output from `samples.js` (no network, no API key)
- **Generate** with text that exactly matches a bundled sample — same offline output
- Human review (approve / request changes / edit output)

## What needs the backend

- **Generate** with **your own** input text → `POST /api/generate` → Gemini

---

## Why the API key must stay server-side

`GEMINI_API_KEY` bills your Google account. If it appears in `app.js`, `index.html`, or static hosting:

- Anyone can steal it from DevTools or your repo
- Attackers can run unlimited generations on your quota

This project stores the key **only** in `.env` and uses it **only** in `server/gemini.js`. The client sends `toolId`, `input`, `accessCode`, and optional `reviewerName` — never the Gemini key.

---

## Prerequisites

- [Node.js](https://nodejs.org/) **18+**
- [Gemini API key](https://aistudio.google.com/apikey)

---

## Local setup (exact commands)

Open a terminal in the project folder:

```bash
cd path/to/ai-sop-operations-assistant
```

**1. Install dependencies (once)**

```bash
npm install
```

**2. Create environment file**

Windows (PowerShell):

```powershell
copy .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

**3. Edit `.env`** — minimum required:

```env
GEMINI_API_KEY=your_actual_key_here
ACCESS_CODE=choose-a-strong-passphrase
```

**4. Start the server**

```bash
npm start
```

You should see:

- `Loaded environment from .env`
- `AI SOP & Operations Assistant → http://localhost:3000`
- Warnings if `GEMINI_API_KEY` or `ACCESS_CODE` is missing

**Optional — auto-restart on file changes (Node 18+):**

```bash
npm run dev
```

**5. Open the app**

Use the URL from the terminal (default):

**http://localhost:3000**

Do **not** open `index.html` as a `file://` URL if you want live AI — the API lives on the Express server.

**6. Health check (optional)**

Visit **http://localhost:3000/api/health** — `ok: true` when both `GEMINI_API_KEY` and `ACCESS_CODE` are set (does not expose secrets).

---

## Using the app

| Action | Access code needed? | Calls API? |
|--------|---------------------|------------|
| Load sample | No | No |
| Generate (sample text unchanged) | No | No |
| Generate (custom text) | Yes (header field) | Yes |

Enter the same value in the header **Access code** field as `ACCESS_CODE` in `.env`.

---

## End-to-end test (one successful AI generation)

1. Confirm `.env` has valid `GEMINI_API_KEY` and `ACCESS_CODE`.
2. Run `npm start` and open **http://localhost:3000**.
3. In the header, enter your **Access code** (matches `.env`).
4. Open any tab (e.g. **Summarize Ops Notes**).
5. **Clear** the textarea or replace sample text with a short custom note, for example:

   ```text
   Shift 14 May: conveyor delay 20 min, 12 orders rerouted to morning wave, no injuries.
   ```

6. Click **Summarize notes** (Generate).
7. Wait for the output card — status should move to **Pending review** with new AI text (not the bundled sample block).
8. Confirm in DevTools → Network: `POST /api/generate` → **200**, response `{ "text": "..." }`.
9. Confirm terminal has no Gemini/auth errors.

**Negative checks (optional):**

- Wrong access code → red error: invalid access code
- Empty access code → prompt to enter code
- Stop `npm start` and click Generate → cannot reach server message
- Paste 7000+ characters → input too long (client or 400 from server)

---

## API reference

**`POST /api/generate`**

Headers:

- `Content-Type: application/json`
- `X-Access-Code: <same as ACCESS_CODE in .env>` (optional if `accessCode` is in the body)

Body:

```json
{
  "toolId": "summarize-notes",
  "input": "Your ops notes…",
  "accessCode": "your-access-code",
  "reviewerName": "Demo reviewer"
}
```

Response: `{ "text": "…" }`

Errors: `{ "error": "…", "code": "…" }`

| Code | HTTP | Meaning |
|------|------|---------|
| `ACCESS_REQUIRED` / `ACCESS_DENIED` | 401 | Missing or wrong access code |
| `ACCESS_NOT_CONFIGURED` | 503 | `ACCESS_CODE` not in `.env` |
| `API_KEY_MISSING` | 503 | `GEMINI_API_KEY` not in `.env` |
| `RATE_LIMIT` / `DAILY_LIMIT` | 429 | Abuse limits |
| `VALIDATION_ERROR` | 400 | Bad input / too long |
| `GENERATION_FAILED` | 500 | Gemini or server error |

---

## Project structure

| Path | Purpose |
|------|---------|
| `index.html`, `style.css`, `app.js`, `samples.js` | Frontend |
| `server.js` | Express entry — static files + API |
| `server/env.js` | Loads `.env`, startup warnings |
| `server/security.js` | Access code + rate limit |
| `server/validate.js` | Input limits + body validation |
| `server/dailyCap.js` | In-memory daily cap per IP |
| `server/prompts.js` | Per-tool prompts |
| `server/gemini.js` | Gemini client (API key here only) |
| `.env.example` | Template — copy to `.env` |

---

## Cost / abuse limits (server)

Configured in `.env`: `MAX_INPUT_LENGTH`, `MAX_OUTPUT_TOKENS`, `RATE_LIMIT_MAX`, `DAILY_REQUEST_CAP`, etc. See `.env.example`.

---

## License

Use and modify for your portfolio as you like.
