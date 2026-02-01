import { useState, useEffect } from 'react';
import { Gamepad2, Wand2, Settings, Play, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { GetGameTemplates, GenerateGame } from '../../../wailsjs/go/main/App';

type GameTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  engine: string;
  multiplayer: boolean;
  icon: string;
  min_questions: number;
  max_questions: number;
  complexity: string;
};

type GameBuilderProps = {
  isOpen: boolean;
  onClose: () => void;
  roomID: string;
  onGameCreated?: (game: any) => void;
};

export default function GameBuilder({ isOpen, onClose, roomID, onGameCreated }: GameBuilderProps) {
  const [step, setStep] = useState(1); // 1: template selection, 2: configuration, 3: generating
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Configuration form
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    } else {
      // Reset on close
      setStep(1);
      setSelectedTemplate(null);
      setSubject('');
      setDifficulty('medium');
      setQuestionCount(10);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data: any = await GetGameTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleTemplateSelect = (template: GameTemplate) => {
    setSelectedTemplate(template);
    const maxQ = Math.max(3, template.max_questions || 10);
    setQuestionCount(Math.min(10, maxQ));
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const count = Math.max(3, Math.min(20, questionCount || 10));
      const game = await GenerateGame(
        roomID,
        selectedTemplate.id,
        subject,
        difficulty,
        count
      );
      console.log('Game generated:', game);
      if (onGameCreated) {
        onGameCreated(game);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to generate game:', err);
      alert('Failed to generate game: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Create Game - Choose Template' : `Create Game - ${selectedTemplate?.name}`}
      size="xl"
    >
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Select a game template to create an AI-powered learning game for your students.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-6 cursor-pointer hover:scale-[1.02] transition-transform hover:border-primary"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {template.name}
                      </h3>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {template.category}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getComplexityColor(template.complexity)} size="sm">
                    {template.complexity}
                  </Badge>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  <span>{template.min_questions}-{template.max_questions} questions</span>
                  {template.multiplayer && <Badge variant="primary" size="sm">Multiplayer</Badge>}
                </div>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
              No templates available
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedTemplate && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {selectedTemplate.name}
              </h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {selectedTemplate.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Subject / Topic
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Algebra, World War II, Cell Biology"
              />
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                AI will generate questions based on your room's resources and this topic
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? 'primary' : 'secondary'}
                    onClick={() => setDifficulty(level)}
                    className="flex-1"
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Number of Questions
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={selectedTemplate.min_questions}
                  max={selectedTemplate.max_questions}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary w-12 text-center">
                  {questionCount}
                </span>
              </div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Range: {selectedTemplate.min_questions} - {selectedTemplate.max_questions}
              </p>
            </div>

            <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
              <h4 className="font-medium text-light-text-primary dark:text-dark-text-primary mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Game Settings
              </h4>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-1">
                <p>Time limit: {difficulty === 'easy' ? '60s' : difficulty === 'medium' ? '30s' : '15s'} per question</p>
                <p>Passing score: 70%</p>
                <p>Lives: 3</p>
                {selectedTemplate.multiplayer && <p>Multiplayer: Enabled</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={!subject || loading}
              className="flex-1"
            >
              {loading ? (
                <>Generating...</>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Game
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
