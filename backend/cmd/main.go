package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"rustlings-on-web/internal/executor"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

var Version = "dev"

type ExecuteRequest struct {
	Code string `json:"code"`
}

var (
	ipLastRequest = make(map[string]time.Time)
	ipMu          sync.Mutex
	// 10 total requests per minute
	globalLimiter = rate.NewLimiter(rate.Every(time.Minute/10), 10)
)

// max 1MB of code
const maxRequestSize = 1024 * 1024

func getClientIP(r *http.Request) string {
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}

	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return ip
}

func rateLimitMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(res http.ResponseWriter, r *http.Request) {

		if r.Method == http.MethodPost {
			ip := getClientIP(r)
			fmt.Println("Getting Request from IP::::: ", ip)

			if !globalLimiter.Allow() {
				res.WriteHeader(http.StatusTooManyRequests)
				res.Write([]byte("Too many request, try again later."))
				return
			}

			ipMu.Lock()
			last, exists := ipLastRequest[ip]
			fmt.Println(ipLastRequest)
			fmt.Println(last, exists)
			if exists && time.Since(last) < 5*time.Second {
				ipMu.Unlock()
				res.WriteHeader(http.StatusTooManyRequests)
				return
			}

			ipLastRequest[ip] = time.Now()
			ipMu.Unlock()

			next.ServeHTTP(res, r)
			return
		}

		next.ServeHTTP(res, r)
	})
}

func executeCode(res http.ResponseWriter, r *http.Request) {
	res.Header().Set("Content-Type", "application/json")
	res.Header().Set("Access-Control-Allow-Origin", "https://rustlings.online")
	res.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	res.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		res.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(res, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(res, r.Body, maxRequestSize)

	var payload ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(res, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if payload.Code == "" {
		http.Error(res, `{"error":"Code cannot be empty"}`, http.StatusBadRequest)
		return
	}

	result := executor.ExecuteCode(payload.Code)

	res.WriteHeader(http.StatusOK)
	data, _ := json.Marshal(result)
	res.Write(data)
}

func fetchExercises(res http.ResponseWriter, r *http.Request) {
	res.Header().Set("Content-Type", "application/json")
	res.Header().Set("Access-Control-Allow-Origin", "https://rustlings.online")

	if r.Method == http.MethodOptions {
		res.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		res.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		res.WriteHeader(http.StatusOK)
		return
	}
	cacheFile := "./rustlings.json"

	if _, err := os.Stat(cacheFile); err == nil {
		data, err := os.ReadFile(cacheFile)
		if err != nil {
			res.WriteHeader(http.StatusInternalServerError)
			res.Write([]byte("Something's Wrong"))
			return
		}

		res.WriteHeader(http.StatusOK)
		res.Write(data)
		return
	}
	tmpDir, err := os.MkdirTemp("", "rustlings-*")

	if err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		res.Write([]byte("Something Wrong"))
		panic(err)
	}

	defer os.RemoveAll(tmpDir)

	cmd := exec.Command("rustlings", "init")
	cmd.Dir = tmpDir

	if err := cmd.Run(); err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		res.Write([]byte("Something Wrong"))
		panic(err)
	}

	rustlingExsPath := filepath.Join(tmpDir, "rustlings", "exercises")

	result := make(map[string]map[string]string)

	err = filepath.WalkDir(rustlingExsPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(rustlingExsPath, path)
		if err != nil {
			return err
		}

		parts := strings.Split(relPath, string(os.PathSeparator))

		if len(parts) < 2 {
			return nil
		}

		exercise := parts[0]
		filename := parts[len(parts)-1]
		content, err := os.ReadFile(path)

		if result[exercise] == nil {
			result[exercise] = make(map[string]string)
		}

		result[exercise][filename] = string(content)

		return nil
	})

	jsonBytes, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		res.Write([]byte("Something Wrong"))
		panic(err)
	}

	if err := os.WriteFile(cacheFile, jsonBytes, 0644); err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		res.Write([]byte("Something Wrong"))
		return
	}

	fmt.Println(string(jsonBytes))
	res.Header().Set("Content-Type", "application/json")
	res.WriteHeader(200)
	res.Write(jsonBytes)
}

func healthCheck(res http.ResponseWriter, r *http.Request) {
	res.WriteHeader(http.StatusOK)
	res.Write([]byte("Sucess"))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthCheck)
	mux.HandleFunc("/api/execute", rateLimitMiddleware(executeCode))
	mux.HandleFunc("/api/fetch-exercises", fetchExercises)

	port := ":8081"
	fmt.Printf("Server running on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}
