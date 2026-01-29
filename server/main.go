package main

import (
	"log"

	"buddy-server/config"
	"buddy-server/database"
	"buddy-server/handlers"
	"buddy-server/middleware"
	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to MongoDB
	db := database.Connect(cfg.MongoURI)
	defer db.Close()

	// Initialize services
	authService := services.NewAuthService(db, cfg.JWTSecret)
	userService := services.NewUserService(db)
	rewardEngine := services.NewRewardEngine(db)
	_ = rewardEngine.EnsureDefaultBadges()
	rewardService := services.NewRewardService(db, rewardEngine)
	roomService := services.NewRoomService(db, rewardService)
	studyPlanService := services.NewStudyPlanService(db)
	resourceService := services.NewResourceService(db)
	assignmentService := services.NewAssignmentService(db, roomService)
	// Set assignment service in room service to avoid circular dependency
	roomService.SetAssignmentService(assignmentService)
	goalService := services.NewGoalService(db, rewardService)
	leaderboardService := services.NewLeaderboardService(db)
	badgeService := services.NewBadgeService(db)
	activityService := services.NewActivityService(db, rewardService, userService)
	friendService := services.NewFriendService(db)

	geminiService, err := services.NewGeminiService(cfg.GeminiAPIKey)
	if err != nil {
		log.Println("Warning: Gemini service initialization failed:", err)
		log.Println("AI features will be unavailable")
	}
	defer func() {
		if geminiService != nil {
			geminiService.Close()
		}
	}()

	// Initialize AI-powered services
	activityQueryService := services.NewActivityQueryService(db)
	productivityService := services.NewProductivityService(db, geminiService)
	aiReportService := services.NewAIReportService(db, geminiService, activityQueryService, productivityService)
	goalSuggestionService := services.NewGoalSuggestionService(db, geminiService, activityQueryService, productivityService)
	roomAIService := services.NewRoomAIService(db, geminiService)
	gameService := services.NewGameService(db, geminiService)
	smartPlanService := services.NewSmartPlanService(db, geminiService, studyPlanService, goalService)
	
	// Set room AI service (to avoid circular dependency)
	roomService.SetRoomAIService(roomAIService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	roomHandler := handlers.NewRoomHandler(roomService)
	studyPlanHandler := handlers.NewStudyPlanHandler(studyPlanService)
	resourceHandler := handlers.NewResourceHandler(resourceService)
	assignmentHandler := handlers.NewAssignmentHandler(assignmentService)
	goalHandler := handlers.NewGoalHandler(goalService, goalSuggestionService)
	leaderboardHandler := handlers.NewLeaderboardHandler(leaderboardService)
	badgeHandler := handlers.NewBadgeHandler(badgeService)
	activityHandler := handlers.NewActivityHandler(activityService, activityQueryService, productivityService)
	friendHandler := handlers.NewFriendHandler(friendService)
	aiHandler := handlers.NewAIHandler(geminiService)
	reportHandler := handlers.NewReportHandler(aiReportService)
	gameHandler := handlers.NewGameHandler(gameService)
	smartPlanHandler := handlers.NewSmartPlanHandler(smartPlanService)

	// Initialize Gin router
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CORS(cfg.AllowedOrigins))

	// Static file serving for uploads
	router.Static("/uploads", "./uploads")

	// Public routes
	api := router.Group("/api")
	{
		// Authentication
		api.POST("/auth/signup", authHandler.SignUp)
		api.POST("/auth/login", authHandler.Login)

		// Public rooms
		api.GET("/rooms", roomHandler.GetRooms)
		api.GET("/rooms/:id", roomHandler.GetRoom)

		// Public study plans (challenges)
		api.GET("/studyplans/public", studyPlanHandler.GetPublicStudyPlans)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Auth
		protected.GET("/auth/me", authHandler.GetCurrentUser)
		protected.POST("/auth/logout", authHandler.Logout)

		// User
		protected.GET("/users/me/profile", userHandler.GetMyProfile)
		protected.PUT("/users/me/profile", userHandler.UpdateProfile)
		protected.GET("/users/me/stats", userHandler.GetMyStats)
		protected.POST("/users/me/xp", userHandler.AddXP)
		protected.GET("/users/me/children", userHandler.GetChildren)      // Get parent's children
		protected.POST("/users/me/children", userHandler.CreateChild)     // Create child account

		// Leaderboard
		protected.GET("/leaderboard", leaderboardHandler.GetLeaderboard)
		protected.GET("/badges/my", badgeHandler.GetMyBadges)

		// Activity
		protected.POST("/users/me/study-session", activityHandler.LogStudySession)
		protected.GET("/users/me/activity", activityHandler.GetMyActivity)
		// Active Study Session
		protected.POST("/users/me/study-session/start", activityHandler.StartStudySession)
		protected.GET("/users/me/study-session/active", activityHandler.GetActiveStudySession)
		protected.PUT("/users/me/study-session/pause", activityHandler.PauseStudySession)
		protected.PUT("/users/me/study-session/resume", activityHandler.ResumeStudySession)
		protected.PUT("/users/me/study-session/idle", activityHandler.SetIdleStatus)
		protected.POST("/users/me/study-session/stop", activityHandler.StopStudySession)
		// AI Assessment
		protected.POST("/study-session/assess", activityHandler.GenerateAssessment)
		protected.POST("/study-session/complete-assessment", activityHandler.CompleteAssessment)

		// Friends
		protected.POST("/friends/requests", friendHandler.SendRequest)
		protected.GET("/friends/requests/incoming", friendHandler.ListIncoming)
		protected.POST("/friends/requests/:id/accept", friendHandler.Accept)
		protected.POST("/friends/requests/:id/reject", friendHandler.Reject)
		protected.GET("/friends", friendHandler.ListFriends)
		protected.GET("/users/search", userHandler.SearchUsers)
		protected.GET("/users/:id/profile", userHandler.GetProfile)
		protected.GET("/users/:id/stats", userHandler.GetUserStats)

		// Rooms
		protected.POST("/rooms", roomHandler.CreateRoom)
		protected.GET("/rooms/my", roomHandler.GetMyRooms)                  // Teacher's own rooms
		protected.GET("/rooms/:id/membership", roomHandler.CheckMembership) // Check if user is member
		protected.PUT("/rooms/:id/syllabus", roomHandler.UpdateRoomSyllabus) // Update room syllabus (owner only)
		protected.POST("/rooms/:id/join", roomHandler.JoinRoom)
		protected.GET("/rooms/:id/members", roomHandler.GetRoomMembers)
		protected.POST("/rooms/:id/messages", roomHandler.SendMessage)
		protected.GET("/rooms/:id/messages", roomHandler.GetMessages)

		// Resources
		protected.POST("/rooms/:id/resources/upload", resourceHandler.UploadFile)      // File upload
		protected.POST("/rooms/:id/resources", resourceHandler.CreateResource)         // Create resource
		protected.GET("/rooms/:id/resources", resourceHandler.GetResources)            // Get all resources
		protected.GET("/resources/:resource_id", resourceHandler.GetResource)          // Get single resource
		protected.DELETE("/resources/:resource_id", resourceHandler.DeleteResource)    // Delete resource
		protected.POST("/resources/:resource_id/share", resourceHandler.ShareResource) // Share resource

		// Assignments
		protected.POST("/rooms/:id/assignments", assignmentHandler.CreateAssignment)           // Create assignment
		protected.GET("/rooms/:id/assignments", assignmentHandler.GetAssignments)              // Get all assignments for a room
		protected.GET("/assignments/:assignment_id", assignmentHandler.GetAssignment)          // Get single assignment
		protected.PUT("/assignments/:assignment_id", assignmentHandler.UpdateAssignment)      // Update assignment
		protected.DELETE("/assignments/:assignment_id", assignmentHandler.DeleteAssignment)   // Delete assignment

		// Room Exam Dates
		protected.PUT("/rooms/:id/exam-dates", roomHandler.UpdateRoomExamDates) // Update room exam dates (owner only)

		// Study Plans
		protected.GET("/studyplans", studyPlanHandler.GetStudyPlans)
		protected.POST("/studyplans", studyPlanHandler.CreateStudyPlan)
		protected.POST("/studyplans/:id/courses", studyPlanHandler.AddCourse)
		protected.GET("/studyplans/:id/courses", studyPlanHandler.GetCourses)
		protected.POST("/studyplans/:id/schedule", studyPlanHandler.CreateScheduleBlock)
		protected.GET("/studyplans/:id/schedule", studyPlanHandler.GetScheduleBlocks)
		protected.PUT("/studyplans/:id/schedule/:block_id", studyPlanHandler.UpdateScheduleBlock)
		protected.PUT("/studyplans/:id/progress", studyPlanHandler.UpdateStudyPlanProgress)
		protected.GET("/schedule", studyPlanHandler.GetUserSchedule) // User's full schedule

		// Goals & Milestones
		protected.POST("/goals", goalHandler.CreateGoal)
		protected.GET("/goals", goalHandler.GetGoals)
		protected.GET("/goals/today", goalHandler.GetTodayGoals)
		protected.POST("/goals/daily/generate", goalHandler.GenerateDailyGoals)
		protected.POST("/goals/:id/toggle", goalHandler.ToggleGoalComplete)
		protected.DELETE("/goals/:id", goalHandler.DeleteGoal)
		protected.GET("/milestones", goalHandler.GetMilestones)
		protected.POST("/milestones", goalHandler.CreateMilestone)
		protected.PUT("/milestones/:id/progress", goalHandler.UpdateMilestoneProgress)

		// Reports
		if aiReportService != nil {
			protected.POST("/reports/generate", reportHandler.GenerateReport)
			protected.GET("/reports", reportHandler.GetReports)
			protected.GET("/reports/:id", reportHandler.GetReport)
		}

		// Goal Suggestions
		if goalSuggestionService != nil {
			protected.POST("/goal-suggestions/generate", goalHandler.GenerateGoalSuggestions)
			protected.GET("/goal-suggestions", goalHandler.GetGoalSuggestions)
			protected.POST("/goal-suggestions/:id/accept", goalHandler.AcceptGoalSuggestion)
			protected.DELETE("/goal-suggestions/:id", goalHandler.DismissGoalSuggestion)
		}

		// Room AI
		if roomAIService != nil {
			protected.POST("/rooms/:id/ai/train", roomHandler.TrainRoomAI)
			protected.POST("/rooms/:id/ai/chat", roomHandler.ChatWithRoomAI)
			protected.GET("/rooms/:id/ai/status", roomHandler.GetRoomAIStatus)
		}

		// Games
		if gameService != nil {
			protected.POST("/rooms/:id/games", gameHandler.GenerateGame)
			protected.GET("/rooms/:id/games", gameHandler.GetRoomGames)
			protected.GET("/games/:game_id", gameHandler.GetGame)
			protected.POST("/games/:game_id/play", gameHandler.PlayGame)
			protected.GET("/games/:game_id/results", gameHandler.GetGameResults)
		}

		// AI (if available)
		if geminiService != nil {
		protected.POST("/ai/chat", aiHandler.Chat)
		protected.POST("/ai/explain", aiHandler.ExplainTopic)
		protected.POST("/ai/answer", aiHandler.AnswerQuestion)
		protected.POST("/ai/questions", aiHandler.GenerateQuestions)
		protected.POST("/ai/summarize", aiHandler.Summarize)
		protected.POST("/ai/syllabus/from-file", aiHandler.GenerateSyllabusFromFile)
		protected.POST("/ai/syllabus/from-topics", aiHandler.GenerateSyllabusFromTopics)
		}

		// Smart Study Plan
		if smartPlanService != nil {
			protected.POST("/smart-plan/generate", smartPlanHandler.GenerateSmartPlan)
			protected.POST("/smart-plan/create", smartPlanHandler.CreateSmartPlan)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "buddy-api"})
	})

	// Start server
	log.Printf("🚀 Server starting on port %s (env: %s)", cfg.Port, cfg.Env)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
