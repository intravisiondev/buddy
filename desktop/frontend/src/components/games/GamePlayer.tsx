import { useState, useEffect, useRef } from 'react';
import { X, Trophy, Clock, Heart } from 'lucide-react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { DownloadGameBundle, PlayGame } from '../../../wailsjs/go/main/App';

type GamePlayerProps = {
  isOpen: boolean;
  onClose: () => void;
  game: any; // AIGame object
  onGameComplete?: (result: any) => void;
};

type GameState = {
  score: number;
  lives: number;
  currentQuestion: number;
};

export default function GamePlayer({ isOpen, onClose, game, onGameComplete }: GamePlayerProps) {
  const [loading, setLoading] = useState(true);
  const [bundlePath, setBundlePath] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    currentQuestion: 0,
  });
  const [gameEnded, setGameEnded] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isOpen && game) {
      loadGame();
      setupMessageListener();
      startTimeRef.current = Date.now();
    } else {
      // Reset on close
      setLoading(true);
      setBundlePath(null);
      setGameState({ score: 0, lives: 3, currentQuestion: 0 });
      setGameEnded(false);
      setFinalResult(null);
    }
  }, [isOpen, game]);

  const loadGame = async () => {
    if (!game?.id) return;

    setLoading(true);
    try {
      // Download and extract game bundle
      const path = await DownloadGameBundle(game.id);
      setBundlePath(`file://${path}`);
    } catch (err) {
      console.error('Failed to load game:', err);
      alert('Failed to load game');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const setupMessageListener = () => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GAME_SCORE') {
        setGameState({
          score: event.data.score || 0,
          lives: event.data.lives || 0,
          currentQuestion: event.data.currentQuestion || 0,
        });
      } else if (event.data.type === 'GAME_END') {
        handleGameEnd(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  };

  const handleGameEnd = async (result: any) => {
    setGameEnded(true);
    setFinalResult(result);

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      // Submit score to backend
      const gameResult = await PlayGame(
        game.id,
        [], // Answers are tracked in the iframe
        timeSpent
      );
      
      if (onGameComplete) {
        onGameComplete(gameResult);
      }
    } catch (err) {
      console.error('Failed to submit game result:', err);
    }
  };

  const handleClose = () => {
    if (gameEnded || confirm('Are you sure you want to quit? Progress will be lost.')) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={game?.title || 'Play Game'}
      size="full"
    >
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center animate-fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Loading game...
            </p>
          </div>
        </div>
      ) : gameEnded ? (
        <div className="space-y-6 animate-fade-in">
          <Card className="p-8 text-center transform transition-all duration-500 hover:scale-[1.02]">
            <div className="mb-6">
              <Trophy className="w-20 h-20 text-warning mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                {finalResult?.passed ? 'Congratulations!' : 'Try Again!'}
              </h2>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                {finalResult?.passed ? 'You passed the game!' : 'Keep practicing and you\'ll get it!'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                <Trophy className="w-8 h-8 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {finalResult?.score || 0}
                </div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Final Score
                </div>
              </div>

              <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {Math.floor((finalResult?.totalTime || 0) / 60)}:{((finalResult?.totalTime || 0) % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Time Spent
                </div>
              </div>

              <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {finalResult?.questionsAnswered || 0}/{game?.questions?.length || 0}
                </div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Questions
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Game stats header */}
          <div className="flex items-center justify-between p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg mb-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Score: {gameState.score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-danger" />
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Lives: {gameState.lives}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">
                  Question {gameState.currentQuestion + 1} / {game?.questions?.length || 0}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Game iframe */}
          <div className="relative h-[600px] bg-light-bg dark:bg-dark-bg rounded-lg overflow-hidden">
            {bundlePath ? (
              <iframe
                ref={iframeRef}
                src={bundlePath}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
                title="Game Player"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                  Game not available
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
