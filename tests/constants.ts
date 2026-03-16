/**
 * Shared test constants for the Gembaa test suite.
 * Centralises repeated strings so they can be updated in one place.
 */

// ---------------------------------------------------------------------------
// Page load states
// ---------------------------------------------------------------------------
export const LOAD_STATE = {
  /** Use after navigation — fast, waits only for HTML/CSS parse */
  DOM: "domcontentloaded",
  /** Use after an in-page interaction (click, form submit) that triggers XHR */
  IDLE: "networkidle",
} as const;

// ---------------------------------------------------------------------------
// Onboarding dialog button labels (dismissed at app startup)
// ---------------------------------------------------------------------------
export const ONBOARDING_BUTTONS = [
  "Let's Go!",
  "Confirm",
  "Accept",
  "Light theme",
  "Confirm",
] as const;

// ---------------------------------------------------------------------------
// Permissions / cognito groups
// ---------------------------------------------------------------------------
export const PERM = {
  APP_ACCESS: "GBA-APP-ACCESS",

  VIEW_PERMISSIONS: "PER-VIEW-PERMISSIONS",
  MANAGE_PERMISSIONS: "PER-MANAGE-PERMISSIONS",

  VIEW_STAFF: "STF-VIEW-STAFF",
  VIEW_INACTIVE_STAFF: "STF-VIEW-INACTIVE_STAFF",
  MANAGE_STAFF: "STF-MANAGE-STAFF",

  VIEW_TEAM: "STF-VIEW-TEAM",
  MANAGE_TEAM: "STF-MANAGE-TEAM",

  VIEW_MISSION: "MSN-VIEW-MISSION",
  MANAGE_MISSION: "MSN-MANAGE-MISSION",

  VIEW_CLIENT: "MSN-VIEW-CLIENT",
  MANAGE_CLIENT: "MSN-MANAGE-CLIENT",

  VIEW_ALLOCATION: "MSN-VIEW-ALLOCATION",
  MANAGE_ALLOCATION: "MSN-MANAGE-ALLOCATION",

  VIEW_FINANCE_ENTRY: "MSN-VIEW-FINANCE_ENTRY",
  MANAGE_FINANCE_ENTRY: "MSN-MANAGE-FINANCE_ENTRY",
  VIEW_DAILY_CAPACITY: "MSN-VIEW-DAILY_CAPACITY",

  VIEW_PULSE: "GBA-VIEW-PULSE",
  MANAGE_PULSE: "GBA-MANAGE-PULSE",
  MANAGE_MILESTONE: "GBA-MANAGE-MILESTONE",

  VIEW_RAID: "GBA-VIEW-RAID",
  MANAGE_RAID: "GBA-MANAGE-RAID",
} as const;

// ---------------------------------------------------------------------------
// Common timeouts (ms)
// ---------------------------------------------------------------------------
export const TIMEOUT = {
  /** Standard assertion timeout */
  DEFAULT: 10_000,
  /** Longer wait for list data to load (e.g. after SCIM ops) */
  LONG: 15_000,
  /** Short wait for elements that may not exist */
  SHORT: 2_000,
  /** Debounce / animation settle */
  DEBOUNCE: 1_000,
} as const;

// ---------------------------------------------------------------------------
// Common UI element labels
// ---------------------------------------------------------------------------
export const LABEL = {
  USER_MENU_BUTTON: "Local Gembaa USER",
  QUICK_SEARCH: "Quick Search",
} as const;
