import { useState, useEffect } from 'react';
import { Users, Play } from 'lucide-react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

type MatchLobbyProps = {
  isOpen: boolean;
  onClose: () => void;
  matchID: string;
  onMatchStart?: () => void;
};

type Player = {
  user_id: string;
  name: string;
  avatar?: string;
  joined_at: string;
};

export default function MatchLobby({ isOpen, onClose, matchID, onMatchStart }: MatchLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchState, setMatchState] = useState<'lobby' | 'countdown' | 'active'>('lobby');
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && matchID) {
      connectToMatch();
    }

    return () => {
      // Cleanup WebSocket connection
    };
  }, [isOpen, matchID]);

  useEffect(() => {
    if (matchState === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setMatchState('active');
            if (onMatchStart) onMatchStart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [matchState]);

  const connectToMatch = async () => {
    setLoading(true);
    try {
      // TODO: WebSocket connection to match
      // const ws = new WebSocket(`ws://localhost:8080/ws/match/${matchID}`);
      
      // Mock players for now
      setPlayers([
        { user_id: '1', name: 'Player 1', joined_at: new Date().toISOString() },
      ]);
      
      // Listen for player joins/leaves
      // ws.onmessage = (event) => {
      //   const msg = JSON.parse(event.data);
      //   if (msg.type === 'player_joined') {
      //     setPlayers(prev => [...prev, msg.data]);
      //   }
      // };
    } catch (err) {
      console.error('Failed to connect to match:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReady = () => {
    // Send ready message via WebSocket
    setMatchState('countdown');
    setCountdown(3);
  };

  if (matchState === 'countdown') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Match Starting" size="sm">
        <div className="text-center py-12">
          <div className="text-8xl font-bold text-primary mb-4 animate-pulse">
            {countdown}
          </div>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
            Get ready!
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Lobby" size="lg">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Connecting to match...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                  Waiting for players...
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Match will start when all players are ready
                </p>
              </div>
              <Badge variant="primary" size="md">
                {players.length} / 4
              </Badge>
            </div>
          </Card>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase">
              Players ({players.length})
            </h4>
            <div className="space-y-2">
              {players.map((player) => (
                <Card key={player.user_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={player.name} src={player.avatar} size="md" />
                      <div>
                        <div className="font-medium text-light-text-primary dark:text-dark-text-primary">
                          {player.name}
                        </div>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          Joined {new Date(player.joined_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Ready</Badge>
                  </div>
                </Card>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 4 - players.length }).map((_, i) => (
                <Card key={`empty-${i}`} className="p-4 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-light-bg-secondary dark:bg-dark-bg-secondary flex items-center justify-center">
                      <Users className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      Waiting for player...
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Leave Lobby
            </Button>
            <Button
              variant="primary"
              onClick={handleReady}
              disabled={players.length < 2}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Ready to Play
            </Button>
          </div>

          <div className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary">
            Minimum 2 players required to start
          </div>
        </div>
      )}
    </Modal>
  );
}
