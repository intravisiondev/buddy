# Buddy Server – REST API Backend

RESTful API backend written in Go, using MongoDB. All routes are under `/api`; base URL `http://localhost:8080/api` when running locally.

## Tech Stack

- **Go**: 1.21+
- **Framework**: Gin
- **Database**: MongoDB
- **AI**: Google Gemini API
- **Auth**: JWT

## Setup

1. Install dependencies:

```bash
go mod download
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Edit `.env`:

```env
PORT=8080
ENV=development
MONGO_URI=mongodb://localhost:27017/buddy
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
ALLOWED_ORIGINS=http://localhost:34115,http://localhost:5173
```

4. Start MongoDB (e.g. via Docker):

```bash
docker run -d -p 27017:27017 --name buddy-mongo mongo:latest
```

## Running

Development:

```bash
go run main.go
```

Production build:

```bash
go build -o buddy-server
./buddy-server
```

---

## API Endpoints

### Public (no JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/rooms` | List rooms |
| GET | `/api/rooms/:id` | Room details |
| GET | `/api/studyplans/public` | Public study plans |

### Protected (JWT required)

Include header: `Authorization: Bearer <token>`.

#### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |

#### User
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me/profile` | My profile |
| PUT | `/api/users/me/profile` | Update profile |
| GET | `/api/users/me/stats` | My stats (XP, gems, etc.) |
| POST | `/api/users/me/xp` | Add XP |
| GET | `/api/users/me/children` | Parent’s children |
| POST | `/api/users/me/children` | Create child account |
| GET | `/api/users/search?q=...` | Search users |
| GET | `/api/users/:id/profile` | User profile by ID |
| GET | `/api/users/:id/stats` | User stats by ID |

#### Leaderboard & badges
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leaderboard?period=all\|weekly&limit=10` | Leaderboard (students) |
| GET | `/api/badges/my` | My badges |

#### Activity & study sessions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users/me/study-session` | Log study session |
| GET | `/api/users/me/activity` | My activity |
| POST | `/api/users/me/study-session/start` | Start study session |
| GET | `/api/users/me/study-session/active` | Active session |
| PUT | `/api/users/me/study-session/pause` | Pause (break) |
| PUT | `/api/users/me/study-session/resume` | Resume |
| PUT | `/api/users/me/study-session/idle` | Set idle status |
| POST | `/api/users/me/study-session/stop` | Stop session |
| POST | `/api/study-session/assess` | Generate assessment questions |
| POST | `/api/study-session/complete-assessment` | Submit assessment |

#### Friends
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/friends/requests` | Send friend request |
| GET | `/api/friends/requests/incoming` | Incoming requests |
| POST | `/api/friends/requests/:id/accept` | Accept request |
| POST | `/api/friends/requests/:id/reject` | Reject request |
| GET | `/api/friends` | My friends |

#### Rooms
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms/my` | My rooms (teacher) |
| GET | `/api/rooms/:id/membership` | Check membership |
| PUT | `/api/rooms/:id/syllabus` | Update syllabus (owner) |
| POST | `/api/rooms/:id/join` | Join room |
| GET | `/api/rooms/:id/members` | Room members |
| POST | `/api/rooms/:id/messages` | Send message |
| GET | `/api/rooms/:id/messages` | Get messages |
| PUT | `/api/rooms/:id/exam-dates` | Update exam dates (owner) |

#### Resources
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms/:id/resources/upload` | Upload file |
| POST | `/api/rooms/:id/resources` | Create resource |
| GET | `/api/rooms/:id/resources` | List resources |
| GET | `/api/resources/:resource_id` | Get resource |
| DELETE | `/api/resources/:resource_id` | Delete resource |
| POST | `/api/resources/:resource_id/share` | Share resource |

#### Assignments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms/:id/assignments` | Create assignment |
| GET | `/api/rooms/:id/assignments` | List assignments |
| GET | `/api/assignments/:assignment_id` | Get assignment |
| PUT | `/api/assignments/:assignment_id` | Update assignment |
| DELETE | `/api/assignments/:assignment_id` | Delete assignment |

