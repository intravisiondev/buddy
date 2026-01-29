# Services Documentation

This document provides comprehensive documentation for all backend and AI services used in the Buddy learning platform.

## Table of Contents

- [Backend Services](#backend-services)
  - [Authentication Service](#authentication-service)
  - [User Service](#user-service)
  - [Room Service](#room-service)
  - [Message Service](#message-service)
  - [Study Plan Service](#study-plan-service)
  - [Resource Service](#resource-service)
  - [Leaderboard Service](#leaderboard-service)
  - [Progress Service](#progress-service)
  - [Assignment Service](#assignment-service)
- [AI Services](#ai-services)
  - [Chat Service](#chat-service)
  - [Content Service](#content-service)
  - [Recommendation Service](#recommendation-service)
  - [Q&A Service](#qa-service)

---

## Backend Services

### Authentication Service

**File:** `src/services/backend/auth.service.ts`

Handles user authentication, session management, and account operations.

#### Methods

##### `signUp(data: SignUpData)`
Creates a new user account and profile.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password
- `fullName` (string): User's full name
- `role` ('student' | 'teacher' | 'parent'): User role

**Returns:** Auth data with user information

**Example:**
```typescript
import { authService } from '@/services';

const result = await authService.signUp({
  email: 'student@example.com',
  password: 'securePassword123',
  fullName: 'John Doe',
  role: 'student'
});
```

##### `signIn(data: SignInData)`
Authenticates a user with email and password.

**Example:**
```typescript
const result = await authService.signIn({
  email: 'student@example.com',
  password: 'securePassword123'
});
```

##### `signOut()`
Signs out the current user.

##### `getCurrentUser()`
Gets the currently authenticated user.

##### `getCurrentSession()`
Gets the current session information.

##### `resetPassword(email: string)`
Sends a password reset email.

##### `updatePassword(newPassword: string)`
Updates the current user's password.

##### `onAuthStateChange(callback)`
Subscribes to authentication state changes.

**Example:**
```typescript
authService.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
});
```

---

### User Service

**File:** `src/services/backend/user.service.ts`

Manages user profiles, statistics, and user-related operations.

#### Methods

##### `getProfile(userId: string)`
Retrieves a user's profile information.

**Example:**
```typescript
import { userService } from '@/services';

const profile = await userService.getProfile('user-id-123');
console.log(profile.full_name, profile.role);
```

##### `updateProfile(userId: string, updates: Partial<UserProfile>)`
Updates user profile information.

**Example:**
```typescript
await userService.updateProfile('user-id-123', {
  bio: 'Passionate learner focusing on mathematics and physics',
  avatar_url: 'https://example.com/avatar.jpg'
});
```

##### `getUserStats(userId: string)`
Gets user statistics including XP, level, streak, etc.

**Example:**
```typescript
const stats = await userService.getUserStats('user-id-123');
console.log(`Level ${stats.level} - ${stats.total_xp} XP`);
```

##### `addXP(userId: string, xp: number)`
Adds experience points to a user and updates their level.

**Example:**
```typescript
await userService.addXP('user-id-123', 150);
```

##### `updateStreak(userId: string)`
Increments the user's daily study streak.

##### `addStudyTime(userId: string, hours: number)`
Adds study time to user's total.

##### `getUsersByRole(role: 'student' | 'teacher' | 'parent')`
Gets all users with a specific role.

##### `searchUsers(query: string)`
Searches users by name.

---

### Room Service

**File:** `src/services/backend/room.service.ts`

Manages study rooms and classrooms, including creation, joining, and member management.

#### Methods

##### `createRoom(data: CreateRoomData)`
Creates a new study room or classroom.

**Example:**
```typescript
import { roomService } from '@/services';

const room = await roomService.createRoom({
  name: 'Advanced Calculus Study Group',
  subject: 'Mathematics',
  description: 'Group for discussing calculus problems and preparing for exams',
  owner_id: 'user-id-123',
  is_private: false,
  max_members: 30
});
```

##### `getRooms(filters?)`
Gets all rooms with optional filters.

**Example:**
```typescript
const mathRooms = await roomService.getRooms({ subject: 'Mathematics' });
const publicRooms = await roomService.getRooms({ is_private: false });
```

##### `getRoom(roomId: string)`
Gets detailed information about a specific room.

##### `updateRoom(roomId: string, updates: Partial<Room>)`
Updates room information.

**Example:**
```typescript
await roomService.updateRoom('room-id-123', {
  description: 'Updated description',
  max_members: 40
});
```

##### `deleteRoom(roomId: string)`
Deletes a room.

##### `joinRoom(roomId: string, userId: string)`
Adds a user to a room.

**Example:**
```typescript
await roomService.joinRoom('room-id-123', 'user-id-456');
```

##### `leaveRoom(roomId: string, userId: string)`
Removes a user from a room.

##### `updateMemberStatus(roomId: string, userId: string, isActive: boolean)`
Updates a member's active status in a room.

##### `getRoomMembers(roomId: string)`
Gets all members of a room.

##### `getUserRooms(userId: string)`
Gets all rooms a user is a member of.

##### `setRoomLiveStatus(roomId: string, isLive: boolean)`
Sets whether a room is currently live.

---

### Message Service

**File:** `src/services/backend/message.service.ts`

Handles messaging within rooms, including real-time message subscriptions.

#### Methods

##### `sendMessage(data: CreateMessageData)`
Sends a message to a room.

**Example:**
```typescript
import { messageService } from '@/services';

const message = await messageService.sendMessage({
  room_id: 'room-id-123',
  user_id: 'user-id-456',
  content: 'Can someone explain question 5?',
  message_type: 'text'
});
```

##### `getMessages(roomId: string, limit?: number, offset?: number)`
Gets messages from a room with pagination.

**Example:**
```typescript
const messages = await messageService.getMessages('room-id-123', 50, 0);
```

##### `deleteMessage(messageId: string)`
Deletes a message.

##### `updateMessage(messageId: string, content: string)`
Updates message content.

##### `subscribeToMessages(roomId: string, callback)`
Subscribes to real-time messages in a room.

**Example:**
```typescript
const subscription = messageService.subscribeToMessages('room-id-123', (message) => {
  console.log('New message:', message.content);
  // Update UI with new message
});
```

##### `unsubscribeFromMessages(roomId: string)`
Unsubscribes from real-time messages.

---

### Study Plan Service

**File:** `src/services/backend/studyplan.service.ts`

Manages study plans, courses, schedules, and challenges.

#### Methods

##### `createStudyPlan(data: CreateStudyPlanData)`
Creates a new study plan.

**Example:**
```typescript
import { studyPlanService } from '@/services';

const plan = await studyPlanService.createStudyPlan({
  user_id: 'user-id-123',
  name: 'Final Exam Preparation',
  description: 'Comprehensive study plan for all subjects',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  daily_goal_hours: 3,
  is_challenge: true,
  is_public: true
});
```

##### `getStudyPlans(userId: string)`
Gets all study plans for a user.

##### `getStudyPlan(planId: string)`
Gets detailed information about a study plan.

##### `updateStudyPlan(planId: string, updates: Partial<StudyPlan>)`
Updates a study plan.

##### `deleteStudyPlan(planId: string)`
Deletes a study plan.

##### `addCourse(planId: string, subject: string, hoursAllocated: number)`
Adds a course to a study plan.

**Example:**
```typescript
await studyPlanService.addCourse('plan-id-123', 'Mathematics', 15);
```

##### `updateCourseProgress(courseId: string, hoursCompleted: number)`
Updates progress on a course.

##### `addScheduleBlock(block)`
Adds a schedule block to a study plan.

**Example:**
```typescript
await studyPlanService.addScheduleBlock({
  study_plan_id: 'plan-id-123',
  day_of_week: 1, // Monday
  start_time: '09:00',
  end_time: '11:00',
  subject: 'Mathematics',
  topic: 'Calculus Review',
  block_type: 'study'
});
```

##### `deleteScheduleBlock(blockId: string)`
Deletes a schedule block.

##### `getPublicStudyPlans()`
Gets all public study plans (challenges).

##### `joinChallenge(planId: string, userId: string)`
Joins a public study plan challenge.

##### `getChallengeParticipants(planId: string)`
Gets all participants of a challenge.

---

### Resource Service

**File:** `src/services/backend/resource.service.ts`

Manages file uploads, resources, and study materials in rooms.

#### Methods

##### `uploadFile(file: File, roomId: string, userId: string)`
Uploads a file to storage and returns the public URL.

**Example:**
```typescript
import { resourceService } from '@/services';

const file = event.target.files[0];
const fileUrl = await resourceService.uploadFile(file, 'room-id-123', 'user-id-456');
```

##### `createResource(data: CreateResourceData)`
Creates a resource entry in the database.

**Example:**
```typescript
await resourceService.createResource({
  room_id: 'room-id-123',
  uploader_id: 'user-id-456',
  name: 'Chapter 5 Notes.pdf',
  description: 'Comprehensive notes on Chapter 5',
  file_url: fileUrl,
  file_type: 'application/pdf',
  file_size: 2048576,
  category: 'document'
});
```

##### `getResources(roomId: string)`
Gets all resources in a room.

##### `getResource(resourceId: string)`
Gets a specific resource.

##### `deleteResource(resourceId: string)`
Deletes a resource and its file from storage.

##### `getResourcesByCategory(roomId: string, category: string)`
Gets resources filtered by category.

##### `searchResources(roomId: string, query: string)`
Searches resources by name.

---

### Leaderboard Service

**File:** `src/services/backend/leaderboard.service.ts`

Manages leaderboards, rankings, badges, and achievements.

#### Methods

##### `getGlobalLeaderboard(limit?: number)`
Gets the global leaderboard ranked by total XP.

**Example:**
```typescript
import { leaderboardService } from '@/services';

const topUsers = await leaderboardService.getGlobalLeaderboard(100);
topUsers.forEach(user => {
  console.log(`#${user.rank} ${user.full_name} - ${user.total_xp} XP`);
});
```

##### `getWeeklyLeaderboard(limit?: number)`
Gets the weekly leaderboard.

##### `getUserRank(userId: string)`
Gets a user's current rank.

##### `getAllBadges()`
Gets all available badges.

##### `getUserBadges(userId: string)`
Gets all badges earned by a user.

**Example:**
```typescript
const badges = await leaderboardService.getUserBadges('user-id-123');
console.log(`User has earned ${badges.length} badges`);
```

##### `awardBadge(userId: string, badgeId: string)`
Awards a badge to a user and gives XP reward.

**Example:**
```typescript
await leaderboardService.awardBadge('user-id-123', 'speed-learner-badge-id');
```

##### `checkBadgeCriteria(userId: string)`
Checks if user is eligible for any new badges.

##### `getTopStreaks(limit?: number)`
Gets users with the longest study streaks.

---

### Progress Service

**File:** `src/services/backend/progress.service.ts`

Tracks user progress, goals, activity logs, and study analytics.

#### Methods

##### `createGoal(userId: string, goal)`
Creates a new goal for a user.

**Example:**
```typescript
import { progressService } from '@/services';

const goal = await progressService.createGoal('user-id-123', {
  title: 'Complete 20 practice problems',
  description: 'Solve 20 calculus problems this week',
  subject: 'Mathematics',
  target_value: 20,
  unit: 'problems',
  due_date: '2024-01-31'
});
```

##### `getGoals(userId: string, filters?)`
Gets user's goals with optional filters.

**Example:**
```typescript
const activeGoals = await progressService.getGoals('user-id-123', {
  is_completed: false
});
```

##### `updateGoalProgress(goalId: string, currentValue: number)`
Updates progress on a goal.

**Example:**
```typescript
await progressService.updateGoalProgress('goal-id-123', 15);
```

##### `deleteGoal(goalId: string)`
Deletes a goal.

##### `logActivity(activity)`
Logs a learning activity.

**Example:**
```typescript
await progressService.logActivity({
  user_id: 'user-id-123',
  activity_type: 'study',
  description: 'Completed Chapter 5 Review',
  subject: 'Mathematics',
  duration_minutes: 120,
  xp_earned: 150
});
```

##### `getActivityLogs(userId: string, limit?, offset?)`
Gets user's activity history.

##### `getDailyProgress(userId: string, startDate: string, endDate: string)`
Gets daily progress statistics for a date range.

##### `getWeeklyProgress(userId: string)`
Gets progress for the current week.

##### `getSubjectProgress(userId: string)`
Gets progress breakdown by subject.

##### `updateStreak(userId: string)`
Updates user's study streak.

##### `checkStreakStatus(userId: string)`
Checks if user's streak is still active.

---

### Assignment Service

**File:** `src/services/backend/assignment.service.ts`

Manages assignments, submissions, and grading (for teachers).

#### Methods

##### `createAssignment(data: CreateAssignmentData)`
Creates a new assignment.

**Example:**
```typescript
import { assignmentService } from '@/services';

const assignment = await assignmentService.createAssignment({
  room_id: 'room-id-123',
  teacher_id: 'teacher-id-456',
  title: 'Calculus Problem Set 5',
  description: 'Complete problems 1-20 from Chapter 5',
  due_date: '2024-02-01',
  total_points: 100,
  assignment_type: 'homework'
});
```

##### `getAssignments(roomId: string)`
Gets all assignments in a room.

##### `getAssignment(assignmentId: string)`
Gets a specific assignment with all submissions.

##### `updateAssignment(assignmentId: string, updates)`
Updates an assignment.

##### `deleteAssignment(assignmentId: string)`
Deletes an assignment.

##### `submitAssignment(assignmentId: string, studentId: string, content?, fileUrl?)`
Submits an assignment.

**Example:**
```typescript
await assignmentService.submitAssignment(
  'assignment-id-123',
  'student-id-456',
  'Here is my solution to the problems...',
  'https://storage.example.com/submission.pdf'
);
```

##### `getSubmission(assignmentId: string, studentId: string)`
Gets a student's submission for an assignment.

##### `getSubmissions(assignmentId: string)`
Gets all submissions for an assignment.

##### `gradeSubmission(submissionId: string, teacherId: string, score: number, feedback?)`
Grades a submission and awards XP.

**Example:**
```typescript
await assignmentService.gradeSubmission(
  'submission-id-123',
  'teacher-id-456',
  85,
  'Great work! Pay attention to step 3 in problem 15.'
);
```

##### `getStudentAssignments(studentId: string, roomId?)`
Gets all assignments for a student.

##### `getPendingSubmissions(teacherId: string)`
Gets all pending submissions for a teacher to grade.

---

## AI Services

### Chat Service

**File:** `src/services/ai/chat.service.ts`

Handles AI-powered chat conversations with the learning assistant.

#### Methods

##### `sendMessage(message: string, context: ChatContext, conversationHistory?)`
Sends a message to the AI assistant and gets a response.

**Example:**
```typescript
import { chatService } from '@/services';

const response = await chatService.sendMessage(
  'Can you explain derivatives?',
  {
    userId: 'user-id-123',
    subject: 'Mathematics',
    userLevel: 10
  },
  conversationHistory
);

console.log(response.message);
if (response.resources) {
  response.resources.forEach(resource => {
    console.log(`Resource: ${resource.title} (${resource.type})`);
  });
}
```

##### `getQuickActions(context: ChatContext)`
Gets suggested quick actions for the user.

##### `suggestFollowUpQuestions(lastMessage: string, context: ChatContext)`
Gets suggested follow-up questions based on conversation.

---

### Content Service

**File:** `src/services/ai/content.service.ts`

AI-powered content generation including explanations, summaries, and questions.

#### Methods

##### `explainTopic(request: ExplanationRequest)`
Generates an explanation for a topic.

**Example:**
```typescript
import { contentService } from '@/services';

const explanation = await contentService.explainTopic({
  topic: 'Derivatives',
  subject: 'Calculus',
  level: 'intermediate',
  format: 'step-by-step'
});
```

##### `summarizeContent(request: SummaryRequest)`
Generates a summary of content.

**Example:**
```typescript
const summary = await contentService.summarizeContent({
  content: longTextContent,
  maxLength: 500,
  focusPoints: ['main concepts', 'key formulas']
});
```

##### `generateQuestions(request: QuestionGenerationRequest)`
Generates practice questions.

**Example:**
```typescript
const questions = await contentService.generateQuestions({
  topic: 'Quadratic Equations',
  subject: 'Mathematics',
  difficulty: 'medium',
  questionType: 'multiple-choice',
  count: 10
});
```

##### `generateStudyGuide(topic: string, subject: string)`
Generates a comprehensive study guide.

##### `generateFlashcards(topic: string, subject: string, count?)`
Generates flashcards for studying.

**Example:**
```typescript
const flashcards = await contentService.generateFlashcards(
  'Chemistry Reactions',
  'Chemistry',
  20
);

flashcards.forEach(card => {
  console.log(`Front: ${card.front}`);
  console.log(`Back: ${card.back}`);
});
```

##### `improveWriting(text: string, improvementType)`
Improves written content.

**Example:**
```typescript
const improved = await contentService.improveWriting(
  userEssay,
  'academic'
);
```

---

### Recommendation Service

**File:** `src/services/ai/recommendation.service.ts`

AI-powered personalized recommendations for study, resources, and learning paths.

#### Methods

##### `getStudyRecommendations(userId: string)`
Gets personalized study recommendations.

**Example:**
```typescript
import { recommendationService } from '@/services';

const recommendations = await recommendationService.getStudyRecommendations('user-id-123');

recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.topic} in ${rec.subject}`);
  console.log(`Reason: ${rec.reason}`);
  console.log(`Estimated time: ${rec.estimatedTime} minutes`);
});
```

##### `getResourceRecommendations(topic: string, subject: string, userLevel?)`
Gets recommended learning resources.

**Example:**
```typescript
const resources = await recommendationService.getResourceRecommendations(
  'Calculus',
  'Mathematics',
  10
);
```

##### `getLearningPath(goal: string, currentLevel, timeAvailable?)`
Generates a personalized learning path.

**Example:**
```typescript
const path = await recommendationService.getLearningPath(
  'Master Calculus',
  'intermediate',
  60 // hours available
);

path.steps.forEach(step => {
  console.log(`${step.order}. ${step.title} (${step.estimatedDuration})`);
});
```

##### `getPersonalizedSchedule(userId: string, weekGoalHours: number)`
Generates a personalized study schedule.

##### `getNextBestAction(userId: string)`
Gets the next recommended action for the user.

**Example:**
```typescript
const nextAction = await recommendationService.getNextBestAction('user-id-123');
console.log(`Next: ${nextAction.action}`);
console.log(`Why: ${nextAction.reason}`);
```

##### `getWeakAreasAnalysis(userId: string)`
Analyzes user's weak areas and suggests improvements.

---

### Q&A Service

**File:** `src/services/ai/qa.service.ts`

AI-powered question answering and homework help.

#### Methods

##### `answerQuestion(request: QuestionAnswerRequest)`
Gets an answer to a question with supporting information.

**Example:**
```typescript
import { qaService } from '@/services';

const result = await qaService.answerQuestion({
  question: 'What is the derivative of x^2?',
  subject: 'Calculus',
  context: 'I am learning about basic derivatives'
});

console.log(result.answer);
console.log(`Confidence: ${result.confidence * 100}%`);
console.log('Related topics:', result.relatedTopics);
```

##### `getHomeworkHelp(problem: string, subject: string)`
Gets step-by-step help with a homework problem.

**Example:**
```typescript
const help = await qaService.getHomeworkHelp(
  'Solve: 2x^2 + 5x - 3 = 0',
  'Mathematics'
);

help.steps.forEach(step => {
  console.log(`Step ${step.stepNumber}: ${step.description}`);
  console.log(`Explanation: ${step.explanation}`);
});
```

##### `explainSolution(solution: string, subject: string)`
Explains a solution in detail.

##### `checkAnswer(question: string, userAnswer: string, subject: string)`
Checks if an answer is correct and provides feedback.

**Example:**
```typescript
const result = await qaService.checkAnswer(
  'What is 2 + 2?',
  '4',
  'Mathematics'
);

console.log(`Correct: ${result.isCorrect}`);
console.log(`Feedback: ${result.feedback}`);
```

##### `getHints(problem: string, subject: string, numberOfHints?)`
Gets progressive hints for a problem.

**Example:**
```typescript
const hints = await qaService.getHints(
  'Solve for x: 3x + 5 = 20',
  'Mathematics',
  3
);

hints.forEach((hint, index) => {
  console.log(`Hint ${index + 1}: ${hint}`);
});
```

##### `explainConcept(concept: string, subject: string, level?)`
Explains a concept at the appropriate level.

##### `getExamples(concept: string, subject: string, count?)`
Gets example problems and solutions for a concept.

---

## Usage Best Practices

### Error Handling

Always wrap service calls in try-catch blocks:

```typescript
try {
  const user = await userService.getProfile(userId);
} catch (error) {
  console.error('Failed to load profile:', error);
  // Handle error appropriately
}
```

### TypeScript Types

Import and use TypeScript types for better type safety:

```typescript
import {
  userService,
  type UserProfile,
  type UserStats
} from '@/services';

const updateProfile = async (profile: Partial<UserProfile>) => {
  await userService.updateProfile(userId, profile);
};
```

### Real-time Subscriptions

Remember to clean up subscriptions:

```typescript
import { useEffect } from 'react';
import { messageService } from '@/services';

useEffect(() => {
  const subscription = messageService.subscribeToMessages(roomId, handleNewMessage);

  return () => {
    messageService.unsubscribeFromMessages(roomId);
  };
}, [roomId]);
```

### Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Database Schema Requirements

To use these services, you need to create the following database tables in Supabase:

- `profiles` - User profiles
- `user_stats` - User statistics and XP
- `rooms` - Study rooms and classrooms
- `room_members` - Room membership
- `messages` - Chat messages
- `study_plans` - Study plans
- `study_plan_courses` - Courses in study plans
- `schedule_blocks` - Schedule blocks
- `study_plan_participants` - Challenge participants
- `resources` - File resources
- `goals` - User goals
- `activity_logs` - Activity tracking
- `badges` - Available badges
- `user_badges` - Earned badges
- `assignments` - Teacher assignments
- `submissions` - Student submissions

Refer to the database migration files in `supabase/migrations/` for the complete schema.

---

## Support

For questions or issues with these services, please contact the development team or refer to the main project documentation.
