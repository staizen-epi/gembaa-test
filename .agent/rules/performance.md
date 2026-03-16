---
trigger: always_on
---

Rule: Logic Escalation Ladder

For all initial test scaffolding and boilerplate generation, use Gemini 3.1 Pro (Low).

If a generated test fails the verification step twice, automatically prompt to switch to Claude 4.6 Opus or Gemini 3 Pro (High) for a "Deep Audit."

Do not use High Thinking for CSS/XPath selector updates unless the DOM is dynamic/hidden.