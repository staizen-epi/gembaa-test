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

```yaml
# test-hints
permissions_required: [VIEW_STAFF]
setup: default_global_setup
navigation: goto /staff
assertions:
  - { target: staff_table, method: "locator('table').first()", expect: toBeVisible }
```

### Scenario 2: Create Virtual Staff via UI
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **When**: The user fills in the new staff form in the application UI and submits
- **Then**: A new "Virtual" staff member is created and appears in the list

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
navigation: goto /staff
actions:
  - { action: click, target: create_button, method: "getByRole('button', { name: /create|add|new/i })" }
assertions:
  - { target: form_or_dialog, method: "getByRole('dialog').or(page.locator('form')).first()", expect: toBeVisible }
```

### Scenario 3: Create Staff via SCIM
- **Given**: The application is running
- **When**: A `POST /scim/Users` request is sent to `http://localhost:5050` with a `Core2EnterpriseUser` payload (userName, displayName, name, emails, active=true)
- **Then**: A new staff member is provisioned and appears in the staff list

```yaml
# test-hints
type: api_test
api_action: ScimApi.createUser({ userName, displayName, givenName, familyName, email, active: true })
verification:
  - navigate: goto /staff
  - search: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(displayName)"
  - debounce_wait: TIMEOUT.DEBOUNCE
  - assert: { target: staff_entry, method: "getByText(displayName)", expect: toBeVisible }
cleanup: ScimApi.deleteUser(identifier)
```

> **API Utils**: `import { ScimApi } from "./api"` — see [`tests/api/scim-api.ts`](../tests/api/scim-api.ts)
> **SCIM API Reference**: See [docs/scim-api-reference.md](../docs/scim-api-reference.md) for full endpoint details and payload examples.

### Scenario 4: Update Staff via SCIM
- **Given**: A SCIM-synced staff member exists
- **When**: A `PATCH /scim/Users/{identifier}` request is sent with a Replace operation (op=2) for a field (e.g., displayName)
- **Then**: The staff member's details are updated in the application

```yaml
# test-hints
type: api_test
prerequisite: known SCIM user must exist (e.g. dbScimUserId from seed data)
api_action: ScimApi.patchUser(identifier, [{ op: SCIM_OP.REPLACE, path: "displayName", value: updatedName }])
verification:
  - navigate: goto /staff
  - search: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(updatedName)"
  - debounce_wait: TIMEOUT.DEBOUNCE
  - assert: { target: updated_entry, method: "getByText(updatedName)", expect: toBeVisible }
cleanup: ScimApi.updateDisplayName(identifier, originalName)
```

### Scenario 5: Deactivate Staff via SCIM
- **Given**: A SCIM-synced staff member exists and is active
- **When**: A `PATCH /scim/Users/{identifier}` request is sent with `{ "op": 2, "path": "active", "value": false }`
- **Then**: The staff member's status changes to inactive in the application

```yaml
# test-hints
type: api_test
prerequisite: known active SCIM user must exist
api_action: ScimApi.deactivateUser(identifier)
verification:
  - navigate: goto /staff
  - note: "default test user lacks VIEW_INACTIVE_STAFF, so deactivated staff disappears"
  - assert: { target: staff_entry, method: "getByText(displayName)", expect: not.toBeVisible }
```

### Scenario 6: Activate Staff via SCIM
- **Given**: A SCIM-synced staff member exists and is inactive
- **When**: A `PATCH /scim/Users/{identifier}` request is sent with `{ "op": 2, "path": "active", "value": true }`
- **Then**: The staff member's status changes to active in the application

```yaml
# test-hints
type: api_test
prerequisite: known inactive SCIM user (deactivated in Scenario 5)
api_action: ScimApi.activateUser(identifier)
verification:
  - navigate: goto /staff
  - search: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(displayName)"
  - debounce_wait: TIMEOUT.DEBOUNCE
  - assert: { target: staff_entry, method: "getByText(displayName)", expect: toBeVisible }
```

### Scenario 7: Edit Staff Details (UI)
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **When**: The user clicks the `Display name` or any part of the row for a staff member
- **Then**: A side-panel opens to display details
- **And**: There is an "Edit" button to change the staff details

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
navigation: goto /staff
actions:
  - { action: wait, target: data_rows, method: "getByRole('row').filter({ hasNotText: 'Staff ID' }).first()", expect: toBeVisible }
  - { action: click, target: first_row_button, method: "dataRows.first().getByRole('button').first()" }
assertions:
  - { target: side_panel, method: "locator('aside, [role=\"dialog\"], .side-panel').first()", expect: toBeVisible }
  - { target: edit_button, method: "sidePanel.getByRole('button', { name: /Edit/i }).first()", expect: toBeVisible }
