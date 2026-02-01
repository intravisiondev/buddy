package backend

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const gameServerPort = "34116"

var (
	gameServer     *http.Server
	gameServerOnce sync.Once
	gamesBaseDir  string
)

func getGamesBaseDir() string {
	if gamesBaseDir != "" {
		return gamesBaseDir
	}
	home, _ := os.UserHomeDir()
	gamesBaseDir = filepath.Join(home, ".buddy", "games")
	return gamesBaseDir
}

// GameServerURL returns the base URL for the local game file server
func GameServerURL() string {
	return "http://127.0.0.1:" + gameServerPort
}

func startGameServer() {
	gameServerOnce.Do(func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/game/", func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			// Path: /game/<gameId>/ or /game/<gameId>/index.html etc.
			path := strings.TrimPrefix(r.URL.Path, "/game/")
			path = strings.Trim(path, "/")
			if path == "" {
				http.NotFound(w, r)
				return
			}
			parts := strings.SplitN(path, "/", 2)
			gameID := parts[0]
			if gameID == "" {
				http.NotFound(w, r)
				return
			}
			dir := filepath.Join(getGamesBaseDir(), gameID, "extracted")
			if _, err := os.Stat(dir); os.IsNotExist(err) {
				http.NotFound(w, r)
				return
			}
			// subPath: "" or "index.html" or "game.js" etc.
			subPath := ""
			if len(parts) > 1 {
				subPath = parts[1]
			}
			if subPath == "" {
				subPath = "index.html"
			}
			fullPath := filepath.Join(dir, subPath)
			// Security: ensure fullPath is under dir
			absDir, _ := filepath.Abs(dir)
			absFull, _ := filepath.Abs(fullPath)
			if !strings.HasPrefix(absFull, absDir+string(filepath.Separator)) {
				http.NotFound(w, r)
				return
			}
			http.ServeFile(w, r, fullPath)
		})
		gameServer = &http.Server{
			Addr:    "127.0.0.1:" + gameServerPort,
			Handler: mux,
		}
		go gameServer.ListenAndServe()
	})
}

func stopGameServer() {
	if gameServer != nil {
		gameServer.Close()
		gameServer = nil
	}
}
