# Dashboard Implementation Plan

## Overview
You chose **Option 1: Create API endpoint** for the cleanest architecture. The API server needs to implement one comprehensive endpoint instead of the UI making multiple calls.

## What API Needs to Implement

**New Endpoint: `GET /dashboard/stats`**

This single endpoint should return:

### 1. **Stats Section** (numbers + trending)
```
- Total Channels: 12 (↑ 2 from yesterday)
- Live Channels: 3 (↑ 1 from last measurement)
- Connected Devices: 8 (all online, warning: 1)
- Triggers Today: 47 (↓ 5 from yesterday)
```

### 2. **Activity Feed** (recent 10-20 events)
```
- Stream started/ended
- Conditions triggered
- Device warnings/offline
- Errors
```
With timestamps so UI can display "2 minutes ago" format

### 3. **Channels Status List** (quick overview)
```
- Channel name
- Platform (Twitch, YouTube)
- Current status (Live/Offline)
- Last stream time
```

### 4. **Devices Status List** (quick overview)
```
- Device name
- Brand
- Status (Online/Offline/Warning)
- Room location
- Last seen time
```

## Full Specification
See: `DASHBOARD_API_SPEC.md` - This has the exact JSON response format the API should return.

## What UI Server Will Do (My Part)

1. Create new controller function `PrepareDashboardPageData()` that calls `/dashboard/stats` endpoint
2. Implement the dashboard.html template with the new professional design
3. Convert API response to template-friendly format
4. Add proper styling with the dark theme

## What You Need to Ask API Team

> "Please implement the `/dashboard/stats` endpoint as specified in `DASHBOARD_API_SPEC.md`. It should return one comprehensive response with stats, activity feed, and status summaries. This replaces multiple separate API calls for better performance."

## Data Requirements from API

The endpoint needs to have access to:
- Watches/Channels data (recent + count)
- Devices data (status, online count)
- Conditions data (enabled count, recent triggers)
- Stream Events (recent stream starts/ends with timestamps)
- Device Events or Status Changes (for activity feed)
- System Event Log (for errors and condition triggers)

## Timeline

**After API implements `/dashboard/stats`:**
- I'll update the UI server to call it: ~15 minutes
- Implement new dashboard.html template: ~30 minutes  
- Style with the professional dark theme: ~20 minutes
- Testing: ~10 minutes

**Total UI work: ~75 minutes once endpoint is ready**

## Benefits of This Approach

✅ Single API call instead of 4-5 calls
✅ Dashboard loads faster
✅ Trending numbers already calculated (no client-side logic)
✅ Activity feed comes pre-formatted
✅ Professional, production-grade dashboard
✅ Easy to add real-time updates later (WebSocket)
✅ Can add historical graphs later (price trend data if needed)

## Next Steps

1. Share `DASHBOARD_API_SPEC.md` with API team
2. API team implements `/dashboard/stats`
3. Once deployed, I implement the UI
4. Dashboard goes live!
