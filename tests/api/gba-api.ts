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
// Enums (integer values from OpenAPI spec)
// ---------------------------------------------------------------------------

/** Source entity IDs — used across CustomFields, RID, Roles, Contributors, etc. */
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
export type SourceEntityEnum = (typeof SOURCE_ENTITY)[keyof typeof SOURCE_ENTITY];

/** Custom field type IDs */
export const CUSTOM_FIELD_TYPE = {
  TEXT: 1,
  NUMBER: 2,
  DATE: 3,
  BOOLEAN: 4,
  SELECT: 5,
  MULTI_SELECT: 6,
  URL: 7,
  EMAIL: 8,
  PHONE: 9,
  CURRENCY: 10,
  COMPOSITE: 11,
  TEXTAREA: 12,
  RICH_TEXT: 13,
  RATING: 14,
  PERCENT: 15,
  DURATION: 16,
  STATUS: 17,
  PERSON: 18,
  RELATION: 19,
  FORMULA: 20,
  ATTACHMENT: 21,
} as const;
export type CustomFieldTypeEnum = (typeof CUSTOM_FIELD_TYPE)[keyof typeof CUSTOM_FIELD_TYPE];

/** Permission levels */
export const PERMISSION_LEVEL = {
  NONE: 0,
  VIEW: 1,
  EDIT: 2,
  MANAGE: 3,
} as const;
export type PermissionLevel = (typeof PERMISSION_LEVEL)[keyof typeof PERMISSION_LEVEL];

/** Record visibility */
export const RECORD_VISIBILITY = {
  PUBLIC: 1,
  RESTRICTED: 2,
  PRIVATE: 3,
} as const;
export type RecordVisibility = (typeof RECORD_VISIBILITY)[keyof typeof RECORD_VISIBILITY];

/** Pulse status */
export const PULSE_STATUS = { RED: 1, AMBER: 2, GREEN: 3, NOT_SET: 4 } as const;
export type PulseStatusEnum = (typeof PULSE_STATUS)[keyof typeof PULSE_STATUS];

/** Pulse forecast */
export const PULSE_FORECAST = { RED: 1, AMBER: 2, GREEN: 3, NOT_SET: 4 } as const;
export type PulseForecastEnum = (typeof PULSE_FORECAST)[keyof typeof PULSE_FORECAST];

/** RID entity types */
export type RidType = "Risk" | "Issue" | "Dependency";

/** Entity types for activity logs */
export type ActivityLogEntityType = "staff" | "team" | "mission" | "client";

// ---------------------------------------------------------------------------
// Types — Custom Fields
// ---------------------------------------------------------------------------

export interface CustomFieldProfileResponse {
  fieldTypes: CustomFieldTypeResponse[] | null;
  sourceEntities: CustomFieldSourceResponse[] | null;
  customFields: CustomFieldConfigResponse[] | null;
  listItemCategories: CustomListItemCategoryResponse[] | null;
  currencyRoundings: CurrencyRoundingResponse[] | null;
}

export interface CustomFieldConfigResponse {
  id: number;
  sourceId: SourceEntityEnum;
  fieldTypeId: CustomFieldTypeEnum;
  name: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  order: number;
  group: number;
  renderingId: number;
  isLocked: boolean;
  isReferenceField: boolean;
  min: number | null;
  max: number | null;
  pathInSource: string | null;
  description: string | null;
  appFieldId: string | null;
  isConfigurable: boolean;
  isPositionLocked: boolean;
  listField: CustomListConfigResponse | null;
  compositeField: CustomCompositeFieldConfigResponse | null;
  currencyField: CustomCurrencyConfigResponse | null;
}

export interface CustomListConfigResponse {
  id: number;
  isMultiselect: boolean;
  displayAsTag: boolean;
  listItems: CustomListItemResponse[] | null;
}

export interface CustomListItemResponse {
  id: number;
  name: string | null;
  order: number;
  color: string | null;
  isDisabled: boolean;
  categoryId: number | null;
  isDefault: boolean;
  icon: string | null;
}

export interface CustomCompositeFieldConfigResponse {
  id: number;
  isField01Used: boolean; field01Name: string | null; field01DefaultValue: string | null;
  isField02Used: boolean; field02Name: string | null; field02DefaultValue: string | null;
  isField03Used: boolean; field03Name: string | null; field03DefaultValue: number | null;
  isField04Used: boolean; field04Name: string | null; field04DefaultValue: string | null;
  isField05Used: boolean; field05Name: string | null; field05DefaultValue: number | null;
  renderingId: number;
}

export interface CustomCurrencyConfigResponse {
  id: number;
  currency: string | null;
  precision: number | null;
  rounding: number | null;
}

export interface CustomFieldTypeResponse { id: number; name: string | null; }
export interface CustomFieldSourceResponse { id: number; name: string | null; }
export interface CustomListItemCategoryResponse {
  id: number; name: string | null; fieldTypeId: CustomFieldTypeEnum;
  icon: string | null; color: string | null;
}
export interface CurrencyRoundingResponse { id: number; name: string | null; }

export interface CustomFieldDataResponse {
  id: number;
  configId: number;
  sourceEntityId: string;
  value: string | null;
  compositeFieldData: CompositeFieldDataResponse | null;
}

export interface CompositeFieldDataResponse {
  id: number;
  field01Value: string | null; field02Value: string | null; field03Value: number | null;
  field04Value: string | null; field05Value: number | null;
}

