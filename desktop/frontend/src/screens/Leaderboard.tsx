import { useEffect, useMemo, useState, useCallback } from 'react';
import { Trophy, Medal, Award, Flame, Gem, Ticket, RefreshCw, Users, UserPlus, Check, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import ProfileModal from '../components/modals/ProfileModal';
import {
  GetLeaderboard,
  GetMyBadges,
  GetDashboardStats,
  GetFriends,
  GetIncomingFriendRequests,
  AcceptFriendRequest,
  RejectFriendRequest,
  GetUserProfile,
} from '../../wailsjs/go/main/App';

type LeaderboardEntry = {
  user_id: string;
  name: string;
  avatar_url?: string;
  total_xp: number;
  weekly_xp?: number;
  level: number;
  rank: number;
};

type FriendRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  from_name?: string;
};

function normalizeId(v: any): string {
  if (typeof v === 'string') return v;
  if (v && typeof (v as any).$oid === 'string') return (v as any).$oid;
  return String(v ?? '');
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<'all' | 'weekly'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [myBadgesRaw, setMyBadgesRaw] = useState<any[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | undefined>(undefined);
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, stats, myBadges, friendsRes, incomingRes] = await Promise.all([
        GetLeaderboard(period, 10).catch(() => []),
        GetDashboardStats().catch(() => null),
        GetMyBadges().catch(() => []),
        GetFriends().catch(() => ({ friends: [] })),
        GetIncomingFriendRequests().catch(() => []),
      ]);
      setEntries(Array.isArray(lb) ? (lb as LeaderboardEntry[]) : []);
      setMyStats(stats);
      setMyBadgesRaw(Array.isArray(myBadges) ? myBadges : []);
      const flist = (friendsRes as any)?.friends;
      setFriends(Array.isArray(flist) ? flist : []);
      const inc = Array.isArray(incomingRes) ? (incomingRes as FriendRequest[]) : [];
      setIncomingRequests(inc);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve names for incoming requests: prefer leaderboard, else fetch profile
  const [incomingNames, setIncomingNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const resolve = async () => {
      const map: Record<string, string> = {};
      const entryMap: Record<string, string> = {};
      for (const e of entries) {
        const id = normalizeId(e.user_id);
        if (e.name) entryMap[id] = e.name;
      }
      for (const r of incomingRequests) {
        const id = normalizeId(r.from_user_id);
        if (entryMap[id]) {
          map[id] = entryMap[id];
        } else {
          try {
            const p: any = await GetUserProfile(id);
            map[id] = p?.name || p?.full_name || `User ${id.slice(-6)}`;
          } catch {
            map[id] = `User ${id.slice(-6)}`;
          }
        }
      }
      setIncomingNames(map);
    };
    if (incomingRequests.length) resolve();
    else setIncomingNames({});
  }, [incomingRequests, entries]);

  const displayXp = useCallback((e: LeaderboardEntry) => {
    const v = period === 'weekly' ? (e.weekly_xp ?? e.total_xp) : e.total_xp;
    const n = typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0;
    return n;
  }, [period]);

  const handleAccept = async (requestId: string) => {
    try {
      await AcceptFriendRequest(requestId);
      await load();
    } catch (err) {
      console.error('Accept friend request failed:', err);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await RejectFriendRequest(requestId);
      await load();
    } catch (err) {
      console.error('Reject friend request failed:', err);
    }
  };

  const safeEntries = useMemo(() => (Array.isArray(entries) ? entries : []), [entries]);
  const safeBadgesRaw = useMemo(() => (Array.isArray(myBadgesRaw) ? myBadgesRaw : []), [myBadgesRaw]);

  const topRankers = useMemo(() => safeEntries.slice(0, 3), [safeEntries]);
  const earnedBadges = useMemo(() => safeBadgesRaw.map(b => b?.badge).filter(Boolean), [safeBadgesRaw]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-10 h-10 text-warning" />;
    if (rank === 2) return <Medal className="w-10 h-10 text-light-text-secondary dark:text-dark-text-secondary" />;
    if (rank === 3) return <Award className="w-10 h-10 text-accent" />;
    return null;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Leaderboard
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            XP, gems, tokens and badges earned via the reward engine
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={period === 'all' ? 'primary' : 'secondary'} onClick={() => setPeriod('all')}>
            All-time
          </Button>
          <Button variant={period === 'weekly' ? 'primary' : 'secondary'} onClick={() => setPeriod('weekly')}>
            Weekly
          </Button>
          <Button variant="ghost" onClick={load}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* My quick stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Weekly rank</div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {myStats?.weekly_rank ?? '-'}
              </div>
            </div>
            <Flame className="w-6 h-6 text-warning" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total XP</div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {myStats?.total_xp?.toLocaleString?.() ?? myStats?.total_xp ?? 0}
              </div>
            </div>
            <Trophy className="w-6 h-6 text-primary" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Gems</div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {myStats?.gems ?? 0}
              </div>
            </div>
            <Gem className="w-6 h-6 text-accent" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Tokens</div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {myStats?.tokens ?? 0}
              </div>
            </div>
            <Ticket className="w-6 h-6 text-success" />
          </div>
        </Card>
      </div>

      {/* Top 3 */}
      {loading ? (
        <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading leaderboard...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {topRankers.map((u) => (
            <Card 
              key={normalizeId(u.user_id)} 
              className="p-6 bg-gradient-to-br from-light-bg-secondary to-light-bg dark:from-dark-bg-secondary dark:to-dark-bg cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => {
                setSelectedUserId(normalizeId(u.user_id));
                setSelectedUserName(u.name);
                setSelectedUserAvatar(u.avatar_url);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                {rankIcon(u.rank)}
                <Badge variant="neutral" size="sm">Level {u.level}</Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={u.name || 'User'} size="lg" src={u.avatar_url} />
                <div className="min-w-0">
                  <div className="font-bold text-light-text-primary dark:text-dark-text-primary truncate">{u.name}</div>
                  <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Rank #{u.rank}</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {displayXp(u).toLocaleString()} XP
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full list + My badges */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <Card className="p-0">
            <div className="p-6 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Rankings
              </h3>
              <Badge variant="neutral" size="sm">{period === 'weekly' ? 'Weekly' : 'All-time'}</Badge>
            </div>
            <div className="divide-y divide-light-border dark:divide-dark-border">
              {safeEntries.map((u) => (
                <div 
                  key={normalizeId(u.user_id)} 
                  className="p-4 flex items-center justify-between hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedUserId(normalizeId(u.user_id));
                    setSelectedUserName(u.name);
                    setSelectedUserAvatar(u.avatar_url);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="neutral" size="sm">#{u.rank}</Badge>
                    <Avatar name={u.name || 'User'} src={u.avatar_url} />
                    <div>
                      <div className="font-medium text-light-text-primary dark:text-dark-text-primary">{u.name}</div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Level {u.level}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {displayXp(u).toLocaleString()} XP
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(normalizeId(u.user_id));
                        setSelectedUserName(u.name);
                        setSelectedUserAvatar(u.avatar_url);
                      }}
                    >
                      Profil
                    </Button>
                  </div>
                </div>
              ))}
              {safeEntries.length === 0 && !loading && (
                <div className="p-6 text-center text-light-text-secondary dark:text-dark-text-secondary">
                  No leaderboard data yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              Reward Rules (current)
            </h3>
            <ul className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-2">
              <li><b>Goal completed</b>: +5/10/20 XP (low/med/high) +1 gem</li>
              <li><b>Badges</b>: “First Goal” (1st), “Goal Machine” (10th)</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              My Badges
            </h3>
            {earnedBadges.length === 0 ? (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                No badges earned yet. Complete goals to earn your first badge!
              </div>
            ) : (
              <div className="space-y-3">
                {earnedBadges.slice(0, 6).map((b: any) => (
                  <div key={b.id} className="p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                    <div className="font-medium text-light-text-primary dark:text-dark-text-primary">{b.name}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{b.description}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Friends
            </h3>
            {friends.length === 0 ? (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                No friends yet. View profiles on the leaderboard and send friend requests!
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((fid) => {
                  const entry = safeEntries.find((e) => normalizeId(e.user_id) === fid);
                  const name = entry?.name || `User ${fid.slice(-6)}`;
                  const avatar = entry?.avatar_url;
                  return (
                    <div
                      key={fid}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary cursor-pointer"
                      onClick={() => {
                        setSelectedUserId(fid);
                        setSelectedUserName(name);
                        setSelectedUserAvatar(avatar);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={name} size="sm" src={avatar} />
                        <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">{name}</span>
                      </div>
                      {entry && (
                        <Badge variant="neutral" size="sm">
                          {displayXp(entry).toLocaleString()} XP
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Friend requests
            </h3>
            {incomingRequests.length === 0 ? (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                No pending friend requests.
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((r) => {
                  const fid = normalizeId(r.from_user_id);
                  const rid = normalizeId(r.id);
                  const name = incomingNames[fid] || `User ${fid.slice(-6)}`;
                  return (
                    <div
                      key={rid}
                      className="flex items-center justify-between p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary"
                    >
                      <div
                        className="flex items-center gap-2 min-w-0 cursor-pointer"
                        onClick={() => {
                          setSelectedUserId(fid);
                          setSelectedUserName(name);
                          setSelectedUserAvatar(undefined);
                        }}
                      >
                        <Avatar name={name} size="sm" />
                        <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleAccept(rid)} title="Accept">
                          <Check className="w-4 h-4 text-success" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleReject(rid)} title="Reject">
                          <X className="w-4 h-4 text-danger" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUserId}
          userName={selectedUserName}
          userAvatar={selectedUserAvatar}
        />
      )}
    </div>
  );
}

