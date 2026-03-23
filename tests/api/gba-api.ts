import { request } from "@playwright/test";
import { generateDynamicCookies } from "./generate-cookie";
import { BASE_URL } from "../constants";

/**
 * GBA API Utility
 *
 * Reusable helpers for the Gembaa REST API.
 * Base URL: http://localhost:1880/gba-api
 *
 * @see docs/api-reference.md#2-gba-api
 */

const GBA_API_BASE_URL =
  process.env.GBA_API_BASE_URL || `${BASE_URL}/gba-api`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomFieldProfile {
  id: string;
  fieldName: string;
  isReferenceField: boolean;
  sourceEntities: Array<{ sourceId: number; [key: string]: any }>;
  [key: string]: any;
}

export interface RidEntity {
  entityId: string;
  [key: string]: any;
}

/** Source Entity IDs as defined by the /CustomFields/Profiles API */
export const SOURCE_ENTITY = {
  STAFF: 1,
  MISSION: 2,
  TEAM: 3,
  CLIENT: 4,
  KNOWLEDGE: 5,
  MILESTONE: 6,
  RISK: 10,
  ISSUE: 11,
  DEPENDENCY: 12,
} as const;

// ---------------------------------------------------------------------------
// GBA API Class
// ---------------------------------------------------------------------------

export class GbaApi {
  /**
   * Internal helper: create a disposable API context.
   */
  private static async _request() {
    const baseURL = GBA_API_BASE_URL.endsWith('/') ? GBA_API_BASE_URL : `${GBA_API_BASE_URL}/`;
    const cookieJar = await generateDynamicCookies(baseURL);
    const cookieString = cookieJar ? cookieJar.getCookieStringSync(baseURL) : "";

    return request.newContext({ 
      baseURL,
      extraHTTPHeaders: cookieString ? { "Cookie": cookieString } : undefined
    });
  }

  /**
   * Internal helper: execute a request, parse JSON, dispose context.
   */
  private static async _json<T = any>(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    data?: any
  ): Promise<T> {
    const ctx = await GbaApi._request();
    // Remove leading slash so it appends correctly to baseURL with path (e.g. /gba-api)
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    try {
      const opts = data !== undefined ? { data } : undefined;
      const response = await ctx[method](normalizedPath, opts);
      if (!response.ok()) {
        const body = await response.text();
        throw new Error(
          `GBA API ${method.toUpperCase()} ${path} failed: ${response.status()} ${body}`
        );
      }
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } finally {
      await ctx.dispose();
    }
  }

  // ── Custom Fields — Profiles ─────────────────────────────────────────

  /**
   * Get all custom field profiles (field definitions + sourceEntities).
   */
  static async getProfiles(): Promise<CustomFieldProfile[]> {
    return GbaApi._json("get", "/CustomFields/Profiles");
  }

  /**
   * Get a specific custom field profile by ID.
   */
  static async getProfile(id: string): Promise<CustomFieldProfile> {
    return GbaApi._json("get", `/CustomFields/Profiles/${id}`);
  }

  /**
   * Get custom field profiles filtered to a specific source entity.
   * Fetches all profiles and terminology, then filters and maps terminology.
   */
  static async getProfilesBySourceEntity(
    sourceId: number
  ): Promise<CustomFieldProfile[]> {
    const [all, terminology] = await Promise.all([
      GbaApi.getProfiles(),
      GbaApi.getTerminology()
    ]);
    const profiles = Array.isArray(all) ? all : (all as any)?.customFields || [];
    const filtered = profiles.filter((p: CustomFieldProfile) => p.sourceId === sourceId);

    return filtered.map((p: CustomFieldProfile) => {
      // Create a shallow copy to prevent mutating potentially cached data elsewhere
      const mapped = { ...p };
      if (mapped.name && mapped.name.includes("TERMINOLOGY:")) {
        mapped.name = mapped.name.replace(/TERMINOLOGY:([a-zA-Z]+)(?:\.value(?:_([a-z_]+))?)?/g, (match: any, entity: string, suffix: any) => {
          const key = suffix ? `${entity.toLowerCase()}_${suffix}` : entity.toLowerCase();
          return terminology[key] || match;
        });
      }
      return mapped;
    });
  }

  /**
   * Get reference-only custom field profiles for a source entity.
   * These are fields where `isReferenceField = true`.
   */
  static async getReferenceFields(
    sourceId: number
  ): Promise<CustomFieldProfile[]> {
    const profiles = await GbaApi.getProfilesBySourceEntity(sourceId);
    const refFields = profiles.filter((p) => p.isReferenceField === true);
    return refFields;
  }

  // ── Custom Fields — Data ─────────────────────────────────────────────

  /**
   * Get custom field data for a specific source entity instance.
   */
  static async getCustomFieldData(sourceEntityId: string): Promise<any> {
    return GbaApi._json("get", `/CustomFields/Data/SourceEntityId/${sourceEntityId}`);
  }