export interface CustomFieldDataBatchResponse {
  successfulUpdates: CustomFieldDataResponse[] | null;
  successfulDeletes: DeletedCustomFieldResponse[] | null;
  errors: DomainError[] | null;
  hasErrors: boolean;
  hasSuccesses: boolean;
}

export interface DeletedCustomFieldResponse { sourceEntityId: string; configId: number; }
export interface DomainError { code: string | null; description: string | null; }

export interface EntityCustomFieldData {
  entityId: string;
  sourceType: number | null;
  customFields: CustomFieldDataResponse[] | null;
  permissions: Record<string, unknown> | null;
}

export interface BatchCustomFieldDataResponse {
  results: EntityCustomFieldData[] | null;
}

// Request types for CustomField Configs
export interface CreateCustomFieldConfigRequest {
  id?: number | null;
  sourceId: SourceEntityEnum;
  fieldTypeId: CustomFieldTypeEnum;
  name?: string | null;
  isRequired: boolean;
  defaultValue?: string | null;
  order: number;
  group: number;
  renderingId: number;
  isReferenceField: boolean;
  min?: number | null;
  max?: number | null;
  description?: string | null;
  listField?: CustomListConfigRequest | null;
  compositeField?: CustomCompositeFieldConfigRequest | null;
  currencyField?: CurrencyConfigRequest | null;
}

export interface UpdateCustomFieldConfigRequest extends Omit<CreateCustomFieldConfigRequest, "sourceId" | "fieldTypeId"> {
  id?: number | null;
}

export interface CustomListConfigRequest {
  id?: number | null;
  isMultiselect: boolean;
  displayAsTag: boolean;
  listItems?: CustomListItemRequest[] | null;
}

export interface CustomListItemRequest {
  id?: number | null;
  name?: string | null;
  order: number;
  color?: string | null;
  isDisabled: boolean;
  categoryId?: number | null;
  isDefault: boolean;
  icon?: string | null;
}

export interface CustomCompositeFieldConfigRequest {
  id?: number | null;
  isField01Used: boolean; field01Name?: string | null; field01DefaultValue?: string | null;
  isField02Used: boolean; field02Name?: string | null; field02DefaultValue?: string | null;
  isField03Used: boolean; field03Name?: string | null; field03DefaultValue?: number | null;
  isField04Used: boolean; field04Name?: string | null; field04DefaultValue?: string | null;
  isField05Used: boolean; field05Name?: string | null; field05DefaultValue?: number | null;
  renderingId: number;
}

export interface CurrencyConfigRequest {
  id?: number | null;
  currency?: string | null;
  precision?: number | null;
  rounding?: number | null;
}

export interface UpdateGroupAndOrderRequest {
  groupOrderChanges?: Array<{ configId: number; group: number; order: number }> | null;
}

// Request types for CustomField Data
export interface CreateCustomFieldDataRequest {
  id?: number | null;
  sourceEntityId: string;
  configId: number;
  value?: string | null;
  compositeFieldData?: CompositeFieldDataRequest | null;
}

export interface CompositeFieldDataRequest {
  id?: number | null;
  field01Value?: string | null; field02Value?: string | null; field03Value?: number | null;
  field04Value?: string | null; field05Value?: number | null;
}

// ---------------------------------------------------------------------------
// Types — RID (Risk, Issue, Dependency)
// ---------------------------------------------------------------------------

export interface RidEntity {
  id: string;
  number: number;
  createdAt: string;
  text: string | null;
  assignee: string | null;
  status: number | null;
  associations: Record<string, unknown> | null;
  customFields: CustomFieldDataResponse[] | null;
}

export interface CreateRidRequest {
  text?: string | null;
  assignee?: string | null;
  status?: number | null;
  associations: { linked?: Record<string, unknown> | null };
  customFields?: CreateCustomFieldDataRequest[] | null;
}

export interface UpdateRidRequest extends CreateRidRequest {
  id: string;
  associations: { linked?: Record<string, unknown> | null; unlinked?: Record<string, unknown> | null };
}

// ---------------------------------------------------------------------------
// Types — Terminologies
// ---------------------------------------------------------------------------

export interface TerminologyResponse {
  id: number;
  sourceId: number;
  languageId: number;
  singular: string | null;
  plural: string | null;
  description: string | null;
}

export interface CreateTerminologyRequest {
  id?: number | null;
  sourceId: SourceEntityEnum;
  languageId: number;
  singular?: string | null;
  plural?: string | null;
  description?: string | null;
}

// ---------------------------------------------------------------------------
// Types — Staff, Roles, Groups, Contributors
// ---------------------------------------------------------------------------

export interface StaffResponse { id: string; }

export interface RoleResponse {
  id: string;
  sourceId: SourceEntityEnum;
  instanceId: string | null;
  name: string | null;
  order: number;
  staffAssociations: Array<{ id: string; staffId: string }> | null;
  groupAssociations: Array<{ id: string; groupId: string }> | null;
}

export interface GroupResponse {
  id: string;
  sourceId: SourceEntityEnum;
  instanceId: string | null;
  roleId: string | null;
  name: string | null;
  staffAssociations: Array<{ id: string; staffId: string }> | null;
}

