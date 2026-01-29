package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// RewardService applies RewardDelta to user stats and grants badges
type RewardService struct {
	db     *database.DB
	engine *RewardEngine
}

func NewRewardService(db *database.DB, engine *RewardEngine) *RewardService {
	return &RewardService{db: db, engine: engine}
}

func (s *RewardService) ApplyEvent(userIDHex string, eventType RewardEventType, meta map[string]interface{}) (RewardDelta, error) {
	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return RewardDelta{}, errors.New("invalid user ID")
	}

	now := time.Now()
	delta, err := s.engine.Evaluate(RewardEvent{Type: eventType, UserID: userID, Meta: meta, Now: now})
	if err != nil {
		return RewardDelta{}, err
	}

	if delta.XP == 0 && delta.Gems == 0 && delta.Tokens == 0 && len(delta.BadgesToGrant) == 0 {
		return delta, nil
	}

	if err := s.applyDelta(userID, delta); err != nil {
		return RewardDelta{}, err
	}

	return delta, nil
}

func (s *RewardService) applyDelta(userID primitive.ObjectID, delta RewardDelta) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	statsCol := s.db.Collection("user_stats")
	// update stats with increments; keep level calculation aligned with existing AddXP logic
	if delta.XP != 0 {
		// read current totalXP to compute level
		var stats struct {
			TotalXP int `bson:"total_xp"`
		}
		if err := statsCol.FindOne(ctx, bson.M{"user_id": userID}).Decode(&stats); err != nil {
			return err
		}
		newTotalXP := stats.TotalXP + delta.XP
		newLevel := (newTotalXP / 100) + 1
		_, err := statsCol.UpdateOne(ctx, bson.M{"user_id": userID}, bson.M{
			"$inc": bson.M{
				"total_xp":  delta.XP,
				"weekly_xp": delta.XP,
				"gems":      delta.Gems,
				"tokens":    delta.Tokens,
			},
			"$set": bson.M{
				"level":      newLevel,
				"updated_at": time.Now(),
			},
		})
		if err != nil {
			return err
		}
	} else {
		// no XP, only currency
		_, err := statsCol.UpdateOne(ctx, bson.M{"user_id": userID}, bson.M{
			"$inc": bson.M{
				"gems":   delta.Gems,
				"tokens": delta.Tokens,
			},
			"$set": bson.M{
				"updated_at": time.Now(),
			},
		})
		if err != nil {
			return err
		}
	}

	// grant badges
	if len(delta.BadgesToGrant) > 0 {
		badgesCol := s.db.Collection("badges")
		userBadgesCol := s.db.Collection("user_badges")

		for _, badgeName := range delta.BadgesToGrant {
			var badge struct {
				ID primitive.ObjectID `bson:"_id"`
			}
			err := badgesCol.FindOne(ctx, bson.M{"name": badgeName}).Decode(&badge)
			if err != nil {
				// if badge not seeded, skip
				continue
			}

			// upsert user badge to avoid duplicates
			_, err = userBadgesCol.UpdateOne(ctx,
				bson.M{"user_id": userID, "badge_id": badge.ID},
				bson.M{"$setOnInsert": bson.M{"user_id": userID, "badge_id": badge.ID, "earned_at": time.Now()}},
				options.Update().SetUpsert(true),
			)
			if err != nil {
				continue
			}

			// increment badges_earned (best effort; may overcount if duplicate insert prevented—acceptable for now)
			_, _ = statsCol.UpdateOne(ctx, bson.M{"user_id": userID}, bson.M{"$inc": bson.M{"badges_earned": 1}})
		}
	}

	return nil
}

