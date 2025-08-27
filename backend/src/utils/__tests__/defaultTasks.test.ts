import { describe, it, expect, jest } from '@jest/globals';
import { defaultTasks, initializeDefaultTasks } from '../defaultTasks';
import { collections } from '../../config/mongodb';

jest.mock('../../config/mongodb', () => ({
  collections: {
    tasks: {
      add: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('defaultTasks utils', () => {
  it('contains predefined tasks', () => {
    // Arrange & Act
    // Assert
    expect(defaultTasks.length).toBeGreaterThan(0);
  });

  it('initializes tasks to database', async () => {
    // Arrange
    const mockAdd = jest.mocked(collections.tasks.add);
    // Act
    await initializeDefaultTasks('system');
    // Assert
    expect(mockAdd).toHaveBeenCalledTimes(defaultTasks.length);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'system' })
    );
  });
});