export interface ContributorRoleResponse {
  sourceId: SourceEntityEnum;
  instanceId: string | null;
  roleId: string;
  name: string | null;
  staffAssociations: Array<{ id: string; staffId: string }> | null;
  groupAssociations: Array<{ id: string; groupId: string }> | null;
}

// ---------------------------------------------------------------------------
// Types — Knowledge
// ---------------------------------------------------------------------------

export interface KnowledgeResponse {
  id: string;
  description: string | null;
  url: string | null;
  classificationId: string;
  lastUpdatedBy: string;
  lastUpdated: string;
  relatedTo: Array<{ id: string; sourceEntityId: string; sourceId: SourceEntityEnum }> | null;
}

export interface KnowledgeClassificationResponse {
  id: string;
  name: string | null;
  color: string | null;
  icon: string | null;
  order: number;
}

export interface KnowledgeAssociationResponse {
  id: string;
  knowledgeId: string;
  instanceId: string;
  sourceEntity: SourceEntityEnum;
  lastUpdatedBy: string;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Types — Milestones (TaskResponse)
// ---------------------------------------------------------------------------

export interface TaskResponse {
  id: string;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  missionId: string;
  staffId: string | null;
  parentTaskId: string | null;
  subTaskIds: string[] | null;
  customFields: CustomFieldDataResponse[] | null;
}

// ---------------------------------------------------------------------------
// Types — Pulse
// ---------------------------------------------------------------------------

export interface PulseConfigForSourceTypeResponse {
  id: number;
  sourceId: number;
  isPulseEnabled: boolean;
  hasForecast: boolean;
  refreshPeriodInDays: number;
  warningPeriodInDays: number;
  remindPeriodInDays: number;
  isProgressEnabled: boolean;
  isDoneRecentlyAndComingNextEnabled: boolean;
}

export interface PulseConfigForInstanceResponse {
  id: number;
  sourceEntityId: string;
  configForSourceTypeId: number;
  isPulseEnabled: boolean;
  hasForecast: boolean;
  refreshPeriodInDays: number;
  warningPeriodInDays: number;
  remindPeriodInDays: number;
  isProgressEnabled: boolean;
  isDoneRecentlyAndComingNextEnabled: boolean;
}

export interface PulseIndicatorConfigForSourceTypeResponse {
  id: number;
  sourceTypeId: number;
  name: string | null;
  description: string | null;
  order: number;
  guidelines: string | null;
}

export interface PulseEntryResponse {
  id: number;
  sourceTypeId: number;
  sourceEntityId: string;
  pulseConfigForInstanceId: number;
  creator: string;
  createDate: string;
  editor: string;
  editDate: string;
  pulseIndicatorEntries: PulseIndicatorEntryResponse[] | null;
  progress: number | null;
  doneRecently: string | null;
  comingNext: string | null;
}

export interface PulseIndicatorEntryResponse {
  id: number;
  pulseEntryId: number;
  indicatorConfigId: number;
  pulseStatus: PulseStatusEnum;
  forecastStatus: PulseForecastEnum;
  comment: string | null;
}

// ---------------------------------------------------------------------------
// Types — Activity Logs
// ---------------------------------------------------------------------------

export interface ActivityLogListResponse {
  data: ActivityLogResponse[] | null;
  pagination: { cursor: string | null; nextCursor: string | null; size: number; hasMore: boolean };
}

export interface ActivityLogResponse {
  id: number;
  entityId: string;
  entityType: number;
  eventType: number;
  targetIds: string[] | null;
  template: string | null;
  timestamp: string;
  placeholders: Array<{ key: string | null; displayText: string | null; value: string; entityType: number | null }> | null;
  subDetails: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Types — Permissions
// ---------------------------------------------------------------------------

export interface SourceEntityPermissionsResponse {
  sourceId: SourceEntityEnum;
  roleAndGroupNames: Record<string, unknown> | null;
  permissionNames: Record<string, unknown> | null;
  permissionLevels: Array<{ roleOrGroupId: string; permissionId: string; permissionLevel: PermissionLevel }> | null;
  allowedPermissions: Record<string, unknown> | null;
  visibility: RecordVisibility;
}

// ---------------------------------------------------------------------------
// GBA API Class
// ---------------------------------------------------------------------------

export class GbaApi {
  private static async _request() {
    const baseURL = GBA_API_BASE_URL.endsWith("/") ? GBA_API_BASE_URL : `${GBA_API_BASE_URL}/`;
    const cookieJar = await generateDynamicCookies(baseURL);
    const cookieString = cookieJar ? cookieJar.getCookieStringSync(baseURL) : "";
    return request.newContext({
      baseURL,
      extraHTTPHeaders: cookieString ? { Cookie: cookieString } : undefined,
    });
  }

  private static async _json<T = any>(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    data?: any
  ): Promise<T> {
    const ctx = await GbaApi._request();
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    try {
      const opts = data !== undefined ? { data } : undefined;
      const response = await ctx[method](normalizedPath, opts);
      if (!response.ok()) {
        const body = await response.text();
        throw new Error(`GBA API ${method.toUpperCase()} ${path} failed: ${response.status()} ${body}`);
      }
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } finally {
      await ctx.dispose();
    }
  }

  // ── Activity Logs ────────────────────────────────────────────────────────

  static async getAllActivityLogs(): Promise<ActivityLogListResponse> {
    return GbaApi._json("get", "/ActivityLogs");
  }