```

### Scenario 8: View Inactive Staff (Permission Granted)
- **Given**: A user with `STF-VIEW-INACTIVE_STAFF` permission is logged in
- **When**: The user navigates to the main staff list
- **Then**: Both active and inactive staff members are included in the list

```yaml
# test-hints
permissions_required: [VIEW_STAFF, VIEW_INACTIVE_STAFF]
setup: default_global_setup (includes VIEW_INACTIVE_STAFF)
navigation: goto /staff
assertions:
  - { target: staff_table, method: "locator('table').first()", expect: toBeVisible }
  - { target: data_rows, method: "getByRole('row').filter({ hasNotText: 'Staff ID' })", expect: "count > 0" }
```

### Scenario 9: Filter Inactive Staff (Permission Denied)
- **Given**: A user without `STF-VIEW-INACTIVE_STAFF` permission is logged in
- **When**: The user navigates to the main staff list
- **Then**: All staff records where Status = inactive are filtered out and not visible

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
permissions_excluded: [VIEW_INACTIVE_STAFF]
setup: setMockPermissions([PERM.APP_ACCESS, PERM.VIEW_STAFF, PERM.MANAGE_STAFF])
navigation: goto /staff
assertions:
  - { target: staff_table, method: "locator('table').first()", expect: toBeVisible }
  - { target: data_rows, method: "getByRole('row').filter({ hasNotText: 'Staff ID' }).first()", expect: toBeVisible }
  - { target: inactive_rows, method: "dataRows.filter({ hasText: /^Inactive$/ })", expect: toHaveCount(0) }
```

### Scenario 10: Manage Finance Entries (Staff Side Panel)
- **Given**: A user with `MSN-MANAGE-FINANCE_ENTRY` permission is logged in
- **When**: The user opens a staff member's side panel and navigates to the "Finance" tab
- **And**: The user adds or edits a finance entry
- **Then**: The finance entry is saved and reflected in the staff financials

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_FINANCE_ENTRY]
setup: default_global_setup
navigation: goto /staff
actions:
  - { action: click, target: staff_row }
  - { action: navigate, target: finance_tab, method: "sidePanel.getByRole('tab', { name: /Finance/i }).click()" }
  - { action: click, target: add_finance_button }
  - { action: fill_form, target: finance_form }
  - { action: submit }
assertions:
  - { target: finance_entry, expect: toBeVisible }
```

### Scenario 11: View Daily Capacity (Staff Side Panel)
- **Given**: A user with `MSN-VIEW-DAILY_CAPACITY` permission is logged in
- **When**: The user opens a staff member's side panel and navigates to the "Finance" tab
- **Then**: Daily capacity data is displayed in the capacity section

```yaml
# test-hints
permissions_required: [VIEW_STAFF, VIEW_DAILY_CAPACITY]
setup: default_global_setup
navigation: goto /staff
actions:
  - { action: click, target: staff_row }
  - { action: navigate, target: finance_tab, method: "sidePanel.getByRole('tab', { name: /Finance/i }).click()" }
assertions:
  - { target: capacity_data, expect: toBeVisible }
```

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

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
prerequisite: a SCIM-synced staff member must exist (e.g. seeded via ScimApi.createUser or dbScimUserId)
navigation: goto /staff
actions:
  - { action: wait, target: data_rows, method: "getByRole('row').filter({ hasNotText: 'Staff ID' }).first()", expect: toBeVisible }
  - { action: search, target: search_input, method: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(scimStaffName)" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
  - { action: click, target: staff_row, method: "dataRows.first().getByRole('button').first()" }
  - { action: wait, target: side_panel, method: "locator('aside, [role=\"dialog\"], .side-panel').first()", expect: toBeVisible }
  - { action: click, target: edit_button, method: "sidePanel.getByRole('button', { name: /Edit/i }).first()" }
  - { action: wait, target: edit_dialog, method: "page.getByRole('dialog').first()", expect: toBeVisible }
assertions:
  - { target: display_name_field, method: "dialog.getByLabel(/Display Name/i)", expect: toBeDisabled }
  - { target: job_title_field, method: "dialog.getByLabel(/Job title/i)", expect: toBeDisabled }
  - { target: location_field, method: "dialog.getByLabel(/Location/i)", expect: toBeDisabled }
  - { target: work_email_field, method: "dialog.getByLabel(/Work email/i)", expect: toBeDisabled }
  - { target: work_phone_1_field, method: "dialog.getByLabel(/Work phone number 1/i)", expect: toBeDisabled }
  - { target: work_phone_2_field, method: "dialog.getByLabel(/Work phone number 2/i)", expect: toBeDisabled }
  - { target: first_name_field, method: "dialog.getByLabel(/First Name/i)", expect: toBeDisabled }
  - { target: last_name_field, method: "dialog.getByLabel(/Last Name/i)", expect: toBeDisabled }
```

