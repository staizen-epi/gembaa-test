# Gembaa — API Specification Reference

This document serves as the centralised API reference for all backend services used by the Gembaa application. It covers the three API layers, their endpoints, and links to interactive documentation.

---

## API Overview

| API Layer | Base URL | Protocol | Swagger / Schema | Purpose |
|-----------|----------|----------|-------------------|---------|
| **SCIM** | `http://localhost:5050` | REST | [Swagger UI](http://localhost:5050/swagger/index.html) | EntraID staff synchronization (create, update, deactivate users & groups) |
| **GBA API** | `http://localhost:1880/gba-api` | REST | [Swagger UI](http://localhost:1880/gba-api/swagger/index.html) | Core domain API (custom fields, RID, knowledge, permissions, pulse, etc.) |
| **BFF** | `http://localhost:1880/px-bff` | GraphQL | [GraphQL Playground](http://localhost:1880/px-bff) | Backend-For-Frontend — aggregated queries & mutations for the UI |

---

## 1. SCIM API

- **Title**: `Staizen.ProductX.Staff.SCIM.Api v1.0`
- **Base URL**: `http://localhost:5050`
- **Swagger UI**: http://localhost:5050/swagger/index.html
- **Swagger JSON**: `http://localhost:5050/swagger/v1/swagger.json`

Simulates EntraID (Azure AD) staff provisioning via the SCIM 2.0 protocol.

### Tags

| Tag | Description |
|-----|-------------|
| `Users` | SCIM user provisioning (staff) |
| `Groups` | SCIM group management |
| `Endpoints` | Schema & token endpoints |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/scim/Users` | Create a new SCIM-synced staff member |
| `GET` | `/scim/Users` | List all SCIM users |
| `GET` | `/scim/Users/{identifier}` | Get a specific user by ID |
| `PATCH` | `/scim/Users/{identifier}` | Update, activate, or deactivate a user |
| `DELETE` | `/scim/Users/{identifier}` | Delete a user |
| `POST` | `/scim/Groups` | Create a group |
| `GET` | `/scim/Groups` | List all groups |
| `GET` | `/scim/Groups/{identifier}` | Get a specific group |
| `PATCH` | `/scim/Groups/{identifier}` | Update a group |
| `DELETE` | `/scim/Groups/{identifier}` | Delete a group |
| `GET` | `/scim/token` | Get a SCIM token |
| `GET` | `/scim/Schemas` | List all schemas |
| `GET` | `/scim/Schemas/{identifier}` | Get a specific schema |

### Key Payload References

See [scim-api-reference.md](scim-api-reference.md) for detailed payload examples including:
- Create Staff (POST)
- Update Staff (PATCH with op codes: `0` = Add, `1` = Remove, `2` = Replace)
- Activate / Deactivate Staff

---

## 2. GBA API

- **Title**: `Gembaa.API v1.0`
- **Base URL**: `http://localhost:1880/gba-api`
- **Swagger UI**: http://localhost:1880/gba-api/swagger/index.html
- **Swagger JSON**: `http://localhost:1880/gba-api/swagger/v1/swagger.json`

Core domain REST API handling custom fields, RID (Risk/Issue/Dependency), knowledge management, permissions, pulse, and more.

### Tags

| Tag | Description |
|-----|-------------|
| `ActivityLogs` | Audit trail / activity logs by entity |
| `Contributor` | Contributor assignment (assign/unassign to instances) |
| `CustomFieldsConfigs` | Custom field configuration CRUD |
| `CustomFieldsData` | Custom field data values per entity |
| `CustomFieldsProfiles` | Custom field profiles (field definitions & `sourceEntities`) |
| `Dependency` | Dependency entity CRUD & linking |
| `EntityPermissions` | Entity-level permission management |
| `Group` | Group CRUD |
| `Issue` | Issue entity CRUD & linking |
| `Knowledge` | Knowledge base entity CRUD |
| `KnowledgeAssociation` | Knowledge associations |
| `KnowledgeClassification` | Knowledge classification taxonomy |
| `KnowledgeProfile` | Knowledge profiles |
| `Milestone` | Milestone CRUD |
| `Permissions` | Permission management & visibility |
| `Powerpoint` | Report generation (PPT export) |
| `PulseConfigForInstance` | Pulse configuration per instance |
| `PulseConfigForSourceType` | Pulse configuration per source type |
| `PulseEntry` | Pulse entry CRUD |
| `PulseIndicatorConfigForSourceType` | Pulse indicator configuration |
| `Risk` | Risk entity CRUD & linking |
| `Role` | Role CRUD & ordering |
| `Staff` | Staff CRUD |
| `Terminologies` | Terminology management |
| `TerminologiesLanguages` | Terminology language support |
| `Themes` | UI theme management (color tokens) |

### Endpoints

#### ActivityLogs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/ActivityLogs` | Get all activity logs |
| `GET` | `/ActivityLogs/staff/{id}` | Get activity logs for a staff member |
| `GET` | `/ActivityLogs/team/{id}` | Get activity logs for a team |
| `GET` | `/ActivityLogs/mission/{id}` | Get activity logs for a mission |
| `GET` | `/ActivityLogs/client/{id}` | Get activity logs for a client |

#### Contributors

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Contributors` | List contributors |
| `POST` | `/Contributors/Assign` | Assign contributors |
| `POST` | `/Contributors/Unassign` | Unassign contributors |
| `GET` | `/Contributors/Instance/{instanceId}` | Get contributors for an instance |
| `POST` | `/Contributors/Instance/{instanceId}/Assign` | Assign to instance |
| `POST` | `/Contributors/Instance/{instanceId}/Unassign` | Unassign from instance |

#### Custom Fields

| Method | Path | Tag | Description |
|--------|------|-----|-------------|
| `GET` | `/CustomFields/Profiles` | Profiles | Get all custom field profiles (field definitions) |
| `GET` | `/CustomFields/Profiles/{id}` | Profiles | Get a specific profile |
| `POST` | `/CustomFields/Configs` | Configs | Create a custom field config |
| `GET` | `/CustomFields/Configs/{id}` | Configs | Get a custom field config |
| `PUT` | `/CustomFields/Configs/{id}` | Configs | Update a custom field config |
| `DELETE` | `/CustomFields/Configs/{id}` | Configs | Delete a custom field config |
| `PUT` | `/CustomFields/Configs/UpdateGroupAndOrder` | Configs | Update grouping & ordering |
| `POST` | `/CustomFields/Data` | Data | Create custom field data |
| `GET` | `/CustomFields/Data/{id}` | Data | Get custom field data by ID |
| `PUT` | `/CustomFields/Data/{id}` | Data | Update custom field data |
| `DELETE` | `/CustomFields/Data/{id}` | Data | Delete custom field data |
| `GET` | `/CustomFields/Data/Batch` | Data | Batch get custom field data |
| `POST` | `/CustomFields/Data/SourceEntityId` | Data | Get data by source entity ID |
| `PATCH` | `/CustomFields/Data/SourceEntityId` | Data | Partial update by source entity |
| `PUT` | `/CustomFields/Data/SourceEntityId` | Data | Full update by source entity |
| `GET` | `/CustomFields/Data/SourceEntityId/{id}` | Data | Get data by source entity ID |
| `DELETE` | `/CustomFields/Data/SourceEntityId/{id}` | Data | Delete data by source entity ID |
| `POST` | `/CustomFields/Data/CreateOrUpdateBySourceEntityId` | Data | Upsert by source entity ID |

#### RID (Risk, Issue, Dependency)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Risk` | List all risks |
| `POST` | `/Risk` | Create a risk |
| `GET` | `/Risk/{entityId}` | Get a risk |
| `PATCH` | `/Risk/{entityId}` | Partial update a risk |
| `PUT` | `/Risk/{entityId}` | Full update a risk |
| `DELETE` | `/Risk/{entityId}` | Delete a risk |
| `GET` | `/Risk/linked/{sourceEntityEnum}/{entityId}` | Get risks linked to an entity |
| `GET` | `/Issue` | List all issues |
| `POST` | `/Issue` | Create an issue |
| `GET` | `/Issue/{entityId}` | Get an issue |
| `PATCH` | `/Issue/{entityId}` | Partial update an issue |
| `PUT` | `/Issue/{entityId}` | Full update an issue |
| `DELETE` | `/Issue/{entityId}` | Delete an issue |
| `GET` | `/Issue/linked/{sourceEntityEnum}/{entityId}` | Get issues linked to an entity |
| `GET` | `/Dependency` | List all dependencies |
| `POST` | `/Dependency` | Create a dependency |
| `GET` | `/Dependency/{entityId}` | Get a dependency |
| `PATCH` | `/Dependency/{entityId}` | Partial update a dependency |
| `PUT` | `/Dependency/{entityId}` | Full update a dependency |
| `DELETE` | `/Dependency/{entityId}` | Delete a dependency |
| `GET` | `/Dependency/linked/{sourceEntityEnum}/{entityId}` | Get dependencies linked to an entity |

#### Knowledge

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Knowledge` | List all knowledge |
| `POST` | `/Knowledge` | Create knowledge |
| `GET` | `/Knowledge/{entityId}` | Get knowledge |
| `PUT` | `/Knowledge/{entityId}` | Update knowledge |
| `DELETE` | `/Knowledge/{entityId}` | Delete knowledge |
| `GET` | `/Knowledge/SourceEntityId/{sourceEntityId}` | Get by source entity |
| `GET` | `/Knowledge/Association` | List associations |
| `POST` | `/Knowledge/Association` | Create association |
| `GET` | `/Knowledge/Association/{id}` | Get association |
| `PUT` | `/Knowledge/Association/{id}` | Update association |
| `DELETE` | `/Knowledge/Association/{id}` | Delete association |
| `GET` | `/Knowledge/Classification` | List classifications |
| `POST` | `/Knowledge/Classification` | Create classification |
| `GET` | `/Knowledge/Classification/{id}` | Get classification |
| `PUT` | `/Knowledge/Classification/{id}` | Update classification |
| `DELETE` | `/Knowledge/Classification/{id}` | Delete classification |
| `PUT` | `/Knowledge/Classification/UpdateOrder` | Update ordering |
| `POST` | `/Knowledge/Profile` | Create profile |
| `DELETE` | `/Knowledge/Profile` | Delete profile |

#### Milestone

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Milestone` | List all milestones |
| `POST` | `/Milestone` | Create a milestone |
| `GET` | `/Milestone/{entityId}` | Get a milestone |
| `PUT` | `/Milestone/{entityId}` | Update a milestone |
| `DELETE` | `/Milestone/{entityId}` | Delete a milestone |

#### Permissions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/Permissions` | Create permissions |
| `POST` | `/Permissions/delete` | Delete permissions |
| `GET` | `/Permissions/visibility` | Get visibility settings |
| `PUT` | `/Permissions/visibility/{entityType}` | Update visibility |
| `GET` | `/Permissions/{entityType}` | Get permissions by entity type |
| `GET` | `/Permissions/{entityType}/CustomFields` | Get custom field permissions |
| `GET` | `/Permissions/{entityType}/{instanceId}` | Get permissions for instance |
| `GET` | `/Permissions/{entityType}/{instanceId}/CustomFields` | Get custom field permissions for instance |
| `POST` | `/Permissions/{entityType}/context/batch` | Batch context permissions |
| `GET` | `/Permissions/{entityType}/context/{instanceId}` | Get context permissions |
| `POST` | `/Permissions/{entityType}/record/batch` | Batch record permissions |
| `GET` | `/Permissions/{entityType}/record/{instanceId}` | Get record permissions |

#### Pulse

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Pulse/ConfigForSourceType` | List configs by source type |
| `POST` | `/Pulse/ConfigForSourceType` | Create config |
| `GET` | `/Pulse/ConfigForSourceType/{sourceId}` | Get config by source ID |
| `PUT` | `/Pulse/ConfigForSourceType/{id}` | Update config |
| `DELETE` | `/Pulse/ConfigForSourceType/{id}` | Delete config |
| `GET` | `/Pulse/ConfigForInstance` | List configs by instance |
| `POST` | `/Pulse/ConfigForInstance` | Create instance config |
| `GET` | `/Pulse/ConfigForInstance/{id}` | Get instance config |
| `PUT` | `/Pulse/ConfigForInstance/{id}` | Update instance config |
| `DELETE` | `/Pulse/ConfigForInstance/{id}` | Delete instance config |
| `GET` | `/Pulse/IndicatorConfigForSourceType` | List indicator configs |
| `POST` | `/Pulse/IndicatorConfigForSourceType` | Create indicator config |
| `GET` | `/Pulse/IndicatorConfigForSourceType/{id}` | Get indicator config |
| `PUT` | `/Pulse/IndicatorConfigForSourceType/{id}` | Update indicator config |
| `DELETE` | `/Pulse/IndicatorConfigForSourceType/{id}` | Delete indicator config |
| `PUT` | `/Pulse/IndicatorConfigForSourceType/UpdateOrder` | Update ordering |
| `GET` | `/Pulse/PulseEntry` | List pulse entries |
| `POST` | `/Pulse/PulseEntry` | Create pulse entry |
| `GET` | `/Pulse/PulseEntry/{id}` | Get pulse entry |
| `PUT` | `/Pulse/PulseEntry/{id}` | Update pulse entry |
| `DELETE` | `/Pulse/PulseEntry/{id}` | Delete pulse entry |
| `PUT` | `/Pulse/PulseEntry` | Bulk update entries |
| `DELETE` | `/Pulse/PulseEntry` | Bulk delete entries |
| `POST` | `/Pulse/PulseEntry/PulseEntries` | Batch create entries |
| `GET` | `/Pulse/PulseEntry/SourceEntityId/{sourceEntityId}` | Get entries by source entity |
| `GET` | `/Pulse/PulseEntry/SourceTypeId/{sourceTypeId}` | Get entries by source type |

#### Staff, Roles, Groups & Settings

| Method | Path | Tag | Description |
|--------|------|-----|-------------|
| `GET` | `/Staffs` | Staff | List all staff |
| `POST` | `/Staffs` | Staff | Create staff |
| `GET` | `/Staffs/{id}` | Staff | Get staff by ID |
| `PUT` | `/Staffs/{id}` | Staff | Update staff |
| `DELETE` | `/Staffs/{id}` | Staff | Delete staff |
| `GET` | `/Roles` | Role | List roles |
| `POST` | `/Roles` | Role | Create role |
| `GET` | `/Roles/{id}` | Role | Get role |
| `PUT` | `/Roles/{id}` | Role | Update role |
| `DELETE` | `/Roles/{id}` | Role | Delete role |
| `PUT` | `/Roles/UpdateOrder` | Role | Reorder roles |
| `DELETE` | `/Roles/Association/{id}` | Role | Delete role association |
| `GET` | `/Groups` | Group | List groups |
| `POST` | `/Groups` | Group | Create group |
| `GET` | `/Groups/{id}` | Group | Get group |
| `PUT` | `/Groups/{id}` | Group | Update group |
| `DELETE` | `/Groups/{id}` | Group | Delete group |

#### Terminologies, Themes & Powerpoint

| Method | Path | Tag | Description |
|--------|------|-----|-------------|
| `GET` | `/Terminologies` | Terminologies | List terminologies |
| `POST` | `/Terminologies` | Terminologies | Create terminology |
| `GET` | `/Terminologies/{id}` | Terminologies | Get terminology |
| `PUT` | `/Terminologies/{id}` | Terminologies | Update terminology |
| `DELETE` | `/Terminologies/{id}` | Terminologies | Delete terminology |
| `GET` | `/Terminologies/Languages` | Languages | List supported languages |
| `GET` | `/Themes` | Themes | List themes |
| `GET` | `/Themes/{id}` | Themes | Get theme |
| `PUT` | `/Themes/{id}/ColorTokens` | Themes | Update color tokens |
| `POST` | `/Themes/{id}/RestoreToDefault` | Themes | Restore theme to default |
| `POST` | `/Powerpoint/generate` | Powerpoint | Generate report (sync) |
| `POST` | `/Powerpoint/generate-async` | Powerpoint | Generate report (async) |
| `GET` | `/Powerpoint/jobs/{jobId}/status` | Powerpoint | Check job status |
| `GET` | `/Powerpoint/jobs/{jobId}/download` | Powerpoint | Download generated report |

---

## 3. BFF (GraphQL)

- **Protocol**: GraphQL
- **Endpoint**: `http://localhost:1880` (proxied through the app)
- **Schema Reference**: [http://localhost:1880/px-bff](http://localhost:1880/px-bff)

The Backend-For-Frontend layer aggregates data from the GBA API and other services, providing the primary data interface for the Gembaa UI.

### Core Entity Types

| Type | Description |
|------|-------------|
| `Staff` | Staff member record |
| `StaffConnection` | Paginated staff list |
| `Client` | Client record |
| `ClientConnection` | Paginated client list |
| `Mission` | Mission/project record |
| `MissionConnection` | Paginated mission list |
| `Team` | Team record |
| `TeamConnection` | Paginated team list |
| `EmploymentDetails` | Staff employment details |
| `FinanceEntry` | Finance entry record |
| `StaffFinanceEntries` | Staff finance entries |
| `LineManager` | Line manager reference |
| `MissionManager` | Mission manager reference |
| `AccountManager` | Account manager reference |
| `Dashboard` | Dashboard data (quick stats, summaries) |
| `UserPref` | User preference record |
| `Permission` | Permission record |
| `PermissionRole` | Permission role |
| `Role` | Role record |
| `User` | User record |

### Query Types

| Type | Description |
|------|-------------|
| `StaffsMetadata` | Staff list metadata, dropdown options for forms |
| `ClientsMetadata` | Client list metadata |
| `MissionsMetadata` | Mission list metadata |
| `AllocationsMetadata` | Allocation metadata |
| `RequestMetadata` | Request metadata |
| `AdminSettings` | Admin settings (general, client, mission, allocation, staff) |

### Mutation Input Types

#### Staff

| Input Type | Description |
|------------|-------------|
| `CreateStaffInput` | Create a staff member |
| `CreateVirtualStaffInput` | Create a virtual (non-SCIM) staff member |
| `UpdateEmploymentDetailsInput` | Update employment details |
| `DeleteVirtualStaffInput` | Delete a virtual staff member |

#### Client

| Input Type | Description |
|------------|-------------|
| `CreateClientInput` | Create a client |
| `UpdateClientInput` | Update a client |
| `DeleteClientInput` | Delete a client |

#### Mission

| Input Type | Description |
|------------|-------------|
| `CreateMissionInput` | Create a mission |
| `UpdateMissionInput` | Update a mission |
| `DeleteMissionInput` | Delete a mission |

#### Team

| Input Type | Description |
|------------|-------------|
| `CreateTeamInput` | Create a team |
| `UpdateTeamDetailsInput` | Update team details |
| `DeleteTeamInput` | Delete a team |
| `ManageTeamMembersInput` | Add/remove team members |
| `AssignTeamLeadInput` | Assign team lead |

#### Allocation

| Input Type | Description |
|------------|-------------|
| `CreateAllocationsInput` | Create allocations |
| `UpdateAllocationsInput` | Update allocations |
| `DeleteAllocationsInput` | Delete allocations |
| `AllocatedStaffInput` | Staff allocation input |
| `SelectedAllocationInput` | Selected allocation |
| `UpdateValuesInput` | Update allocation values |
| `IsAllocatedOnDayInput` | Check day allocation |

#### Finance

| Input Type | Description |
|------------|-------------|
| `SaveStaffFinanceEntriesInput` | Save finance entries |
| `AddStaffFinanceEntryInput` | Add a finance entry |
| `UpdateOrDeleteFinanceEntryInput` | Update or delete a finance entry |

#### Admin Settings (Field Options)

| Input Type | Description |
|------------|-------------|
| `AddStaffFieldOptionInput` | Add staff field option |
| `UpdateStaffFieldOptionInput` | Update staff field option |
| `DeleteStaffFieldOptionInput` | Delete staff field option |
| `AddClientFieldOptionInput` | Add client field option |
| `UpdateClientFieldOptionInput` | Update client field option |
| `DeleteClientFieldOptionInput` | Delete client field option |
| `AddMissionFieldOptionInput` | Add mission field option |
| `UpdateMissionFieldOptionInput` | Update mission field option |
| `DeleteMissionFieldOptionInput` | Delete mission field option |
| `AddAllocationFieldOptionInput` | Add allocation field option |
| `UpdateAllocationFieldOptionInput` | Update allocation field option |
| `DeleteAllocationtFieldOptionInput` | Delete allocation field option |
| `AddGeneralFieldOptionInput` | Add general field option |
| `UpdateGeneralFieldOptionInput` | Update general field option |
| `DeleteGeneralFieldOptionInput` | Delete general field option |

#### Roles & User Preferences

| Input Type | Description |
|------------|-------------|
| `CreateRoleInput` | Create a role |
| `UpdateRoleInput` | Update a role |
| `SetUserPrefInput` | Set user preference |
| `DeleteUserPrefInput` | Delete user preference |

### Supporting Types

| Type | Description |
|------|-------------|
| `PageInfo` | Pagination metadata (cursor-based) |
| `DropdownOption` | Generic dropdown option |
| `CustomFieldError` | Custom field validation error |
| `DeleteEntityResponse` | Standard delete response |
| `AllocationMutationResult` | Allocation mutation result |
| `RelatedActions` | Related actions for an entity |

### Enums

| Enum | Description |
|------|-------------|
| `Operator` | Filter operator |
| `FilterMethod` | Filter method |
| `SortOrder` | Sort direction |
| `StringOperationsType` | String filter operations |
| `UpdateAllocationMethod` | Allocation update method |

---

## Cross-References

| Topic | Document |
|-------|----------|
| SCIM payload examples | [scim-api-reference.md](scim-api-reference.md) |
| Custom field profiles & `sourceEntities` | [global-spec.md — Profiles API](../specs/global-spec.md#profiles-api--custom-fields) |
| Mock Cognito configuration | [mock-cognito-config.json](mock-cognito-config.json) |
| BFF introspection schema (live) | [http://localhost:1880/px-bff](http://localhost:1880/px-bff) |
