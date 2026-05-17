# AI SOP & Operations Assistant

A small portfolio single-page web app with four operational writing tools:

- **Draft SOP** — turn process notes into an SOP outline
- **Summarize Ops Notes** — condense shift or incident notes
- **Extract Action Items** — pull tasks, owners, and due dates from text
- **Business Rewrite** — rephrase technical content for business audiences

## Quick start

No build step required. Open the app locally:

1. Clone or download this folder.
2. Open `index.html` in a browser, or serve the folder with any static server:

   ```bash
   npx serve .
   ```

3. Click **Load sample** on any tab for realistic ops notes and example outputs, or open the app (first tab loads automatically). **Generate** returns the full demo output when the input matches the sample.

## Project structure

| File        | Purpose                                      |
| ----------- | ---------------------------------------------- |
| `index.html` | Markup, navigation, four tool sections        |
| `style.css`  | Layout and professional styling               |
| `samples.js` | Demo operational notes and example outputs        |
| `app.js`     | Form handling, tab UI, extension hooks          |
| `.gitignore` | Common ignores for env files and OS artifacts |

## Extending the app

1. **Backend** — Add an API route (e.g. `/api/generate`) that accepts `{ toolId, input }` and returns generated text.
2. **`runTool()` in `app.js`** — Replace the placeholder `switch` with `fetch()` to your backend. Keep API keys on the server, not in the browser.
3. **Prompts** — Tune system prompts per `toolId` on the server for SOP structure, summaries, action extraction, and business tone.
4. **UI** — Add copy buttons, markdown rendering, or history in `style.css` / new components as needed.

## License

Use and modify for your portfolio as you like.
