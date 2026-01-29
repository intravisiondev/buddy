# End-to-End Test Plan - Buddy Game System

## Overview

This document outlines the complete end-to-end testing procedures for the Buddy Game System, covering teacher game creation, student gameplay, analytics, and multiplayer features.

## Prerequisites

- Buddy desktop app installed and running
- Backend server running on `localhost:8080`
- MongoDB running on `localhost:27017`
- At least 2 user accounts:
  - 1 teacher account
  - 1 student account
- At least 1 study room created with both users as members

---

## Test Suite 1: Teacher Game Creation Flow

### TC-001: Create Quiz Game

**Objective:** Verify teacher can create a quiz game with AI-generated questions

**Steps:**
1. Login as teacher
2. Navigate to study room
3. Click "Games" tab
4. Click "Create Game" button
5. Verify template selection modal opens
6. Click on "Quiz Game" template card
7. Verify configuration step appears
8. Enter subject: "Algebra"
9. Select difficulty: "Medium"
10. Adjust question count slider to 10
11. Click "Generate Game"
12. Wait for AI generation (max 30s)
13. Verify success message
14. Verify game appears in games list

**Expected Results:**
- ✅ Game created with correct metadata
- ✅ Game has 10 questions
- ✅ Game difficulty is "medium"
- ✅ Game appears in room's game list
- ✅ No console errors

**Acceptance Criteria:**
- [ ] All steps complete without errors
- [ ] Game visible in list within 5s of creation
- [ ] Game title includes subject name

---

### TC-002: Create Multiple Game Types

**Objective:** Verify all 5 game templates work

**Steps:**
For each template (quiz, flashcards, word-search, fill-blank, matching):
1. Click "Create Game"
2. Select template
3. Configure with subject "Test Subject"
4. Generate game
5. Verify game created

**Expected Results:**
- ✅ All 5 templates generate successfully
- ✅ Each game has appropriate question format
- ✅ No duplicate games created

**Acceptance Criteria:**
- [ ] 5 games created (one per template)
- [ ] All games visible in list
- [ ] Each game has unique ID

---

## Test Suite 2: Student Gameplay Flow

### TC-101: Play Quiz Game

**Objective:** Verify student can play a quiz game and submit score

**Steps:**
1. Login as student
2. Join study room (if not already member)
3. Click "Games" tab
4. Verify teacher's quiz game visible
5. Click "Play Game" button
6. Wait for game to load in iframe
7. Verify game UI displays:
   - Score: 0
   - Lives: 3
   - Progress bar
8. Answer first question correctly
9. Verify score increases
10. Answer second question incorrectly
11. Verify lives decrease
12. Complete all 10 questions
13. Verify results screen shows:
    - Final score
    - Time spent
    - Questions answered (10/10)
    - Pass/Fail status
14. Click "Close"
15. Verify returned to games list

**Expected Results:**
- ✅ Game loads within 5s
- ✅ Score updates in real-time
- ✅ Lives decrease on wrong answers
- ✅ Results screen accurate
- ✅ Score saved to backend

**Acceptance Criteria:**
- [ ] All steps complete
- [ ] No iframe errors
- [ ] postMessage communication works
- [ ] Score persists after closing

---

### TC-102: Play Flashcards Game

**Objective:** Verify flashcard flip mechanic

**Steps:**
1. Play flashcards game
2. Click on first card
3. Verify card flips to show answer
4. Click "Next Card"
5. Verify next card appears
6. Complete all cards
7. Verify completion screen

**Expected Results:**
- ✅ Cards flip smoothly
- ✅ All cards reviewable
- ✅ Progress tracked

**Acceptance Criteria:**
- [ ] Flip animation works
- [ ] All cards accessible
- [ ] Completion detected

---

### TC-103: Play Puzzle Game

**Objective:** Verify drag-drop puzzle mechanics

**Steps:**
1. Play puzzle game
2. Click locked piece
3. Answer question correctly
4. Verify piece unlocks
5. Drag unlocked piece to different position
6. Drop piece
7. Verify pieces swap positions
8. Unlock all pieces
9. Arrange all pieces correctly
10. Verify completion bonus awarded

**Expected Results:**
- ✅ Pieces unlock on correct answers
- ✅ Drag-drop works smoothly
- ✅ Pieces swap positions
- ✅ Completion detected when all correct
- ✅ Bonus points awarded