### Scenario 11: Edit SCIM Staff via Edit Dialog — Reference Custom Fields Are Read-Only
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A SCIM-synced staff member exists with custom fields
- **And**: The `/Profiles` API returns custom fields where some have `isReferenceField = true`
- **When**: The user opens the side panel for the SCIM staff and clicks the Edit icon
- **Then**: All custom fields with `isReferenceField = true` are **disabled / read-only** in the edit dialog

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
prerequisite: >
  A SCIM staff with custom fields must exist.
  Use GbaApi.getReferenceFields(SOURCE_ENTITY.STAFF) to discover fields with isReferenceField = true.
  If the custom field `name` contains "TERMINOLOGY:*", fetch the localized label from the `/Terminology` API to assert on the correct UI text.
navigation: goto /staff
actions:
  - { action: search, target: search_input, method: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(scimStaffName)" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
  - { action: click, target: staff_row, method: "dataRows.first().getByRole('button').first()" }
  - { action: wait, target: side_panel, expect: toBeVisible }
  - { action: click, target: edit_button, method: "sidePanel.getByRole('button', { name: /Edit/i }).first()" }
  - { action: wait, target: edit_dialog, method: "page.getByRole('dialog').first()", expect: toBeVisible }
assertions:
  - note: "For each customField from /Profiles where isReferenceField = true (mapping TERMINOLOGY: keys to their true UI labels):"
  - { target: reference_custom_field, method: "dialog.getByLabel(referenceFieldLabel)", expect: toBeDisabled }
```

### Scenario 12: Edit SCIM Staff via Inline Editing — Non-Editable Fields Cannot Be Toggled
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A SCIM-synced staff member's side panel is open
- **When**: The user hovers over a SCIM-controlled field (e.g., Display Name) and single-clicks it
- **Then**: The field does **not** toggle into edit mode (remains read-only text)
- **And**: Custom fields with `isReferenceField = true` also do **not** toggle into edit mode

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
prerequisite: a SCIM-synced staff member must exist
navigation: goto /staff
actions:
  - { action: search, target: search_input, method: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(scimStaffName)" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
  - { action: click, target: staff_row, method: "dataRows.first().getByRole('button').first()" }
  - { action: wait, target: side_panel, expect: toBeVisible }
assertions:
  - note: "SCIM-controlled fields are not inline-editable, which is evaluated by the absence of the [data-testid^=inline-edit-] attribute in stz-dialog-body"
  - { target: display_name_editable, method: "sidePanel.locator('.stz-dialog-body [data-testid^=\"inline-edit-\"]').filter({ hasText: scimStaffDisplayName })", expect: toHaveCount(0) }
  - note: "Repeat for all scim_readonly_fields: Job title, Location, Work email, Work phone number 1, Work phone number 2, First Name, Last Name"
  - note: "Reference custom fields (isReferenceField = true) must also lack inline-edit ability. Ensure `name` is mapped via /Terminology if prefixed."
  - { target: reference_field_editable, method: "sidePanel.locator('.stz-dialog-body [data-testid^=\"inline-edit-\"]').filter({ hasText: referenceFieldValue })", expect: toHaveCount(0) }
```

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

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
prerequisite: a Virtual staff member must exist (e.g. created via UI in Scenario 2)
navigation: goto /staff
actions:
  - { action: search, target: search_input, method: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(virtualStaffName)" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
  - { action: click, target: staff_row, method: "dataRows.first().getByRole('button').first()" }
  - { action: wait, target: side_panel, expect: toBeVisible }
  - { action: click, target: edit_button, method: "sidePanel.getByRole('button', { name: /Edit/i }).first()" }
  - { action: wait, target: edit_dialog, method: "page.getByRole('dialog').first()", expect: toBeVisible }
assertions:
  - note: "SCIM-restricted fields ARE editable for Virtual staff"
  - { target: display_name_field, method: "dialog.getByLabel(/Display Name/i)", expect: toBeEnabled }
  - { target: job_title_field, method: "dialog.getByLabel(/Job title/i)", expect: toBeEnabled }
  - { target: location_field, method: "dialog.getByLabel(/Location/i)", expect: toBeEnabled }
  - { target: work_email_field, method: "dialog.getByLabel(/Work email/i)", expect: toBeEnabled }
  - { target: work_phone_1_field, method: "dialog.getByLabel(/Work phone number 1/i)", expect: toBeEnabled }
  - { target: work_phone_2_field, method: "dialog.getByLabel(/Work phone number 2/i)", expect: toBeEnabled }
  - { target: first_name_field, method: "dialog.getByLabel(/First Name/i)", expect: toBeEnabled }
  - { target: last_name_field, method: "dialog.getByLabel(/Last Name/i)", expect: toBeEnabled }
  - note: "Reference custom fields are STILL read-only for Virtual staff. Map terminology first."
  - { target: reference_custom_field, method: "dialog.getByLabel(referenceFieldLabel)", expect: toBeDisabled }
```

### Scenario 14: Edit Virtual Staff via Inline Editing — Editable Fields Toggle and Submit
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A Virtual staff member's side panel is open
- **When**: The user hovers over an editable field (e.g., Display Name) and single-clicks it
- **Then**: The field toggles into edit mode (an input/textbox appears)
- **When**: The user changes the value and presses Enter
- **Then**: The change is submitted and the field shows the updated value
- **And**: Custom fields with `isReferenceField = true` do **not** toggle into edit mode

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
prerequisite: a Virtual staff member must exist
navigation: goto /staff
actions:
  - { action: search, target: search_input, method: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(virtualStaffName)" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
  - { action: click, target: staff_row, method: "dataRows.first().getByRole('button').first()" }
  - { action: wait, target: side_panel, expect: toBeVisible }
  - { action: hover, target: display_name_value, method: "sidePanel.getByText(virtualStaffDisplayName)" }
  - { action: click, target: display_name_value, method: "sidePanel.getByText(virtualStaffDisplayName)" }
  - { action: wait, target: inline_input, method: "sidePanel.getByRole('textbox').first()", expect: toBeVisible }
  - { action: clear_and_fill, target: inline_input, method: "inlineInput.fill(updatedDisplayName)" }
  - { action: press, target: enter_key, method: "inlineInput.press('Enter')" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
assertions:
  - { target: updated_value, method: "sidePanel.getByText(updatedDisplayName)", expect: toBeVisible }
  - note: "Reference custom fields lack inline-edit ability (map terminology if needed), evaluated by absence of [data-testid^=inline-edit-]"
  - { target: reference_field_editable, method: "sidePanel.locator('.stz-dialog-body [data-testid^=\"inline-edit-\"]').filter({ hasText: referenceFieldValue })", expect: toHaveCount(0) }
cleanup: revert the display name to original value via inline edit or API
```

### Scenario 15: Edit Virtual Staff via Edit Dialog — Submit and Verify Changes
- **Given**: A user with `STF-MANAGE-STAFF` permission is logged in
- **And**: A Virtual staff member's edit dialog is open
- **When**: The user modifies one or more editable fields and clicks Save/Submit
- **Then**: The dialog closes
- **And**: The side panel reflects the updated field values

```yaml
# test-hints
permissions_required: [VIEW_STAFF, MANAGE_STAFF]
setup: default_global_setup
prerequisite: a Virtual staff member must exist
navigation: goto /staff
actions:
  - { action: search, target: search_input, method: "getByPlaceholder(LABEL.QUICK_SEARCH).last().fill(virtualStaffName)" }
  - { action: wait, target: debounce, method: "page.waitForTimeout(TIMEOUT.DEBOUNCE)" }
  - { action: click, target: staff_row, method: "dataRows.first().getByRole('button').first()" }
  - { action: wait, target: side_panel, expect: toBeVisible }
  - { action: click, target: edit_button, method: "sidePanel.getByRole('button', { name: /Edit/i }).first()" }
  - { action: wait, target: edit_dialog, method: "page.getByRole('dialog').first()", expect: toBeVisible }
  - { action: clear_and_fill, target: display_name_field, method: "dialog.getByLabel(/Display Name/i).fill(updatedDisplayName)" }
  - { action: clear_and_fill, target: job_title_field, method: "dialog.getByLabel(/Job title/i).fill(updatedJobTitle)" }
  - { action: click, target: save_button, method: "dialog.getByRole('button', { name: /save|submit|confirm/i })" }
  - { action: click, target: success_modal_ok, method: "page.getByRole('button', { name: /Ok/i })" }
assertions:
  - { target: edit_dialog, method: "page.getByRole('dialog').first()", expect: not.toBeVisible }
  - { target: updated_display_name, method: "sidePanel.getByText(updatedDisplayName)", expect: toBeVisible }
  - { target: updated_job_title, method: "sidePanel.getByText(updatedJobTitle)", expect: toBeVisible }
cleanup: revert the modified fields to original values via edit dialog or API
```
