# SCIM API Reference

Local SCIM endpoint for simulating EntraID staff synchronization.

- **Swagger UI**: http://localhost:5050/swagger/index.html
- **API Name**: `Staizen.ProductX.Staff.SCIM.Api v1`

## Users Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/scim/Users` | Create a new SCIM-synced staff member |
| `GET` | `/scim/Users` | List all SCIM users |
| `GET` | `/scim/Users/{identifier}` | Get a specific user by ID |
| `PATCH` | `/scim/Users/{identifier}` | Update, activate, or deactivate a user |
| `DELETE` | `/scim/Users/{identifier}` | Delete a user |

## Create Staff

```http
POST /scim/Users
Content-Type: application/json
```

```json
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User", "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"],
  "userName": "john.doe@example.com",
  "active": true,
  "displayName": "John Doe",
  "name": {
    "familyName": "Doe",
    "givenName": "John"
  },
  "emails": [
    { "value": "john.doe@example.com", "type": "work", "primary": true }
  ],
  "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
    "employeeNumber": "EMP-001",
    "department": "Engineering"
  }
}
```

## Update Staff (PATCH)

```http
PATCH /scim/Users/{identifier}
Content-Type: application/json
```

### Update a field (e.g., displayName)
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "operations": [
    {
      "op": 2,
      "path": "displayName",
      "value": "John Updated Doe"
    }
  ]
}
```

> **Patch Operation Types**: `0` = Add, `1` = Remove, `2` = Replace

## Activate Staff

```http
PATCH /scim/Users/{identifier}
```
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "operations": [
    { "op": 2, "path": "active", "value": true }
  ]
}
```

## Deactivate Staff

```http
PATCH /scim/Users/{identifier}
```
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "operations": [
    { "op": 2, "path": "active", "value": false }
  ]
}
```

## Groups Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/scim/Groups` | Create a group |
| `GET` | `/scim/Groups` | List all groups |
| `GET` | `/scim/Groups/{identifier}` | Get a specific group |
| `PATCH` | `/scim/Groups/{identifier}` | Update a group |
| `DELETE` | `/scim/Groups/{identifier}` | Delete a group |

## Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/scim/token` | Get a SCIM token |
| `GET` | `/scim/Schemas` | List all schemas |
| `GET` | `/scim/Schemas/{identifier}` | Get a specific schema |
