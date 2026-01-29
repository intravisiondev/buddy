# Buddy Desktop Application

Cross-platform desktop app for Windows, macOS, and Linux. Built with Wails v2 (Go + React).

## Tech Stack

- **Backend**: Go
- **Framework**: Wails v2
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **API**: REST client talking to the Buddy server

## Requirements

- Go 1.21+
- Node.js 18+ and npm
- Wails CLI v2:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

2. Install Go dependencies:

```bash
go mod download
```

3. Optional: create `.env` in `desktop/`:

```env
BUDDY_API_URL=http://localhost:8080/api
BUDDY_ENV=development
```

## Development

### Start the server first

Run MongoDB and the backend:

```bash
cd ../server
cp .env.example .env
# Edit .env (MONGO_URI, GEMINI_API_KEY, etc.)
go run main.go
```

### Run the desktop app (dev mode)

```bash
cd desktop
wails dev
```

This starts the frontend dev server and the Go app with hot reload.

### Production build

```bash
wails build
```

Output binaries are in `build/bin/`.

## Configuration

| Variable | Description |
|----------|-------------|
| BUDDY_API_URL | API base URL (default `http://localhost:8080/api`) |
| BUDDY_ENV | `development` or `production` |

## Project Structure

```
desktop/
├── main.go           # Wails entry point
├── app.go            # App struct, Wails bindings
├── wails.json        # Wails config (frontend dir, build, etc.)
├── frontend/         # React app
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   └── wailsjs/  # Generated Wails bindings
│   └── package.json
├── backend/          # WailsApp logic, API calls
├── internal/
│   ├── api/          # HTTP client, API services
│   └── config/       # Config loading
└── build/            # Production build output
```

## Wails Bindings (Frontend → Go)

The frontend calls these via `wailsjs/go/main/App`. Examples:

### Auth
- `Login(email, password)` – Log in
- `SignUp(email, password, name, age, role)` – Register
- `Logout()` – Log out
- `GetCurrentUser()` – Current user
- `IsAuthenticated()` – Auth check

### Rooms
- `GetRooms(subject?)` – List rooms
- `GetMyRooms(subject?)` – My rooms (teacher)
- `GetRoom(roomID)` – Room details
- `CreateRoom(...)` – Create room
- `JoinRoom(roomID)` – Join room
- `SendMessage(roomID, content)` – Send message
- `GetMessages(roomID)` – Get messages
- `GetRoomMembers(roomID)` – Room members
- `UpdateRoomSyllabus(roomID, syllabus)` – Update syllabus

### User & profile
- `GetMyProfile()` – My profile
- `UpdateMyProfile(data)` – Update profile
- `GetUserProfile(userID)` – User profile
- `GetUserStats(userID)` – User stats
- `GetChildren()` – Parent’s children
- `CreateChild(...)` – Create child account

### Study plans & schedule
- `GetMyStudyPlans()` – My study plans
- `CreateStudyPlan(data)` – Create plan
- `AddCourseToStudyPlan(planID, data)` – Add course
- `GetStudyPlanCourses(planID)` – Get courses
- `GetScheduleBlocks(planID)` – Get schedule blocks
- `CreateScheduleBlock(planID, data)` – Create block
- `UpdateScheduleBlock(planID, blockID, data)` – Update block
- `DeleteScheduleBlock(planID, blockID)` – Delete block
- `GetUserSchedule()` – Full user schedule
- `UpdateStudyPlanProgress(planID, progress)` – Update progress

### Goals & milestones
- `CreateGoal(data)` – Create goal
- `GetGoals(completed?, studyPlanID?)` – Get goals
- `GetTodayGoals()` – Today’s goals
- `GenerateDailyGoals()` – AI daily goals
- `ToggleGoalComplete(goalID)` – Toggle goal
- `DeleteGoal(goalID)` – Delete goal
- `GetMilestones(studyPlanID?)` – Get milestones
- `CreateMilestone(data)` – Create milestone
- `UpdateMilestoneProgress(milestoneID, progress)` – Update progress

### Activity & study sessions
- `LogStudySession(subject, durationMinutes)` – Log session
- `GetMyActivity(activityType?, limit?)` – My activity
- `StartStudySession(studyPlanID, subject)` – Start session
- `GetActiveStudySession()` – Active session
- `PauseStudySession()` – Pause (break)
- `ResumeStudySession()` – Resume
- `SetIdleStatus(isIdle)` – Set idle
- `StopStudySession(notes, focusScore)` – Stop session

### AI & reports
- `Chat(message, context)` – Buddy AI chat
- `ExplainTopic(topic, subject, level)` – Explain
- `AnswerQuestion(question, subject, context)` – Q&A
- `GenerateAssessmentQuestions(subject, notes, durationMinutes)` – Assessment questions
- `CompleteAssessment(data)` – Submit assessment
- `GenerateReport(reportType)` – Generate report
- `GetReports()` – List reports
- `GetReport(reportID)` – Get report
- `GenerateSyllabusFromFile(...)` – Syllabus from file
- `GenerateSyllabusFromTopics(...)` – Syllabus from topics

### Smart Study Plan
- `GenerateSmartStudyPlan(data)` – AI-generated plan
- `CreateSmartStudyPlan(data)` – Create from generated

### Leaderboard & friends
- `GetLeaderboard(period, limit)` – Leaderboard
- `GetMyBadges()` – My badges
- `GetDashboardStats()` – Dashboard stats (XP, rank, etc.)
- `SendFriendRequest(toUserID)` – Send friend request
- `GetIncomingFriendRequests()` – Incoming requests
- `AcceptFriendRequest(id)` – Accept
- `RejectFriendRequest(id)` – Reject
- `GetFriends()` – My friends

### Room AI (teacher)
- `GetRoomAIStatus(roomID)` – Room AI status
- `TrainRoomAI(roomID, resourceIDs)` – Train on resources
- `ChatWithRoomAI(roomID, message)` – Chat with room AI

### Resources & assignments
- `UploadFile(roomID, filePath)` – Upload file
- `CreateResource(roomID, resource)` – Create resource
- `GetResources(roomID, ...)` – List resources
- `DeleteResource(resourceID)` – Delete resource
- `ShareResource(resourceID, sharedWith, isPublic)` – Share
- `CreateAssignment(...)` – Create assignment
- `GetAssignments(roomID)` – List assignments
- `GetAssignment(assignmentID)` – Get assignment
- `UpdateAssignment(...)` – Update assignment
- `DeleteAssignment(assignmentID)` – Delete assignment
- `UpdateRoomExamDates(roomID, examDates)` – Update exam dates

### Utilities
- `OpenFileDialog()` – Native file picker
- `SaveTextToDownloads(filename, content)` – Save to downloads

## Platform Support

- Windows 10/11
- macOS 10.13+
- Ubuntu 18.04+ and other Linux distros

## License

Copyright © 2024, Buddy Team
