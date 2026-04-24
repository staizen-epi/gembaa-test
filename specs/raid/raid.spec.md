---
route: /rid
grid_type: ag-grid
execution_mode: serial
tags: ["@raid", "@permissions"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_RAID: GBA-VIEW-RAID
  MANAGE_RAID: GBA-MANAGE-RAID
entity_rules:
  types: [Risk, Issue, Dependency]
  linking_field: Affecting
  can_link_to: [Staff, Team, Mission, Client]
  cardinality: many-to-many
  min_links: 1
  mutability: mutable (links can be added/removed, min 1 must remain)
  note: "Assumptions tracking is a planned future capability"
ui_notes:
  grid_element: "getByRole('treegrid')"
  data_rows: "raidGrid.locator('[role=\"row\"][row-index]')"
  tabs: ["All dependencies", "All issues"]
  create_button_label: "Add dependency (on dependencies tab)"
  create_button: "getByRole('button', { name: /add dependency/i })"
  row_context_menu: "dataRows.first().getByRole('button').first()"
  access_denied_pattern: '/You don''t have access|Error Code: 403|no access|access denied|unauthorized/i'
---

# Feature: RAID (Risks, Assumptions, Issues, Dependencies)

## Description
The RAID module provides a centralised register for tracking Risks, Issues, and Dependencies across missions and projects. RID items are linked to primary entities (Staff, Team, Mission, Client) via the "Affecting" field — each item must affect **at least one** primary entity and can affect **many** (see [global-spec.md](global-spec.md)).

The `GBA-VIEW-RAID` permission grants read-only access to the register, while `GBA-MANAGE-RAID` unlocks the Create button, the row context menu (`...`), and all edit/delete actions.

> **Note**: Assumptions tracking is a planned future capability. The `GBA-VIEW-RAID` and `GBA-MANAGE-RAID` permission codes are already defined and will not change when Assumptions are introduced.

## Acceptance Criteria
- [ ] Users with `GBA-VIEW-RAID` can navigate to `/rid` and view the RAID item list
- [ ] Users without `GBA-VIEW-RAID` cannot access the RAID module (menu hidden or access denied)
- [ ] Users with `GBA-MANAGE-RAID` see the Create button and the row context menu (`...`)
- [ ] Users with only `GBA-VIEW-RAID` do NOT see the Create button or row context menu (`...`)
- [ ] RID items must be linked to at least 1 primary entity (Affecting field) upon creation
- [ ] RID items can be linked to multiple primary entities simultaneously

## Test Scenarios

### Scenario 1: View RAID list (view permission)
- **Given**: A user with `GBA-VIEW-RAID` permission is logged in
- **When**: The user navigates to `/rid`
- **Then**: The RAID item list or table is displayed


### Scenario 2: Deny access (no RAID permission)
- **Given**: A user without `GBA-VIEW-RAID` permission is logged in
- **When**: The user navigates to `/rid`
- **Then**: The page shows an access denied message or the RAID menu item is absent


### Scenario 3: Manage buttons visible (manage permission)
- **Given**: A user with both `GBA-VIEW-RAID` and `GBA-MANAGE-RAID` permissions is logged in
- **When**: The user navigates to `/rid`
- **Then**: A Create (or equivalent add) button is visible
- **And**: At least one row's context menu trigger (`...`) is visible


### Scenario 4: Manage buttons hidden (view-only permission)
- **Given**: A user with `GBA-VIEW-RAID` but WITHOUT `GBA-MANAGE-RAID` is logged in
- **When**: The user navigates to `/rid`
- **Then**: No Create button is visible
- **And**: No row context menu trigger (`...`) is visible


