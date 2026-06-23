package controller

import (
	"html"
	"time"
)

// ChannelForTemplate represents a channel as prepared for template rendering
type ChannelForTemplate struct {
	ID       string
	Name     string
	Platform string
}

// ConditionForTemplate represents a condition as prepared for template rendering
type ConditionForTemplate struct {
	ID                 string
	Name               string
	EventType          string
	Filter             string
	IsEnabled          bool
	LastTriggeredAt    string
	DeviceID           string
	DeviceAction       string
	DeviceActionParams map[string]interface{}
}

// PageData contains all data needed to render a page
type PageData struct {
	CurrentChannel  *ChannelForTemplate
	Conditions      []ConditionForTemplate
	EventTypes      []string
	PlatformMeta    map[string]map[string]interface{}
	EventBadgeClass map[string]string
}

// GetEventLabel returns the human-readable label for an event type on a platform
func GetEventLabel(eventType, platform string) string {
	labels := map[string]map[string]string{
		"youtube": {
			"comment":      "Chat Comment",
			"superchat":    "Super Chat",
			"member":       "Channel Member",
			"stream_start": "Stream Start",
			"stream_end":   "Stream End",
		},
		"twitch": {
			"comment":   "Chat Comment",
			"cheer":     "Cheer",
			"follow":    "Follow",
			"sub":       "Subscribe",
			"raid":      "Raid",
			"hype_train": "Hype Train",
		},
	}
	if platformLabels, ok := labels[platform]; ok {
		if label, ok := platformLabels[eventType]; ok {
			return label
		}
	}
	return eventType
}

// FormatDateTime formats a date string for display, returning a fallback if empty
func FormatDateTime(dateStr, fallback string) string {
	if dateStr == "" || dateStr == "0001-01-01T00:00:00Z" {
		return fallback
	}
	// Parse and format the date
	t, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		return fallback
	}
	return t.Format("2006-01-02")
}

// EscapeHTML escapes HTML special characters
func EscapeHTML(s string) string {
	return html.EscapeString(s)
}

// GetPlatformMetadata returns metadata for all supported platforms
func GetPlatformMetadata() map[string]map[string]interface{} {
	return map[string]map[string]interface{}{
		"youtube": {"icon": "▶", "label": "YouTube"},
		"twitch":  {"icon": "◆", "label": "Twitch"},
	}
}

// GetEventBadgeClasses returns CSS class mapping for event badge styling
func GetEventBadgeClasses() map[string]string {
	return map[string]string{
		"comment":       "comment",
		"superchat":     "gift",
		"sticker":       "gift",
		"cheer":         "gift",
		"gift":          "gift",
		"member":        "follow",
		"follow":        "follow",
		"sub":           "follow",
		"nicoru":        "effect",
		"hype_train":    "stream",
		"raid":          "stream",
		"stream_start":  "stream",
		"stream_end":    "stream",
	}
}

// ChannelDetailForTemplate represents a watch channel with all detail info
type ChannelDetailForTemplate struct {
	ID               string
	Name             string
	Platform         string
	ChannelID        string
	ThumbnailURL     string
	IsActive         bool
	Status           string // "live", "offline", "paused"
	LastStreamAt     string
	StreamFilter     map[string]interface{}
	Conditions       []ConditionDetailForTemplate
}

// ConditionDetailForTemplate represents a condition for channel detail view
type ConditionDetailForTemplate struct {
	ID            string
	Name          string
	EventType     string
	IsEnabled     bool
	LastTriggeredAt string
}

// ChannelDetailPageData contains all data needed to render a channel detail page
type ChannelDetailPageData struct {
	CurrentChannel  *ChannelDetailForTemplate
	PlatformMeta    map[string]map[string]interface{}
	EventBadgeClass map[string]string
}

// ConditionsPageData contains all data needed to render a conditions page
type ConditionsPageData struct {
	CurrentChannel  *ChannelForTemplate
	Conditions      []ConditionForTemplate
	EventTypes      []string
	PlatformMeta    map[string]map[string]interface{}
	EventBadgeClass map[string]string
}

