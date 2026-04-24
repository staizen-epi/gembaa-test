---
route: /clients
grid_type: table
execution_mode: parallel
tags: ["@client"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_CLIENT: MSN-VIEW-CLIENT
  MANAGE_CLIENT: MSN-MANAGE-CLIENT
  VIEW_MISSION: MSN-VIEW-MISSION
  MANAGE_MISSION: MSN-MANAGE-MISSION
entity_rules:
  parent_of: Mission (1:N — a mission belongs to exactly 1 client)
ui_notes:
  row_click_to_open_sidepanel: "To open a side-panel, ALWAYS click the first cell of the target row: dataRows.n.getByRole('cell').first().click()"
  list_element: "locator('table').first()"
  list_inline_edit: "NOT SUPPORTED — clients do not support inline editing in the table list view; the table is read-only and double-clicking a cell does NOT toggle edit mode"
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
  mission_tab: "sidePanel.getByRole('tab', { name: /Mission/i })"
  mission_tab_table: "sidePanel.locator('table').first() // missions table inside the Mission tab"
  row_click_opens: side_panel
---

# Feature: Client Management

## Description
Client Management handles the lifecycle of client records including creation, viewing, editing, and organizing client information for mission and project association. A client can own **many missions**, but each mission belongs to **exactly one client** (see [global-spec.md](../global-spec.md)).

The structure mirrors Mission Management — there is a list, and the user can create, edit, and delete records — except that **clients do not support inline editing in the table list**. Inline editing is only available via the side panel.

## Acceptance Criteria
- [ ] Client list is viewable by authorized users
- [ ] New clients can be created via a popup form
- [ ] Client details can be viewed via the side panel (opened by clicking the first cell of a row)
- [ ] Client details can be edited via the edit dialog (side panel → Edit icon → dialog form)
- [ ] Client details can be edited inline in the side panel (side panel → hover field → single-click → edit → Enter to submit)
- [ ] Client details **cannot** be edited inline from the table list view (no double-click-to-edit)
- [ ] Clients can be deleted via the `...` context menu on a row
- [ ] When a client's side panel is open, a "Mission" tab displays a table listing all missions created under that client
- [ ] Each mission listed in the Mission tab belongs to exactly one client (this client)
- [ ] When user lacks `MANAGE_CLIENT` permission, the create button, `...` context menu, edit icon (side panel), and delete icon (side panel) are hidden
- [ ] All client create/edit/delete operations display a success toast notification that automatically closes after 3s
- [ ] A required field left empty upon submission triggers an error toast notification or inline validation error

## Test Scenarios

### Scenario 1: View Client List

- **Given**: A user with `MSN-VIEW-CLIENT` permission is logged in
- **When**: The user navigates to `/client`
- **Then**: A list of clients is displayed in a table

### Scenario 2: Create New Client

- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **When**: The user clicks the create button, fills in the new client form, and submits
- **Then**: A new client is created and appears in the list
- **And**: A success toast notification automatically closes after 3s

### Scenario 2.1: Create New Client (Validation Error)

- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **When**: The user submits the create-client dialog with the required Display Name field empty
- **Then**: An inline validation error or error toast appears
- **And**: The client is not created

### Scenario 3: Edit Client Details via Edit Dialog

- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **And**: The side panel is open for an existing client (opened by clicking the first cell of the row)
- **When**: The user clicks the Edit icon to open the edit dialog, modifies a field, and clicks Save/Submit
- **Then**: The changes are saved
- **And**: A success toast notification appears
- **And**: The side panel reflects the updated value

### Scenario 4: Edit Client Details via Sidepanel Inline Edit

- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **And**: The side panel is open for an existing client
- **When**: The user single-clicks an inline-editable field in the side panel, modifies the value, and presses Enter
- **Then**: The change is submitted
- **And**: A success toast notification appears
- **And**: The side panel shows the updated value

### Scenario 5: List Inline Edit Is NOT Supported

- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **And**: The client list is displayed
- **When**: The user double-clicks any cell in a client row in the table
- **Then**: The cell does **not** toggle into an editable input
- **And**: No inline edit textbox appears in the list view

### Scenario 6: View Missions Under a Client (Mission Tab in Side Panel)

- **Given**: A user with `MSN-VIEW-CLIENT` and `MSN-VIEW-MISSION` permissions is logged in
- **And**: A client exists that has at least one mission associated with it (via the `Client → Mission` 1:N relationship)
- **When**: The user clicks the first cell of the client row to open the side panel
- **And**: The user clicks the "Mission" tab inside the side panel
- **Then**: A table is displayed listing all missions whose `client.entityId` equals this client's `entityId`
- **And**: A mission belonging to a different client does **not** appear in this table

### Scenario 7: Delete Client via Context Menu

- **Given**: A user with `MSN-MANAGE-CLIENT` permission is logged in
- **And**: At least one client exists in the list
- **When**: The user clicks the `...` context menu button on a client row and selects the delete option
- **Then**: The client is removed from the list
- **And**: A success toast notification appears

### Scenario 8: Read-Only UI for Users Without `MSN-MANAGE-CLIENT`

- **Given**: A user with `MSN-VIEW-CLIENT` permission but **without** `MSN-MANAGE-CLIENT` is logged in
  - Use `setMockPermissions(page, [PERM.APP_ACCESS, PERM.VIEW_CLIENT])` to restrict to view-only
- **When**: The user navigates to `/client`
- **Then**: The **Create** button is **not visible**
- **When**: The user clicks the first cell of a client row to open the side panel
- **Then**: The **edit icon** (`[data-icon="edit"]`) is **not visible** in the side panel
- **And**: The **delete icon** (`[data-icon="delete"]`) is **not visible** in the side panel
- **When**: The user hovers over the `...` context menu button on a client row
- **Then**: The `...` context menu button is **not visible**
