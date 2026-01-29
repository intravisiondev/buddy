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

type GameMessage = 
  | { type: 'GAME_SCORE'; score: number; lives: number; currentQuestion: number }
  | { type: 'GAME_END'; score: number; totalTime: number; passed: boolean; questionsAnswered: number };

const ALLOWED_ORIGINS = [
  'file://',
  'http://localhost:34115',
  'http://localhost:8080',
];

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
      // 1. Origin validation
      const isAllowedOrigin = ALLOWED_ORIGINS.some(origin => 
        event.origin === origin || event.origin.startsWith(origin)
      );
      
      if (!isAllowedOrigin && event.origin !== '') {
        console.warn('[GamePlayer] Rejected message from unauthorized origin:', event.origin);
        return;
      }

      // 2. Schema validation
      const msg = event.data;
      if (!msg || typeof msg !== 'object' || !msg.type) {
        console.warn('[GamePlayer] Invalid message format:', msg);
        return;
      }

      // 3. Type-specific validation
      switch (msg.type) {
        case 'GAME_SCORE':
          if (typeof msg.score !== 'number' || typeof msg.lives !== 'number') {
            console.warn('[GamePlayer] Invalid GAME_SCORE payload:', msg);
            return;
          }
          if (msg.score < 0 || msg.lives < 0 || msg.lives > 10) {
            console.warn('[GamePlayer] Suspicious GAME_SCORE values:', msg);
            return;
          }
          setGameState({
            score: msg.score,
            lives: msg.lives,
            currentQuestion: msg.currentQuestion || 0,
          });
          break;

        case 'GAME_END':
          if (typeof msg.score !== 'number' || typeof msg.totalTime !== 'number' || typeof msg.passed !== 'boolean') {
            console.warn('[GamePlayer] Invalid GAME_END payload:', msg);
            return;
          }
          if (msg.score < 0 || msg.totalTime < 0) {
            console.warn('[GamePlayer] Suspicious GAME_END values:', msg);
            return;
          }
          handleGameEnd(msg);
          break;

        default:
          console.warn('[GamePlayer] Unknown message type:', msg.type);
          return;
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
                allow="accelerometer 'none'; camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'"
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
