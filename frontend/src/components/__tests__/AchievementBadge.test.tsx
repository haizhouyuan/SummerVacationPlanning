import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementBadge from '../AchievementBadge';

describe('AchievementBadge', () => {
  const mockAchievement = {
    type: 'streak' as const,
    level: 1,
    title: '连续达人',
    description: '连续3天完成任务',
    isUnlocked: true,
  };

  test('renders unlocked achievement correctly', () => {
    render(<AchievementBadge {...mockAchievement} />);
    
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('连续达人')).toBeInTheDocument();
    expect(screen.getByText('连续3天完成任务')).toBeInTheDocument();
  });

  test('renders locked achievement with lock icon', () => {
    render(
      <AchievementBadge
        {...mockAchievement}
        isUnlocked={false}
        progress={5}
        maxProgress={10}
      />
    );
    
    expect(screen.getByText('🔒')).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  test('shows level indicator for high-level achievements', () => {
    render(<AchievementBadge {...mockAchievement} level={3} />);
    expect(screen.getByText('Lv.3')).toBeInTheDocument();
  });

  test('renders different achievement types correctly', () => {
    const { rerender, container } = render(
      <AchievementBadge {...mockAchievement} type="points" />
    );
    expect(container.querySelector('.text-cartoon-yellow')).toBeInTheDocument();

    rerender(<AchievementBadge {...mockAchievement} type="tasks" />);
    expect(screen.getByText('✅')).toBeInTheDocument();

    rerender(<AchievementBadge {...mockAchievement} type="special" />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  test('applies different sizes correctly', () => {
    const { rerender, container } = render(
      <AchievementBadge {...mockAchievement} size="sm" />
    );
    let badgeContainer = container.querySelector('.w-16.h-16');
    expect(badgeContainer).toBeInTheDocument();

    rerender(<AchievementBadge {...mockAchievement} size="lg" />);
    badgeContainer = container.querySelector('.w-24.h-24');
    expect(badgeContainer).toBeInTheDocument();
  });

  test('shows progress bar for locked achievements', () => {
    const { container } = render(
      <AchievementBadge
        {...mockAchievement}
        isUnlocked={false}
        progress={3}
        maxProgress={5}
        showProgress={true}
      />
    );
    
    const progressBar = container.querySelector('.bg-cartoon-green.h-2');
    expect(progressBar).toBeInTheDocument();
  });

  test('hides progress bar when showProgress is false', () => {
    const { container } = render(
      <AchievementBadge
        {...mockAchievement}
        isUnlocked={false}
        progress={3}
        maxProgress={5}
        showProgress={false}
      />
    );
    
    const progressBar = container.querySelector('.bg-cartoon-green.h-2');
    expect(progressBar).not.toBeInTheDocument();
  });

  test('applies animation classes for unlocked achievements', () => {
    const { container } = render(<AchievementBadge {...mockAchievement} />);
    const animatedElement = container.querySelector('.animate-float');
    expect(animatedElement).toBeInTheDocument();
  });

  test('applies grayscale filter for locked achievements', () => {
    const { container } = render(
      <AchievementBadge {...mockAchievement} isUnlocked={false} />
    );
    const grayElement = container.querySelector('.grayscale.opacity-50');
    expect(grayElement).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <AchievementBadge {...mockAchievement} className="custom-badge" />
    );
    expect(container.querySelector('.custom-badge')).toBeInTheDocument();
  });
});