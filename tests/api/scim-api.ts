import { request } from "@playwright/test";

/**
 * SCIM API Utility
 *
 * Reusable helpers for the SCIM 2.0 API (EntraID simulation).
 * Base URL: http://localhost:5050
 *
 * @see docs/scim-api-reference.md
 * @see docs/api-reference.md#1-scim-api
 */

const SCIM_BASE_URL = process.env.SCIM_BASE_URL || "http://localhost:5050";

const SCHEMAS = {
  core: "urn:ietf:params:scim:schemas:core:2.0:User",
  enterprise: "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
  patchOp: "urn:ietf:params:scim:api:messages:2.0:PatchOp",
} as const;

/** SCIM Patch operation codes */
export const SCIM_OP = {
  ADD: 0,
  REMOVE: 1,
  REPLACE: 2,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScimCreateUserOptions {
  userName: string;
  displayName: string;
  givenName: string;
  familyName: string;
  email: string;
  active?: boolean;
  department?: string;
  employeeNumber?: string;
}

export interface ScimPatchOperation {
  op: number;
  path: string;
  value: any;
}

export interface ScimUserResponse {
  id: string;
  identifier?: string;
  userName: string;
  displayName: string;
  active: boolean;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// SCIM API Class
// ---------------------------------------------------------------------------

export class ScimApi {
  // ── Users ────────────────────────────────────────────────────────────

  /**
   * Create a staff member via SCIM API.
   * Returns the full SCIM user response (includes `id` / `identifier`).
   */
  static async createUser(options: ScimCreateUserOptions): Promise<ScimUserResponse> {
    const apiContext = await request.newContext({ baseURL: SCIM_BASE_URL });
    try {
      const response = await apiContext.post("/scim/Users", {
        data: {
          schemas: [SCHEMAS.core, SCHEMAS.enterprise],
          userName: options.userName,
          active: options.active ?? true,
          displayName: options.displayName,
          name: {
            familyName: options.familyName,
            givenName: options.givenName,
          },
          emails: [
            { value: options.email, type: "work", primary: true },
          ],
          roles: [{ value: "Staff" }],
          externalId: `ext-${Date.now()}`,
          [SCHEMAS.enterprise]: {
            employeeNumber: options.employeeNumber || `EMP-${Date.now()}`,
            department: options.department || "Engineering",
          },
        },
      });

      if (!response.ok()) {
        const errorBody = await response.text();
        throw new Error(`SCIM Create failed: ${response.status()} ${errorBody}`);
      }

      return await response.json();
    } finally {
      await apiContext.dispose();
    }
  }

  /**
   * Patch a SCIM user with one or more operations.
   * Returns the updated SCIM user response.
   */
  static async patchUser(
    identifier: string,
    operations: ScimPatchOperation[]
  ): Promise<ScimUserResponse> {
    const apiContext = await request.newContext({ baseURL: SCIM_BASE_URL });
    try {
      const response = await apiContext.patch(`/scim/Users/${identifier}`, {
        data: {
          schemas: [SCHEMAS.patchOp],
          operations,
        },
      });

      if (!response.ok()) {
        const errorBody = await response.text();
        throw new Error(`SCIM Patch failed: ${response.status()} ${errorBody}`);
      }

      return await response.json();
    } finally {
      await apiContext.dispose();
    }
  }

  /**
   * Delete a SCIM user by identifier.
   */
  static async deleteUser(identifier: string): Promise<void> {
    const apiContext = await request.newContext({ baseURL: SCIM_BASE_URL });
    try {
      const response = await apiContext.delete(`/scim/Users/${identifier}`);
      if (!response.ok()) {
        const errorBody = await response.text();
        throw new Error(`SCIM Delete failed: ${response.status()} ${errorBody}`);
      }
    } finally {
      await apiContext.dispose();
    }
  }

  /**
   * Get a specific SCIM user by identifier.
   */
  static async getUser(identifier: string): Promise<ScimUserResponse> {
    const apiContext = await request.newContext({ baseURL: SCIM_BASE_URL });
    try {
      const response = await apiContext.get(`/scim/Users/${identifier}`);
      if (!response.ok()) {
        const errorBody = await response.text();
        throw new Error(`SCIM Get failed: ${response.status()} ${errorBody}`);
      }
      return await response.json();
    } finally {
      await apiContext.dispose();
    }
  }

  /**
   * List all SCIM users.
   */
  static async listUsers(): Promise<any> {
    const apiContext = await request.newContext({ baseURL: SCIM_BASE_URL });
    try {
      const response = await apiContext.get("/scim/Users");
      if (!response.ok()) {
        const errorBody = await response.text();
        throw new Error(`SCIM List failed: ${response.status()} ${errorBody}`);
      }
      return await response.json();
    } finally {
      await apiContext.dispose();
    }
  }

  // ── Convenience shortcuts ────────────────────────────────────────────

  /**
   * Activate a SCIM user (set active = true).
   */
  static async activateUser(identifier: string): Promise<ScimUserResponse> {
    return ScimApi.patchUser(identifier, [
      { op: SCIM_OP.REPLACE, path: "active", value: true },
    ]);
  }

  /**
   * Deactivate a SCIM user (set active = false).
   */
  static async deactivateUser(identifier: string): Promise<ScimUserResponse> {
    return ScimApi.patchUser(identifier, [
      { op: SCIM_OP.REPLACE, path: "active", value: false },
    ]);
  }

  /**
   * Update the displayName of a SCIM user.
   */
  static async updateDisplayName(
    identifier: string,
    displayName: string
  ): Promise<ScimUserResponse> {
    return ScimApi.patchUser(identifier, [
      { op: SCIM_OP.REPLACE, path: "displayName", value: displayName },
    ]);
  }

  // ── Groups ───────────────────────────────────────────────────────────

  /**
   * List all SCIM groups.
   */
  static async listGroups(): Promise<any> {
    const apiContext = await request.newContext({ baseURL: SCIM_BASE_URL });
    try {
      const response = await apiContext.get("/scim/Groups");
      if (!response.ok()) {
        throw new Error(`SCIM ListGroups failed: ${response.status()}`);
      }
      return await response.json();
    } finally {
      await apiContext.dispose();
    }
  }
}
