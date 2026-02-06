type Course = {
  id: string;
  subject: string;
  hours_allocated: number;
  hours_completed: number;
};

interface CourseProgressBarsProps {
  courses: Course[];
}

export default function CourseProgressBars({ courses }: CourseProgressBarsProps) {
  const safeCourses = Array.isArray(courses) ? courses : [];

  return (
    <div className="space-y-4">
      {safeCourses.map((c) => {
        const total = c.hours_allocated || 0;
        const done = c.hours_completed || 0;
        const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;

        return (
          <div key={c.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-light-text-primary dark:text-dark-text-primary">
                {c.subject}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {done}h / {total}h
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-light-border/60 dark:bg-dark-border/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-light-primary dark:bg-dark-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