  static async getActivityLogs(
    entityType: ActivityLogEntityType,
    entityId: string
  ): Promise<ActivityLogListResponse> {
    return GbaApi._json("get", `/ActivityLogs/${entityType}/${entityId}`);
  }

  // ── Contributors ─────────────────────────────────────────────────────────

  static async listContributors(): Promise<ContributorRoleResponse[]> {
    return GbaApi._json("get", "/Contributors");
  }

  static async assignContributors(data: {
    sourceId: SourceEntityEnum;
    roleIds?: string[] | null;
    staffContributors?: string[] | null;
    groupContributors?: string[] | null;
  }): Promise<ContributorRoleResponse[]> {
    return GbaApi._json("post", "/Contributors/Assign", data);
  }

  static async unassignContributors(data: {
    sourceId: SourceEntityEnum;
    roleIds?: string[] | null;
    staffContributors?: string[] | null;
    groupContributors?: string[] | null;
  }): Promise<void> {
    await GbaApi._json("post", "/Contributors/Unassign", data);
  }

  static async listInstanceContributors(instanceId: string): Promise<ContributorRoleResponse[]> {
    return GbaApi._json("get", `/Contributors/Instance/${instanceId}`);
  }

  static async assignInstanceContributors(
    instanceId: string,
    data: {
      sourceId: SourceEntityEnum;
      roleIds?: string[] | null;
      staffContributors?: string[] | null;
      groupContributors?: string[] | null;
    }
  ): Promise<ContributorRoleResponse[]> {
    return GbaApi._json("post", `/Contributors/Instance/${instanceId}/Assign`, data);
  }

  static async unassignInstanceContributors(
    instanceId: string,
    data: {
      sourceId: SourceEntityEnum;
      roleIds?: string[] | null;
      staffContributors?: string[] | null;
      groupContributors?: string[] | null;
    }
  ): Promise<void> {
    await GbaApi._json("post", `/Contributors/Instance/${instanceId}/Unassign`, data);
  }

  // ── Custom Fields — Profiles ─────────────────────────────────────────────

  static async getProfiles(): Promise<CustomFieldProfileResponse> {
    return GbaApi._json("get", "/CustomFields/Profiles");
  }

  static async getProfile(id: string): Promise<CustomFieldProfileResponse> {
    return GbaApi._json("get", `/CustomFields/Profiles/${id}`);
  }

  static async getProfilesBySourceEntity(sourceId: number): Promise<CustomFieldConfigResponse[]> {
    const [profileResp, terminology] = await Promise.all([
      GbaApi.getProfiles(),
      GbaApi.getTerminology(),
    ]);
    const all = profileResp.customFields ?? [];
    const filtered = all.filter((p) => (p as any).sourceId === sourceId);
    return filtered.map((p) => {
      if (!p.name?.includes("TERMINOLOGY:")) return p;
      const mapped = { ...p };
      mapped.name = mapped.name!.replace(
        /TERMINOLOGY:([a-zA-Z]+)(?:\.value(?:_([a-z_]+))?)?/g,
        (_match: string, entity: string, suffix: string | undefined) => {
          const key = suffix ? `${entity.toLowerCase()}_${suffix}` : entity.toLowerCase();
          return terminology[key] ?? _match;
        }
      );
      return mapped;
    });
  }

  static async getReferenceFields(sourceId: number): Promise<CustomFieldConfigResponse[]> {
    const profiles = await GbaApi.getProfilesBySourceEntity(sourceId);
    return profiles.filter((p) => p.isReferenceField === true);
  }

  // ── Custom Fields — Configs ──────────────────────────────────────────────

  static async createCustomFieldConfig(data: CreateCustomFieldConfigRequest): Promise<CustomFieldConfigResponse> {
    return GbaApi._json("post", "/CustomFields/Configs", data);
  }

  static async getCustomFieldConfig(id: number): Promise<CustomFieldConfigResponse> {
    return GbaApi._json("get", `/CustomFields/Configs/${id}`);
  }

  static async updateCustomFieldConfig(id: number, data: UpdateCustomFieldConfigRequest): Promise<CustomFieldConfigResponse> {
    return GbaApi._json("put", `/CustomFields/Configs/${id}`, data);
  }

  static async deleteCustomFieldConfig(id: number): Promise<void> {
    await GbaApi._json("delete", `/CustomFields/Configs/${id}`);
  }

  static async updateCustomFieldGroupAndOrder(data: UpdateGroupAndOrderRequest): Promise<void> {
    await GbaApi._json("put", "/CustomFields/Configs/UpdateGroupAndOrder", data);
  }

  // ── Custom Fields — Data ─────────────────────────────────────────────────

  static async createCustomFieldData(data: CreateCustomFieldDataRequest): Promise<CustomFieldDataResponse> {
    return GbaApi._json("post", "/CustomFields/Data", data);
  }

  static async getCustomFieldDataById(id: number): Promise<CustomFieldDataResponse> {
    return GbaApi._json("get", `/CustomFields/Data/${id}`);
  }

  static async updateCustomFieldData(id: number, data: CreateCustomFieldDataRequest): Promise<CustomFieldDataResponse> {
    return GbaApi._json("put", `/CustomFields/Data/${id}`, data);
  }

  static async deleteCustomFieldData(id: number): Promise<void> {
    await GbaApi._json("delete", `/CustomFields/Data/${id}`);
  }

  static async batchGetCustomFieldData(): Promise<BatchCustomFieldDataResponse> {
    return GbaApi._json("get", "/CustomFields/Data/Batch");
  }

