---
route: /mission
grid_type: ag-grid
execution_mode: parallel
tags: ["@mission"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_MISSION: MSN-VIEW-MISSION
  MANAGE_MISSION: MSN-MANAGE-MISSION
entity_rules:
  child_of: Client (a mission belongs to exactly 1 client)
  central_to: Allocation module
ui_notes:
  row_click_to_open_sidepanel: "To open a side-panel, ALWAYS click the first cell of the target row: dataRows.n.getByRole('gridcell').first().click()"
  list_element: "getByRole('treegrid').first()"
  create_button: "getByRole('button', { name: /create|add|new/i })"
  context_menu_button: "getByTestId('more-options-btn') // placeholder for ... menu"
  side_panel: "locator('aside, [role=\"dialog\"], .side-panel').first()"
  edit_button: "sidePanel.getByRole('button', { name: /Edit/i }).first()"
  edit_icon: "sidePanel.locator('[data-icon=\"edit\"]')"
  delete_icon: "sidePanel.locator('[data-icon=\"delete\"]')"
  edit_dialog: "page.getByRole('dialog').first()"
  dialog_save_button: "dialog.getByRole('button', { name: /save|submit|confirm/i })"
  success_toast: "page.locator('stz-toast.success').filter({ hasText: /success|saved|created|updated|deleted/i })"
  error_toast: "page.locator('stz-toast.error')"
  inline_edit_trigger: "sidePanel.locator('.stz-dialog-body [data-testid^=\"inline-edit-\"]').filter({ hasText: value }).click()"
  list_inline_edit_trigger: "cell.dblclick()"
  list_inline_edit_input: "page.getByRole('textbox').first()"
  inline_edit_submit: "field.press('Enter')  // press Enter to submit inline edit"
  row_click_opens: side_panel
---

# Feature: Mission Management

## Description
Mission Management handles the creation, tracking, and lifecycle management of missions (projects). This includes managing mission details and milestones. Each mission belongs to **exactly one client** and is central to the **Allocation module** (see [global-spec.md](global-spec.md)).

## Acceptance Criteria
- [ ] Mission list is viewable by authorized users
- [ ] New missions can be created
- [ ] Creating a mission requires the mission name, status, and client.
- [ ] The client field is a reference to the created clients (indicates the created mission belongs to the selected client, based on ERD).
- [ ] Mission details can be viewed and edited
- [ ] Mission details can be edited via the edit dialog (side panel → Edit icon → dialog form)
- [ ] Mission details can be edited inline in the side panel (side panel → hover field → single-click → edit → Enter to submit)
- [ ] Mission details can be edited inline from the list view (AG-Grid list table → double-click cell → edit → Enter to submit)
- [ ] Double-clicking an AG-Grid cell prepopulates the existing data (including datepickers)
- [ ] Submitting an inline edit by pressing enter saves the data
- [ ] Milestones can be managed within missions
- [ ] Each mission must be linked to exactly one client
- [ ] When user lacks `MANAGE_MISSION` permission, the create button, `...` context menu, edit icon (side panel), and delete icon (side panel) are hidden.
- [ ] All mission create/edit/delete operations display a success toast notification that automatically closes after 3s
- [ ] A required field left empty upon edit submission triggers an error toast notification that must be manually closed
- [ ] Failed API operations display an error toast notification that must be closed manually

## Test Scenarios

### Scenario 1: View Mission List
- **Given**: A user with `MSN-VIEW-MISSION` permission is logged in
- **When**: The user navigates to `/mission`
- **Then**: A list of missions is displayed via AG-Grid

```yaml
# test-hints
permissions_required: [VIEW_MISSION]
setup: default_global_setup
navigation: goto /mission
assertions:
  - { target: mission_table, method: "getByRole('treegrid').first()", expect: toBeVisible }
```

### Scenario 2: Create New Mission
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user fills in the new mission form and submits
- **Then**: A new mission is created and appears in the list
- **And**: A success toast notification automatically closes after 3s

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: click, target: create_button, method: "getByRole('button', { name: /create|add|new/i })" }
  - { action: fill_form, target: mission_form, note: "must select a client (required 1:1 link)" }
  - { action: submit }
assertions:
  - { target: success_toast, method: "page.locator('stz-toast.success')", expect: toBeVisible }
  - { target: new_mission, method: "getByText(missionName)", expect: toBeVisible }
