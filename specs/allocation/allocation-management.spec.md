---
route: /allocation
grid_type: table
execution_mode: parallel
tags: ["@allocation"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_ALLOCATION: MSN-VIEW-ALLOCATION
  MANAGE_ALLOCATION: MSN-MANAGE-ALLOCATION
entity_rules:
  links: Staff → Mission (staff is allocated to mission for a date range)
  depends_on: [Staff, Mission]
ui_notes:
  list_element: "locator('table').first() or calendar/timeline view"
  create_button: "getByRole('button', { name: /create|add|new|allocate/i })"
---

# Feature: Allocation Management

## Description
Allocation Management handles the assignment and tracking of staff allocations to missions, enabling resource planning and capacity management across the organization. Allocations connect **Staff** to **Missions** for a specific date range (see [global-spec.md](global-spec.md)).

## Acceptance Criteria
- [ ] Allocation list/view is accessible to authorized users
- [ ] New allocations can be created
- [ ] Allocations can be viewed and edited
- [ ] Allocation conflicts or capacity issues are surfaced

## Test Scenarios

### Scenario 1: View Allocations
- **Given**: A user with `MSN-VIEW-ALLOCATION` permission is logged in
- **When**: The user navigates to `/allocation`
- **Then**: A list/view of allocations is displayed


### Scenario 2: Create New Allocation
- **Given**: A user with `MSN-MANAGE-ALLOCATION` permission is logged in
- **When**: The user assigns a staff member to a mission with a date range
- **Then**: The allocation is created and reflected in the allocation view


### Scenario 3: Edit Allocation
- **Given**: A user with `MSN-MANAGE-ALLOCATION` permission is logged in
- **When**: The user modifies an existing allocation
- **Then**: The changes are saved and reflected


### Scenario 4: View Allocation Summary
- **Given**: A user with `MSN-VIEW-ALLOCATION` permission is logged in
- **When**: The user views the allocation summary
- **Then**: An overview of staff utilization and allocation status is displayed


