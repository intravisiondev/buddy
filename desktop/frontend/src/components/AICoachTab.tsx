import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Info, BookOpen, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface Message {
  id: number;
  type: 'user' | 'coach';
  message: string;
  time: string;
}

interface AICoachTabProps {
  roomId: string | null;
}

export default function AICoachTab({ roomId }: AICoachTabProps) {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      checkAIStatus();
    }
  }, [roomId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const checkAIStatus = async () => {
    setLoadingStatus(true);
    try {
      // @ts-ignore
      const { GetRoomAIStatus } = await import('../wailsjs/go/main/App');
      const status = await GetRoomAIStatus(roomId);
      setAiStatus(status);

      // Add welcome message if AI is trained
      if (status.trained && conversation.length === 0) {
        setConversation([
          {
            id: 1,
            type: 'coach',
            message: `Hi! I'm your AI Coach for this course. I've been trained on ${status.resource_count} resources. Feel free to ask me anything about the course material!`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Failed to check AI status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !roomId) return;

    const userMessage: Message = {
      id: conversation.length + 1,
      type: 'user',
      message: input,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // @ts-ignore
      const { ChatWithRoomAI } = await import('../wailsjs/go/main/App');
      
      const response: any = await ChatWithRoomAI(roomId, currentInput);
      
      const coachMessage: Message = {
        id: conversation.length + 2,
        type: 'coach',
        message: response.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setConversation(prev => [...prev, coachMessage]);
    } catch (error: any) {
      console.error('AI Coach chat error:', error);
      const errorMessage: Message = {
        id: conversation.length + 2,
        type: 'coach',
        message: error.message || 'Sorry, I encountered an error. Please try again later.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Explain the main concepts covered in this course",
    "What are the key topics I should focus on?",
    "Can you summarize the course syllabus?",
    "Help me understand [specific topic]",
  ];

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Checking AI Coach status...
          </p>
        </div>
      </div>
    );
  }

  if (!aiStatus?.trained) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card className="p-8 text-center bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/20 rounded-card mb-4">
            <AlertCircle className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3">
            AI Coach Not Available Yet
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
            The AI Coach needs to be trained with course materials first. Please ask your instructor to upload resources and train the AI.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Resources: {aiStatus?.resource_count || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Status: Not Trained</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      {/* AI Coach Info Header */}
      <div className="p-6 border-b border-light-text-secondary/10 dark:border-dark-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-card">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              AI Course Coach
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-3">
              Ask me anything about this course! I'm trained specifically on your course materials.
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="success" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Trained
              </Badge>
              <Badge variant="neutral" size="sm">
                {aiStatus.resource_count} Resources
              </Badge>
              <Badge variant="neutral" size="sm">
                {aiStatus.message_count || 0} Messages
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      {conversation.length <= 1 && (
        <div className="p-6 border-b border-light-text-secondary/10 dark:border-dark-border bg-light-card dark:bg-dark-card">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
              Try asking:
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInput(prompt)}
                className="p-3 text-left text-sm bg-light-bg dark:bg-dark-bg hover:bg-primary/5 dark:hover:bg-primary/10 border border-light-text-secondary/10 dark:border-dark-border rounded-button transition-colors text-light-text-primary dark:text-dark-text-primary"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-light-card dark:bg-dark-card border border-light-text-secondary/10 dark:border-dark-border'} rounded-2xl p-4 shadow-soft`}>
              {msg.type === 'coach' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-primary">
                    AI Course Coach
                  </p>
                </div>
              )}
              <p className={`text-sm leading-relaxed whitespace-pre-line ${msg.type === 'user' ? 'text-white' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                {msg.message}
              </p>
              <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-white/70' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-light-card dark:bg-dark-card border border-light-text-secondary/10 dark:border-dark-border rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  AI Coach is thinking...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-light-text-secondary/10 dark:border-dark-border bg-light-card dark:bg-dark-card">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Coach about this course..."
            rows={3}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
          />
          <Button 
            className="flex-shrink-0" 
            size="lg"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-3 flex items-center gap-1">
          <Info className="w-3 h-3" />
          AI responses are based on course materials uploaded by your instructor
        </p>
      </div>
    </div>
  );
}