  static async getCustomFieldData(sourceEntityId: string): Promise<CustomFieldDataResponse[]> {
    return GbaApi._json("get", `/CustomFields/Data/SourceEntityId/${sourceEntityId}`);
  }

  static async createOrUpdateCustomFieldDataBySourceEntity(
    data: CreateCustomFieldDataRequest[]
  ): Promise<CustomFieldDataBatchResponse> {
    return GbaApi._json("post", "/CustomFields/Data/CreateOrUpdateBySourceEntityId", data);
  }

  static async replaceCustomFieldDataBySourceEntity(
    data: CreateCustomFieldDataRequest[]
  ): Promise<CustomFieldDataResponse[]> {
    return GbaApi._json("put", "/CustomFields/Data/SourceEntityId", data);
  }

  static async patchCustomFieldDataBySourceEntity(
    data: CreateCustomFieldDataRequest[]
  ): Promise<CustomFieldDataBatchResponse> {
    return GbaApi._json("patch", "/CustomFields/Data/SourceEntityId", data);
  }

  static async deleteCustomFieldDataBySourceEntity(sourceEntityId: string): Promise<void> {
    await GbaApi._json("delete", `/CustomFields/Data/SourceEntityId/${sourceEntityId}`);
  }

  // ── RID (Risk, Issue, Dependency) ────────────────────────────────────────

  static async listRid(type: RidType): Promise<RidEntity[]> {
    return GbaApi._json("get", `/${type}`);
  }

  static async getRid(type: RidType, entityId: string): Promise<RidEntity> {
    return GbaApi._json("get", `/${type}/${entityId}`);
  }

  static async createRid(type: RidType, data: CreateRidRequest): Promise<RidEntity> {
    return GbaApi._json("post", `/${type}`, data);
  }

  static async updateRid(type: RidType, entityId: string, data: UpdateRidRequest): Promise<RidEntity> {
    return GbaApi._json("put", `/${type}/${entityId}`, data);
  }

  static async patchRid(type: RidType, entityId: string, data: Partial<UpdateRidRequest>): Promise<RidEntity> {
    return GbaApi._json("patch", `/${type}/${entityId}`, data);
  }

  static async deleteRid(type: RidType, entityId: string): Promise<void> {
    await GbaApi._json("delete", `/${type}/${entityId}`);
  }

  static async getLinkedRid(
    type: RidType,
    sourceEntityEnum: SourceEntityEnum,
    entityId: string
  ): Promise<RidEntity[]> {
    return GbaApi._json("get", `/${type}/linked/${sourceEntityEnum}/${entityId}`);
  }

  // ── Roles ────────────────────────────────────────────────────────────────

  static async listRoles(): Promise<RoleResponse[]> {
    return GbaApi._json("get", "/Roles");
  }

  static async getRole(id: string): Promise<RoleResponse> {
    return GbaApi._json("get", `/Roles/${id}`);
  }

  static async createRole(data: {
    sourceId: SourceEntityEnum;
    instanceId?: string | null;
    name?: string | null;
    order: number;
    staffs?: string[] | null;
    groups?: string[] | null;
  }): Promise<RoleResponse> {
    return GbaApi._json("post", "/Roles", data);
  }

  static async updateRole(id: string, data: {
    id: string;
    sourceId: SourceEntityEnum;
    instanceId?: string | null;
    name?: string | null;
    order: number;
    staffs?: string[] | null;
    groups?: string[] | null;
  }): Promise<RoleResponse> {
    return GbaApi._json("put", `/Roles/${id}`, data);
  }

  static async deleteRole(id: string): Promise<void> {
    await GbaApi._json("delete", `/Roles/${id}`);
  }

  static async updateRoleOrder(roleOrderChanges: Array<{ roleId: string; order: number }>): Promise<void> {
    await GbaApi._json("put", "/Roles/UpdateOrder", { roleOrderChanges });
  }

  static async deleteRoleAssociation(id: string): Promise<void> {
    await GbaApi._json("delete", `/Roles/Association/${id}`);
  }

  // ── Groups ───────────────────────────────────────────────────────────────

  static async listGroups(): Promise<GroupResponse[]> {
    return GbaApi._json("get", "/Groups");
  }

  static async getGroup(id: string): Promise<GroupResponse> {
    return GbaApi._json("get", `/Groups/${id}`);
  }

  static async createGroup(data: {
    sourceId: SourceEntityEnum;
    instanceId?: string | null;
    roleId?: string | null;
    name?: string | null;
    staffs?: string[] | null;
  }): Promise<GroupResponse> {
    return GbaApi._json("post", "/Groups", data);
  }

  static async updateGroup(id: string, data: {
    id: string;
    sourceId: SourceEntityEnum;
    instanceId?: string | null;
    roleId?: string | null;
    name?: string | null;
    staffs?: string[] | null;
  }): Promise<GroupResponse> {
    return GbaApi._json("put", `/Groups/${id}`, data);
  }

  static async deleteGroup(id: string): Promise<void> {
    await GbaApi._json("delete", `/Groups/${id}`);
  }

  // ── Staff ────────────────────────────────────────────────────────────────

  static async listStaff(): Promise<StaffResponse[]> {
    return GbaApi._json("get", "/Staffs");
  }

