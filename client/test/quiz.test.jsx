import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import QuizRunner from '../src/components/QuizRunner';
import { api } from '../src/api';

vi.mock('../src/api', () => ({
  api: {
    getQuizQuestions: vi.fn()
  }
}));

const QUESTIONS = [
  {
    id: 'q1',
    topic: 'Plot',
    question: 'Who shot the Albatross?',
    options: ['The Wedding Guest', 'A fellow sailor', 'The Ancient Mariner', 'The Pilot'],
    correct_index: 2,
    explanation: 'The Mariner shoots the innocent Albatross with his crossbow.'
  },
  {
    id: 'q2',
    topic: 'Symbolism',
    question: 'What hung around the Mariner\u2019s neck?',
    options: ['A cross of gold', 'The dead Albatross', 'A silver bell', 'A rope anchor'],
    correct_index: 1,
    explanation: 'The dead Albatross is hung around his neck in place of a cross.'
  }
];

describe('QuizRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getQuizQuestions.mockResolvedValue({ questions: QUESTIONS });
  });

  it('asks ten-question flow with instant feedback and result marks', async () => {
    const onFinish = vi.fn();
    render(<QuizRunner unitId="rime-of-the-ancient-mariner" onFinish={onFinish} />);

    expect(api.getQuizQuestions).toHaveBeenCalledWith('rime-of-the-ancient-mariner', 10);

    // Question 1 loads
    expect(await screen.findByText('Who shot the Albatross?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();

    // No marks before answering
    expect(screen.queryByLabelText('Correct answer')).not.toBeInTheDocument();

    // Answer correctly: correct mark + good feedback
    fireEvent.click(screen.getByRole('button', { name: /The Ancient Mariner/ }));
    expect(screen.getByLabelText('Correct answer')).toBeInTheDocument();
    expect(screen.getByText(/Correct! Well navigated/)).toBeInTheDocument();
    expect(screen.getByText('The Mariner shoots the innocent Albatross with his crossbow.')).toBeInTheDocument();

    // Next question
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    expect(await screen.findByText('What hung around the Mariner\u2019s neck?')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();

    // Answer wrongly: wrong mark + correct answer still flagged
    fireEvent.click(screen.getByRole('button', { name: /A cross of gold/ }));
    expect(screen.getByLabelText('Your answer was wrong')).toBeInTheDocument();
    expect(screen.getByLabelText('Correct answer')).toBeInTheDocument();
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();

    // Results
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));
    expect(await screen.findByText('Voyage Complete')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledWith(1, 2);
  });

  it('shows an empty note when the unit has no quiz questions', async () => {
    api.getQuizQuestions.mockResolvedValue({ questions: [] });
    render(<QuizRunner unitId="empty-unit" />);
    expect(await screen.findByText('No quiz questions available yet.')).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    api.getQuizQuestions.mockRejectedValue(new Error('boom'));
    render(<QuizRunner unitId="x" />);
    expect(await screen.findByText('Failed to load quiz: boom')).toBeInTheDocument();
  });
});