**Acceptance Criteria:**
- [ ] react-dnd works
- [ ] Position validation correct
- [ ] Completion bonus applied

---

## Test Suite 3: Analytics & Reporting

### TC-201: View Game Analytics (Teacher)

**Objective:** Verify teacher can view game performance analytics

**Steps:**
1. Login as teacher
2. Navigate to Teacher Dashboard
3. Scroll to "Game Analytics" section
4. Verify summary cards display:
   - Total Games
   - Total Plays
   - Active Students
   - Avg Engagement
5. Verify "Top Performing Games" list shows games
6. For each game, verify displays:
   - Title
   - Play count
   - Avg score
   - Pass rate
7. Click "Export CSV" button
8. Verify CSV file downloads
9. Open CSV and verify data matches UI

**Expected Results:**
- ✅ All metrics display correctly
- ✅ Top games sorted by plays
- ✅ CSV export works
- ✅ CSV data accurate

**Acceptance Criteria:**
- [ ] Analytics load within 3s
- [ ] All 4 summary cards populated
- [ ] CSV downloads to ~/Downloads
- [ ] CSV has correct headers and data

---

## Test Suite 4: Security & Validation

### TC-301: postMessage Origin Validation

**Objective:** Verify iframe rejects unauthorized messages

**Steps:**
1. Open game in player
2. Open browser dev tools
3. Run in console:
   ```javascript
   window.postMessage({ type: 'GAME_SCORE', score: 9999 }, 'https://evil.com');
   ```
4. Verify console warning appears
5. Verify score does NOT update to 9999

**Expected Results:**
- ✅ Warning logged: "unauthorized origin"
- ✅ Score unchanged
- ✅ Game continues normally

**Acceptance Criteria:**
- [ ] Invalid origin rejected
- [ ] Console warning present
- [ ] Game state not affected

---

### TC-302: Score Replay Protection

**Objective:** Verify session nonce prevents replay attacks

**Steps:**
1. Play game and capture network request
2. Note the session nonce in request
3. Complete game
4. Try to replay same request with same nonce
5. Verify backend rejects with "session already used"

**Expected Results:**
- ✅ First submission succeeds
- ✅ Replay rejected with 400 error
- ✅ Score not duplicated

**Acceptance Criteria:**
- [ ] Nonce validated
- [ ] Replay blocked
- [ ] Error message clear

---

### TC-303: Rate Limiting

**Objective:** Verify rate limiting prevents spam

**Steps:**
1. Play same game 10 times in 1 hour
2. Verify all 10 submissions succeed
3. Try 11th submission
4. Verify rejected with "rate limit exceeded"
5. Wait 1 hour
6. Try again
7. Verify succeeds

**Expected Results:**
- ✅ First 10 submissions succeed
- ✅ 11th submission rejected
- ✅ After 1 hour, submissions allowed again

**Acceptance Criteria:**
- [ ] Limit enforced at 10/hour
- [ ] Error message clear
- [ ] Timer resets correctly

---

### TC-304: Bundle Integrity Verification

**Objective:** Verify tampered bundles rejected

**Steps:**
1. Download game bundle
2. Locate bundle in `~/.buddy/games/{game_id}/`
3. Modify ZIP file (add random bytes)
4. Try to play game
5. Verify error: "bundle hash mismatch"
6. Verify game does not load

**Expected Results:**
- ✅ Tampered bundle detected
- ✅ Error message clear
- ✅ Game does not execute

**Acceptance Criteria:**
- [ ] Hash verification works
- [ ] Signature verification works
- [ ] Tampered bundle rejected

---

## Test Suite 5: Multiplayer (Foundation)

### TC-401: Create and Join Match

**Objective:** Verify multiplayer lobby works

**Steps:**
1. Student 1 creates match for multiplayer game
2. Verify lobby opens
3. Verify Student 1 shown in player list
4. Student 2 joins same match
5. Verify Student 2 appears in Student 1's lobby
6. Verify both see "2 / 4" players
7. Both click "Ready"
8. Verify countdown starts (3-2-1)
9. Verify match transitions to "active" state

