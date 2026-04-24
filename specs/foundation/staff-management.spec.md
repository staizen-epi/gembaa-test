---
route: /staff
grid_type: table
execution_mode: parallel
tags: ["@staff"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_STAFF: STF-VIEW-STAFF
  MANAGE_STAFF: STF-MANAGE-STAFF
  VIEW_INACTIVE_STAFF: STF-VIEW-INACTIVE_STAFF
  VIEW_FINANCE_ENTRY: MSN-VIEW-FINANCE_ENTRY
  MANAGE_FINANCE_ENTRY: MSN-MANAGE-FINANCE_ENTRY
  VIEW_DAILY_CAPACITY: MSN-VIEW-DAILY_CAPACITY
api:
  scim_base: http://localhost:5050
  endpoints:
    create: POST /scim/Users
    patch: PATCH /scim/Users/{identifier}
    delete: DELETE /scim/Users/{identifier}
  payload_schema: Core2EnterpriseUser
  schemas:
    - "urn:ietf:params:scim:schemas:core:2.0:User"
    - "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
  patch_schema: "urn:ietf:params:scim:api:messages:2.0:PatchOp"
  op_codes:
    replace: 2
  api_results_mapping:
    status_active: "status = true for active staff (not a text status like 'Active')"
    status_inactive: "status = false for inactive staff (not a text status like 'Inactive', UI display only)"
    is_virtual: "isVirtual = true indicates a virtual staff member (no 'staffType' field)"
profiles_api:
  endpoint: GET /gba-api/CustomFields/Profiles
  source_id: 1                         # sourceId = 1 → Staff
  notes: >
    Returns the field definitions for all entities. Custom fields applicable to Staff
    are determined by sourceId = 1. Fields displayed in the
    side panel, edit dialog, and inline editing are all driven by this API response.
    Any customField where isReferenceField = true is non-editable for all staff types.
scim_readonly_fields:
  - Display Name
  - Job title
  - Location
  - Work email
  - Work phone number 1
  - Work phone number 2
  - First Name
  - Last Name
ui_notes:
  row_click_to_open_sidepanel: "To open a side-panel, ALWAYS click the first cell of the target row: dataRows.n.getByRole('cell').first().click()"
  list_element: "locator('table').first()"
  data_rows: "getByRole('row').filter({ hasNotText: 'Staff ID' })"
  search_input: "getByPlaceholder(LABEL.QUICK_SEARCH).last()"
  create_button: "getByRole('button', { name: /create|add|new/i })"
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

# Feature: Staff Management

## Description
Staff Management handles the lifecycle of staff members including creation, viewing, editing, deactivation, and management of inactive staff records. It also includes tracking finance entries and viewing daily capacity for staff members, which are accessed via the "Finance" tab in the staff side panel.

## Acceptance Criteria
- [ ] Staff list is viewable by authorized users
- [ ] New staff members can be created via the UI (Virtual staff)
- [ ] New staff members can be synchronized/created via SCIM (EntraID simulation)
- [ ] Staff details can be viewed and edited
- [ ] Staff members can be deactivated
- [ ] Inactive staff are visible in the main list only if the user has the required permission
- [ ] Finance entries can be managed and tracked per staff member via the "Finance" tab in their side panel
- [ ] Daily capacity is viewable per staff member in their "Finance" tab
- [ ] All displayed fields are derived from the `/Profiles` API response
- [ ] Custom fields with `isReferenceField = true` are read-only in both edit dialog and inline editing for all staff types
- [ ] SCIM staff cannot edit: Display Name, Job title, Location, Work email, Work phone number 1, Work phone number 2, First Name, Last Name (in both edit dialog and inline editing)
- [ ] Virtual staff can edit all non-reference fields including the SCIM-restricted fields listed above
- [ ] Staff details can be edited via the edit dialog (side panel → Edit icon → dialog form)
- [ ] Staff details can be edited inline (side panel → hover field → single-click → edit → Enter to submit)

## Test Scenarios

### Scenario 1: View Staff List
- **Given**: A user with `STF-VIEW-STAFF` permission is logged in
- **When**: The user navigates to `/staff`
- **Then**: A list of active staff members is displayed


### Scenario 2: Create Virtual Staff via UI
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **When**: The user fills in the new staff form in the application UI and submits
- **Then**: A new "Virtual" staff member is created and appears in the list


### Scenario 3: Create Staff via SCIM
- **Given**: The application is running
- **When**: A `POST /scim/Users` request is sent to `http://localhost:5050` with a `Core2EnterpriseUser` payload (userName, displayName, name, emails, active=true)
- **Then**: A new staff member is provisioned and appears in the staff list


> **API Utils**: `import { ScimApi } from "./api"` — see [`tests/api/scim-api.ts`](../tests/api/scim-api.ts)
> **SCIM API Reference**: See [docs/scim-api-reference.md](../docs/scim-api-reference.md) for full endpoint details and payload examples.

### Scenario 4: Update Staff via SCIM
- **Given**: A SCIM-synced staff member exists
- **When**: A `PATCH /scim/Users/{identifier}` request is sent with a Replace operation (op=2) for a field (e.g., displayName)
- **Then**: The staff member's details are updated in the application


### Scenario 5: Deactivate Staff via SCIM
- **Given**: A SCIM-synced staff member exists and is active
- **When**: A `PATCH /scim/Users/{identifier}` request is sent with `{ "op": 2, "path": "active", "value": false }`
- **Then**: The staff member's status changes to inactive in the application


### Scenario 6: Activate Staff via SCIM
- **Given**: A SCIM-synced staff member exists and is inactive
- **When**: A `PATCH /scim/Users/{identifier}` request is sent with `{ "op": 2, "path": "active", "value": true }`
- **Then**: The staff member's status changes to active in the application


### Scenario 7: Edit Staff Details (UI)
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **When**: The user clicks the `Display name` or any part of the row for a staff member
- **Then**: A side-panel opens to display details
- **And**: There is an "Edit" button to change the staff details


### Scenario 8: View Inactive Staff (Permission Granted)
- **Given**: A user with `STF-VIEW-INACTIVE_STAFF` permission is logged in
- **When**: The user navigates to the main staff list
- **Then**: Both active and inactive staff members are included in the list


### Scenario 9: Filter Inactive Staff (Permission Denied)
- **Given**: A user without `STF-VIEW-INACTIVE_STAFF` permission is logged in
- **When**: The user navigates to the main staff list
- **Then**: All staff records where Status = inactive are filtered out and not visible


### Scenario 10: Manage Finance Entries (Staff Side Panel)
- **Given**: A user with `MSN-MANAGE-FINANCE_ENTRY` permission is logged in
- **When**: The user opens a staff member's side panel and navigates to the "Finance" tab
- **And**: The user adds or edits a finance entry
- **Then**: The finance entry is saved and reflected in the staff financials


### Scenario 11: View Daily Capacity (Staff Side Panel)
- **Given**: A user with `MSN-VIEW-DAILY_CAPACITY` permission is logged in
- **When**: The user opens a staff member's side panel and navigates to the "Finance" tab
- **Then**: Daily capacity data is displayed in the capacity section


---

## Edit Staff Details

> **Field Source**: All fields displayed in the side panel are driven by the `/Profiles` API response.
> Custom fields applicable to Staff are those where `sourceId = 1`.
> See [global-spec.md — Profiles API & Custom Fields](global-spec.md#profiles-api--custom-fields) for the full `sourceId` mapping.
>
> **Editability Rules**:
> 1. Custom fields where `isReferenceField = true` (from `/Profiles`) are **read-only** for both SCIM and Virtual staff, in both the edit dialog and inline editing.
> 2. SCIM staff have additional non-editable fields: Display Name, Job title, Location, Work email, Work phone number 1, Work phone number 2, First Name, Last Name.
> 3. Virtual staff can edit all fields that are not reference fields.
>
> **Edit Methods**:
> 1. **Edit Dialog**: Open side panel → click the Edit icon button → an edit dialog form opens.
> 2. **Inline Editing**: Open side panel → hover over a field → single-click to toggle the field into edit mode → make the change → press Enter to submit.

### Scenario 10: Edit SCIM Staff via Edit Dialog — SCIM-Controlled Fields Are Read-Only
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A SCIM-synced staff member exists in the staff list
- **When**: The user clicks the staff row to open the side panel
- **And**: The user clicks the Edit icon button to open the edit dialog
- **Then**: The following fields are **disabled / read-only** in the dialog form:
  - Display Name
  - Job title
  - Location
  - Work email
  - Work phone number 1
  - Work phone number 2
  - First Name
  - Last Name


### Scenario 11: Edit SCIM Staff via Edit Dialog — Reference Custom Fields Are Read-Only
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A SCIM-synced staff member exists with custom fields
- **And**: The `/Profiles` API returns custom fields where some have `isReferenceField = true`
- **When**: The user opens the side panel for the SCIM staff and clicks the Edit icon
- **Then**: All custom fields with `isReferenceField = true` are **disabled / read-only** in the edit dialog


### Scenario 12: Edit SCIM Staff via Inline Editing — Non-Editable Fields Cannot Be Toggled
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A SCIM-synced staff member's side panel is open
- **When**: The user hovers over a SCIM-controlled field (e.g., Display Name) and single-clicks it
- **Then**: The field does **not** toggle into edit mode (remains read-only text)
- **And**: Custom fields with `isReferenceField = true` also do **not** toggle into edit mode


### Scenario 13: Edit Virtual Staff via Edit Dialog — SCIM-Restricted Fields Are Editable
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A Virtual staff member exists in the staff list
- **When**: The user clicks the staff row to open the side panel
- **And**: The user clicks the Edit icon button to open the edit dialog
- **Then**: The following fields are **enabled / editable** in the dialog form:
  - Display Name
  - Job title
  - Location
  - Work email
  - Work phone number 1
  - Work phone number 2
  - First Name
  - Last Name
- **And**: Custom fields with `isReferenceField = true` are still **disabled / read-only**


### Scenario 14: Edit Virtual Staff via Inline Editing — Editable Fields Toggle and Submit
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A Virtual staff member's side panel is open
- **When**: The user hovers over an editable field (e.g., Display Name) and single-clicks it
- **Then**: The field toggles into edit mode (an input/textbox appears)
- **When**: The user changes the value and presses Enter
- **Then**: The change is submitted and the field shows the updated value
- **And**: Custom fields with `isReferenceField = true` do **not** toggle into edit mode


### Scenario 15: Edit Virtual Staff via Edit Dialog — Submit and Verify Changes
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A Virtual staff member's edit dialog is open
- **When**: The user modifies one or more editable fields and clicks Save/Submit
- **Then**: The dialog closes
- **And**: The side panel reflects the updated field values


