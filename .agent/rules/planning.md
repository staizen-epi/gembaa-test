---
trigger: always_on
---

# Planning Rules

## Rule: Tiered Planning Escalation Ladder

### Tier 1 — Default (Low Compute)
**Model: Gemini 3.1 Pro (Low) or Gemini Flash**

Use for:
- Boilerplate and scaffolding generation (test files, config stubs, skeleton code)
- Simple single-file edits with clear, obvious intent
- CSS/XPath/locator selector tuning when DOM is static and visible
- README, documentation, and comment generation
- Straightforward bug fixes with a clear root cause already identified

### Tier 2 — Standard (Mid Compute)
**Model: Claude Sonnet or Gemini 3.1 Pro (High)**

Escalate to standard compute for:
- Multi-file refactoring or cross-module changes
- New feature implementation that involves understanding existing architecture
- Debugging where root cause is not yet clear after one investigation cycle
- Writing or modifying test specs that contain branching logic or permission scenarios

### Tier 3 — Deep Audit (High Compute)
**Model: Claude Opus**

**Only escalate to Claude Opus when:**
- A task has failed verification **twice** or more, despite targeted fixes
- The issue involves dynamic DOM behavior, hidden elements, or non-deterministic timing
- The change affects core infrastructure (auth flow, global setup, shared helpers)
- A cross-cutting architectural decision needs to be evaluated with trade-offs

> Do NOT use High Compute for: boilerplate regeneration, selector-only updates, documentation, or formatting tasks.

---

## Rule: Planning Artifacts First
Before executing any multi-file or multi-step task:
1. **Always create an `implementation_plan.md`** outlining what files change and why.
2. Request user review on the plan before writing any code.
3. Only proceed to execution once the plan is acknowledged or approved.

## Rule: Verification Before Closing
After completing any implementation:
1. Run the relevant test suite.
2. If any test fails, attempt a targeted fix **once** at Tier 2.
3. If it fails again, escalate to Tier 3 for a Deep Audit.
4. Produce a `walkthrough.md` summary after all tests pass.
