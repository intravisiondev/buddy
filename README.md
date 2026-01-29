# Buddy – AI-Powered Learning & Focus Assistant

A cross-platform desktop application (Windows, macOS, Linux) and AI-powered learning platform for **students**, **teachers**, and **parents**.

## Project Structure

```
buddy/
├── desktop/           # Wails desktop app (Go + React)
│   ├── frontend/      # React + TypeScript UI
│   ├── backend/       # Wails bindings & app logic
│   └── internal/api/  # HTTP client for backend API
├── server/            # REST API backend (Go + MongoDB)
└── GETTING_STARTED.md # Quick-start guide
```

## Features

### User Roles
- **Student**: Study materials, AI assistant, study plans, rooms, time tracking, goals, leaderboard
- **Teacher**: Room management, assignments, resources, AI content creation, room AI coach
- **Parent**: Child linking, progress reports, security controls

### Core Features
- ✅ JWT authentication (signup, login, logout, session restore / “Remember me”)
- ✅ Profile and user stats (XP, level, gems, tokens)
- ✅ Study rooms with real-time messaging
- ✅ Study plans, schedule blocks, milestones
- ✅ Goals (create, toggle complete, AI-generated daily goals)
- ✅ Time tracking: start/stop study sessions, breaks, idle status; link to plans/milestones
- ✅ AI-powered study assessment (focus score, notes, AI questions, productivity score)
- ✅ AI assistant (Google Gemini): chat, explain, Q&A, summarize, generate questions
- ✅ Smart Study Plan: AI-generated plans, schedules, and milestones
- ✅ Leaderboard (all-time / weekly), badges, friends, friend requests
- ✅ AI reports (daily, weekly, monthly)
- ✅ Study-room AI coach (train on resources, subject-limited chat)
- ✅ Age-based content filtering
- ✅ Multi-language support (English / Turkish)

## Requirements

- **Go**: 1.21+
- **Node.js**: 18+
- **MongoDB**: 5.0+
- **Wails CLI**: v2.10+

## Setup

### 1. Backend server

```bash
cd server
cp .env.example .env
# Edit .env (MONGO_URI, JWT_SECRET, GEMINI_API_KEY, etc.)
go mod download
go run main.go
```

The server runs at `http://localhost:8080`.

### 2. Desktop app

```bash
cd desktop
go mod download
cd frontend && npm install && cd ..
wails dev
```

For production build:

```bash
cd desktop
wails build
```

Binaries are in `desktop/build/bin/`.

## Development

| Task | Command |
|------|---------|
| Run server | `cd server && go run main.go` |
| Run desktop (dev) | `cd desktop && wails dev` |
| Build desktop | `cd desktop && wails build` |
| Server tests | `cd server && go test ./...` |

## Tech Stack

### Backend
- **Language**: Go  
- **Framework**: Gin  
- **Database**: MongoDB  
- **AI**: Google Gemini API  
- **Auth**: JWT  

### Desktop
- **Framework**: Wails v2  
- **Backend**: Go  
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS  
- **Icons**: Lucide React  

## API Overview

All API routes are under `/api`. Base URL: `http://localhost:8080/api`.

| Area | Examples |
|------|----------|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Users | `GET /users/me/profile`, `GET /users/me/stats`, `GET /users/search` |
| Rooms | `GET /rooms`, `GET /rooms/:id`, `POST /rooms`, `POST /rooms/:id/join` |
| Study plans | `GET /studyplans`, `POST /studyplans`, `GET /studyplans/:id/schedule` |
| Goals & milestones | `GET /goals`, `POST /goals`, `GET /milestones`, `POST /goals/daily/generate` |
| Activity | `POST /users/me/study-session/start`, `POST /users/me/study-session/stop` |
| Leaderboard | `GET /leaderboard`, `GET /badges/my` |
| Friends | `GET /friends`, `POST /friends/requests`, `GET /friends/requests/incoming` |
| AI | `POST /ai/chat`, `POST /ai/explain`, `POST /ai/questions` |

Detailed API docs: [server/README.md](server/README.md).

## Configuration

### Server (`.env` in `server/`)

```env
PORT=8080
ENV=development
MONGO_URI=mongodb://localhost:27017/buddy
JWT_SECRET=your-secret
GEMINI_API_KEY=your-gemini-key
ALLOWED_ORIGINS=http://localhost:34115,http://localhost:5173
```

### Desktop (optional `.env` in `desktop/`)

```env
BUDDY_API_URL=http://localhost:8080/api
BUDDY_ENV=development
```

## Security

- JWT authentication  
- Password hashing (bcrypt)  
- Role-based access control  
- Age-based content filtering  
- Input validation  
- CORS protection  
- Secrets via environment variables  

## Documentation

- [Getting started](GETTING_STARTED.md) – Run server + desktop step by step  
- [Server API](server/README.md) – Endpoints and examples  
- [Desktop app](desktop/README.md) – Structure and Wails bindings  

## Roadmap

- [x] Authentication & user management  
- [x] Rooms & messaging  
- [x] Study plans, schedule, milestones  
- [x] Goals & AI daily goals  
- [x] Time tracking & study sessions  
- [x] AI integration (Gemini), reports, Smart Study Plan  
- [x] Leaderboard, badges, friends  
- [x] Room AI coach, AI-powered assessment  
- [ ] Teacher dashboard (assignments, grading)  
- [ ] Live lessons (streaming)  
- [ ] Game system  
- [ ] Mobile app (e.g. React Native)  
- [ ] Advanced analytics  

## Contributing

1. Fork the project  
2. Create a feature branch  
3. Commit your changes  
4. Push to the branch  
5. Open a Pull Request  

## Support

Use GitHub Issues for questions and bugs.

## License

Copyright © 2026, Neurobytes Inc.