#### Study plans
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/studyplans` | My study plans |
| POST | `/api/studyplans` | Create study plan |
| POST | `/api/studyplans/:id/courses` | Add course |
| GET | `/api/studyplans/:id/courses` | Get courses |
| POST | `/api/studyplans/:id/schedule` | Create schedule block |
| GET | `/api/studyplans/:id/schedule` | Get schedule blocks |
| PUT | `/api/studyplans/:id/schedule/:block_id` | Update block |
| PUT | `/api/studyplans/:id/progress` | Update plan progress |
| GET | `/api/schedule` | User’s full schedule |

#### Goals & milestones
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/goals` | Create goal |
| GET | `/api/goals` | Get goals |
| GET | `/api/goals/today` | Today’s goals |
| POST | `/api/goals/daily/generate` | AI daily goals |
| POST | `/api/goals/:id/toggle` | Toggle goal complete |
| DELETE | `/api/goals/:id` | Delete goal |
| GET | `/api/milestones` | Get milestones |
| POST | `/api/milestones` | Create milestone |
| PUT | `/api/milestones/:id/progress` | Update milestone progress |

#### Reports (student/parent)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reports/generate` | Generate report |
| GET | `/api/reports` | List reports |
| GET | `/api/reports/:id` | Get report |

#### Goal suggestions (student)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/goal-suggestions/generate` | Generate suggestions |
| GET | `/api/goal-suggestions` | List suggestions |
| POST | `/api/goal-suggestions/:id/accept` | Accept suggestion |
| DELETE | `/api/goal-suggestions/:id` | Dismiss suggestion |

#### Room AI (teacher)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms/:id/ai/train` | Train room AI on resources |
| POST | `/api/rooms/:id/ai/chat` | Chat with room AI |
| GET | `/api/rooms/:id/ai/status` | Room AI status |

#### Games (teacher)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms/:id/games` | Generate game |
| GET | `/api/rooms/:id/games` | List games |
| GET | `/api/games/:game_id` | Get game |
| POST | `/api/games/:game_id/play` | Play game |
| GET | `/api/games/:game_id/results` | Game results |

#### Global AI (Gemini)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/chat` | Chat |
| POST | `/api/ai/explain` | Explain topic |
| POST | `/api/ai/answer` | Answer question |
| POST | `/api/ai/questions` | Generate questions |
| POST | `/api/ai/summarize` | Summarize content |
| POST | `/api/ai/syllabus/from-file` | Generate syllabus from file |
| POST | `/api/ai/syllabus/from-topics` | Generate syllabus from topics |

#### Smart Study Plan (student)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/smart-plan/generate` | Generate plan (AI) |
| POST | `/api/smart-plan/create` | Create plan from generated |

---

## Request / Response Examples

### Sign up

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "John Doe",
    "age": 16,
    "role": "student"
  }'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "name": "John Doe",
    "age": 16,
    "role": "student"
  }
}
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "password": "password123"}'
```

### Protected request

```bash
curl -X GET http://localhost:8080/api/users/me/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Create room

```bash
curl -X POST http://localhost:8080/api/rooms \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Math Study Group",
    "subject": "Mathematics",
    "description": "Weekly math problem solving",
    "is_private": false,
    "max_members": 20
  }'
```

### AI chat

```bash
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain quadratic equations", "context": "I am learning algebra"}'
```

---

## Project Structure

```
server/
├── main.go           # Entry point, routing
├── config/           # Configuration
├── database/         # MongoDB connection
├── models/           # Data models
├── handlers/         # HTTP handlers
├── services/         # Business logic
├── middleware/       # Auth, CORS, etc.
└── .env.example
```

## Tests

```bash
go test ./...
go test -cover ./...
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| ENV | development / production | development |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/buddy |
| JWT_SECRET | JWT signing secret | (required) |
| GEMINI_API_KEY | Google Gemini API key | (optional) |
| ALLOWED_ORIGINS | CORS allowed origins | localhost:34115,localhost:5173 |

## Security

- JWT authentication  
- Role-based access (Student / Parent / Teacher)  
- Age-based content filtering  
- Input validation  
- CORS  
- Password hashing (bcrypt)  

## License

Copyright © 2024, Buddy Team
