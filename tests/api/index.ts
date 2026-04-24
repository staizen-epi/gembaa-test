/**
 * API Utilities — Barrel Export
 *
 * Import all API utilities from a single entry point:
 *
 *   import { ScimApi, GbaApi, BffApi, SCIM_OP, SOURCE_ENTITY } from "./api";
 *
 * @see docs/api-reference.md
 */

export { ScimApi, SCIM_OP } from "./scim-api";
export type { ScimCreateUserOptions, ScimPatchOperation, ScimUserResponse } from "./scim-api";

export {
  GbaApi,
  SOURCE_ENTITY,
  CUSTOM_FIELD_TYPE,
  PERMISSION_LEVEL,
  RECORD_VISIBILITY,
  PULSE_STATUS,
  PULSE_FORECAST,
} from "./gba-api";
export type {
  SourceEntityEnum,
  CustomFieldTypeEnum,
  PermissionLevel,
  RecordVisibility,
  PulseStatusEnum,
  PulseForecastEnum,
  RidType,
  RidEntity,
  CreateRidRequest,
  UpdateRidRequest,
  CustomFieldProfileResponse,
  CustomFieldConfigResponse,
  CustomFieldDataResponse,
  CustomFieldDataBatchResponse,
  CreateCustomFieldConfigRequest,
  UpdateCustomFieldConfigRequest,
  CreateCustomFieldDataRequest,
  CustomListConfigRequest,
  CustomListItemRequest,
  TaskResponse,
  TerminologyResponse,
  CreateTerminologyRequest,
  StaffResponse,
  RoleResponse,
  GroupResponse,
  ContributorRoleResponse,
  KnowledgeResponse,
  KnowledgeClassificationResponse,
  KnowledgeAssociationResponse,
  PulseConfigForSourceTypeResponse,
  PulseConfigForInstanceResponse,
  PulseIndicatorConfigForSourceTypeResponse,
  PulseEntryResponse,
  PulseIndicatorEntryResponse,
  ActivityLogListResponse,
  ActivityLogResponse,
  SourceEntityPermissionsResponse,
} from "./gba-api";

export { BffApi } from "./bff-api";
export type { GraphQLResponse } from "./bff-api";
