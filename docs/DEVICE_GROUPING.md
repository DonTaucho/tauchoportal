# Device Grouping Feature

## Overview

Device grouping allows users to organize multiple smart-home devices into logical groups. Device groups are scoped to individual users (a user cannot see or access other users' device groups).

Each device group can have a specific **option** that defines how devices in the group behave when triggered:
- **sequential**: "Cracker popper" behavior - devices trigger one after another. Once the first device is called, the next device becomes available only after the first is triggered again.
- **queue**: Queue-based behavior - each device serves one audience/user until exhausted, then moves to the next device in the group.

## Database Schema

### device_groups Table

```sql
CREATE TABLE device_groups (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    option VARCHAR(50) NOT NULL DEFAULT 'sequential',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_groups_user_id ON device_groups(user_id);
```

**Columns:**
- `id` (TEXT): Unique identifier for the device group (format: `group_<timestamp_nanos>`)
- `user_id` (INTEGER): Foreign key to `users` table - defines group ownership
- `name` (VARCHAR): Human-readable name for the device group
- `option` (VARCHAR): Behavior mode - `'sequential'` or `'queue'`
- `created_at` (TIMESTAMP): When the group was created
- `updated_at` (TIMESTAMP): When the group was last updated

### devices Table (Modified)

The existing `devices` table now includes:

```sql
ALTER TABLE devices ADD COLUMN device_group_id TEXT REFERENCES device_groups(id) ON DELETE SET NULL;
CREATE INDEX idx_devices_group_id ON devices(device_group_id);
```

**New Column:**
- `device_group_id` (TEXT, nullable): Foreign key to `device_groups` table. A device belongs to at most one group.

## Data Model

### DeviceGroup

```go
type DeviceGroup struct {
    ID        string            `json:"id"`
    UserID    int               `json:"user_id"`
    Name      string            `json:"name"`
    Option    DeviceGroupOption `json:"option"` // "sequential" or "queue"
    CreatedAt time.Time         `json:"created_at"`
    UpdatedAt time.Time         `json:"updated_at"`
}

type DeviceGroupOption string

const (
    SequentialOption DeviceGroupOption = "sequential"
    QueueOption      DeviceGroupOption = "queue"
)
```

### Device (Updated)

The `Device` model now includes:

```go
type Device struct {
    // ... existing fields ...
    DeviceGroupID *string `json:"device_group_id,omitempty"` // optional
    // ... timestamps ...
}
```

## API Endpoints

All endpoints require user authentication via session cookie or token.

### List Device Groups

**GET /device-groups**

Lists all device groups for the current user.

**Response:**
```json
[
  {
    "id": "group_1718237456000000000",
    "user_id": 42,
    "name": "Main Room Lights",
    "option": "sequential",
    "created_at": "2024-06-12T22:14:07Z",
    "updated_at": "2024-06-12T22:14:07Z"
  }
]
```

### Get Device Group

**GET /device-groups/get?id=<id>**

Gets a single device group with all devices in it.

**Query Parameters:**
- `id` (required): Device group ID

**Response:**
```json
{
  "id": "group_1718237456000000000",
  "user_id": 42,
  "name": "Main Room Lights",
  "option": "sequential",
  "devices": [
    {
      "id": "device_1718237400000000001",
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
    }
  ],
  "created_at": "2024-06-12T22:14:07Z",
  "updated_at": "2024-06-12T22:14:07Z"
}
```

### Create Device Group

**POST /device-groups**

Creates a new device group.

**Request Body:**
```json
{
  "name": "Main Room Lights",
  "option": "sequential"
}
```

**Required Fields:**
- `name` (string): Human-readable group name
- `option` (string): Either `"sequential"` or `"queue"`

**Response:**
```json
{
  "id": "group_1718237456000000000",
  "user_id": 42,
  "name": "Main Room Lights",
  "option": "sequential",
  "created_at": "2024-06-12T22:14:07Z",
  "updated_at": "2024-06-12T22:14:07Z"
}
```

**Status Code:** `201 Created`

### Update Device Group

**PATCH /device-groups/update?id=<id>**

Updates an existing device group.

**Query Parameters:**
- `id` (required): Device group ID

**Request Body (all optional):**
```json
{
  "name": "Updated Name",
  "option": "queue"
}
```

**Response:**
```json
{
  "id": "group_1718237456000000000",
  "user_id": 42,
  "name": "Updated Name",
  "option": "queue",
  "created_at": "2024-06-12T22:14:07Z",
  "updated_at": "2024-06-12T22:15:00Z"
}
```

### Delete Device Group

**DELETE /device-groups?id=<id>**

Deletes a device group and removes all devices from it.

**Query Parameters:**
- `id` (required): Device group ID

**Response:**
```json
{
  "status": "deleted"
}
```

### Assign Device to Group

**POST /device-groups/assign?device_id=<id>&group_id=<id>**

Adds a device to a device group. If the device was already in a different group, it is removed from that group first.

**Query Parameters:**
- `device_id` (required): Device ID to assign
- `group_id` (required): Target device group ID

**Response:**
```json
{
  "status": "assigned",
  "device_id": "device_1718237400000000001",
  "group_id": "group_1718237456000000000"
}
```

### Remove Device from Group

**POST /device-groups/remove?device_id=<id>**

Removes a device from its device group.

**Query Parameters:**
- `device_id` (required): Device ID to remove from its group

**Response:**
```json
{
  "status": "removed",
  "device_id": "device_1718237400000000001"
}
```

## Usage Examples

### Example 1: Create a Sequential Group

```bash
curl -X POST http://localhost:8080/device-groups \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<session_cookie>" \
  -d '{
    "name": "Bedroom Lights - Sequential",
    "option": "sequential"
  }'
```

### Example 2: Add Devices to a Group

First, list your devices:
```bash
curl http://localhost:8080/devices \
  -H "Cookie: session=<session_cookie>"
```

Then assign a device:
```bash
curl -X POST "http://localhost:8080/device-groups/assign?device_id=device_123&group_id=group_456" \
  -H "Cookie: session=<session_cookie>"
```

### Example 3: Get Group with All Devices

```bash
curl "http://localhost:8080/device-groups/get?id=group_456" \
  -H "Cookie: session=<session_cookie>"
```

### Example 4: Remove Device from Group

```bash
curl -X POST "http://localhost:8080/device-groups/remove?device_id=device_123" \
  -H "Cookie: session=<session_cookie>"
```

## Security & Privacy

- **User Isolation**: Each device group is tied to a specific user (`user_id`). Users cannot create, read, update, or delete device groups belonging to other users.
- **Cascading Deletes**: When a user is deleted, all their device groups are automatically deleted via foreign key constraints.
- **Device Orphaning**: When a device group is deleted, its devices are not deleted—only the `device_group_id` reference is set to NULL.

## Implementation Details

### Store Interface

```go
type DeviceGroupStore interface {
    CreateDeviceGroup(ctx context.Context, group *models.DeviceGroup) error
    GetDeviceGroup(ctx context.Context, id string) (*models.DeviceGroup, error)
    ListUserDeviceGroups(ctx context.Context, userID int) ([]*models.DeviceGroup, error)
    UpdateDeviceGroup(ctx context.Context, group *models.DeviceGroup) error
    DeleteDeviceGroup(ctx context.Context, id string) error
    GetDevicesInGroup(ctx context.Context, groupID string) ([]*models.Device, error)
    AssignDeviceToGroup(ctx context.Context, deviceID, groupID string) error
    RemoveDeviceFromGroup(ctx context.Context, deviceID string) error
}
```

### Implementations

- **SQLDeviceGroupStore**: PostgreSQL-backed implementation (`internal/store/sql_device_group_store.go`)
- **MemoryDeviceGroupStore**: In-memory implementation for testing (`internal/store/memory_store.go`)

### API Handlers

All endpoints are handled by `DeviceGroupAPI` in `internal/api/device_group_handlers.go`:

- `HandleListDeviceGroups()`
- `HandleGetDeviceGroup()`
- `HandleCreateDeviceGroup()`
- `HandleUpdateDeviceGroup()`
- `HandleDeleteDeviceGroup()`
- `HandleAssignDeviceToGroup()`
- `HandleRemoveDeviceFromGroup()`

## Future Enhancements

The current implementation provides the foundation for the following planned features:

1. **Sequential Mode**: Track which device in a group was last triggered, so the next trigger activates the next device in sequence.
2. **Queue Mode**: Implement audience-based device allocation where each device is assigned to a specific user/audience for a period, then rotated.
3. **Execution History**: Track device execution within groups to implement stateful behavior.
4. **Device Rotation**: Implement automatic device cycling based on group option and triggering patterns.

## Files Modified/Created

### Created Files
- `internal/models/device_group.go` - DeviceGroup model
- `internal/store/device_group_store.go` - DeviceGroupStore interface
- `internal/store/sql_device_group_store.go` - PostgreSQL implementation
- `internal/api/device_group_handlers.go` - API handlers
- `docs/DEVICE_GROUPING.md` - This documentation

### Modified Files
- `internal/models/device.go` - Added `DeviceGroupID` field
- `internal/store/sql_device_store.go` - Updated to handle device_group_id
- `internal/store/memory_store.go` - Added MemoryDeviceGroupStore
- `internal/auth/db.go` - Added device_groups table creation and migration
- `internal/bootstrap/types.go` - Added DeviceGroupStore and DeviceGroupAPI
- `internal/bootstrap/stores.go` - Initialize DeviceGroupStore
- `internal/bootstrap/handlers.go` - Initialize DeviceGroupAPI
- `internal/bootstrap/routes.go` - Register device group endpoints
