---
route: /portfolio
grid_type: gantt
execution_mode: parallel
tags: ["@portfolio", "@roadmap"]
permissions:
  APP_ACCESS: GBA-APP-ACCESS
  VIEW_MISSION: MSN-VIEW-MISSION
ui_notes:
  gantt_element: "Gantt chart or timeline component"
  filter_controls: "filter/group dropdowns"
  zoom_controls: "zoom/scroll controls on timeline"
---

# Feature: Portfolio / Roadmap

## Description
The Portfolio / Roadmap module provides a high-level view of missions, milestones, and timelines using Gantt charts and roadmap visualizations for strategic planning and tracking.

## Acceptance Criteria
- [ ] Portfolio/Roadmap view is accessible to authorized users
- [ ] Gantt chart displays missions and milestones on a timeline
- [ ] Roadmap can be filtered and grouped by various criteria
- [ ] Timeline can be scrolled and zoomed

## Test Scenarios

### Scenario 1: View Portfolio Roadmap
- **Given**: A user with mission view permissions is logged in
- **When**: The user navigates to `/portfolio`
- **Then**: The Gantt/roadmap view is displayed with missions and milestones

```yaml
# test-hints
permissions_required: [VIEW_MISSION]
setup: default_global_setup
navigation: goto /portfolio
assertions:
  - { target: gantt_chart, method: "gantt/timeline component locator", expect: toBeVisible }
```

### Scenario 2: Filter Roadmap
- **Given**: A user is viewing the Portfolio / Roadmap
- **When**: The user applies filters (e.g., by client, by status)
- **Then**: The roadmap updates to show only matching missions

```yaml
# test-hints
permissions_required: [VIEW_MISSION]
setup: default_global_setup
navigation: goto /portfolio
actions:
  - { action: click, target: filter_dropdown }
  - { action: select, target: filter_option, value: "specific client or status" }
assertions:
  - { target: gantt_chart, expect: "shows only filtered missions" }
```

### Scenario 3: Navigate Timeline
- **Given**: A user is viewing the Portfolio / Roadmap
- **When**: The user scrolls or zooms the timeline
- **Then**: The Gantt chart adjusts to show the selected time range

```yaml
# test-hints
permissions_required: [VIEW_MISSION]
setup: default_global_setup
navigation: goto /portfolio
actions:
  - { action: scroll_or_zoom, target: timeline }
assertions:
  - { target: gantt_chart, expect: "timeline range changes" }
```
