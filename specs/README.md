# Application Specs

This directory contains the **application specifications** — the source of truth for what the app should do. Each spec maps to one or more Playwright test files in the `tests/` directory.

> **Start here →** [`global-spec.md`](global-spec.md) — defines the entity model (primary & secondary entities, relationships, and linking rules) for the entire Gembaa application.

## Format

Each spec file is a Markdown file (`.spec.md`) with the following structure:

```markdown
# Feature: [Feature Name]

## Description
Brief description of the feature and its purpose.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Test Scenarios

### Scenario 1: [Scenario Name]
- **Given**: [precondition]
- **When**: [action]
- **Then**: [expected result]

### Scenario 2: [Scenario Name]
- **Given**: [precondition]
- **When**: [action]
- **Then**: [expected result]
```

## Naming Convention

- File name: `<feature-name>.spec.md`
- Use lowercase kebab-case (e.g., `user-login.spec.md`, `dashboard-widgets.spec.md`)

## Mapping Specs → Tests

| Spec File | Test File | Status |
|-----------|-----------|--------|
| `specs/app-access.spec.md` | `tests/app-access.spec.ts` | ✅ Tests written |
| `specs/foundation/staff-management.spec.md` | `tests/staff-management.spec.ts` | ✅ Tests written |
| `specs/foundation/team-management.spec.md` | `tests/team-management.spec.ts` | 📝 Spec only |
| `specs/foundation/client-management.spec.md` | `tests/client-management.spec.ts` | 📝 Spec only |
| `specs/foundation/mission-management.spec.md` | `tests/mission-management.spec.ts` | 📝 Spec only |
| `specs/admin/admin-console.spec.md` | `tests/admin-console.spec.ts` | 📝 Spec only |
| `specs/allocation/allocation-management.spec.md` | `tests/allocation-management.spec.ts` | 📝 Spec only |
| `specs/portfolio/portfolio-roadmap.spec.md` | `tests/portfolio-roadmap.spec.ts` | 📝 Spec only |
| `specs/pulse/pulses.spec.md` | `tests/pulses.spec.ts` | 📝 Spec only |
| `specs/raid/raid.spec.md` | `tests/raid.spec.ts` | ✅ Tests written |

Keep this mapping 1:1 whenever possible. If a spec grows too large, split it into sub-specs and matching test files.
