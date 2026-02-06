import { useState, useEffect } from 'react';
import { TrendingUp, Users, Trophy, Clock, Download, Gamepad2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { gameService } from '../../services';

type GameAnalyticsDashboardProps = {
  roomID: string;
};

type RoomAnalytics = {
  room_id: string;
  total_games: number;
  total_plays: number;
  active_students: number;
  avg_engagement: number;
  top_games: GamePerformance[];
};

type GamePerformance = {
  game_id: string;
  title: string;
  plays: number;
  avg_score: number;
  pass_rate: number;
};

export default function GameAnalyticsDashboard({ roomID }: GameAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<RoomAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (roomID) {
      loadAnalytics();
    }
  }, [roomID]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data: any = await gameService.getRoomAnalytics(roomID);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await gameService.exportAnalyticsCSV(roomID);
      alert('Analytics exported successfully!');
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Failed to export: ' + (err?.message || err));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-12 text-center">
        <Gamepad2 className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
          No Analytics Available
        </h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Create games and have students play to see analytics
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Game Analytics
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Track student engagement and performance
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExportCSV}
          disabled={exporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 text-warning" />
            <Badge variant="neutral" size="sm">Total</Badge>
          </div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            {analytics.total_games}
          </div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Games Created
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <Badge variant="primary" size="sm">Activity</Badge>
          </div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            {analytics.total_plays}
          </div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Total Plays
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-success" />
            <Badge variant="success" size="sm">Active</Badge>
          </div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            {analytics.active_students}
          </div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Active Students
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-secondary" />
            <Badge variant="neutral" size="sm">Avg</Badge>
          </div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            {analytics.avg_engagement?.toFixed(1) || '0.0'}
          </div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Plays per Student
          </div>
        </Card>
      </div>

      {/* Top Games Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Top Performing Games
        </h3>
        
        {analytics.top_games && analytics.top_games.length > 0 ? (
          <div className="space-y-3">
            {analytics.top_games.map((game: GamePerformance, index: number) => (
              <div
                key={game.game_id}
                className="flex items-center justify-between p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      {game.title}
                    </p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {game.plays} plays
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {game.avg_score?.toFixed(1)}%
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Avg Score
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={game.pass_rate >= 70 ? 'success' : game.pass_rate >= 50 ? 'warning' : 'error'}
                    >
                      {game.pass_rate?.toFixed(0)}% pass
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
            No game performance data yet
          </div>
        )}
      </Card>

      {/* Engagement Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Student Engagement
        </h3>
        <div className="h-64 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Time series chart coming soon</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
