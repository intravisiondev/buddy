package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ActivityService struct {
	db            *database.DB
	rewardService *RewardService
	userService   *UserService
}

func NewActivityService(db *database.DB, rewardService *RewardService, userService *UserService) *ActivityService {
	return &ActivityService{db: db, rewardService: rewardService, userService: userService}
}

// LogStudySession logs a study session (minutes) and applies rewards + streak update.
func (s *ActivityService) LogStudySession(userID string, subject string, durationMinutes int) error {
	if durationMinutes <= 0 {
		return errors.New("duration_minutes must be > 0")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	// Insert activity log
	log := &models.ActivityLog{
		UserID:          oid,
		ActivityType:    "study",
		Description:     "Study session",
		Subject:         subject,
		DurationMinutes: durationMinutes,
		XPEarned:        0, // computed by reward engine
		CreatedAt:       time.Now(),
	}
	_, err = s.db.Collection("activity_logs").InsertOne(ctx, log)
	if err != nil {
		return err
	}

	// Update study time (hours)
	_ = s.userService.AddStudyTime(userID, float64(durationMinutes)/60.0)

	// Update streak
	_ = s.userService.UpdateStreak(userID)

	// Read updated streak to feed engine
	var stats models.UserStats
	_ = s.db.Collection("user_stats").FindOne(ctx, bson.M{"user_id": oid}).Decode(&stats)

	// Apply rewards
	if s.rewardService != nil {
		_, _ = s.rewardService.ApplyEvent(userID, EventStudySessionLogged, map[string]interface{}{
			"duration_minutes": durationMinutes,
		})
		_, _ = s.rewardService.ApplyEvent(userID, EventStreakUpdated, map[string]interface{}{
			"current_streak": stats.CurrentStreak,
		})
	}

	return nil
}

// StartStudySession starts a new active study session
func (s *ActivityService) StartStudySession(userID, studyPlanID, subject string) (*models.ActiveStudySession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if subject == "" {
		return nil, errors.New("subject is required")
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Check if user already has an active session
	existingSession := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(existingSession)
	if err == nil {
		return nil, errors.New("user already has an active study session")
	}

	now := time.Now()
	session := &models.ActiveStudySession{
		UserID:            userOID,
		Subject:           subject,
		StartTime:         now,
		LastActiveTime:    now,
		IsIdle:            false,
		TotalStudySeconds: 0,
		Breaks:            []models.Break{},
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if studyPlanID != "" {
		planOID, err := primitive.ObjectIDFromHex(studyPlanID)
		if err == nil {
			session.StudyPlanID = &planOID
		}
	}

	result, err := s.db.Collection("active_study_sessions").InsertOne(ctx, session)
	if err != nil {
		return nil, err
	}

	session.ID = result.InsertedID.(primitive.ObjectID)
	return session, nil
}

// GetActiveStudySession gets the active study session for a user
func (s *ActivityService) GetActiveStudySession(userID string) (*models.ActiveStudySession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	session := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(session)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // Return nil session, nil error if no active session
		}
		return nil, err // Return other errors
	}

	// Calculate current total study time
	now := time.Now()
	elapsedSinceLastActive := int(now.Sub(session.LastActiveTime).Seconds())
	
	// Only add elapsed time if not on break
	onBreak := false
	if len(session.Breaks) > 0 {
		lastBreak := session.Breaks[len(session.Breaks)-1]
		if lastBreak.EndTime == nil {
			onBreak = true
		}
	}
	
	if !onBreak && elapsedSinceLastActive > 0 {
		session.TotalStudySeconds += elapsedSinceLastActive
		// Update last active time to now for next calculation
		session.LastActiveTime = now
	}

	return session, nil
}

// PauseStudySession starts a break for the active study session
func (s *ActivityService) PauseStudySession(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	session := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(session)
	if err != nil {
		return errors.New("no active study session found")
	}

	// Check if already on break (last break has no end time)
	if len(session.Breaks) > 0 {
		lastBreak := session.Breaks[len(session.Breaks)-1]
		if lastBreak.EndTime == nil {
			return errors.New("already on break")
		}
	}

	// Update total study time before break
	s.updateTotalStudyTime(session)
	session.LastActiveTime = time.Now()

	// Add new break
	newBreak := models.Break{
		StartTime:       time.Now(),
		EndTime:         nil,
		DurationSeconds: 0,
	}
	session.Breaks = append(session.Breaks, newBreak)

	_, err = s.db.Collection("active_study_sessions").UpdateOne(
		ctx,
		bson.M{"_id": session.ID},
		bson.M{"$set": bson.M{
			"breaks":          session.Breaks,
			"last_active_time": session.LastActiveTime,
			"total_study_seconds": session.TotalStudySeconds,
			"updated_at":      time.Now(),
		}},
	)
	return err
}

// ResumeStudySession ends the current break
func (s *ActivityService) ResumeStudySession(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	session := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(session)
	if err != nil {
		return errors.New("no active study session found")
	}

	// Check if on break
	if len(session.Breaks) == 0 {
		return errors.New("not on break")
	}

	lastBreak := &session.Breaks[len(session.Breaks)-1]
	if lastBreak.EndTime != nil {
		return errors.New("not on break")
	}

	now := time.Now()
	lastBreak.EndTime = &now
	lastBreak.DurationSeconds = int(now.Sub(lastBreak.StartTime).Seconds())
	session.LastActiveTime = now

	_, err = s.db.Collection("active_study_sessions").UpdateOne(
		ctx,
		bson.M{"_id": session.ID},
		bson.M{"$set": bson.M{
			"breaks":          session.Breaks,
			"last_active_time": session.LastActiveTime,
			"updated_at":      time.Now(),
		}},
	)
	return err
}

// SetIdleStatus sets the idle status of the active study session
func (s *ActivityService) SetIdleStatus(userID string, isIdle bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	session := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(session)
	if err != nil {
		return errors.New("no active study session found")
	}

	// If setting to idle, update total study time first
	if isIdle {
		s.updateTotalStudyTime(session)
	}
	session.IsIdle = isIdle
	session.LastActiveTime = time.Now()

	_, err = s.db.Collection("active_study_sessions").UpdateOne(
		ctx,
		bson.M{"_id": session.ID},
		bson.M{"$set": bson.M{
			"is_idle":         session.IsIdle,
			"last_active_time": session.LastActiveTime,
			"total_study_seconds": session.TotalStudySeconds,
			"updated_at":      time.Now(),
		}},
	)
	return err
}

// StopStudySession stops the active study session and creates an ActivityLog
func (s *ActivityService) StopStudySession(userID string, notes string, focusScore int) (*models.ActivityLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	session := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(session)
	if err != nil {
		return nil, errors.New("no active study session found")
	}

	// Update total study time one last time
	s.updateTotalStudyTime(session)

	// End any active break
	if len(session.Breaks) > 0 {
		lastBreak := &session.Breaks[len(session.Breaks)-1]
		if lastBreak.EndTime == nil {
			now := time.Now()
			lastBreak.EndTime = &now
			lastBreak.DurationSeconds = int(now.Sub(lastBreak.StartTime).Seconds())
		}
	}

	// Calculate total duration in minutes (excluding breaks)
	durationMinutes := session.TotalStudySeconds / 60
	if durationMinutes < 1 {
		durationMinutes = 1
	}

	// Create activity log
	activityLog := &models.ActivityLog{
		UserID:          session.UserID,
		StudyPlanID:     session.StudyPlanID,
		ActivityType:    "study",
		Description:     "Study session",
		Subject:         session.Subject,
		DurationMinutes: durationMinutes,
		XPEarned:        0, // computed by reward engine
		Notes:           notes,
		FocusScore:      focusScore,
		Breaks:          session.Breaks,
		CreatedAt:       time.Now(),
	}

	// Insert activity log
	_, err = s.db.Collection("activity_logs").InsertOne(ctx, activityLog)
	if err != nil {
		return nil, err
	}

	// Delete active session
	_, err = s.db.Collection("active_study_sessions").DeleteOne(ctx, bson.M{"_id": session.ID})
	if err != nil {
		return nil, err
	}

	// Update study time (hours)
	_ = s.userService.AddStudyTime(userID, float64(durationMinutes)/60.0)

	// Update streak
	_ = s.userService.UpdateStreak(userID)

	// Read updated streak to feed engine
	var stats models.UserStats
	_ = s.db.Collection("user_stats").FindOne(ctx, bson.M{"user_id": userOID}).Decode(&stats)

	// Apply rewards
	if s.rewardService != nil {
		_, _ = s.rewardService.ApplyEvent(userID, EventStudySessionLogged, map[string]interface{}{
			"duration_minutes": durationMinutes,
		})
		_, _ = s.rewardService.ApplyEvent(userID, EventStreakUpdated, map[string]interface{}{
			"current_streak": stats.CurrentStreak,
		})
	}

	return activityLog, nil
}

// UpdateActiveSessionTime updates the total study time for an active session
func (s *ActivityService) UpdateActiveSessionTime(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	session := &models.ActiveStudySession{}
	err = s.db.Collection("active_study_sessions").FindOne(ctx, bson.M{"user_id": userOID}).Decode(session)
	if err != nil {
		return errors.New("no active study session found")
	}

	s.updateTotalStudyTime(session)

	_, err = s.db.Collection("active_study_sessions").UpdateOne(
		ctx,
		bson.M{"_id": session.ID},
		bson.M{"$set": bson.M{
			"total_study_seconds": session.TotalStudySeconds,
			"last_active_time":    time.Now(),
			"updated_at":         time.Now(),
		}},
	)
	return err
}

// updateTotalStudyTime calculates and updates total study time (excluding breaks and idle time)
func (s *ActivityService) updateTotalStudyTime(session *models.ActiveStudySession) {
	now := time.Now()

	// Don't count time if idle or on break
	if session.IsIdle {
		return
	}

	// Check if on break
	isOnBreak := false
	if len(session.Breaks) > 0 {
		lastBreak := session.Breaks[len(session.Breaks)-1]
		if lastBreak.EndTime == nil {
			isOnBreak = true
		}
	}

	if isOnBreak {
		return
	}

	// Calculate time since last update
	elapsed := int(now.Sub(session.LastActiveTime).Seconds())
	if elapsed > 0 {
		session.TotalStudySeconds += elapsed
	}
}
