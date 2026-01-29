import { useState } from 'react';
import { Plus, Calendar, Clock, Target, Users, BookOpen, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';

export default function StudyPlanBuilder() {
  const [shareAsChallenge, setShareAsChallenge] = useState(false);

  const courses = [
    { id: 1, name: 'Mathematics', color: 'primary', hours: 12, totalHours: 20 },
    { id: 2, name: 'Physics', color: 'accent', hours: 8, totalHours: 15 },
    { id: 3, name: 'Chemistry', color: 'success', hours: 6, totalHours: 10 },
  ];

  const scheduleBlocks = [
    { id: 1, day: 'Monday', time: '09:00 - 11:00', subject: 'Mathematics', topic: 'Algebra Review', type: 'Study' },
    { id: 2, day: 'Monday', time: '14:00 - 16:00', subject: 'Physics', topic: 'Mechanics Problems', type: 'Practice' },
    { id: 3, day: 'Tuesday', time: '10:00 - 12:00', subject: 'Chemistry', topic: 'Organic Chemistry', type: 'Study' },
    { id: 4, day: 'Wednesday', time: '09:00 - 11:00', subject: 'Mathematics', topic: 'Calculus', type: 'Study' },
    { id: 5, day: 'Thursday', time: '14:00 - 16:00', subject: 'Physics', topic: 'Lab Prep', type: 'Practice' },
  ];

  const studyPlans = [
    { id: 1, name: 'Final Exam Prep', courses: 3, duration: '4 weeks', progress: 68, isChallenge: true, participants: 12 },
    { id: 2, name: 'Math Competition', courses: 1, duration: '6 weeks', progress: 45, isChallenge: false, participants: 0 },
    { id: 3, name: 'Science Deep Dive', courses: 2, duration: '3 weeks', progress: 82, isChallenge: true, participants: 8 },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Study Plans
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Create structured learning plans and share them as challenges
          </p>
        </div>
        <Button>
          <Plus className="w-5 h-5" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {studyPlans.map((plan) => (
          <Card key={plan.id} hover className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">{plan.courses} courses</Badge>
                  <Badge variant="neutral" size="sm">{plan.duration}</Badge>
                </div>
              </div>
              {plan.isChallenge && (
                <Badge variant="warning" size="sm">
                  <Users className="w-3 h-3 mr-1" />
                  Challenge
                </Badge>
              )}
            </div>
            <ProgressBar progress={plan.progress} showLabel className="mb-4" />
            {plan.isChallenge && (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                {plan.participants} participants
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Create Study Plan
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <Input label="Plan Name" placeholder="e.g., Final Exam Preparation" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date" type="date" />
                <Input label="End Date" type="date" />
              </div>
              <Input label="Daily Study Goal (hours)" type="number" placeholder="2" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-button bg-light-bg dark:bg-dark-bg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-button">
                  <Users className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                    Share as Challenge
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Allow others to join and compete
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareAsChallenge(!shareAsChallenge)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  shareAsChallenge ? 'bg-primary' : 'bg-light-text-secondary/20 dark:bg-dark-text-secondary/20'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    shareAsChallenge ? 'transform translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Weekly Schedule
              </h3>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Add Block
              </Button>
            </div>

            <div className="space-y-3">
              {scheduleBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-4 p-4 rounded-button bg-light-bg dark:bg-dark-bg"
                >
                  <div className="flex-shrink-0 w-24">
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      {block.day}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      <Clock className="w-3 h-3" />
                      {block.time}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">{block.subject}</Badge>
                      <Badge variant="neutral" size="sm">{block.type}</Badge>
                    </div>
                    <p className="text-sm text-light-text-primary dark:text-dark-text-primary">
                      {block.topic}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-light-card dark:hover:bg-dark-card rounded-button transition-colors">
                      <Edit2 className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    </button>
                    <button className="p-2 hover:bg-light-card dark:hover:bg-dark-card rounded-button transition-colors">
                      <Trash2 className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-button">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Selected Courses
              </h3>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="p-4 rounded-button bg-light-bg dark:bg-dark-bg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      {course.name}
                    </p>
                    <Badge variant={course.color as any} size="sm">
                      {course.hours}/{course.totalHours}h
                    </Badge>
                  </div>
                  <ProgressBar
                    progress={(course.hours / course.totalHours) * 100}
                    variant={course.color as any}
                    size="sm"
                  />
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" fullWidth className="mt-4">
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success/10 rounded-button">
                <Target className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Milestones
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { id: 1, title: 'Complete Unit 1', date: 'Jan 15', completed: true },
                { id: 2, title: 'Midterm Review', date: 'Jan 22', completed: false },
                { id: 3, title: 'Practice Tests', date: 'Jan 29', completed: false },
              ].map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 p-3 rounded-button ${
                    milestone.completed
                      ? 'bg-success/5 border border-success/20'
                      : 'bg-light-bg dark:bg-dark-bg'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      milestone.completed
                        ? 'bg-success border-success'
                        : 'border-light-text-secondary dark:border-dark-text-secondary'
                    }`}
                  >
                    {milestone.completed && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${milestone.completed ? 'text-light-text-secondary dark:text-dark-text-secondary line-through' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                      {milestone.title}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {milestone.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" fullWidth className="mt-4">
              <Plus className="w-4 h-4" />
              Add Milestone
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
