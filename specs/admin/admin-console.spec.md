---
route: /admin
grid_type: table
execution_mode: serial
tags: ["@admin", "@permissions"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_PERMISSIONS: PER-VIEW-PERMISSIONS
  MANAGE_PERMISSIONS: PER-MANAGE-PERMISSIONS
ui_notes:
  access_denied_pattern: '/You don''t have access|Error Code: 403|no access|access denied|unauthorized/i'
  admin_button_class: '.adminbtn'
seed_settings:
  # These admin settings MUST be applied via BffApi.getAdminSettings / the Admin Console
  # before any test in the suite executes (i.e. in global-setup or a beforeAll hook).
  terminology:
    staff.value: "Staff"          # singular label for Staff entity
    team.value: "Team"            # singular label for Team entity
    mission.value: "Mission"      # singular label for Mission entity
    client.value: "Client"        # singular label for Client entity
  theming:
    mode: "Light theme"           # default colour scheme expected by tests
  onboarding:
    dismissed: true               # onboarding dialog must be dismissed before tests run
  entities:
    staff:
      fields:
        Seniority:
          type: select
          options:
            - "S1 - Intern"
            - "S2 - Junior"
            - "S3 - Mid"
            - "S4 - Senior"
            - "S5 - Lead"
            - "S6 - Architect"
            - "S7 - Department Head"
            - "S8 - EMCO"
            - "S9 - CEO"
        Category:
          type: select
          options:
            - "Internal - Payroll"
            - "Internal - Consultant"
            - "External"
    mission:
      fields:
        Status:
          type: status
          options:
            - label: "Proposal"
              category: "To Do"
            - label: "Sprint 0"
              category: "To Do"
            - label: "Planned"
              category: "To Do"
            - label: "In Progress"
              category: "In Progress"
            - label: "Client Validation"
              category: "In Progress"
            - label: "Done"
              category: "Done"
---

# Feature: Admin Console

## Description
The Admin Console provides administrative functionality for managing system-wide settings, user access, and platform configuration.

Accessing the admin module is done using the `.adminbtn` css class. 

Inside the admin console there are multiple menu items:
* **Entities:** Responsible for the configuration of each entity (Staff, Team, Mission, Client, Knowledge, Milestone, Risk, Issues, Dependencies).
* **Configuration:** Responsible for general application settings, items usually used across all entities.
* **Access:** Provides the user access to certain modules. Responsible for populating the permission codes of the user (when executed locally, only `/mock` is able to update the permissions of the user, so all test cases in this page will be only CRUD).
* **Theming:** Responsible for updating the color scheme of the application on both light mode and dark mode.

## Pre-Test Admin Settings (Seed Requirements)

The following admin settings must be in place **before any test in the suite is executed**. They are applied once in `global-setup` (or a suite-level `beforeAll`) via the Admin Console UI or `BffApi.getAdminSettings`. If the settings are already at the expected values, seeding is a no-op.

| Category | Setting | Expected Value | Why |
| -------- | ------- | -------------- | --- |
| **Terminology** | `staff.value` | `"Staff"` | All locators and `hasText` checks resolve against this label |
| **Terminology** | `team.value` | `"Team"` | Same — team labels appear in headers, breadcrumbs, and dropdowns |
| **Terminology** | `mission.value` | `"Mission"` | Mission labels drive nav items and detail-panel titles |
| **Terminology** | `client.value` | `"Client"` | Client labels appear in filters and relationship dropdowns |
| **Theming** | Default colour scheme | `"Light theme"` | Screenshot diffs and visual assertions are calibrated for light mode |
| **Onboarding** | Dialog dismissed | `true` | The onboarding flow blocks navigation until completed; tests must start past it |
| **Entity — Staff** | `Seniority` field options | S1–S9 values (see below) | Dropdown tests assert exact option labels; missing options cause false negatives |
| **Entity — Staff** | `Category` field options | Internal/External values (see below) | Same — category filter and form tests depend on these exact values |
| **Entity — Mission** | `Status` field options | 6 statuses across 3 categories (see below) | Status column, filters, and kanban views rely on these labels and their category mappings |

> [!IMPORTANT]
> Tests **must not** assume these values are already set. The seeding step is idempotent — always verify the current value and only write if it differs. Use `BffApi.getAdminSettings(page)` to read the current state before mutating.

### Seeding Approach

Seeding is done at two levels:

1. **Global setup** (`global-setup.ts`) — runs once before the entire test run. Handles onboarding dismissal and default theming via the `ONBOARDING_BUTTONS` flow already defined in `constants.ts`.
2. **Suite `beforeAll`** — each spec file that depends on a specific terminology value reads it via `BffApi.getAdminSettings` and applies any correction through the Admin Console before the first test.

#### API Surface for Field Option Seeding

All entity field options are managed via the **BFF GraphQL layer** (`BffApi`), not the GBA REST API directly.

| Operation | BFF Mutation Input Type |
| --------- | ----------------------- |
| Read current options | `BffApi.getAdminSettings(page)` → `adminSettings.staffSettings` / `missionSettings` |
| Add a staff field option | `AddStaffFieldOptionInput` |
| Update a staff field option | `UpdateStaffFieldOptionInput` |
| Delete a staff field option | `DeleteStaffFieldOptionInput` |
| Add a mission field option | `AddMissionFieldOptionInput` |
| Update a mission field option | `UpdateMissionFieldOptionInput` |
| Delete a mission field option | `DeleteMissionFieldOptionInput` |

`getAdminSettings` returns options with shape `{ entityId, field, value }`. The `field` key identifies which setting bucket the option belongs to (e.g. `"seniority"`, `"category"`, `"status"`). Seeding checks the returned list against the required values and calls the appropriate mutation only for missing or mismatched entries.

```typescript
// Example: check and seed seniority options in a beforeAll hook
test.beforeAll(async ({ page }) => {
  const { data } = await BffApi.getAdminSettings(page);
  const existing = data.adminSettings.staffSettings.seniority.map((o: any) => o.value);
  const required = ["S1 - Intern", "S2 - Junior", /* … */];
  for (const value of required) {
    if (!existing.includes(value)) {
      // call AddStaffFieldOptionInput mutation via BffApi.execute(page, mutation, { input })
    }
  }
});
```

### Entity Field Seed Values

These are configured via **Admin → Entities → [Entity]** and read back through `BffApi.getAdminSettings`.

#### Staff Entity — `adminSettings.staffSettings`

**`seniority`** — options must exist in this exact order:

| # | `value` |
| - | ------- |
| 1 | `S1 - Intern` |
| 2 | `S2 - Junior` |
| 3 | `S3 - Mid` |
| 4 | `S4 - Senior` |
| 5 | `S5 - Lead` |
| 6 | `S6 - Architect` |
| 7 | `S7 - Department Head` |
| 8 | `S8 - EMCO` |
| 9 | `S9 - CEO` |

**`category`** — options must exist:

| # | `value` |
| - | ------- |
| 1 | `Internal - Payroll` |
| 2 | `Internal - Consultant` |
| 3 | `External` |

#### Mission Entity — `adminSettings.missionSettings`

**`status`** — each option carries a `statusCategory` that controls workflow column placement. Read via `BffApi.getAdminSettings` → `missionSettings.status`:

| `value` | `statusCategory` |
| ------- | ---------------- |
| `Proposal` | `To Do` |
| `Sprint 0` | `To Do` |
| `Planned` | `To Do` |
| `In Progress` | `In Progress` |
| `Client Validation` | `In Progress` |
| `Done` | `Done` |

> [!IMPORTANT]
> Status category membership (To Do / In Progress / Done) affects how missions are grouped in kanban and portfolio views. Seeding with the wrong `statusCategory` will cause grouping assertions to fail even if the `value` label is correct.

---

## Acceptance Criteria
- [ ] Admin Console is accessible via the `.adminbtn` to authorized users
- [ ] Users can navigate and manage settings within the Entities menu
- [ ] Users can manage general application settings within the Configuration menu
- [ ] Users can perform CRUD operations on user permissions within the Access menu (local mutations via `/mock`)
- [ ] Users can update the color scheme (light/dark mode) within the Theming menu

## Test Scenarios

### Scenario 1: Access Admin Console
- **Given**: A user with `PER-VIEW-PERMISSIONS` permission is logged in
- **When**: The user clicks the Admin button using `.adminbtn`
- **Then**: The Admin Console dashboard is displayed


### Scenario 2: Navigate to Entities, Configuration, Access, and Theming
- **Given**: A user with `PER-VIEW-PERMISSIONS` permission is logged in and on the Admin Console
- **When**: The user clicks through the menu items (Entities, Configuration, Access, Theming)
- **Then**: The respective configuration pages are displayed


### Scenario 3: Unauthorized Access
- **Given**: A user without `PER-VIEW-PERMISSIONS` permission is logged in
- **When**: The user attempts to access the Admin Console
- **Then**: Access is denied or the `.adminbtn` is not visible/disabled


