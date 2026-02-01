import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GamePlayer from '../GamePlayer';

vi.mock('../../../../wailsjs/go/main/App', () => ({
  DownloadGameBundle: vi.fn(() => Promise.resolve('/path/to/bundle')),
  PlayGame: vi.fn(() => Promise.resolve({ score: 80, passed: true })),
}));

describe('GamePlayer', () => {
  const mockGame = {
    id: 'game123',
    title: 'Test Quiz',
    questions: [
      { question: 'Q1', correct_answer: 'A1', points: 10 },
      { question: 'Q2', correct_answer: 'A2', points: 10 },
    ],
  };

  it('shows loading state initially', () => {
    render(<GamePlayer isOpen={true} onClose={() => {}} game={mockGame} />);
    expect(screen.getByText('Loading game...')).toBeInTheDocument();
  });

  it('validates postMessage origin', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<GamePlayer isOpen={true} onClose={() => {}} game={mockGame} />);

    // Simulate message from unauthorized origin
    const event = new MessageEvent('message', {
      data: { type: 'GAME_SCORE', score: 100 },
      origin: 'https://evil.com',
    });
    window.dispatchEvent(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('unauthorized origin'),
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });

  it('validates message schema', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<GamePlayer isOpen={true} onClose={() => {}} game={mockGame} />);

    // Invalid message (no type)
    const event = new MessageEvent('message', {
      data: { score: 100 },
      origin: 'file://',
    });
    window.dispatchEvent(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid message format'),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('rejects invalid GAME_SCORE payload', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<GamePlayer isOpen={true} onClose={() => {}} game={mockGame} />);

    // Invalid payload (score is string)
    const event = new MessageEvent('message', {
      data: { type: 'GAME_SCORE', score: 'invalid', lives: 3 },
      origin: 'file://',
    });
    window.dispatchEvent(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid GAME_SCORE payload'),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('ignores unknown message types', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<GamePlayer isOpen={true} onClose={() => {}} game={mockGame} />);

    const event = new MessageEvent('message', {
      data: { type: 'UNKNOWN_TYPE' },
      origin: 'file://',
    });
    window.dispatchEvent(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown message type'),
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });
});
