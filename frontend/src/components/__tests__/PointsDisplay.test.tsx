import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PointsDisplay from '../PointsDisplay';

describe('PointsDisplay', () => {
  test('renders points correctly', () => {
    render(<PointsDisplay points={100} animated={false} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('积分')).toBeInTheDocument();
  });

  test('renders star icon', () => {
    const { container } = render(<PointsDisplay points={100} animated={false} />);
    expect(container.querySelector('.text-cartoon-yellow')).toBeInTheDocument();
  });

  test('formats large numbers correctly', () => {
    render(<PointsDisplay points={1234} animated={false} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  test('hides label when showLabel is false', () => {
    render(<PointsDisplay points={100} showLabel={false} animated={false} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByText('积分')).not.toBeInTheDocument();
  });

  test('shows level indicator for high points', () => {
    render(<PointsDisplay points={250} animated={false} />);
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
  });

  test('applies different sizes correctly', () => {
    const { rerender } = render(<PointsDisplay points={100} size="sm" animated={false} />);
    let pointsElement = screen.getByText('100');
    expect(pointsElement).toHaveClass('text-lg');

    rerender(<PointsDisplay points={100} size="lg" animated={false} />);
    pointsElement = screen.getByText('100');
    expect(pointsElement).toHaveClass('text-4xl');
  });

  test('applies custom className', () => {
    render(<PointsDisplay points={100} className="custom-class" animated={false} />);
    const container = screen.getByText('100').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
});