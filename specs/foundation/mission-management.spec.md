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
  success_toast: "page.locator('section[aria-label=\"Notifications\"] [data-icon=\"check-circle\"]').filter({ hasText: /success|saved|created|updated|deleted/i })"
  error_toast: "page.locator('section[aria-label=\"Notifications\"] [data-icon=\"exclamation-triangle\"]')"
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
- [ ] Start date / end date are validated on every edit surface (dialog, list inline, side-panel inline): end date cannot be set without a start date; start date cannot be later than end date; end date cannot be earlier than start date.
- [ ] All mission create/edit/delete operations display a success toast notification that automatically closes after 3s
- [ ] A required field left empty upon edit submission triggers an error toast notification that must be manually closed
- [ ] Failed API operations display an error toast notification that must be closed manually

## Test Scenarios

### Scenario 1: View Mission List

- **Given**: A user with `MSN-VIEW-MISSION` permission is logged in
- **When**: The user navigates to `/mission`
- **Then**: A list of missions is displayed via AG-Grid

### Scenario 2: Create New Mission

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user fills in the new mission form and submits
- **Then**: A new mission is created and appears in the list
- **And**: A success toast notification automatically closes after 3s

### Scenario 2.1: Create New Mission (Validation Error)

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user submits the new mission form with required fields missing (e.g., Mission Name or Client)
- **Then**: An error toast notification or inline validation error appears
- **And**: The mission is not created

### Scenario 3: Edit Mission Details via Edit Dialog

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user edits an existing mission's details via the dialog box
- **Then**: The changes are saved and reflected
- **And**: A success toast notification appears

### Scenario 3.1: Edit Mission Details via Edit Dialog (Validation Error)

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user empties a required field in the edit dialog and submits
- **Then**: An error toast notification appears
- **And**: The user manually closes the error toast

### Scenario 4: Edit Mission via List Inline Edit

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user double clicks an AG-Grid cell in the mission list to edit a field inline
- **Then**: The existing data is prepopulated in the input field
- **When**: The user modifies the value and presses Enter
- **Then**: A success toast notification appears and automatically closes after 3s

### Scenario 5: Edit Mission via Sidepanel Inline Edit

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: The user has clicked a mission to open the side panel
- **When**: The user clicks to edit a field inline within the side panel
- **Then**: The input becomes editable and populated with the existing value
- **When**: The user modifies the value and presses Enter
- **Then**: A success toast notification appears and automatically closes after 3s

### Scenario 5.1: Submit Empty Required Field (Validation Error) via Inline Edit

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **When**: The user attempts to submit an inline edit (from list or side panel) with a cleared, required field
- **Then**: An error toast notification appears
- **And**: The user must manually close the toast notification

### Scenario 6: Side Panel Inline Edit — Each Field Type

> **Field Source**: Fields displayed in the side panel are driven by the `/Profiles` API (`sourceId = 2` for Mission).
> Custom fields with `isReferenceField = true` are read-only and must not toggle into edit mode.
> The test must call `GbaApi.getProfilesBySourceEntity(SOURCE_ENTITY.MISSION)` to discover editable fields at runtime and group them by `fieldTypeId` to exercise one representative field per distinct type.

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: The `/Profiles` API returns custom fields for Mission (`sourceId = 2`)
- **And**: The user has clicked a mission row to open the side panel
- **When**: For each distinct `fieldTypeId` among editable fields (`isReferenceField = false`), the user hovers and single-clicks the corresponding inline-edit trigger in the side panel
- **Then**: The field toggles into edit mode (the appropriate input control appears — textbox, datepicker, select, etc.) and is pre-populated with the existing value
- **When**: The user modifies the value and presses Enter (or confirms via the appropriate control)
- **Then**: A success toast notification appears and automatically closes after 3s
- **And**: Fields with `isReferenceField = true` do **not** toggle into edit mode when clicked

### Scenario 7: Delete Mission via Context Menu

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: At least one mission exists in the list
- **When**: The user clicks the `...` context menu button (`getByTestId('more-options-btn')`) on a mission row
- **And**: The user selects "Delete mission" from the context menu
- **Then**: A confirmation dialog or immediate deletion occurs
- **And**: The mission is removed from the list
- **And**: A success toast notification appears

### Scenario 8: Read-Only UI for Users Without `MSN-MANAGE-MISSION`

- **Given**: A user with `MSN-VIEW-MISSION` permission but **without** `MSN-MANAGE-MISSION` is logged in
  - Use `setMockPermissions(page, [PERM.APP_ACCESS, PERM.VIEW_MISSION])` to restrict to view-only
- **When**: The user navigates to `/mission`
- **Then**: The **Create** button is **not visible**
- **When**: The user clicks the first mission row cell to open the side panel
- **Then**: The **edit icon** (`[data-icon="edit"]`) is **not visible** in the side panel
- **And**: The **delete icon** (`[data-icon="delete"]`) is **not visible** in the side panel
- **When**: The user hovers over the `...` context menu button on a mission row
- **Then**: The `...` context menu button is **not visible** (hidden for view-only users)

### Scenario 9: Start Date / End Date Validation

> **Applies to all three edit surfaces**: edit dialog form, AG-Grid list inline edit, and side-panel inline edit.
> Each sub-case must be verified on every surface.

**Invalid combinations (all must be rejected):**

1. **End date without start date** — user clears (or leaves empty) the start date but provides an end date.
2. **Start date later than end date** — user edits the start date to a value after the existing end date.
3. **End date earlier than start date** — user edits the end date to a value before the existing start date.

#### 9.1: Edit Dialog — Date Validation

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: The edit dialog is open for an existing mission
- **When**: The user applies any of the three invalid date combinations above and clicks Save/Submit
- **Then**: An error toast notification appears **or** an inline validation error is displayed on the offending date field
- **And**: The mission is **not** updated
- **And**: The dialog remains open

#### 9.2: AG-Grid List Inline Edit — Date Validation

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: The mission list is displayed
- **When**: The user double-clicks the start date or end date cell, applies any of the three invalid date combinations above, and presses Enter
- **Then**: An error toast notification appears
- **And**: The cell reverts to its original value (the mission is **not** updated)

#### 9.3: Side Panel Inline Edit — Date Validation

- **Given**: A user with `MSN-MANAGE-MISSION` permission is logged in
- **And**: The side panel is open for an existing mission
- **When**: The user single-clicks the start date or end date field, applies any of the three invalid date combinations above, and presses Enter
- **Then**: An error toast notification appears
- **And**: The field reverts to its original value (the mission is **not** updated)
