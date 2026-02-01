import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { Check, X, HelpCircle } from 'lucide-react';

type PuzzleGameProps = {
  questions: any[];
  puzzleConfig: any;
  onScoreUpdate: (score: number) => void;
  onGameEnd: (result: any) => void;
};

type PuzzlePiece = {
  id: number;
  unlocked: boolean;
  currentX: number;  // Current position in grid
  currentY: number;
  correctX: number;  // Target correct position
  correctY: number;
};

function PuzzlePieceComponent({ 
  piece, 
  onClick, 
  onDrop 
}: { 
  piece: PuzzlePiece; 
  onClick: () => void;
  onDrop: (dragId: number, dropId: number) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'puzzle-piece',
    item: { id: piece.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: piece.unlocked,
  }), [piece.unlocked]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'puzzle-piece',
    drop: (item: { id: number }) => {
      onDrop(item.id, piece.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [piece.id]);

  const isCorrectPosition = piece.currentX === piece.correctX && piece.currentY === piece.correctY;

  return (
    <div
      ref={(node) => drag(drop(node))}
      onClick={piece.unlocked ? undefined : onClick}
      className={`
        w-full h-full border-2 rounded-lg flex items-center justify-center
        transition-all cursor-pointer
        ${piece.unlocked
          ? isCorrectPosition
            ? 'bg-success/20 border-success hover:scale-105'
            : 'bg-primary/20 border-primary hover:scale-105'
          : 'bg-gray-300 border-gray-400 opacity-50'
        }
        ${isDragging ? 'opacity-50 scale-110' : ''}
        ${isOver ? 'border-accent border-4' : ''}
      `}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {!piece.unlocked && <HelpCircle className="w-6 h-6 text-gray-500" />}
      {piece.unlocked && (
        <div className="text-center">
          <span className="text-2xl font-bold">{piece.id + 1}</span>
          {isCorrectPosition && <Check className="w-4 h-4 text-success mx-auto" />}
        </div>
      )}
    </div>
  );
}

function PuzzleGameInner({ questions, puzzleConfig, onScoreUpdate, onGameEnd }: PuzzleGameProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Initialize puzzle pieces (4x4 grid)
    const gridSize = 4;
    const initialPieces: PuzzlePiece[] = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      initialPieces.push({
        id: i,
        unlocked: i === 0, // First piece unlocked
        currentX: col,
        currentY: row,
        correctX: col,
        correctY: row,
      });
    }

    // Shuffle pieces for challenge
    const shuffled = [...initialPieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempX = shuffled[i].currentX;
      const tempY = shuffled[i].currentY;
      shuffled[i].currentX = shuffled[j].currentX;
      shuffled[i].currentY = shuffled[j].currentY;
      shuffled[j].currentX = tempX;
      shuffled[j].currentY = tempY;
    }

    setPieces(shuffled);
  }, []);

  const handlePieceClick = (pieceId: number) => {
    if (pieces[pieceId].unlocked) return;
    
    setSelectedPiece(pieceId);
    setShowQuestion(true);
  };

  const handleDrop = (dragId: number, dropId: number) => {
    if (dragId === dropId) return;

    setPieces((prev) => {
      const newPieces = [...prev];
      const dragPiece = newPieces.find(p => p.id === dragId);
      const dropPiece = newPieces.find(p => p.id === dropId);

      if (!dragPiece || !dropPiece) return prev;

      // Swap positions
      const tempX = dragPiece.currentX;
      const tempY = dragPiece.currentY;
      dragPiece.currentX = dropPiece.currentX;
      dragPiece.currentY = dropPiece.currentY;
      dropPiece.currentX = tempX;
      dropPiece.currentY = tempY;

      return newPieces;
    });

    // Check if puzzle is complete
    setTimeout(() => checkPuzzleComplete(), 100);
  };

  const checkPuzzleComplete = () => {
    const allCorrect = pieces.every(
      (p) => p.unlocked && p.currentX === p.correctX && p.currentY === p.correctY
    );

    if (allCorrect) {
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      const completionBonus = 100;
      const finalScore = score + completionBonus;
      
      onScoreUpdate(finalScore);
      onGameEnd({
        score: finalScore,
        totalTime,
        passed: true,
        questionsAnswered: currentQuestion,
      });
    }
  };

  const handleAnswer = (answer: string) => {
    if (currentQuestion >= questions.length) return;

    const q = questions[currentQuestion];
    const correct = answer === q.correct_answer;

    if (correct && selectedPiece !== null) {
      // Unlock the piece
      setPieces((prev) =>
        prev.map((p) =>
          p.id === selectedPiece ? { ...p, unlocked: true } : p
        )
      );

      const newScore = score + (q.points || 10);
      setScore(newScore);
      onScoreUpdate(newScore);
    }

    setCurrentQuestion((prev) => prev + 1);
    setShowQuestion(false);
    setSelectedPiece(null);
  };

  const unlockedCount = pieces.filter((p) => p.unlocked).length;
  const totalPieces = pieces.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Puzzle Game
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Answer questions to unlock puzzle pieces
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{score}</div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Score
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-light-text-secondary dark:text-dark-text-secondary">
            Progress
          </span>
          <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
            {unlockedCount} / {totalPieces} pieces
          </span>
        </div>
        <div className="h-2 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(unlockedCount / totalPieces) * 100}%` }}
          />
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="grid grid-cols-4 gap-2 aspect-square max-w-md mx-auto">
        {pieces
          .sort((a, b) => {
            if (a.currentY !== b.currentY) return a.currentY - b.currentY;
            return a.currentX - b.currentX;
          })
          .map((piece) => (
            <PuzzlePieceComponent
              key={piece.id}
              piece={piece}
              onClick={() => handlePieceClick(piece.id)}
              onDrop={handleDrop}
            />
          ))}
      </div>

      {/* Question Modal */}
      {showQuestion && currentQuestion < questions.length && (
        <Card className="p-6 border-2 border-primary">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            {questions[currentQuestion].question}
          </h3>
          <div className="space-y-2">
            {questions[currentQuestion].options?.map((opt: string, i: number) => (
              <Button
                key={i}
                variant="secondary"
                onClick={() => handleAnswer(opt)}
                className="w-full text-left justify-start"
              >
                {opt}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function PuzzleGame(props: PuzzleGameProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <PuzzleGameInner {...props} />
    </DndProvider>
  );
}
