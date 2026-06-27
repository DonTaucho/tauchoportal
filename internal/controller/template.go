package controller

import (
	"html"
	"sort"
	"time"
)

// WatchForTemplate represents a watched channel as prepared for template rendering
type WatchForTemplate struct {
	ID           string
	Name         string
	Platform     string
	ChannelID    string
	IsActive     bool
	Status       string
	ThumbnailUrl string
	LastStream   string
	StreamFilter WatchStreamFilter
}

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
			"comment":    "Chat Comment",
			"cheer":      "Cheer",
			"follow":     "Follow",
			"sub":        "Subscribe",
			"raid":       "Raid",
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
		"comment":      "comment",
		"superchat":    "gift",
		"sticker":      "gift",
		"cheer":        "gift",
		"gift":         "gift",
		"member":       "follow",
		"follow":       "follow",
		"sub":          "follow",
		"nicoru":       "effect",
		"hype_train":   "stream",
		"raid":         "stream",
		"stream_start": "stream",
		"stream_end":   "stream",
	}
}

// ChannelDetailForTemplate represents a watch channel with all detail info
type ChannelDetailForTemplate struct {
	ID           string
	Name         string
	Platform     string
	ChannelID    string
	ThumbnailURL string
	IsActive     bool
	Status       string // "live", "offline", "paused"
	LastStreamAt string
	StreamFilter map[string]interface{}
	Conditions   []ConditionDetailForTemplate
}

