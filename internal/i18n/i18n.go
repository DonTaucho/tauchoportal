package i18n

import (
	_ "embed"
	"encoding/json"
	"html/template"
	"net/http"
	"strings"
)

//go:embed locales/en.json
var enJSON []byte

//go:embed locales/ja.json
var jaJSON []byte

//go:embed locales/de.json
var deJSON []byte

//go:embed locales/fr.json
var frJSON []byte

//go:embed locales/es.json
var esJSON []byte

var supported = []string{"en", "ja", "de", "fr", "es"}

const CookieName = "taucho_language"

// Bundle holds all loaded locale translations.
type Bundle struct {
	locales map[string]map[string]string
}

// Load parses all embedded locale JSON files and returns a Bundle.
// Panics on malformed JSON (caught at startup, not in production traffic).
func Load() *Bundle {
	b := &Bundle{locales: make(map[string]map[string]string)}
	for lang, data := range map[string][]byte{
		"en": enJSON, "ja": jaJSON, "de": deJSON, "fr": frJSON, "es": esJSON,
	} {
		var m map[string]string
		if err := json.Unmarshal(data, &m); err != nil {
			panic("i18n: failed to parse " + lang + ".json: " + err.Error())
		}
		b.locales[lang] = m
	}
	return b
}

// Translator returns a Translator bound to the given language code.
// Falls back to English if the code is unknown.
func (b *Bundle) Translator(lang string) *Translator {
	m := b.locales[lang]
	if m == nil {
		m = b.locales["en"]
	}
	return &Translator{strings: m}
}

// DetectLang picks the best language for a request.
// Priority: taucho_language cookie > Accept-Language header > "en".
func DetectLang(r *http.Request) string {
	if c, err := r.Cookie(CookieName); err == nil {
		for _, s := range supported {
			if c.Value == s {
				return s
			}
		}
	}
	for _, part := range strings.Split(r.Header.Get("Accept-Language"), ",") {
		tag := strings.ToLower(strings.SplitN(strings.TrimSpace(part), ";", 2)[0])
		lang := strings.SplitN(tag, "-", 2)[0]
		for _, s := range supported {
			if lang == s {
				return s
			}
		}
	}
	return "en"
}

// Supported returns the list of supported language codes.
func Supported() []string { return supported }

// Translator provides translation lookup for a single language.
type Translator struct {
	strings map[string]string
}

// T returns the translation for key, falling back to key itself if not found.
func (t *Translator) T(key string) string {
	if v, ok := t.strings[key]; ok {
		return v
	}
	return key
}

// JS returns all strings as a JSON object safe for inline <script> injection.
func (t *Translator) JS() template.JS {
	b, _ := json.Marshal(t.strings)
	return template.JS(b)
}
