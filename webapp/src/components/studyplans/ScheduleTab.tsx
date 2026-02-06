import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List as ListIcon, Clock, Plus, Download } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import CreateScheduleBlockModal from '../modals/CreateScheduleBlockModal';
import { studyPlanService } from '../../services';
import { buildScheduleICS } from '../../utils/ics';

interface ScheduleBlock {
  id: string;
  study_plan_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  subject: string;
  topic: string;
  block_type: string; // "study", "break", "review"
}

interface StudyPlan {
  id: string;
  name: string;
}

type ViewMode = 'calendar' | 'list';
type CalendarView = 'week' | 'month';

export default function ScheduleTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [filterPlanID, setFilterPlanID] = useState<string | null>(null); // null = All
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const [scheduleData, plansData] = await Promise.all([
        studyPlanService.getUserSchedule(),
        studyPlanService.getMyStudyPlans(),
      ]);
      const planList = Array.isArray(plansData) ? plansData : [];
      setPlans(planList.map((p: any) => ({ id: p.id || p._id, name: p.name })));
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedSchedule = filterPlanID
    ? schedule.filter((b) => String(b.study_plan_id) === String(filterPlanID))
    : schedule;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getBlocksByDay = (dayIndex: number) => {
    return displayedSchedule.filter(b => b.day_of_week === dayIndex).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const onDragStartBlock = (block: ScheduleBlock) => (e: React.DragEvent) => {
    setDraggingId(block.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: block.id,
      study_plan_id: block.study_plan_id,
      day_of_week: block.day_of_week,
    }));
  };

  const onDragEndBlock = () => {
    setDraggingId(null);
  };

  const onDragOverDay = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropOnDay = (newDay: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const payload = JSON.parse(raw) as { id: string; study_plan_id: string; day_of_week: number };
      if (!payload?.id || !payload?.study_plan_id) return;
      if (payload.day_of_week === newDay) return;

      // optimistic UI update
      setSchedule(prev => prev.map(b => b.id === payload.id ? { ...b, day_of_week: newDay } : b));

      await studyPlanService.updateScheduleBlock(payload.study_plan_id, payload.id, { day_of_week: newDay });

      // refresh from server (source of truth)
      await loadSchedule();
    } catch (error) {
      console.error('Failed to move schedule block:', error);
      // rollback by reloading
      await loadSchedule();
    } finally {
      setDraggingId(null);
    }
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-light-primary/20 dark:bg-dark-primary/20 border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary';
      case 'break': return 'bg-light-success/20 dark:bg-dark-success/20 border-light-success dark:border-dark-success text-light-success dark:text-dark-success';
      case 'review': return 'bg-light-accent/20 dark:bg-dark-accent/20 border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent';
      default: return 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary border-light-border dark:border-dark-border';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading schedule...</div>;
  }

  const handleExportICS = async () => {
    try {
      setExporting(true);
      const ics = buildScheduleICS(displayedSchedule, 'Buddy Study Schedule');
      // Download as file in browser
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'buddy-schedule.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export .ics:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            Study Schedule
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Your weekly study timetable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportICS} disabled={exporting || displayedSchedule.length === 0}>
            <Download className="w-5 h-5 mr-2" />
            {exporting ? 'Exporting...' : 'Export .ics'}
          </Button>
          {viewMode === 'calendar' && (
            <div className="flex bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-1 mr-2">
              <Button
                variant={calendarView === 'week' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('week')}
              >
                Week
              </Button>
              <Button
                variant={calendarView === 'month' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('month')}
              >
                Month
              </Button>
            </div>
          )}
          <div className="flex bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} disabled={!filterPlanID}>
            <Plus className="w-5 h-5 mr-2" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Study Plan filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
          Study Plan
        </label>
        <select
          value={filterPlanID ?? ''}
          onChange={(e) => setFilterPlanID(e.target.value || null)}
          className="p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary min-w-[200px]"
        >
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {displayedSchedule.length} block{displayedSchedule.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filterPlanID && (
        <CreateScheduleBlockModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadSchedule}
          studyPlanID={filterPlanID}
        />
      )}

      {/* Schedule Display */}
      {displayedSchedule.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-light-primary/10 dark:bg-dark-primary/10 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-light-primary dark:text-dark-primary" />
            </div>
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              No Schedule Blocks
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
              Add study blocks to your schedule to organize your time
            </p>
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Block
            </Button>
          </div>
        </Card>
      ) : viewMode === 'calendar' ? (
        <Card className="p-6">
          {/* Calendar View */}
          <div className="grid grid-cols-7 gap-4">
            {/* Headers */}
            {daysShort.map((day, idx) => (
              <div key={idx} className="text-center font-semibold text-light-text-primary dark:text-dark-text-primary pb-3 border-b border-light-border dark:border-dark-border">
                {day}
              </div>
            ))}

            {/* Day Columns */}
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
              const blocks = getBlocksByDay(dayIndex);
              return (
                <div
                  key={dayIndex}
                  className={`space-y-2 min-h-[400px] rounded-lg p-2 ${draggingId ? 'bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/50' : ''}`}
                  onDragOver={onDragOverDay}
                  onDrop={onDropOnDay(dayIndex)}
                >
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={onDragStartBlock(block)}
                      onDragEnd={onDragEndBlock}
                      className={`p-3 rounded-lg border-l-4 cursor-move hover:shadow-md transition-shadow ${getBlockColor(block.block_type)} ${draggingId === block.id ? 'opacity-60' : ''}`}
                    >
                      <div className="text-xs font-semibold mb-1">
                        {block.start_time} - {block.end_time}
                      </div>
                      <div className="text-sm font-medium mb-1">
                        {block.subject}
                      </div>
                      {block.topic && (
                        <div className="text-xs opacity-80">
                          {block.topic}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* List View */}
          {daysOfWeek.map((day, dayIndex) => {
            const blocks = getBlocksByDay(dayIndex);
            if (blocks.length === 0) return null;

            return (
              <Card
                key={dayIndex}
                onDragOver={onDragOverDay}
                onDrop={onDropOnDay(dayIndex)}
              >
                <div className="p-4 border-b border-light-border dark:border-dark-border">
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {day}
                  </h3>
                </div>
                <div className="divide-y divide-light-border dark:divide-dark-border">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={onDragStartBlock(block)}
                      onDragEnd={onDragEndBlock}
                      className={`p-4 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors cursor-move ${draggingId === block.id ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary w-24">
                            {block.start_time} - {block.end_time}
                          </div>
                          <div>
                            <div className="font-medium text-light-text-primary dark:text-dark-text-primary">
                              {block.subject}
                            </div>
                            {block.topic && (
                              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                {block.topic}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant={block.block_type === 'study' ? 'primary' : block.block_type === 'break' ? 'success' : 'accent'}>
                          {block.block_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