// ConditionDetailForTemplate represents a condition for channel detail view
type ConditionDetailForTemplate struct {
	ID              string
	Name            string
	EventType       string
	IsEnabled       bool
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
			ID:              c.Id,
			Name:            c.Name,
			EventType:       c.EventType,
			Filter:          c.Filter,
			IsEnabled:       c.IsEnabled,
			LastTriggeredAt: c.LastTriggeredAt,
			DeviceID:        c.DeviceId,
			DeviceAction:    c.DeviceAction,
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

// DeviceForTemplate represents a device prepared for template rendering
type DeviceForTemplate struct {
	ID               string      `json:"id"`
	Name             string      `json:"name"`
	Brand            string      `json:"brand"`
	ProductID        string      `json:"product_id"`
	ProductName      string      `json:"product_name"`
	Room             string      `json:"room"`
	Status           string      `json:"status"` // "online", "offline"
	IsConfigured     bool        `json:"is_configured"`
	BrandColor       string      `json:"brand_color"`
	BrandLogo        string      `json:"brand_logo"`
	SupportedActions []string    `json:"supported_actions"`
	Credentials      map[string]string `json:"credentials"`
}

// BrandForTemplate represents a device brand for template rendering
type BrandForTemplate struct {
	ID               string             `json:"id"`
	Name             string             `json:"name"`
	LogoURL          string             `json:"logo_url"`
	BrandColor       string             `json:"brand_color"`
	AffiliateURL     string             `json:"affiliate_url"`
	Icon             string             `json:"icon"`
	CredentialFields []CredentialField  `json:"credential_fields"`
	DocsUrl          string             `json:"docs_url"`
	DocsLabel        string             `json:"docs_label"`
	SortOrder        int                `json:"sort_order"`
}

// DevicesPageData contains all data needed to render the devices page
type DevicesPageData struct {
	Devices       []DeviceForTemplate
	Brands        map[string]*BrandForTemplate
	BrandsSorted  []*BrandForTemplate
	Products      map[string][]Product
	BrandIDs      []string
}

// PrepareDevicesPageData prepares all data needed to render the devices page
func PrepareDevicesPageData() *DevicesPageData {
	// Fetch all devices
	devices := Devices{}.ListDevices()
	devicesForTemplate := make([]DeviceForTemplate, 0)

	// Fetch all active brands from catalog
	catalog := Catalog{}
	brands := catalog.ListBrands(true)
	brandsMap := make(map[string]*BrandForTemplate)
	brandsSorted := make([]*BrandForTemplate, 0)

	// Sort brands by sort_order
	sort.Slice(brands, func(i, j int) bool {
		return brands[i].SortOrder < brands[j].SortOrder
	})

	// Build brands map for quick lookup and sorted slice
	for _, b := range brands {
		brandForTemplate := &BrandForTemplate{
			ID:               b.Id,
			Name:             b.Name,
			LogoURL:          b.LogoUrl,
			BrandColor:       b.BrandColor,
			AffiliateURL:     b.AffiliateUrl,
			Icon:             b.Icon,
			CredentialFields: b.CredentialFields,
			DocsUrl:          b.DocsUrl,
			DocsLabel:        b.DocsLabel,
			SortOrder:        b.SortOrder,
		}
		brandsMap[b.Id] = brandForTemplate
		brandsSorted = append(brandsSorted, brandForTemplate)
	}

	// Fetch products by brand for product names and supported actions
	productsMap := make(map[string]map[string]interface{})
	productsForTemplate := make(map[string][]Product)
	for _, brand := range brands {
		products := catalog.ListProducts(brand.Id, true)
		productsByID := make(map[string]interface{})
		for _, p := range products {
			productsByID[p.Id] = map[string]interface{}{
				"name":    p.Name,
				"actions": p.SupportedActions,
			}
		}
		productsMap[brand.Id] = productsByID
		productsForTemplate[brand.Id] = products
	}

	// Convert devices to template format
	for _, dev := range devices {
		brand := brandsMap[dev.Brand]
		productName := dev.ProductId
		var actions []string

		if productMap, ok := productsMap[dev.Brand]; ok {
			if prod, ok := productMap[dev.ProductId]; ok {
				if prodData, ok := prod.(map[string]interface{}); ok {
					if name, ok := prodData["name"].(string); ok {
						productName = name
					}
					if actionsSlice, ok := prodData["actions"].([]interface{}); ok {
						actions = make([]string, 0)
						for _, a := range actionsSlice {
							if str, ok := a.(string); ok {
								actions = append(actions, str)
							}
						}
					}
				}
			}
		}

		brandLogo := ""
		brandColor := "#888888"

		if brand != nil {
			brandLogo = brand.LogoURL
			brandColor = brand.BrandColor
		}

		// Extract credentials map
		credentialsMap := make(map[string]string)
		if dev.Credentials != nil {
			credentialsMap["api_key"] = dev.Credentials.ApiKey
			credentialsMap["device_id"] = dev.Credentials.DeviceId
		}

		devicesForTemplate = append(devicesForTemplate, DeviceForTemplate{
			ID:               dev.Id,
			Name:             dev.Name,
			Brand:            dev.Brand,
			ProductID:        dev.ProductId,
			ProductName:      productName,
			Room:             dev.Room,
			Status:           dev.Status,
			IsConfigured:     dev.IsConfigured,
			BrandColor:       brandColor,
			BrandLogo:        brandLogo,
			SupportedActions: actions,
			Credentials:      credentialsMap,
		})
	}

	return &DevicesPageData{
		Devices:      devicesForTemplate,
		Brands:       brandsMap,
		BrandsSorted: brandsSorted,
		Products:     productsForTemplate,
		BrandIDs:     getBrandIDsFromDevices(devicesForTemplate),
	}
}

// Helper function to extract unique brand IDs from devices in order of appearance
func getBrandIDsFromDevices(devices []DeviceForTemplate) []string {
	seen := make(map[string]bool)
	var brandIDs []string

	for _, dev := range devices {
		if !seen[dev.Brand] {
			brandIDs = append(brandIDs, dev.Brand)
			seen[dev.Brand] = true
		}
	}

	return brandIDs
}

// ChannelsPageData contains all data needed to render the channels list page
type ChannelsPageData struct {
	Watches      []WatchForTemplate
	PlatformMeta map[string]map[string]interface{}
}

// PrepareChannelsPageData prepares all data needed to render the channels list page
func PrepareChannelsPageData() *ChannelsPageData {
	// Fetch all watches
	watches := Watches{}.ListWatches()

	watchesForTemplate := make([]WatchForTemplate, 0)
	for _, w := range watches {
		lastStream := FormatDateTime(w.LastStreamAt, "Never")
		watchesForTemplate = append(watchesForTemplate, WatchForTemplate{
			ID:           w.Id,
			Name:         w.Name,
			Platform:     w.Platform,
			ChannelID:    w.ChannelId,
			IsActive:     w.IsActive,
			Status:       w.Status,
			ThumbnailUrl: w.ThumbnailUrl,
			LastStream:   lastStream,
			StreamFilter: w.StreamFilter,
		})
	}

	return &ChannelsPageData{
		Watches:      watchesForTemplate,
		PlatformMeta: GetPlatformMetadata(),
	}
}
