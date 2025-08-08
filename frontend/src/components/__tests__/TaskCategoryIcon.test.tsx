import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskCategoryIcon from '../TaskCategoryIcon';

describe('TaskCategoryIcon', () => {
  test('renders study category icon', () => {
    render(<TaskCategoryIcon category="study" />);
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  test('renders exercise category icon', () => {
    render(<TaskCategoryIcon category="exercise" />);
    expect(screen.getByText('🏃')).toBeInTheDocument();
  });

  test('renders art category icon', () => {
    render(<TaskCategoryIcon category="art" />);
    expect(screen.getByText('🎨')).toBeInTheDocument();
  });

  test('renders music category icon', () => {
    render(<TaskCategoryIcon category="music" />);
    expect(screen.getByText('🎵')).toBeInTheDocument();
  });

  test('renders cooking category icon', () => {
    render(<TaskCategoryIcon category="cooking" />);
    expect(screen.getByText('👨‍🍳')).toBeInTheDocument();
  });

  test('renders default icon for unknown category', () => {
    render(<TaskCategoryIcon category="unknown" />);
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  test('handles case insensitive categories', () => {
    render(<TaskCategoryIcon category="STUDY" />);
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  test('applies different sizes correctly', () => {
    const { rerender, container } = render(<TaskCategoryIcon category="study" size="sm" />);
    let iconContainer = container.querySelector('.w-8.h-8');
    expect(iconContainer).toBeInTheDocument();

    rerender(<TaskCategoryIcon category="study" size="lg" />);
    iconContainer = container.querySelector('.w-16.h-16');
    expect(iconContainer).toBeInTheDocument();
  });

  test('applies animation when enabled', () => {
    const { container } = render(<TaskCategoryIcon category="study" animated={true} />);
    const iconElement = container.querySelector('.animate-float');
    expect(iconElement).toBeInTheDocument();
  });

  test('does not apply animation when disabled', () => {
    const { container } = render(<TaskCategoryIcon category="study" animated={false} />);
    const iconElement = container.querySelector('.animate-float');
    expect(iconElement).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(<TaskCategoryIcon category="study" className="custom-icon" />);
    expect(container.querySelector('.custom-icon')).toBeInTheDocument();
  });

  test('renders correct background color for categories', () => {
    const { container } = render(<TaskCategoryIcon category="study" />);
    const iconContainer = container.querySelector('.bg-blue-100');
    expect(iconContainer).toBeInTheDocument();
  });
});