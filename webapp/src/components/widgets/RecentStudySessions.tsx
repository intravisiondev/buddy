import { useEffect, useMemo, useState } from 'react';
import { Clock, BookOpen, Award } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { activityService, userService } from '../../services';

type ActivityLog = {
  id?: string;
  activity_type: string;
  description?: string;
  subject?: string;
  duration_minutes?: number;
  xp_earned?: number;
  created_at?: string;
};

type EarnedBadge = {
  earned_at?: string;
  badge?: {
    id?: string;
    name?: string;
    description?: string;
    icon_url?: string;
    category?: string;
    xp_reward?: number;
  };
};

function fmtTime(ts?: string) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function RecentStudySessions({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [data, badges] = await Promise.all([
        activityService.getMyActivity(),
        userService.getMyBadges().catch(() => []),
      ]);
      // Filter study activities and limit
      const studyActivities = (Array.isArray(data) ? data : [])
        .filter((a: any) => a.activity_type === 'study')
        .slice(0, Math.max(50, limit * 10));
      setItems(studyActivities as ActivityLog[]);
      setEarnedBadges(Array.isArray(badges) ? (badges as EarnedBadge[]) : []);
    } catch {
      setItems([]);
      setEarnedBadges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Periodically refresh data
    const interval = setInterval(load, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [limit]);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const last7 = useMemo(() => {
    return items.filter(a => {
      const t = a.created_at ? new Date(a.created_at).getTime() : 0;
      return t >= sevenDaysAgo;
    });
  }, [items, sevenDaysAgo]);

  const totalMinutes7d = useMemo(() => last7.reduce((s, a) => s + (a.duration_minutes || 0), 0), [last7]);

  const feed = useMemo(() => {
    const studyFeed = items.slice(0, limit).map(a => ({
      type: 'study' as const,
      ts: a.created_at ? new Date(a.created_at).getTime() : 0,
      data: a,
      key: a.id || `study-${a.created_at}`,
    }));
    const badgeFeed = earnedBadges.slice(0, limit).map(b => ({
      type: 'badge' as const,
      ts: b.earned_at ? new Date(b.earned_at).getTime() : 0,
      data: b,
      key: b.badge?.id || `badge-${b.earned_at}`,
    }));
    return [...studyFeed, ...badgeFeed].sort((a, b) => b.ts - a.ts).slice(0, limit);
  }, [items, earnedBadges, limit]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-light-primary/10 dark:bg-dark-primary/10 rounded-lg">
            <Clock className="w-5 h-5 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Recent Study Sessions
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Last 7 days: <b>{last7.length}</b> sessions • <b>{Math.round(totalMinutes7d)}</b> min
            </p>
          </div>
        </div>
        <Badge variant="neutral" size="sm">Activity</Badge>
      </div>

      {loading ? (
        <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading...</div>
      ) : items.length === 0 && earnedBadges.length === 0 ? (
        <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          No study sessions yet. Use <b>Today → Log</b> to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((f) => {
            if (f.type === 'study') {
              const a = f.data as ActivityLog;
              return (
                <div key={f.key} className="p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                      <div className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                        {a.subject || 'General study'}
                      </div>
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {a.duration_minutes || 0} min
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {fmtTime(a.created_at)}
                  </div>
                </div>
              );
            }

            const b = f.data as EarnedBadge;
            return (
              <div key={f.key} className="p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Award className="w-4 h-4 text-warning" />
                    <div className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                      Badge: {b.badge?.name || 'Achievement'}
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">Badge</Badge>
                </div>
                <div className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {(b.badge?.description || '').trim()} {b.earned_at ? `• ${fmtTime(b.earned_at)}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

