package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	apiURL := os.Getenv("API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:8081"
	}

	// Get the API token for service-to-service authentication
	apiToken := os.Getenv("API_TOKEN")
	if apiToken == "" {
		apiToken = "dev-token-change-in-production"
	}

	target, err := url.Parse(apiURL)
	if err != nil {
		log.Fatalf("invalid API_URL %q: %v", apiURL, err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)

	// Create a custom director that strips /api prefix AND adds the auth token
	proxy.Director = func(r *http.Request) {
		// Strip the /api prefix from the path
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api")
		if r.URL.RawPath != "" {
			r.URL.RawPath = strings.TrimPrefix(r.URL.RawPath, "/api")
		}
		
		// Set the target scheme and host
		r.URL.Scheme = target.Scheme
		r.URL.Host = target.Host
		
		// Update the Host header to match the target
		r.Host = target.Host
		r.RequestURI = "" // Clear RequestURI as it's only valid for client requests
		
		// Add the API token for service-to-service authentication
		r.Header.Set("X-API-Token", apiToken)
		
		// Log for debugging
		log.Printf("Proxying request: %s %s -> %s://%s%s", r.Method, r.RequestURI, r.URL.Scheme, r.URL.Host, r.URL.Path)
	}

	router := NewRouter()
	mux := http.NewServeMux()

	// Proxy /api/* to the API server
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		proxy.ServeHTTP(w, r)
	})

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// Debug endpoint: tests API connectivity and shows config (remove after diagnosing)
	mux.HandleFunc("/debug/api", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, "<h2>API Debug</h2>")
		fmt.Fprintf(w, "<p><b>API_URL env:</b> %s</p>", htmlEscape(os.Getenv("API_URL")))
		fmt.Fprintf(w, "<p><b>Resolved API URL:</b> %s</p>", htmlEscape(apiURL))
		tokenSet := os.Getenv("API_TOKEN") != ""
		fmt.Fprintf(w, "<p><b>API_TOKEN set:</b> %v</p>", tokenSet)

		// Test connectivity to each important endpoint
		endpoints := []string{"/auth/user", "/oauth/login?provider=google"}
		client := &http.Client{Timeout: 5 * time.Second}
		for _, ep := range endpoints {
			testURL := apiURL + ep
			req, err := http.NewRequest("GET", testURL, nil)
			if err != nil {
				fmt.Fprintf(w, "<p>❌ <b>%s</b>: failed to build request: %v</p>", ep, err)
				continue
			}
			req.Header.Set("X-API-Token", apiToken)
			// Forward cookies from browser so session-based endpoints respond correctly
			req.Header.Set("Cookie", r.Header.Get("Cookie"))
			resp, err := client.Do(req)
			if err != nil {
				fmt.Fprintf(w, "<p>❌ <b>%s</b>: connection error: %v</p>", htmlEscape(ep), err)
				continue
			}
			body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
			resp.Body.Close()
			fmt.Fprintf(w, "<p>%s <b>%s</b>: HTTP %d — <code>%s</code></p>",
				statusEmoji(resp.StatusCode), htmlEscape(ep), resp.StatusCode, htmlEscape(string(body)))
		}
	})

	// Static files with clean URLs (no .html extension)
	mux.HandleFunc("/", router.ServeStatic)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(shutdownCtx)
	}()

	log.Printf("UI server starting on :%s (proxying API to %s)", port, apiURL)
	log.Printf("Open http://localhost:%s in your browser", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

// Router handles clean URLs by serving HTML files without extension
type Router struct {
	publicDir string
}

// NewRouter creates a new router
func NewRouter() *Router {
	return &Router{
		publicDir: "public",
	}
}

// ServeStatic serves static files with clean URLs
func (r *Router) ServeStatic(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Path

	// Normalize path
	if path == "/" {
		path = "/index.html"
	} else if strings.HasPrefix(path, "/monitors/") {
		// SPA prefix routing: all /monitors/* sub-paths are handled by monitors.html
		path = "/monitors.html"
	} else if !strings.Contains(path, ".") {
		// If no file extension, try with .html
		path = path + ".html"
	}

	// Clean the path to prevent directory traversal
	path = filepath.Clean(path)
	filePath := filepath.Join(r.publicDir, path)

	// Serve the file
	http.ServeFile(w, req, filePath)
}

func statusEmoji(code int) string {
	if code >= 200 && code < 300 {
		return "✅"
	}
	return "❌"
}

func htmlEscape(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&#34;")
	return s
}
