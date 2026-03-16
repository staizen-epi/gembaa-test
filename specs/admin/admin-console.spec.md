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

```yaml
# test-hints
permissions_required: [APP_ACCESS, VIEW_PERMISSIONS]
setup: default_global_setup
navigation: click .adminbtn
assertions:
  - { target: admin_dashboard, method: "locator('.admin-dashboard-container') or module-specific element", expect: toBeVisible }
```

### Scenario 2: Navigate to Entities, Configuration, Access, and Theming
- **Given**: A user with `PER-VIEW-PERMISSIONS` permission is logged in and on the Admin Console
- **When**: The user clicks through the menu items (Entities, Configuration, Access, Theming)
- **Then**: The respective configuration pages are displayed

```yaml
# test-hints
permissions_required: [APP_ACCESS, VIEW_PERMISSIONS]
setup: default_global_setup
navigation: click .adminbtn
actions:
  - { action: click, target: entities_menu, method: "getByRole('menuitem', { name: /entities/i })" }
  - { action: click, target: config_menu, method: "getByRole('menuitem', { name: /configuration/i })" }
  - { action: click, target: access_menu, method: "getByRole('menuitem', { name: /access/i })" }
  - { action: click, target: theming_menu, method: "getByRole('menuitem', { name: /theming/i })" }
assertions:
  - { target: selected_view, method: "locator('table').first() or module-specific element", expect: toBeVisible }
```

### Scenario 3: Unauthorized Access
- **Given**: A user without `PER-VIEW-PERMISSIONS` permission is logged in
- **When**: The user attempts to access the Admin Console
- **Then**: Access is denied or the `.adminbtn` is not visible/disabled

```yaml
# test-hints
permissions_required: [APP_ACCESS]
permissions_excluded: [VIEW_PERMISSIONS, MANAGE_PERMISSIONS]
setup: setMockPermissions([PERM.APP_ACCESS])
navigation: goto /admin
assertions:
  - { target: admin_btn, method: "locator('.adminbtn')", expect: not.toBeVisible }
  - { target: access_denied_text, method: "getByText(access_denied_pattern)", expect: toBeVisible, optional: true }
```
