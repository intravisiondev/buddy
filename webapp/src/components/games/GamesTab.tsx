import { useState, useEffect } from 'react';
import { Gamepad2, Plus, Play, Trophy, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import GameBuilder from './GameBuilder';
import GamePlayer from './GamePlayer';
import { gameService } from '../../services';

type GamesTabProps = {
  roomID: string;
  isTeacher: boolean;
};

export default function GamesTab({ roomID, isTeacher }: GamesTabProps) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadGames();
  }, [roomID]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const data: any = await gameService.getRoomGames(roomID);
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load games:', err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGameCreated = () => {
    loadGames();
  };

  const handlePlayGame = (game: any) => {
    setSelectedGame(game);
    setShowPlayer(true);
  };

  const handleGameComplete = (result: any) => {
    console.log('Game completed:', result);
    // Reload games to update stats
    loadGames();
  };

  const getDifficultyColor = (difficulty: string): 'primary' | 'success' | 'warning' | 'error' | 'accent' | 'neutral' => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Games
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {isTeacher
              ? 'Create AI-powered learning games for your students'
              : 'Play games to test your knowledge and earn XP'}
          </p>
        </div>
        {isTeacher && (
          <Button variant="primary" onClick={() => setShowBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Game
          </Button>
        )}
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">
            Loading games...
          </p>
        </div>
      ) : games.length === 0 ? (
        <Card className="p-12 text-center">
          <Gamepad2 className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            No games yet
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            {isTeacher
              ? 'Create your first AI-powered game to engage students'
              : 'Your teacher hasn\'t created any games yet'}
          </p>
          {isTeacher && (
            <Button variant="primary" onClick={() => setShowBuilder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Game
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card 
              key={game.id} 
              className="p-6 hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                    {game.title}
                  </h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    {game.subject}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="neutral" size="sm">
                      {game.template || game.game_type}
                    </Badge>
                    <Badge variant={getDifficultyColor(game.difficulty)} size="sm">
                      {game.difficulty}
                    </Badge>
                  </div>
                </div>
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>

              {game.description && (
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                  {game.description}
                </p>
              )}

              <div className="flex items-center gap-4 mb-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{game.ruleset?.time_limit || 30}s</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>{game.play_count || 0} plays</span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => handlePlayGame(game)}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Game
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Game Builder Modal */}
      {isTeacher && (
        <GameBuilder
          isOpen={showBuilder}
          onClose={() => setShowBuilder(false)}
          roomID={roomID}
          onGameCreated={handleGameCreated}
        />
      )}

      {/* Game Player Modal */}
      {selectedGame && (
        <GamePlayer
          isOpen={showPlayer}
          onClose={() => {
            setShowPlayer(false);
            setSelectedGame(null);
          }}
          game={selectedGame}
          onGameComplete={handleGameComplete}
        />
      )}
    </div>
  );
}
