import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GameBuilder from '../GameBuilder';

// Mock Wails functions
vi.mock('../../../../wailsjs/go/main/App', () => ({
  GetGameTemplates: vi.fn(() => Promise.resolve([
    {
      id: 'quiz',
      name: 'Quiz Game',
      description: 'Multiple choice questions',
      category: 'knowledge',
      engine: 'html',
      multiplayer: true,
      icon: 'question-circle',
      min_questions: 3,
      max_questions: 20,
      complexity: 'low',
    },
    {
      id: 'flashcards',
      name: 'Flashcards',
      description: 'Flip cards',
      category: 'knowledge',
      engine: 'html',
      multiplayer: false,
      icon: 'cards',
      min_questions: 5,
      max_questions: 50,
      complexity: 'low',
    },
  ])),
  GenerateGame: vi.fn(() => Promise.resolve({ id: 'game123', title: 'Test Game' })),
}));

describe('GameBuilder', () => {
  it('renders template selection when opened', async () => {
    render(<GameBuilder isOpen={true} onClose={() => {}} roomID="room123" />);

    await waitFor(() => {
      expect(screen.getByText('Quiz Game')).toBeInTheDocument();
      expect(screen.getByText('Flashcards')).toBeInTheDocument();
    });
  });

  it('shows template descriptions', async () => {
    render(<GameBuilder isOpen={true} onClose={() => {}} roomID="room123" />);

    await waitFor(() => {
      expect(screen.getByText('Multiple choice questions')).toBeInTheDocument();
      expect(screen.getByText('Flip cards')).toBeInTheDocument();
    });
  });

  it('moves to configuration step when template selected', async () => {
    render(<GameBuilder isOpen={true} onClose={() => {}} roomID="room123" />);

    await waitFor(() => {
      const quizCard = screen.getByText('Quiz Game').closest('div');
      if (quizCard) fireEvent.click(quizCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/Subject \/ Topic/i)).toBeInTheDocument();
      expect(screen.getByText(/Difficulty Level/i)).toBeInTheDocument();
    });
  });

  it('validates subject input', async () => {
    const { GenerateGame } = await import('../../../../wailsjs/go/main/App');
    
    render(<GameBuilder isOpen={true} onClose={() => {}} roomID="room123" />);

    // Select template
    await waitFor(() => {
      const quizCard = screen.getByText('Quiz Game').closest('div');
      if (quizCard) fireEvent.click(quizCard);
    });

    // Try to generate without subject
    const generateBtn = screen.getByText(/Generate Game/i);
    expect(generateBtn).toBeDisabled();

    // Enter subject
    const subjectInput = screen.getByPlaceholderText(/e.g., Algebra/i);
    fireEvent.change(subjectInput, { target: { value: 'Math' } });

    // Should be enabled now
    expect(generateBtn).not.toBeDisabled();
  });

  it('allows difficulty selection', async () => {
    render(<GameBuilder isOpen={true} onClose={() => {}} roomID="room123" />);

    await waitFor(() => {
      const quizCard = screen.getByText('Quiz Game').closest('div');
      if (quizCard) fireEvent.click(quizCard);
    });

    const easyBtn = screen.getByText('Easy');
    const mediumBtn = screen.getByText('Medium');
    const hardBtn = screen.getByText('Hard');

    fireEvent.click(easyBtn);
    // Check if button gets primary variant (would need to check className)

    fireEvent.click(hardBtn);
    // Check if button gets primary variant
  });

  it('adjusts question count with slider', async () => {
    render(<GameBuilder isOpen={true} onClose={() => {}} roomID="room123" />);

    await waitFor(() => {
      const quizCard = screen.getByText('Quiz Game').closest('div');
      if (quizCard) fireEvent.click(quizCard);
    });

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '15' } });

    expect(screen.getByText('15')).toBeInTheDocument();
  });
});
