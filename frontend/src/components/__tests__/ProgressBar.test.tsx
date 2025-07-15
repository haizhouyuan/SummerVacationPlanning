import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  test('renders progress bar with correct percentage', () => {
    const { container } = render(<ProgressBar current={50} max={100} label="Test Progress" />);
    expect(screen.getByText('50/100')).toBeInTheDocument();
    expect(container.querySelector('.bg-cartoon-green')).toBeInTheDocument();
  });

  test('displays label when provided', () => {
    render(<ProgressBar current={3} max={5} label="Tasks completed" />);
    expect(screen.getByText('Tasks completed')).toBeInTheDocument();
  });

  test('shows percentage when enabled', () => {
    render(<ProgressBar current={3} max={5} label="Test" showPercentage={true} />);
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  test('hides percentage when disabled', () => {
    render(<ProgressBar current={3} max={5} label="Test" showPercentage={false} />);
    expect(screen.queryByText('3/5')).not.toBeInTheDocument();
  });

  test('calculates percentage correctly', () => {
    render(<ProgressBar current={25} max={100} label="Test" />);
    expect(screen.getByText('25/100')).toBeInTheDocument();
  });

  test('handles 100% completion', () => {
    render(<ProgressBar current={5} max={5} label="Test" />);
    expect(screen.getByText(/🎉/)).toBeInTheDocument();
  });

  test('caps percentage at 100%', () => {
    render(<ProgressBar current={150} max={100} label="Test" />);
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  test('applies different sizes correctly', () => {
    const { rerender, container } = render(<ProgressBar current={50} max={100} size="sm" />);
    let progressElement = container.querySelector('.h-2');
    expect(progressElement).toBeInTheDocument();

    rerender(<ProgressBar current={50} max={100} size="lg" />);
    progressElement = container.querySelector('.h-6');
    expect(progressElement).toBeInTheDocument();
  });

  test('shows milestone indicators for larger max values', () => {
    const { container } = render(<ProgressBar current={3} max={10} />);
    const milestones = container.querySelectorAll('.w-2.h-2.rounded-full');
    expect(milestones.length).toBeGreaterThan(0);
  });

  test('applies custom className', () => {
    const { container } = render(<ProgressBar current={50} max={100} className="custom-progress" />);
    expect(container.querySelector('.custom-progress')).toBeInTheDocument();
  });
});