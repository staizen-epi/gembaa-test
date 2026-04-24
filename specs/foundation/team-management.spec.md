---
route: /communities
grid_type: table
execution_mode: parallel
tags: ["@team"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_TEAM: STF-VIEW-TEAM
  MANAGE_TEAM: STF-MANAGE-TEAM
  VIEW_STAFF: STF-VIEW-STAFF
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
  members_tab: "sidePanel.getByRole('tab', { name: /Members/i })"
  add_member_button: "sidePanel.getByRole('button', { name: /add member|add staff|assign member/i })"
  member_picker_dialog: "page.getByRole('dialog').last()"
  member_picker_search: "memberPickerDialog.getByPlaceholder(/search/i).first()"
  member_picker_option: "memberPickerDialog.getByRole('option').filter({ hasText: staffName }).first()"
  team_lead_select: "sidePanel.getByRole('combobox', { name: /team lead|lead/i }).first()"
  row_click_opens: side_panel
---

# Feature: Team Management

## Description
Team Management allows the organization and grouping of staff members into teams for collaboration and project assignment purposes. A staff member can only belong to **one team at a time** (see [global-spec.md](../global-spec.md)).

The structure mirrors Mission and Client Management — there is a list, and the user can create, edit, and delete records. Like clients, teams support both popup-form editing (via the side panel Edit icon) and inline editing in the side panel.

In addition to standard CRUD, teams have a **dedicated process to add members and assign a team lead**:

- **Members** can be selected from **all existing staff regardless of whether the staff is actual (SCIM-synced) or virtual** (UI-created).
- The **Team Lead** can only be assigned from the **existing members of the team** (a staff member must first be a team member before they can be made the lead).

## Acceptance Criteria
- [ ] Teams list is viewable by authorized users
- [ ] New teams can be created via a popup form
- [ ] Team details can be viewed via the side panel
- [ ] Team details can be edited via the edit dialog (side panel → Edit icon → dialog form)
- [ ] Team details can be edited inline in the side panel (side panel → hover field → single-click → edit → Enter to submit)
- [ ] Teams can be deleted via the `...` context menu on a row
- [ ] Members can be added to a team through a dedicated add-member flow in the side panel
- [ ] Members can be selected from the **full pool of existing staff (both actual SCIM-synced and virtual)**
- [ ] Members can be removed from a team
- [ ] A team lead can be assigned, but **only from the team's existing members**
- [ ] Selecting a non-member as the team lead is not possible (the lead picker only lists current members)
- [ ] A staff member cannot be assigned to more than one team simultaneously
- [ ] When user lacks `MANAGE_TEAM` permission, mutation controls are unreachable: the create button and add-member control are hidden, while the side-panel edit icon and delete icon are rendered but disabled
- [ ] All team create/edit/delete operations display a success toast notification that automatically closes after 3s

## Test Scenarios

### Scenario 1: View Teams List

- **Given**: A user with `STF-VIEW-TEAM` permission is logged in
- **When**: The user navigates to `/team`
- **Then**: A list of teams is displayed in a table

### Scenario 2: Create New Team

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **When**: The user clicks the create button, fills in the new team form, and submits
- **Then**: A new team is created and appears in the list
- **And**: A success toast notification automatically closes after 3s

### Scenario 2.1: Create New Team (Validation — Inline Error on Next)

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **When**: The user opens the create-team wizard, leaves the required Team name field empty, and clicks **Next**
- **Then**: An inline validation error reading "Team name is required" appears under the Team name field
- **And**: The wizard does **not** advance to the next step
- **And**: The team is not created

### Scenario 3: Edit Team Details via Edit Dialog

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: The side panel is open for an existing team
- **When**: The user clicks the Edit icon to open the edit dialog, modifies a field, and clicks Save/Submit
- **Then**: The changes are saved
- **And**: A success toast notification appears
- **And**: The side panel reflects the updated value

### Scenario 4: Edit Team Details via Sidepanel Inline Edit

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: The side panel is open for an existing team
- **When**: The user single-clicks an inline-editable field in the side panel, modifies the value, and presses Enter
- **Then**: The change is submitted
- **And**: A success toast notification appears
- **And**: The side panel shows the updated value

### Scenario 5: Add Members to a Team — Selectable from All Staff

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: The side panel is open for an existing team
- **And**: The staff pool contains **both** at least one SCIM-synced (actual) staff member (`isVirtual = false`) and one virtual staff member (`isVirtual = true`)
- **When**: The user opens the dedicated add-member control in the side panel
- **Then**: The member picker lists candidates drawn from **all existing staff**, with no filter that excludes virtual or SCIM-synced staff
- **When**: The user selects an actual (SCIM) staff member and confirms
- **Then**: The actual staff member is added to the team
- **When**: The user opens the add-member control again and selects a virtual staff member
- **Then**: The virtual staff member is also added to the team
- **And**: A success toast notification appears for each addition

### Scenario 6: Remove a Member from a Team

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: The side panel is open for a team that has at least one member
- **When**: The user removes a member via the member-management UI in the side panel
- **Then**: The removed staff member no longer appears in the team's member list
- **And**: A success toast notification appears

### Scenario 7: Assign Team Lead — Only From Existing Members

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: A team exists that has at least two members and a third existing staff member who is **not** a member of this team
- **And**: The side panel is open for the team
- **When**: The user opens the team-lead picker
- **Then**: The picker lists **only** the staff members who are currently members of the team
- **And**: The non-member staff is **not** present in the picker options
- **When**: The user selects one of the existing members as the lead and confirms
- **Then**: That member becomes the team lead
- **And**: A success toast notification appears

### Scenario 7.1: Cannot Assign Non-Member as Team Lead

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: The side panel is open for an existing team with at least one member
- **When**: The user inspects the team-lead picker options
- **Then**: No staff member who is not currently a team member appears as a selectable option

### Scenario 8: Staff Cannot Belong to More Than One Team

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: A staff member is already a member of Team A
- **When**: The user opens Team B's side panel and attempts to add the same staff member
- **Then**: Either the staff is not selectable from Team B's picker, **or** adding them removes them from Team A (the system enforces single-team membership in one of these two ways)
- **And**: After the operation completes, the staff appears in exactly one team

### Scenario 9: Delete Team via Context Menu

- **Given**: A user with `STF-MANAGE-TEAM` permission is logged in
- **And**: At least one team exists in the list
- **When**: The user clicks the `...` context menu button on a team row and selects the delete option
- **Then**: The team is removed from the list
- **And**: A success toast notification appears

### Scenario 10: Read-Only UI for Users Without `STF-MANAGE-TEAM`

- **Given**: A user with `STF-VIEW-TEAM` permission but **without** `STF-MANAGE-TEAM` is logged in
  - Use `setMockPermissions(page, [PERM.APP_ACCESS, PERM.VIEW_TEAM])` to restrict to view-only
- **When**: The user navigates to `/communities`
- **Then**: The **Create** button is **not visible**
- **When**: The user clicks the team-name cell of a team row to open the side panel
- **Then**: The **edit icon button** (`button:has([data-icon="edit"])`) is rendered but **disabled** in the side panel
- **And**: The **delete icon button** (`button:has([data-icon="trash-alt"])`) is rendered but **disabled** in the side panel
- **And**: The **add-member control** is **not visible** under the Members tab
- **And**: The **team-lead control** is **not editable**
- **When**: The user hovers over the `...` context menu button on a team row
- **Then**: The `...` context menu button is **not visible**
