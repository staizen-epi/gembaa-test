---
route: /pulse
grid_type: table
execution_mode: parallel
tags: ["@pulse"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_PULSE: GBA-VIEW-PULSE
  MANAGE_PULSE: GBA-MANAGE-PULSE
  MANAGE_MILESTONE: GBA-MANAGE-MILESTONE
entity_rules:
  can_link_to: [Staff, Team, Mission, Client]
  cardinality: one-to-one (linked to exactly 1 primary entity)
  min_links: 1
  mutability: immutable (cannot be re-linked to a different primary entity after creation)
ui_notes:
  list_element: "locator('table').first() or dashboard widgets"
  create_button: "getByRole('button', { name: /create|add|new/i })"
---

# Feature: Pulses

## Description
Pulses provide a dashboard and monitoring capability for tracking key metrics, indicators, and organizational health through configurable pulse widgets and views. Each Pulse record is linked to **exactly one** primary entity (Staff, Team, Mission, or Client) and that link is **immutable** — it cannot be changed after creation (see [global-spec.md](global-spec.md)).

## Acceptance Criteria
- [ ] Pulse dashboard is viewable by authorized users
- [ ] Pulse indicators can be configured
- [ ] Pulse data refreshes and displays current metrics
- [ ] Milestones can be managed within pulse context
- [ ] Each Pulse must be linked to exactly 1 primary entity at creation
- [ ] The entity link cannot be changed after creation

## Test Scenarios

### Scenario 1: View Pulse Dashboard
- **Given**: A user with `GBA-VIEW-PULSE` permission is logged in
- **When**: The user navigates to the Pulses module
- **Then**: The Pulse dashboard with configured widgets is displayed


### Scenario 2: Configure Pulse Indicators
- **Given**: A user with `GBA-MANAGE-PULSE` permission is logged in
- **When**: The user configures pulse indicator settings
- **Then**: The pulse indicators are updated accordingly


### Scenario 3: Manage Milestones
- **Given**: A user with `GBA-MANAGE-MILESTONE` permission is logged in
- **When**: The user creates or edits a milestone
- **Then**: The milestone is saved and reflected in the pulse view