cleanup: delete created mission
```

### Scenario 2.1: Create New Mission (Validation Error)
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user submits the new mission form with required fields missing (e.g., Mission Name or Client)
- **Then**: An error toast notification or inline validation error appears
- **And**: The mission is not created

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: click, target: create_button }
  - { action: submit, note: "Form submitted without filling required fields" }
assertions:
  - { target: error_toast, method: "page.locator('stz-toast.error')", expect: toBeVisible }
actions_after_assertion:
  - { action: click, target: toast_close_btn, method: "error_toast.getByRole('button', { name: /close/i })" }
```

### Scenario 3: Edit Mission Details via Edit Dialog
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user edits an existing mission's details via the dialog box
- **Then**: The changes are saved and reflected
- **And**: A success toast notification appears

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: click, target: mission_row }
  - { action: click, target: edit_button, method: "getByRole('button', { name: /edit/i })" }
  - { action: modify_fields }
  - { action: save }
assertions:
  - { target: success_toast, method: "page.locator('stz-toast.success')", expect: toBeVisible }
```

### Scenario 3.1: Edit Mission Details via Edit Dialog (Validation Error)
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user empties a required field in the edit dialog and submits
- **Then**: An error toast notification appears
- **And**: The user manually closes the error toast

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: click, target: mission_row }
  - { action: click, target: edit_button }
  - { action: clear_field, target: required_field }
  - { action: save }
assertions:
  - { target: error_toast, method: "page.locator('stz-toast.error')", expect: toBeVisible }
actions_after_assertion:
  - { action: click, target: toast_close_btn, method: "error_toast.getByRole('button', { name: /close/i })" }
```

### Scenario 4: Edit Mission via List Inline Edit
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user double clicks an AG-Grid cell in the mission list to edit a field inline
- **Then**: The existing data is prepopulated in the input field
- **When**: The user modifies the value and presses Enter
- **Then**: A success toast notification appears and automatically closes after 3s

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: dblclick, target: list_cell }
  - { action: clear_and_fill, target: list_inline_edit_input }
  - { action: press, target: enter_key, method: "list_inline_edit_input.press('Enter')" }
assertions:
  - { target: success_toast, method: "page.locator('stz-toast.success')", expect: toBeVisible }
  - { target: updated_value, method: "getByText(updatedValue)", expect: toBeVisible }
```

### Scenario 5: Edit Mission via Sidepanel Inline Edit
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: The user has clicked a mission to open the side panel
- **When**: The user clicks to edit a field inline within the side panel
- **Then**: The input becomes editable and populated with the existing value
- **When**: The user modifies the value and presses Enter
- **Then**: A success toast notification appears and automatically closes after 3s

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: click, target: mission_row }
  - { action: wait, target: side_panel, expect: toBeVisible }
  - { action: click, target: inline_edit_trigger }
  - { action: clear_and_fill, target: inline_input }
  - { action: press, target: enter_key, method: "inline_input.press('Enter')" }
assertions:
  - { target: success_toast, method: "page.locator('stz-toast.success')", expect: toBeVisible }
  - { target: updated_value, method: "sidePanel.getByText(updatedValue)", expect: toBeVisible }
```

### Scenario 5.1: Submit Empty Required Field (Validation Error) via Inline Edit
- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user attempts to submit an inline edit (from list or side panel) with a cleared, required field
- **Then**: An error toast notification appears
- **And**: The user must manually close the toast notification

```yaml
# test-hints
permissions_required: [VIEW_MISSION, MANAGE_MISSION]
setup: default_global_setup
navigation: goto /mission
actions:
  - { action: dblclick_or_click, target: list_cell_or_sidepanel_field }
  - { action: clear, target: inline_edit_input, method: "inline_edit_input.fill('')" }
  - { action: press, target: enter_key, method: "inline_edit_input.press('Enter')" }
assertions:
  - { target: error_toast, method: "page.locator('stz-toast.error')", expect: toBeVisible }
actions_after_assertion:
  - { action: click, target: toast_close_btn, method: "error_toast.getByRole('button', { name: /close/i })" }
assertions_after_cleanup:
  - { target: error_toast, method: "page.locator('stz-toast.error')", expect: not.toBeVisible }
```