  static async getStaff(id: string): Promise<StaffResponse> {
    return GbaApi._json("get", `/Staffs/${id}`);
  }

  static async deleteStaff(id: string): Promise<void> {
    await GbaApi._json("delete", `/Staffs/${id}`);
  }

  // ── Knowledge ────────────────────────────────────────────────────────────

  static async listKnowledge(): Promise<KnowledgeResponse[]> {
    return GbaApi._json("get", "/Knowledge");
  }

  static async getKnowledge(entityId: string): Promise<KnowledgeResponse> {
    return GbaApi._json("get", `/Knowledge/${entityId}`);
  }

  static async createKnowledge(data: {
    description?: string | null;
    url?: string | null;
    classificationId: string;
    lastUpdatedBy: string;
    relatedTo?: Array<{ sourceEntityId: string; sourceId: SourceEntityEnum }> | null;
  }): Promise<KnowledgeResponse> {
    return GbaApi._json("post", "/Knowledge", data);
  }

  static async updateKnowledge(entityId: string, data: {
    id: string;
    description?: string | null;
    url?: string | null;
    classificationId: string;
    lastUpdatedBy: string;
    relatedTo?: Array<{ sourceEntityId: string; sourceId: SourceEntityEnum }> | null;
  }): Promise<KnowledgeResponse> {
    return GbaApi._json("put", `/Knowledge/${entityId}`, data);
  }

  static async deleteKnowledge(entityId: string): Promise<void> {
    await GbaApi._json("delete", `/Knowledge/${entityId}`);
  }

  static async getKnowledgeBySourceEntity(sourceEntityId: string): Promise<KnowledgeResponse[]> {
    return GbaApi._json("get", `/Knowledge/SourceEntityId/${sourceEntityId}`);
  }

  // Knowledge — Associations

  static async listKnowledgeAssociations(): Promise<KnowledgeAssociationResponse[]> {
    return GbaApi._json("get", "/Knowledge/Association");
  }

  static async createKnowledgeAssociation(data: {
    knowledgeId: string;
    instanceId: string;
    sourceEntity: SourceEntityEnum;
    lastUpdatedBy: string;
  }): Promise<KnowledgeAssociationResponse> {
    return GbaApi._json("post", "/Knowledge/Association", data);
  }

  static async getKnowledgeAssociation(id: string): Promise<KnowledgeAssociationResponse> {
    return GbaApi._json("get", `/Knowledge/Association/${id}`);
  }

  static async updateKnowledgeAssociation(id: string, data: {
    id: string;
    knowledgeId: string;
    instanceId: string;
    sourceEntity: SourceEntityEnum;
    lastUpdatedBy: string;
  }): Promise<KnowledgeAssociationResponse> {
    return GbaApi._json("put", `/Knowledge/Association/${id}`, data);
  }

  static async deleteKnowledgeAssociation(id: string): Promise<void> {
    await GbaApi._json("delete", `/Knowledge/Association/${id}`);
  }

  // Knowledge — Classifications

  static async listKnowledgeClassifications(): Promise<KnowledgeClassificationResponse[]> {
    return GbaApi._json("get", "/Knowledge/Classification");
  }

  static async createKnowledgeClassification(data: {
    name?: string | null;
    color?: string | null;
    icon?: string | null;
    order: number;
  }): Promise<KnowledgeClassificationResponse> {
    return GbaApi._json("post", "/Knowledge/Classification", data);
  }

  static async getKnowledgeClassification(id: string): Promise<KnowledgeClassificationResponse> {
    return GbaApi._json("get", `/Knowledge/Classification/${id}`);
  }

  static async updateKnowledgeClassification(id: string, data: {
    id: string;
    name?: string | null;
    color?: string | null;
    icon?: string | null;
    order: number;
  }): Promise<KnowledgeClassificationResponse> {
    return GbaApi._json("put", `/Knowledge/Classification/${id}`, data);
  }

  static async deleteKnowledgeClassification(id: string): Promise<void> {
    await GbaApi._json("delete", `/Knowledge/Classification/${id}`);
  }

  static async updateKnowledgeClassificationOrder(
    groupOrderChanges: Array<{ classificationId: string; order: number }>
  ): Promise<void> {
    await GbaApi._json("put", "/Knowledge/Classification/UpdateOrder", { groupOrderChanges });
  }

  // ── Milestones ───────────────────────────────────────────────────────────

  static async listMilestones(): Promise<TaskResponse[]> {
    return GbaApi._json("get", "/Milestone");
  }

  static async getMilestone(entityId: string): Promise<TaskResponse> {
    return GbaApi._json("get", `/Milestone/${entityId}`);
  }

  static async createMilestone(data: {
    name?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    missionId: string;
    staffId?: string | null;
    parentTaskId?: string | null;
    customFields?: CreateCustomFieldDataRequest[] | null;
  }): Promise<TaskResponse> {
    return GbaApi._json("post", "/Milestone", data);
  }

  static async updateMilestone(entityId: string, data: {
    id: string;
    name?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    missionId: string;
    staffId?: string | null;
    parentTaskId?: string | null;
    customFields?: CreateCustomFieldDataRequest[] | null;
  }): Promise<TaskResponse> {
    return GbaApi._json("put", `/Milestone/${entityId}`, data);
  }

  static async deleteMilestone(entityId: string): Promise<void> {
    await GbaApi._json("delete", `/Milestone/${entityId}`);
  }

