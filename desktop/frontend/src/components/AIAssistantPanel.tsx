import { useState } from 'react';
import { Sparkles, Send, X, BookOpen, Lightbulb, HelpCircle, FileText, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  message: string;
  time: string;
  resources?: Array<{ name: string; type: string }>;
}

export default function AIAssistantPanel() {
  const { showAIPanel, setShowAIPanel } = useApp();
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([
    {
      id: 1,
      type: 'assistant',
      message: 'Hi! I\'m Buddy, your AI learning assistant. How can I help you today?',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const quickActions = [
    { icon: BookOpen, label: 'Explain Topic', color: 'primary', action: 'explain' },
    { icon: Lightbulb, label: 'Study Tips', color: 'warning', action: 'tips' },
    { icon: HelpCircle, label: 'Ask Question', color: 'success', action: 'question' },
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

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
      // Import Chat function dynamically
      const { Chat } = await import('../../wailsjs/go/main/App');
      
      const response: any = await Chat(currentInput, '');
      
      const assistantMessage: Message = {
        id: conversation.length + 2,
        type: 'assistant',
        message: response.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setConversation(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: conversation.length + 2,
        type: 'assistant',
        message: 'Sorry, I encountered an error. Please make sure you\'re connected and try again.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    let prompt = '';
    switch (action) {
      case 'explain':
        prompt = 'Can you explain a topic in simple terms?';
        break;
      case 'tips':
        prompt = 'Can you give me some study tips?';
        break;
      case 'question':
        prompt = 'I have a question about my studies';
        break;
    }
    
    if (prompt) {
      setInput(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!showAIPanel) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-light-card dark:bg-dark-card border-l border-light-text-secondary/10 dark:border-dark-border shadow-strong flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-light-text-secondary/10 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-button">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              Buddy AI
            </h3>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Your Learning Assistant
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAIPanel(false)}
          className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-button transition-colors"
        >
          <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
        </button>
      </div>

      <div className="p-4 border-b border-light-text-secondary/10 dark:border-dark-border">
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">
          Quick Actions
        </p>
        <div className="flex gap-2">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button 
                key={idx} 
                variant="ghost" 
                size="sm" 
                className="flex-1"
                onClick={() => handleQuickAction(action.action)}
                disabled={loading}
              >
                <Icon className="w-4 h-4 mr-1" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((msg) => (
          <div key={msg.id} className={`${msg.type === 'user' ? 'flex justify-end' : ''}`}>
            <div className={`max-w-[85%] ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-light-bg dark:bg-dark-bg'} rounded-2xl p-3`}>
              {msg.type === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-primary/10 rounded">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
                    Buddy AI
                  </p>
                </div>
              )}
              <p className={`text-sm whitespace-pre-line ${msg.type === 'user' ? 'text-white' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                {msg.message}
              </p>
              {msg.resources && (
                <div className="mt-3 space-y-2">
                  {msg.resources.map((resource, idx) => (
                    <Card key={idx} hover className="p-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                            {resource.name}
                          </p>
                        </div>
                        <Badge variant="neutral" size="sm">{resource.type}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-white/70' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-light-bg dark:bg-dark-bg rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Buddy is thinking...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-light-text-secondary/10 dark:border-dark-border">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Buddy anything..."
            rows={3}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
          />
          <Button 
            className="flex-shrink-0" 
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
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
          Buddy uses AI to provide helpful learning assistance
        </p>
      </div>
    </div>
  );
}
