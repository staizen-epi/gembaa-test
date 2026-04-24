---
route: /
grid_type: none
execution_mode: serial
tags: ["@app-access", "@permissions"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
ui_notes:
  onboarding_dismissal: true
  onboarding_buttons: ["Let's Go!", "Confirm", "Accept", "Light theme", "Confirm"]
  user_menu_button: "Local Gembaa USER"
  access_denied_pattern: '/You don''t have access|Error Code: 403|no access|access denied|unauthorized/i'
---

# Feature: App Access Control

## Description
App Access Control ensures that only authorized users with the base application access token can access the Gembaa application. Users without the appropriate access token are shown a dedicated "No Access" or "Unauthorized" page.

## Acceptance Criteria
- [ ] Users without `GBA-APP-ACCESS` group in their access token are denied access to the main application features.
- [ ] Unauthorized users are redirected or shown a dedicated access denied page.
- [ ] Authorized users (with `GBA-APP-ACCESS`) can seamlessly access the application root.

## Test Scenarios

### Scenario 1: User with App Access Token successfully loads the app
- **Given**: A user is authenticated and their access token DOES include the `GBA-APP-ACCESS` group
- **When**: The user attempts to access the application root URL (`/`)
- **Then**: The user successfully loads the application home page or dashboard


### Scenario 2: User without App Access Token is denied access
- **Given**: A user is authenticated but their access token DOES NOT include the `GBA-APP-ACCESS` group
- **When**: The user attempts to access the application root URL (`/`)
- **Then**: The user is shown the dedicated "access denied" page