  // ── Pulse — ConfigForSourceType ──────────────────────────────────────────

  static async listPulseConfigsForSourceType(): Promise<PulseConfigForSourceTypeResponse[]> {
    return GbaApi._json("get", "/Pulse/ConfigForSourceType");
  }

  static async getPulseConfigForSourceType(sourceId: number): Promise<PulseConfigForSourceTypeResponse> {
    return GbaApi._json("get", `/Pulse/ConfigForSourceType/${sourceId}`);
  }

  static async createPulseConfigForSourceType(data: {
    source: SourceEntityEnum;
    isPulseEnabled: boolean;
    hasForecast: boolean;
    refreshPeriodInDays: number;
    warningPeriodInDays: number;
    remindPeriodInDays: number;
    isProgressEnabled: boolean;
    isDoneRecentlyAndComingNextEnabled: boolean;
  }): Promise<PulseConfigForSourceTypeResponse> {
    return GbaApi._json("post", "/Pulse/ConfigForSourceType", data);
  }

  static async updatePulseConfigForSourceType(
    id: number,
    data: { id: number; source: SourceEntityEnum } & Omit<ReturnType<typeof GbaApi.createPulseConfigForSourceType> extends Promise<infer R> ? R : never, "id" | "sourceId">
  ): Promise<PulseConfigForSourceTypeResponse> {
    return GbaApi._json("put", `/Pulse/ConfigForSourceType/${id}`, data);
  }

  static async deletePulseConfigForSourceType(id: number): Promise<void> {
    await GbaApi._json("delete", `/Pulse/ConfigForSourceType/${id}`);
  }

  // ── Pulse — ConfigForInstance ────────────────────────────────────────────

  static async listPulseConfigsForInstance(): Promise<PulseConfigForInstanceResponse[]> {
    return GbaApi._json("get", "/Pulse/ConfigForInstance");
  }

  static async getPulseConfigForInstance(id: number): Promise<PulseConfigForInstanceResponse> {
    return GbaApi._json("get", `/Pulse/ConfigForInstance/${id}`);
  }

  static async createPulseConfigForInstance(data: Omit<PulseConfigForInstanceResponse, "id">): Promise<PulseConfigForInstanceResponse> {
    return GbaApi._json("post", "/Pulse/ConfigForInstance", data);
  }

  static async updatePulseConfigForInstance(id: number, data: PulseConfigForInstanceResponse): Promise<PulseConfigForInstanceResponse> {
    return GbaApi._json("put", `/Pulse/ConfigForInstance/${id}`, data);
  }

  static async deletePulseConfigForInstance(id: number): Promise<void> {
    await GbaApi._json("delete", `/Pulse/ConfigForInstance/${id}`);
  }

  // ── Pulse — IndicatorConfig ──────────────────────────────────────────────

  static async listPulseIndicatorConfigs(): Promise<PulseIndicatorConfigForSourceTypeResponse[]> {
    return GbaApi._json("get", "/Pulse/IndicatorConfigForSourceType");
  }

  static async getPulseIndicatorConfig(id: number): Promise<PulseIndicatorConfigForSourceTypeResponse> {
    return GbaApi._json("get", `/Pulse/IndicatorConfigForSourceType/${id}`);
  }

  static async createPulseIndicatorConfig(data: {
    sourceTypeId: SourceEntityEnum;
    name?: string | null;
    description?: string | null;
    order: number;
    guidelines?: string | null;
  }): Promise<PulseIndicatorConfigForSourceTypeResponse> {
    return GbaApi._json("post", "/Pulse/IndicatorConfigForSourceType", data);
  }

  static async updatePulseIndicatorConfig(
    id: number,
    data: PulseIndicatorConfigForSourceTypeResponse
  ): Promise<PulseIndicatorConfigForSourceTypeResponse> {
    return GbaApi._json("put", `/Pulse/IndicatorConfigForSourceType/${id}`, data);
  }

  static async deletePulseIndicatorConfig(id: number): Promise<void> {
    await GbaApi._json("delete", `/Pulse/IndicatorConfigForSourceType/${id}`);
  }

  static async updatePulseIndicatorOrder(
    groupOrderChanges: Array<{ indicatorConfigId: number; order: number }>
  ): Promise<void> {
    await GbaApi._json("put", "/Pulse/IndicatorConfigForSourceType/UpdateOrder", { groupOrderChanges });
  }

  // ── Pulse — Entries ──────────────────────────────────────────────────────

  static async listPulseEntries(): Promise<PulseEntryResponse[]> {
    return GbaApi._json("get", "/Pulse/PulseEntry");
  }

  static async getPulseEntry(id: number): Promise<PulseEntryResponse> {
    return GbaApi._json("get", `/Pulse/PulseEntry/${id}`);
  }

  static async getPulseEntriesBySourceEntity(sourceEntityId: string): Promise<PulseEntryResponse[]> {
    return GbaApi._json("get", `/Pulse/PulseEntry/SourceEntityId/${sourceEntityId}`);
  }

  static async getPulseEntriesBySourceType(sourceTypeId: number): Promise<PulseEntryResponse[]> {
    return GbaApi._json("get", `/Pulse/PulseEntry/SourceTypeId/${sourceTypeId}`);
  }

