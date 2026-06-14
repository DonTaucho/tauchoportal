# Device Grouping API Quick Reference

## Authentication

All endpoints require a valid session cookie or bearer token.

## Endpoints Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/device-groups` | List all groups for current user |
| GET | `/device-groups/get?id=<id>` | Get group with all devices in it |
| POST | `/device-groups` | Create new device group |
| PATCH | `/device-groups/update?id=<id>` | Update group name or option |
| DELETE | `/device-groups?id=<id>` | Delete group and unassign devices |
| POST | `/device-groups/assign?device_id=<id>&group_id=<id>` | Add device to group |
| POST | `/device-groups/remove?device_id=<id>` | Remove device from group |

## Request Examples

### Create a Sequential Group
```bash
curl -X POST http://localhost:8080/device-groups \
  -H "Content-Type: application/json" \
  -H "Cookie: session=abc123" \
  -d '{"name": "Living Room Lights", "option": "sequential"}'
```

### Create a Queue Group
```bash
curl -X POST http://localhost:8080/device-groups \
  -H "Content-Type: application/json" \
  -H "Cookie: session=abc123" \
  -d '{"name": "Audience Devices", "option": "queue"}'
```

### List All Groups
```bash
curl http://localhost:8080/device-groups \
  -H "Cookie: session=abc123"
```

### Get Group with Devices
```bash
curl "http://localhost:8080/device-groups/get?id=group_123" \
  -H "Cookie: session=abc123"
```

### Update Group
```bash
curl -X PATCH "http://localhost:8080/device-groups/update?id=group_123" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=abc123" \
  -d '{"name": "Updated Name", "option": "queue"}'
```

### Assign Device to Group
```bash
curl -X POST "http://localhost:8080/device-groups/assign?device_id=device_123&group_id=group_456" \
  -H "Cookie: session=abc123"
```

### Remove Device from Group
```bash
curl -X POST "http://localhost:8080/device-groups/remove?device_id=device_123" \
  -H "Cookie: session=abc123"
```

### Delete Group
```bash
curl -X DELETE "http://localhost:8080/device-groups?id=group_123" \
  -H "Cookie: session=abc123"
```

## Response Examples

### Create Group - 201 Created
```json
{
  "id": "group_1718237456000000000",
  "user_id": 42,
  "name": "Living Room Lights",
  "option": "sequential",
  "created_at": "2024-06-12T22:14:07Z",
  "updated_at": "2024-06-12T22:14:07Z"
}
```

### List Groups - 200 OK
```json
[
  {
    "id": "group_1718237456000000000",
    "user_id": 42,
    "name": "Living Room Lights",
    "option": "sequential",
    "created_at": "2024-06-12T22:14:07Z",
    "updated_at": "2024-06-12T22:14:07Z"
  },
  {
    "id": "group_1718237457000000000",
    "user_id": 42,
    "name": "Audience Devices",
    "option": "queue",
    "created_at": "2024-06-12T22:15:00Z",
    "updated_at": "2024-06-12T22:15:00Z"
  }
]
```

### Get Group with Devices - 200 OK
```json
{
  "id": "group_1718237456000000000",
  "user_id": 42,
  "name": "Living Room Lights",
  "option": "sequential",
  "devices": [
    {
      "id": "device_1",
      "user_id": 42,
      "name": "Light 1",
      "brand": "hue",
      "product_id": "hue-color-bulb",
      "room": "living_room",
      "is_configured": true,
      "status": "online",
      "device_group_id": "group_1718237456000000000",
      "created_at": "2024-06-12T22:00:00Z",
      "updated_at": "2024-06-12T22:14:07Z"
    },
    {
      "id": "device_2",
      "user_id": 42,
      "name": "Light 2",
      "brand": "lifx",
      "product_id": "lifx-bulb",
      "room": "living_room",
      "is_configured": true,
      "status": "online",
      "device_group_id": "group_1718237456000000000",
      "created_at": "2024-06-12T22:05:00Z",
      "updated_at": "2024-06-12T22:14:07Z"
    }
  ],
  "created_at": "2024-06-12T22:14:07Z",
  "updated_at": "2024-06-12T22:14:07Z"
}
```

### Assign Device - 200 OK
```json
{
  "status": "assigned",
  "device_id": "device_123",
  "group_id": "group_456"
}
```

### Remove Device - 200 OK
```json
{
  "status": "removed",
  "device_id": "device_123"
}
```

### Delete Group - 200 OK
```json
{
  "status": "deleted"
}
```

## Error Responses

### Missing Device
```json
HTTP/1.1 404 Not Found
"Device not found"
```

### Missing Group
```json
HTTP/1.1 404 Not Found
"Device group not found"
```

### Authorization Error
```json
HTTP/1.1 403 Forbidden
"Forbidden"
```

### Invalid Option
```json
HTTP/1.1 400 Bad Request
"Invalid option: must be 'sequential' or 'queue'"
```

### Missing Required Field
```json
HTTP/1.1 400 Bad Request
"Missing required field: name"
```

## Common Workflows

### Workflow 1: Create Group and Add Devices

1. Create group:
   ```bash
   GROUP_ID=$(curl -s -X POST http://localhost:8080/device-groups \
     -H "Content-Type: application/json" \
     -H "Cookie: session=abc123" \
     -d '{"name": "Main Room", "option": "sequential"}' | jq -r .id)
   ```

2. Get device IDs:
   ```bash
   curl http://localhost:8080/devices \
     -H "Cookie: session=abc123" | jq '.[] | .id'
   ```

3. Assign devices:
   ```bash
   curl -X POST "http://localhost:8080/device-groups/assign?device_id=device_1&group_id=$GROUP_ID" \
     -H "Cookie: session=abc123"
   
   curl -X POST "http://localhost:8080/device-groups/assign?device_id=device_2&group_id=$GROUP_ID" \
     -H "Cookie: session=abc123"
   ```

### Workflow 2: View and Modify Groups

1. List all groups:
   ```bash
   curl http://localhost:8080/device-groups \
     -H "Cookie: session=abc123"
   ```

2. Get specific group with devices:
   ```bash
   curl "http://localhost:8080/device-groups/get?id=group_123" \
     -H "Cookie: session=abc123"
   ```

3. Update group option:
   ```bash
   curl -X PATCH "http://localhost:8080/device-groups/update?id=group_123" \
     -H "Content-Type: application/json" \
     -H "Cookie: session=abc123" \
     -d '{"option": "queue"}'
   ```

### Workflow 3: Manage Devices in Groups

1. Remove device from group:
   ```bash
   curl -X POST "http://localhost:8080/device-groups/remove?device_id=device_123" \
     -H "Cookie: session=abc123"
   ```

2. Add same device to different group:
   ```bash
   curl -X POST "http://localhost:8080/device-groups/assign?device_id=device_123&group_id=group_999" \
     -H "Cookie: session=abc123"
   ```

## Important Notes

- Devices can belong to at most one group
- Assigning a device to a new group automatically removes it from its current group
- Deleting a group does NOT delete the devices - it only removes the group assignment
- All operations are scoped to the current user (user isolation enforced)
- Both `sequential` and `queue` options are for future feature implementation

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, POST, DELETE) |
| 201 | Created (POST returning new resource) |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (authorization error) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |
