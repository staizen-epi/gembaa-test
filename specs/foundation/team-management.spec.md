---
route: /team
grid_type: table
execution_mode: parallel
tags: ["@team"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_TEAM: STF-VIEW-TEAM
  MANAGE_TEAM: STF-MANAGE-TEAM
entity_rules:
  parent_of: Staff (1:N — a staff belongs to at most 1 team)
ui_notes:
  row_click_to_open_sidepanel: "To open a side-panel, ALWAYS click the first cell of the target row: dataRows.n.getByRole('cell').first().click()"
  list_element: "locator('table').first()"
  create_button: "getByRole('button', { name: /create|add|new/i })"
  context_menu_button: "getByTestId('more-options-btn') // placeholder for ... menu"
  side_panel: "locator('aside, [role=\"dialog\"], .side-panel').first()"
  edit_button: "sidePanel.getByRole('button', { name: /Edit/i }).first()"
  edit_icon: "sidePanel.locator('[data-icon=\"edit\"]')"
  delete_icon: "sidePanel.locator('[data-icon=\"delete\"]')"
  edit_dialog: "page.getByRole('dialog').first()"
  dialog_save_button: "dialog.getByRole('button', { name: /save|submit|confirm/i })"
  success_modal_ok_button: "page.getByRole('button', { name: /Ok/i })"
  inline_edit_trigger: "sidePanel.locator('.stz-dialog-body [data-testid^=\"inline-edit-\"]').filter({ hasText: value }).click()"
  inline_edit_submit: "field.press('Enter')  // press Enter to submit inline edit"
  row_click_opens: side_panel
---

# Feature: Team Management

## Description
Team Management allows the organization and grouping of staff members into teams for collaboration and project assignment purposes. A staff member can only belong to **one team at a time** (see [global-spec.md](global-spec.md)).

## Acceptance Criteria
- [ ] Teams list is viewable by authorized users
- [ ] New teams can be created
- [ ] Team details can be viewed and edited
- [ ] Team details can be edited via the edit dialog (side panel → Edit icon → dialog form)
- [ ] Team details can be edited inline (side panel → hover field → single-click → edit → Enter to submit)
- [ ] Staff members can be assigned to and removed from teams
- [ ] A staff member cannot be assigned to more than one team simultaneously
- [ ] When user lacks `MANAGE_TEAM` permission, the create button, `...` context menu, edit icon (side panel), and delete icon (side panel) are hidden.

## Test Scenarios

### Scenario 1: View Teams List
- **Given**: A user with `STF-VIEW-TEAM` permission is logged in
- **When**: The user navigates to `/team`
- **Then**: A list of teams is displayed

```yaml
# test-hints
permissions_required: [VIEW_TEAM]
setup: default_global_setup
navigation: goto /team
assertions:
  - { target: team_table, method: "locator('table').first()", expect: toBeVisible }
```

### Scenario 2: Create New Team
- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **When**: The user fills in the new team form and submits
- **Then**: A new team is created and appears in the list

```yaml
# test-hints
permissions_required: [VIEW_TEAM, MANAGE_TEAM]
setup: default_global_setup
navigation: goto /team
actions:
  - { action: click, target: create_button, method: "getByRole('button', { name: /create|add|new/i })" }
  - { action: fill_form, target: team_form }
  - { action: submit }
  - { action: click, target: success_modal_ok, method: "page.getByRole('button', { name: /Ok/i })" }
assertions:
  - { target: new_team, method: "getByText(teamName)", expect: toBeVisible }
cleanup: delete created team
```

### Scenario 3: Edit Team Details
- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **When**: The user edits an existing team's details
- **Then**: The changes are saved and reflected

```yaml
# test-hints
permissions_required: [VIEW_TEAM, MANAGE_TEAM]
setup: default_global_setup
navigation: goto /team
actions:
  - { action: click, target: team_row, method: "click row or team name to open detail" }
  - { action: click, target: edit_button, method: "getByRole('button', { name: /edit/i })" }
  - { action: modify_fields }
  - { action: save }
  - { action: click, target: success_modal_ok, method: "page.getByRole('button', { name: /Ok/i })" }
assertions:
  - { target: updated_value, expect: toBeVisible }
```

### Scenario 4: Manage Team Members
- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **When**: The user adds or removes staff members from a team
- **Then**: The team membership is updated accordingly

```yaml
# test-hints
permissions_required: [VIEW_TEAM, MANAGE_TEAM]
setup: default_global_setup
navigation: goto /team
constraint: "Staff can only be in 1 team — assigning to a new team should remove from old team"
actions:
  - { action: click, target: team_row }
  - { action: add_or_remove_member }
assertions:
  - { target: member_list, expect: "reflects updated membership" }
  - { target: exclusive_membership, expect: "staff not in previous team" }
```
