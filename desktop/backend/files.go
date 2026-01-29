package backend

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// SaveTextToDownloads writes content to a file in the user's Downloads folder and returns the saved path.
func (a *WailsApp) SaveTextToDownloads(filename, content string) (string, error) {
	if strings.TrimSpace(filename) == "" {
		return "", fmt.Errorf("filename is required")
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home dir: %w", err)
	}

	downloads := filepath.Join(home, "Downloads")
	_ = os.MkdirAll(downloads, 0755)

	safeName := filepath.Base(filename)
	if !strings.HasSuffix(strings.ToLower(safeName), ".ics") {
		safeName += ".ics"
	}

	target := filepath.Join(downloads, safeName)
	if err := os.WriteFile(target, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}
	return target, nil
}

// OpenFileDialog opens a file dialog and returns the selected file path
func (a *WailsApp) OpenFileDialog(ctx context.Context) (string, error) {
	filePath, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
		Title: "Select File to Upload",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "All Files",
				Pattern:     "*.*",
			},
			{
				DisplayName: "Documents",
				Pattern:     "*.pdf;*.doc;*.docx;*.txt",
			},
			{
				DisplayName: "Videos",
				Pattern:     "*.mp4;*.avi;*.mov;*.mkv",
			},
			{
				DisplayName: "Images",
				Pattern:     "*.jpg;*.jpeg;*.png;*.gif",
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to open file dialog: %w", err)
	}
	return filePath, nil
}
