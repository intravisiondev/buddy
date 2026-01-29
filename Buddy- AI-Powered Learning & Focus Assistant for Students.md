# Buddy: AI-Powered Learning & Focus Assistant for Students

### TL;DR

Buddy is an AI-driven cross-platform assistant designed to empower students, parents, and teachers through focused learning, efficient tools, and a connected educational ecosystem. Teachers can publish lessons, create and host games, schedule live streamed classes, and manage student registrations. Students engage in teacher-led courses, participate in games, attend live lessons, and benefit from deeply personalized AI assistance constrained to their class’s own resources. Parents support and monitor learning via direct student account creation and oversight. Buddy features robust user role management, granular content gating by age and role, and powerful AI support for curriculum and resource curation. Offered in English and Turkish, Buddy helps turn learning into a productive, safe, and enjoyable journey for every participant.

---

## Goals

### Business Goals

* Acquire 10,000 active student users within the first 6 months.

* Achieve a 30% month-over-month retention rate for new users.

* Establish partnerships with at least 3 educational institutions/tutoring services within one year.

* Maintain a net promoter score (NPS) of 60+ from students and parents.

* Secure minimum viable revenue via premium subscriptions or institutional licensing.

### User Goals

* Help students focus, collaborate in real time, and improve learning outcomes within guided classroom structures.

* Provide teachers with tools for lesson publishing, live class hosting, game creation, and full administrative control over their courses.

* Empower parents to create and manage student profiles, monitor engagement, and maintain age-appropriate content access.

* Foster safe, gamified, and motivating environments for all ages—with easy enrollment and parental oversight for minors.

* Deliver multi-language, accessible experiences to support learners in English and Turkish.

### Non-Goals

* Buddy does not provide complete curriculum content or act as a direct tutoring service.

* Initial release excludes mobile support—desktop only (Windows/Mac/Linux).

* No behavioral analytics or surveillance; privacy protections are fundamental.

---

## User Stories

### Student Persona

* As a student, I want to independently register my own account, providing my age to ensure only age-appropriate content is shown.

* As a student, I want to browse available courses and games, enroll in teacher-led classes, and join interactive rooms.

* As a student, I want access to chat, games, live streamed lessons, and resource walls—administered and moderated by my teacher.

* As a student, I want to receive and complete assignments or challenges, and participate in class leaderboards.

* As a student, I want to join games, upload and access resources relevant to my courses, and interact with AI that references only the resources my class or teacher provides.

### Parent Persona

* As a parent, I want to create accounts/profiles for my child, specifying their age so content restrictions are applied automatically.

* As a parent, I want weekly summaries of my child’s course activity, including games played, lessons attended, assignments submitted, leaderboard standing, and resources used.

* As a parent, I want to oversee and approve my children's registrations, monitor their engagement and safety, and ensure they access content appropriate for their age group.

* As a parent, I want the ability to set or restrict which courses, games, or resources my child can access.

### Teacher Persona

* As a teacher, I want to create, publish, and update courses/lessons and specify age ranges for enrollment.

* As a teacher, I want to create and customize games for my classes, using AI for inspiration or content—restricted to my chosen resources.

* As a teacher, I want to enable student registration for my classes, view participant lists, and manage enrollments and permissions.

* As a teacher, I want to schedule and host live (streamed) lessons, manage in-class activities (chat, games, resources), and archive recordings/resources for later reference.

* As a teacher, I want administrative rights to moderate chat, control access to activities and resources, and ensure a safe, productive environment.

* As a teacher, I want AI assistance for lesson planning, curriculum structure, game creation, and resource curation—always with the option to restrict AI use to my uploaded materials.

---

## Functional Requirements

### User Types & Registration

* **User Roles**: Three roles—Parent, Student, Teacher—each with tailored dashboards and permissions.

* **Student Registration**: Students may register independently or via parental creation. During signup, age must be provided and verified.

* **Parental Account Creation**: Parents can create/manage student profiles directly, providing birth year for automated content gating.

* **Age-Based Content Gating**: All courses, games, and resources can specify recommended age ranges. Students see and enroll only in materials appropriate for their profile.

* **Parental Oversight**: Parents can see their child’s activity, approve/restrict enrollments, and receive regular summary reports.

### Teacher-Driven Classrooms

* **Course & Lesson Publishing**: Teachers can author and publish courses and lessons, making them discoverable by students and parents.

* **Game Creation & Hosting**: Teachers create and manage educational games for their courses. AI tools are available for idea generation or auto-building games based on provided resources.

* **Live Lesson Scheduling & Streaming**: Teachers can schedule, host, and stream live lessons. Attendance, participation, and recordings are managed within each room.

* **Enrollment Management**: Teachers open registrations for their classes, control admission, and manage student lists and permissions.

* **Admin Rights in Rooms**: Teachers act as moderators—controlling chat, managing participants, approving uploaded resources, and toggling game/resource access.