**Expected Results:**
- ✅ Lobby displays both players
- ✅ Real-time updates via WebSocket
- ✅ Countdown synchronizes
- ✅ Match starts when all ready

**Acceptance Criteria:**
- [ ] WebSocket connection established
- [ ] Player join events broadcast
- [ ] Countdown visible to both
- [ ] Match state transitions correctly

---

## Test Suite 6: Edge Cases & Error Handling

### TC-501: Network Disconnection During Game

**Steps:**
1. Start playing game
2. Disconnect network
3. Try to answer question
4. Verify error handling
5. Reconnect network
6. Verify game recovers or shows appropriate error

**Expected Results:**
- ✅ Graceful error message
- ✅ No crash
- ✅ Recovery possible or clear instructions

---

### TC-502: Expired Game Session

**Steps:**
1. Start game session
2. Wait 1 hour + 1 minute
3. Try to submit score
4. Verify rejected with "expired session"

**Expected Results:**
- ✅ Session expires after 1 hour
- ✅ Clear error message
- ✅ Must start new session

---

### TC-503: Invalid Game Bundle

**Steps:**
1. Create game
2. Delete bundle file from server
3. Try to play game
4. Verify error: "bundle not found"

**Expected Results:**
- ✅ Missing bundle detected
- ✅ Error message clear
- ✅ No crash

---

## Test Suite 7: Performance & Load

### TC-601: Concurrent Game Sessions

**Objective:** Verify system handles multiple simultaneous games

**Steps:**
1. Have 10 students play games simultaneously
2. Monitor server CPU/memory
3. Verify all games load within 5s
4. Verify all score submissions succeed
5. Check for any errors in logs

**Expected Results:**
- ✅ All games load successfully
- ✅ No timeouts
- ✅ Server remains responsive
- ✅ No memory leaks

**Acceptance Criteria:**
- [ ] 10 concurrent sessions supported
- [ ] Response time < 5s
- [ ] No errors in logs

---

## Test Suite 8: Cross-Platform

### TC-701: macOS

**Steps:**
1. Run all test suites on macOS
2. Verify all features work

**Expected Results:**
- ✅ All tests pass

---

### TC-702: Windows

**Steps:**
1. Run all test suites on Windows
2. Verify all features work

**Expected Results:**
- ✅ All tests pass

---

### TC-703: Linux

**Steps:**
1. Run all test suites on Linux
2. Verify all features work

**Expected Results:**
- ✅ All tests pass

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Backend server running
- [ ] MongoDB running
- [ ] Frontend built
- [ ] Test accounts created
- [ ] Test room created
- [ ] Sample resources uploaded

### Test Execution
- [ ] Test Suite 1: Teacher Creation (3 tests)
- [ ] Test Suite 2: Student Gameplay (3 tests)
- [ ] Test Suite 3: Analytics (1 test)
- [ ] Test Suite 4: Security (4 tests)
- [ ] Test Suite 5: Multiplayer (1 test)
- [ ] Test Suite 6: Edge Cases (3 tests)
- [ ] Test Suite 7: Performance (1 test)
- [ ] Test Suite 8: Cross-Platform (3 tests)

### Post-Test
- [ ] All tests documented
- [ ] Bugs filed for failures
- [ ] Screenshots captured
- [ ] Test report generated

---

## Bug Reporting Template

```markdown
**Test Case:** TC-XXX
**Severity:** Critical / High / Medium / Low
**Environment:** macOS / Windows / Linux
**Steps to Reproduce:**
1. ...
2. ...

**Expected Result:**
...

**Actual Result:**
...

**Screenshots:**
[Attach screenshots]

**Console Errors:**
```
[Paste errors]
```

**Additional Notes:**
...
```

---

## Test Coverage Goals

- **Backend:** >70% line coverage
- **Frontend:** >60% line coverage
- **E2E:** All critical paths tested
- **Security:** All attack vectors tested

---

## Automated Test Commands

```bash
# Backend unit tests
cd server && go test -v -race -coverprofile=coverage.out ./...

# Frontend unit tests
cd desktop/frontend && npm test -- --coverage

# Integration tests
cd server && go test -v -tags=integration ./...

# Run all tests
./scripts/run-all-tests.sh
```

---

## Test Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Build Version:** _______________  
**Test Result:** ✅ PASS / ❌ FAIL  

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