  static async createPulseEntry(data: {
    sourceTypeId: SourceEntityEnum;
    sourceEntityId: string;
    pulseConfigForInstanceId?: number | null;
    creator: string;
    pulseIndicatorEntries?: Array<{
      indicatorConfigId: number;
      pulseStatus: PulseStatusEnum;
      forecastStatus: PulseForecastEnum;
      comment?: string | null;
    }> | null;
    progress?: number | null;
    doneRecently?: string | null;
    comingNext?: string | null;
  }): Promise<PulseEntryResponse> {
    return GbaApi._json("post", "/Pulse/PulseEntry", data);
  }

  static async updatePulseEntry(id: number, data: any): Promise<PulseEntryResponse> {
    return GbaApi._json("put", `/Pulse/PulseEntry/${id}`, data);
  }

  static async deletePulseEntry(id: number): Promise<void> {
    await GbaApi._json("delete", `/Pulse/PulseEntry/${id}`);
  }

  static async bulkCreatePulseEntries(entries: any[]): Promise<PulseEntryResponse[]> {
    return GbaApi._json("post", "/Pulse/PulseEntry/PulseEntries", entries);
  }

  static async bulkUpdatePulseEntries(entries: any[]): Promise<PulseEntryResponse[]> {
    return GbaApi._json("put", "/Pulse/PulseEntry", entries);
  }

  static async bulkDeletePulseEntries(ids: number[]): Promise<void> {
    await GbaApi._json("delete", "/Pulse/PulseEntry", ids);
  }

  // ── Permissions ──────────────────────────────────────────────────────────

  static async createPermissions(
    permissions: Array<{ roleOrGroupId: string; permissionId: string; permissionLevel: PermissionLevel }>
  ): Promise<void> {
    await GbaApi._json("post", "/Permissions", permissions);
  }

  static async deletePermissions(
    permissions: Array<{ roleOrGroupId: string; permissionId: string }>
  ): Promise<void> {
    await GbaApi._json("post", "/Permissions/delete", permissions);
  }

  static async getPermissionsVisibility(): Promise<Array<{ sourceId: SourceEntityEnum; visibility: RecordVisibility }>> {
    return GbaApi._json("get", "/Permissions/visibility");
  }

  static async updatePermissionsVisibility(
    entityType: string,
    visibility: RecordVisibility
  ): Promise<void> {
    await GbaApi._json("put", `/Permissions/visibility/${entityType}`, { visibility });
  }

  static async getPermissions(entityType: string): Promise<SourceEntityPermissionsResponse> {
    return GbaApi._json("get", `/Permissions/${entityType}`);
  }

  static async getPermissionsForInstance(
    entityType: string,
    instanceId: string
  ): Promise<SourceEntityPermissionsResponse> {
    return GbaApi._json("get", `/Permissions/${entityType}/${instanceId}`);
  }

  static async batchGetContextPermissions(
    entityType: string,
    instanceIds: string[]
  ): Promise<{ contexts: Record<string, unknown> | null }> {
    return GbaApi._json("post", `/Permissions/${entityType}/context/batch`, { instanceIds });
  }

  static async batchGetRecordPermissions(
    entityType: string,
    instanceIds: string[]
  ): Promise<{ permissions: Record<string, unknown> | null }> {
    return GbaApi._json("post", `/Permissions/${entityType}/record/batch`, { instanceIds });
  }

  static async getRecordPermissions(
    entityType: string,
    instanceId: string
  ): Promise<{ permissionLevel: number }> {
    return GbaApi._json("get", `/Permissions/${entityType}/record/${instanceId}`);
  }

  // ── Terminologies ────────────────────────────────────────────────────────

  static async listTerminologies(): Promise<TerminologyResponse[]> {
    return GbaApi._json("get", "/Terminologies");
  }

  static async getTerminologyById(id: number): Promise<TerminologyResponse> {
    return GbaApi._json("get", `/Terminologies/${id}`);
  }

  static async createTerminology(data: CreateTerminologyRequest): Promise<TerminologyResponse> {
    return GbaApi._json("post", "/Terminologies", data);
  }

  static async updateTerminology(id: number, data: CreateTerminologyRequest): Promise<TerminologyResponse> {
    return GbaApi._json("put", `/Terminologies/${id}`, data);
  }

  static async deleteTerminology(id: number): Promise<void> {
    await GbaApi._json("delete", `/Terminologies/${id}`);
  }

  /**
   * Get the terminology mapping dictionary (English, languageId = 1).
   * Returns keys like "staff", "staff_lower", "staff_plural", "staff_plural_lower".
   */
  static async getTerminology(): Promise<Record<string, string>> {
    const data = await GbaApi.listTerminologies();
    const SOURCE_ENTITY_NAME_MAP: Record<number, string> = {
      1: "staff", 2: "mission", 3: "team", 4: "client",
      6: "milestone", 10: "risk", 11: "issue", 12: "dependency",
    };
    const dict: Record<string, string> = {};
    const capt = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
    const eng = Array.isArray(data) ? data.filter((d) => d.languageId === 1) : [];
    eng.forEach((item) => {
      const eName = SOURCE_ENTITY_NAME_MAP[item.sourceId];
      if (eName) {
        dict[eName] = capt(item.singular ?? "");
        dict[`${eName}_lower`] = (item.singular ?? "").toLowerCase();
        dict[`${eName}_plural`] = capt(item.plural ?? "");
        dict[`${eName}_plural_lower`] = (item.plural ?? "").toLowerCase();
      }
    });
    return dict;
  }
}