// PrepareConditionsPageData prepares all data needed to render the conditions page
func PrepareConditionsPageData(channelID string) *ConditionsPageData {
	// Fetch current channel and all conditions
	watches := Watches{}.ListWatches()
	var currentChannel *ChannelForTemplate
	for _, w := range watches {
		if w.Id == channelID {
			currentChannel = &ChannelForTemplate{
				ID:       w.Id,
				Name:     w.Name,
				Platform: w.Platform,
			}
			break
		}
	}

	cond := Conditions{}
	condList := cond.ListConditions(channelID)

	// Get unique event types
	eventTypeMap := make(map[string]bool)
	for _, c := range condList {
		eventTypeMap[c.EventType] = true
	}
	var eventTypes []string
	for et := range eventTypeMap {
		eventTypes = append(eventTypes, et)
	}

	// Convert to template format
	conditions := make([]ConditionForTemplate, 0)
	for _, c := range condList {
		conditions = append(conditions, ConditionForTemplate{
			ID:            c.Id,
			Name:          c.Name,
			EventType:     c.EventType,
			Filter:        c.Filter,
			IsEnabled:     c.IsEnabled,
			LastTriggeredAt: c.LastTriggeredAt,
			DeviceID:      c.DeviceId,
			DeviceAction:  c.DeviceAction,
			DeviceActionParams: map[string]interface{}{
				"color":       c.DeviceActionParams.Color,
				"duration_ms": c.DeviceActionParams.DurationMs,
			},
		})
	}

	return &ConditionsPageData{
		CurrentChannel:  currentChannel,
		Conditions:      conditions,
		EventTypes:      eventTypes,
		PlatformMeta:    GetPlatformMetadata(),
		EventBadgeClass: GetEventBadgeClasses(),
	}
}

// PrepareChannelDetailPageData prepares all data needed to render the channel detail page
func PrepareChannelDetailPageData(channelID string) *ChannelDetailPageData {
	// Fetch current watch and conditions
	watches := Watches{}.ListWatches()
	var currentWatch *Watch
	for _, w := range watches {
		if w.Id == channelID {
			w2 := w
			currentWatch = &w2
			break
		}
	}

	if currentWatch == nil {
		return &ChannelDetailPageData{
			PlatformMeta:    GetPlatformMetadata(),
			EventBadgeClass: GetEventBadgeClasses(),
		}
	}

	// Fetch conditions for this channel
	cond := Conditions{}
	condList := cond.ListConditions(channelID)

	conditions := make([]ConditionDetailForTemplate, 0)
	for _, c := range condList {
		conditions = append(conditions, ConditionDetailForTemplate{
			ID:              c.Id,
			Name:            c.Name,
			EventType:       c.EventType,
			IsEnabled:       c.IsEnabled,
			LastTriggeredAt: c.LastTriggeredAt,
		})
	}

	return &ChannelDetailPageData{
		CurrentChannel: &ChannelDetailForTemplate{
			ID:           currentWatch.Id,
			Name:         currentWatch.Name,
			Platform:     currentWatch.Platform,
			ChannelID:    currentWatch.ChannelId,
			ThumbnailURL: currentWatch.ThumbnailUrl,
			IsActive:     currentWatch.IsActive,
			Status:       currentWatch.Status,
			LastStreamAt: currentWatch.LastStreamAt,
			StreamFilter: map[string]interface{}{
				"require_title_contains":       currentWatch.StreamFilter.RequireTitleContains,
				"skip_if_title_contains":       currentWatch.StreamFilter.SkipIfTitleContains,
				"skip_if_description_contains": currentWatch.StreamFilter.SkipIfDescriptionContains,
			},
			Conditions: conditions,
		},
		PlatformMeta:    GetPlatformMetadata(),
		EventBadgeClass: GetEventBadgeClasses(),
	}
}