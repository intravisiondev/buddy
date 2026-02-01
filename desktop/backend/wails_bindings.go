package backend

import (
	"buddy-desktop/internal/api"
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// WailsApp wraps the Wails application context and API services
type WailsApp struct {
	ctx        context.Context
	api        *api.Service
	authToken  string
	currentUser *api.User
}

// NewWailsApp creates a new Wails application instance
func NewWailsApp() *WailsApp {
	return &WailsApp{
		api: api.NewService(),
	}
}

// Startup is called when the app starts
func (a *WailsApp) Startup(ctx context.Context) {
	a.ctx = ctx
	startGameServer()
}

// Shutdown is called when the app shuts down
func (a *WailsApp) Shutdown(ctx context.Context) {
	stopGameServer()
}

// EmitEvent emits an event to the frontend
func (a *WailsApp) EmitEvent(eventName string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, eventName, data)
	}
}

// GetContext returns the application context
func (a *WailsApp) GetContext() context.Context {
	return a.ctx
}
