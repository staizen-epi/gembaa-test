---
route: /client
grid_type: table
execution_mode: parallel
tags: ["@client"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_CLIENT: MSN-VIEW-CLIENT
  MANAGE_CLIENT: MSN-MANAGE-CLIENT
entity_rules:
  parent_of: Mission (1:N — a mission belongs to exactly 1 client)
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

# Feature: Client Management

## Description
Client Management handles the lifecycle of client records including creation, viewing, editing, and organizing client information for mission and project association. A client can own **many missions**, but each mission belongs to **exactly one client** (see [global-spec.md](global-spec.md)).

## Acceptance Criteria
- [ ] Client list is viewable by authorized users
- [ ] New clients can be created
- [ ] Client details can be viewed and edited
- [ ] Client details can be edited via the edit dialog (side panel → Edit icon → dialog form)
- [ ] Client details can be edited inline (side panel → hover field → single-click → edit → Enter to submit)
- [ ] Clients can be associated with missions
- [ ] A mission cannot belong to more than one client
- [ ] When user lacks `MANAGE_CLIENT` permission, the create button, `...` context menu, edit icon (side panel), and delete icon (side panel) are hidden.

## Test Scenarios

### Scenario 1: View Client List
- **Given**: A user with `MSN-VIEW-CLIENT` permission is logged in
- **When**: The user navigates to `/client`
- **Then**: A list of clients is displayed

```yaml
# test-hints
permissions_required: [VIEW_CLIENT]
setup: default_global_setup
navigation: goto /client
assertions:
  - { target: client_table, method: "locator('table').first()", expect: toBeVisible }
```

### Scenario 2: Create New Client
- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **When**: The user fills in the new client form and submits
- **Then**: A new client is created and appears in the list

```yaml
# test-hints
permissions_required: [VIEW_CLIENT, MANAGE_CLIENT]
setup: default_global_setup
navigation: goto /client
actions:
  - { action: click, target: create_button, method: "getByRole('button', { name: /create|add|new/i })" }
  - { action: fill_form, target: client_form }
  - { action: submit }
  - { action: click, target: success_modal_ok, method: "page.getByRole('button', { name: /Ok/i })" }
assertions:
  - { target: new_client, method: "getByText(clientName)", expect: toBeVisible }
cleanup: delete created client
```

### Scenario 3: Edit Client Details
- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **When**: The user edits an existing client's details
- **Then**: The changes are saved and reflected in the client profile

```yaml
# test-hints
permissions_required: [VIEW_CLIENT, MANAGE_CLIENT]
setup: default_global_setup
navigation: goto /client
actions:
  - { action: click, target: client_row }
  - { action: click, target: edit_button, method: "getByRole('button', { name: /edit/i })" }
  - { action: modify_fields }
  - { action: save }
  - { action: click, target: success_modal_ok, method: "page.getByRole('button', { name: /Ok/i })" }
assertions:
  - { target: updated_value, expect: toBeVisible }
```

### Scenario 4: View Client Details
- **Given**: A user with `MSN-VIEW-CLIENT` permission is logged in
- **When**: The user clicks on a client in the list
- **Then**: The client's full details and associated missions are displayed

```yaml
# test-hints
permissions_required: [VIEW_CLIENT]
setup: default_global_setup
navigation: goto /client
actions:
  - { action: click, target: client_row }
assertions:
  - { target: detail_view, expect: toBeVisible }
  - { target: associated_missions, expect: "missions list or section is present" }
```
