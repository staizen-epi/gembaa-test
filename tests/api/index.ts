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

export { GbaApi, SOURCE_ENTITY } from "./gba-api";
export type { CustomFieldProfile, RidEntity } from "./gba-api";

export { BffApi } from "./bff-api";
export type { GraphQLResponse } from "./bff-api";