  // ── Terminology ─────────────────────────────────────────────

  /**
   * Get the terminology mapping dictionary
   */
  static async getTerminology(): Promise<Record<string, string>> {
    const data = await GbaApi._json("get", "/Terminologies");
    
    // Map source IDs to their terminology keys
    const SOURCE_ENTITY_NAME_MAP: Record<number, string> = {
      1: "staff", 2: "mission", 3: "team", 4: "client",
      6: "milestone", 10: "risk", 11: "issue", 12: "dependency"
    };

    const dict: Record<string, string> = {};
    const capt = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

    // Parse terminologies (assuming English / languageId = 1)
    const eng = Array.isArray(data) ? data.filter((d: any) => d.languageId === 1) : [];
    
    eng.forEach((item: any) => {
      const eName = SOURCE_ENTITY_NAME_MAP[item.sourceId];
      if (eName) {
        dict[eName] = capt(item.singular);
        dict[`${eName}_lower`] = String(item.singular || "").toLowerCase();
        dict[`${eName}_plural`] = capt(item.plural);
        dict[`${eName}_plural_lower`] = String(item.plural || "").toLowerCase();
      }
    });

    return dict;
  }

  // ── Staff ────────────────────────────────────────────────────────────

  /**
   * List all staff via the GBA API.
   */
  static async listStaff(): Promise<any> {
    return GbaApi._json("get", "/Staffs");
  }

  /**
   * Get a staff member by ID.
   */
  static async getStaff(id: string): Promise<any> {
    return GbaApi._json("get", `/Staffs/${id}`);
  }

  // ── RID (Risk, Issue, Dependency) ────────────────────────────────────

  /**
   * List all entities of a given RID type.
   */
  static async listRid(type: "Risk" | "Issue" | "Dependency"): Promise<RidEntity[]> {
    return GbaApi._json("get", `/${type}`);
  }

  /**
   * Get a single RID entity.
   */
  static async getRid(
    type: "Risk" | "Issue" | "Dependency",
    entityId: string
  ): Promise<RidEntity> {
    return GbaApi._json("get", `/${type}/${entityId}`);
  }

  /**
   * Create a RID entity.
   */
  static async createRid(
    type: "Risk" | "Issue" | "Dependency",
    data: any
  ): Promise<RidEntity> {
    return GbaApi._json("post", `/${type}`, data);
  }

  /**
   * Update a RID entity (full replace).
   */
  static async updateRid(
    type: "Risk" | "Issue" | "Dependency",
    entityId: string,
    data: any
  ): Promise<RidEntity> {
    return GbaApi._json("put", `/${type}/${entityId}`, data);
  }

  /**
   * Partial update a RID entity.
   */
  static async patchRid(
    type: "Risk" | "Issue" | "Dependency",
    entityId: string,
    data: any
  ): Promise<RidEntity> {
    return GbaApi._json("patch", `/${type}/${entityId}`, data);
  }

  /**
   * Delete a RID entity.
   */
  static async deleteRid(
    type: "Risk" | "Issue" | "Dependency",
    entityId: string
  ): Promise<void> {
    await GbaApi._json("delete", `/${type}/${entityId}`);
  }

  /**
   * Get RID entities linked to a specific primary entity.
   */
  static async getLinkedRid(
    type: "Risk" | "Issue" | "Dependency",
    sourceEntityEnum: string | number,
    entityId: string
  ): Promise<RidEntity[]> {
    return GbaApi._json(
      "get",
      `/${type}/linked/${sourceEntityEnum}/${entityId}`
    );
  }

  // ── Knowledge ────────────────────────────────────────────────────────

  /**
   * List all knowledge entries.
   */
  static async listKnowledge(): Promise<any[]> {
    return GbaApi._json("get", "/Knowledge");
  }

  /**
   * Get knowledge entries for a source entity.
   */
  static async getKnowledgeBySourceEntity(sourceEntityId: string): Promise<any[]> {
    return GbaApi._json("get", `/Knowledge/SourceEntityId/${sourceEntityId}`);
  }

  // ── Milestones ───────────────────────────────────────────────────────

  /**
   * List all milestones.
   */
  static async listMilestones(): Promise<any[]> {
    return GbaApi._json("get", "/Milestone");
  }

  // ── Activity Logs ────────────────────────────────────────────────────

  /**
   * Get activity logs for a specific entity.
   */
  static async getActivityLogs(
    entityType: "staff" | "team" | "mission" | "client",
    entityId: string
  ): Promise<any> {
    return GbaApi._json("get", `/ActivityLogs/${entityType}/${entityId}`);
  }

  // ── Permissions ──────────────────────────────────────────────────────

  /**
   * Get permissions for an entity type.
   */
  static async getPermissions(entityType: string): Promise<any> {
    return GbaApi._json("get", `/Permissions/${entityType}`);
  }
}