* **Resource Uploads & Sharing**: Teachers (and optionally students) can upload and share documents, videos, or additional materials, all tagged and indexed per course.

### Classrooms & Activities

* **Student Navigation**: Students browse and search for available courses and rooms, filtered by subject and age suitability.

* **Enrollment & Participation**: Students can request/enroll in classes, join teacher-led rooms, and participate in course activities (chat, games, live lessons).

* **Activity Management**: All interactive activities (games, chat, resource sharing, live lessons) are administered by the assigned teacher.

* **AI-Powered Support**: Teachers can opt to use AI tools strictly with their supplied materials for specific classes—ensuring relevance and safe content boundaries.

### Safety, Permissions, and Content Controls

* **Role-Based Permissions**: Strict role-based permissions govern access to courses, games, resources, and administrative actions.

* **Age & Role Content Gating**: Upon registration and at any access point, age and role restrictions filter available content and features.

* **Live Lesson Controls**: Teachers manage entry to live lessons, can mute/remove participants, and control APIs for streaming/archiving.

* **Parental Administration**: Parents retain final approval over join requests, especially for younger students. They can view, limit, or unlock classes and activities as needed.

---

## User Experience

### Entry Point & Onboarding

* Upon installation (Windows/Mac/Linux), users select their role: Parent, Student, or Teacher.

* **Students:** Enter name, age, and choose registration flow (independent or via parental linking). See only age-appropriate content upon access.

* **Parents:** Guided to create/manage child profiles, verify ages, and set permissions. Dashboard offers a clear view for oversight and class approvals.

* **Teachers:** Profile setup enables course/lesson publishing, game creation, and dashboard for managing classes, live sessions, and students.

### Everyday Flows

For Students

1. **Course Discovery & Enrollment**

  * Browse/search teacher-published courses and join by age/subject.

  * Request to enroll; receive confirmation if under age supervision.

2. **Course Participation**

  * Enter class rooms for scheduled activities.

  * Join moderated chat, play educational games, attend live streamed lessons.

  * Access resource wall and AI help, constrained to class-chosen or teacher-supplied material.

3. **Progress Tracking**

  * See assignments, completed tasks, game/game performance, and leaderboard status–all administered by the teacher.

For Parents

1. **Profile & Permission Management**

  * Create and maintain one or multiple student profiles, setting age and approval settings for actions and enrollments.

  * Receive weekly activity digests summarizing class activity, achievements, and resource use.

  * Set content restrictions and review course/enrollment data.

2. **Secure Oversight**

  * Review all courses joined by child, including class schedules, game/activity participation, and resources accessed.

  * Adjust permissions and receive notifications for new enrollments or resource uploads.

For Teachers

1. **Course Creation & Publishing**

  * Create, configure, and publish courses/lessons with age constraints and enrollment rules.

2. **Game Creation & Scheduling**

  * Use AI tools to build custom games; restrict AI to classes’ own materials for maximum relevance and safety.

  * Schedule and host games for enrolled students.

3. **Live Lesson Management**

  * Schedule, stream, and moderate live lessons within classroom rooms.

  * Grant/revoke access, control chat, manage participant lists, and archive sessions.

  * Resource wall enables upload and sharing of class materials; AI always operates within teacher-supplied context.

4. **Oversight and Moderation**

  * Monitor chat, participant engagement, and enforce classroom boundaries.

  * Approve student uploads and monitor AI utilization logs for safety.

### Accessibility & Inclusivity

* Full English/Turkish support, dyslexia-friendly fonts, high-contrast mode, and comprehensive screen reader compatibility.

* Safe, moderated communication with parental/admin controls and robust privacy guardrails in all public and private spaces.

---

## Success Metrics

---

## Technical Considerations

### Platform Architecture

* Modular cross-platform desktop app with real-time communication, scalable course/game management, and secure user/role management.

* Gemini 3 AI integration, with per-class/course resource scoping and teacher opt-ins for AI material use.

* Role-based access control (RBAC) at every data and interface layer, supporting fine-grained user and permission management.

* Scalable streaming architecture for live lessons, with recording/archiving and attendance analytics.

* Content gating and safety checks at user, enrollment, and activity layers—ensuring compliance and secure engagement.

### Security & Compliance

* Robust authentication/authorization with role and age gating at all entry and action points.

* GDPR-compliance, transparent consent/approval flows for parent and teacher oversight.

* End-to-end encryption for resource uploads and sensitive communications.

* Moderation tools for proactive and reactive content monitoring.

### Scalability & Reliability

* Engineered for multi-thousand concurrent rooms/lessons and live activities.

* Efficient sync and moderation during high-volume game/live session periods.

* Resilient failover and monitoring for uninterrupted live lesson experiences.

---

## Milestones & Sequencing

---

Buddy delivers a safe, collaborative, and empowering environment where teachers instruct, parents oversee, and students thrive—all backed by world-class AI tailored to the needs and safety of every learner.