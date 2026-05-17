/** Allowed tool identifiers — must match frontend data-tool values. */
const VALID_TOOLS = [
  "draft-sop",
  "summarize-notes",
  "extract-actions",
  "business-rewrite",
];

const PROMPT_TEMPLATES = {
  "draft-sop": (input) => `You are an operations documentation specialist. Convert the following rough process notes into a clear STANDARD OPERATING PROCEDURE outline.

Use plain text with numbered sections:
1. Purpose
2. Scope
3. Roles & responsibilities
4. Procedure (step-by-step)
5. Exceptions & escalation
6. Records / audit trail (if applicable)

Be specific where the input provides detail; use [placeholder] only where information is missing. Do not invent compliance claims or safety certifications.

PROCESS NOTES:
---
${input}
---`,

  "summarize-notes": (input) => `You are an operations shift lead. Summarize the following ops notes into a concise handoff-ready brief.

Use this structure:
- SUMMARY (2-3 sentences)
- KEY EVENTS (bullets)
- BLOCKERS / RISKS (bullets)
- DECISIONS (bullets)
- HANDOFF TO NEXT SHIFT (numbered actions)

Stay factual; do not add events not supported by the notes.

OPS NOTES:
---
${input}
---`,

  "extract-actions": (input) => `You are an operations program manager. Extract action items from the following text.

Return a plain-text table or checklist with columns: Task | Owner | Due date (or TBD).
Use [ ] for open items. If owner or due date is unclear, mark TBD. Do not invent commitments not present in the source.

SOURCE TEXT:
---
${input}
---`,

  "business-rewrite": (input) => `You are an operations communicator writing for executives and cross-functional stakeholders. Rewrite the following technical or operational content in business-friendly language.

Use:
- EXECUTIVE SUMMARY (short paragraph)
- WHAT HAPPENED
- CUSTOMER / BUSINESS IMPACT
- RESOLUTION (if applicable)
- NEXT STEPS

Avoid jargon where possible; explain acronyms once. Do not minimize real incidents or overstate certainty.

SOURCE TEXT:
---
${input}
---`,
};

function buildPrompt(toolId, input) {
  const template = PROMPT_TEMPLATES[toolId];
  if (!template) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  return template(input);
}

module.exports = { VALID_TOOLS, buildPrompt };
