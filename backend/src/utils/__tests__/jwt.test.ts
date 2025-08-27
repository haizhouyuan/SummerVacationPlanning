// JWT工具函数单元测试 - Test demo token functionality only
// Since the actual JWT functions use the real jsonwebtoken library,
// we'll focus on testing the demo token logic which doesn't require mocking

import { generateToken, verifyToken } from '../jwt';

describe('jwt utils', () => {
  it('generates token with user data', () => {
    // Arrange
    const user = { id: 'test-user-id', email: 'test@example.com', role: 'student' } as any;
    // Act
    const token = generateToken(user);
    // Assert - token should be generated (actual JWT content depends on real library)
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifies demo token correctly', () => {
    // Arrange
    const demoToken = 'demo-token-test';
    // Act
    const payload = verifyToken(demoToken);
    // Assert - demo tokens should return mock user data
    expect(payload).toEqual({
      id: 'demo-user-id',
      email: 'demo@example.com',
      role: 'student'
    });
  });

  it('throws error on invalid token format', () => {
    // Arrange
    const invalidToken = 'invalid-token-format';
    // Act & Assert - non-demo tokens should throw when invalid
    expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
  });

  it('handles empty token string', () => {
    // Arrange
    const emptyToken = '';
    // Act & Assert
    expect(() => verifyToken(emptyToken)).toThrow('Invalid token');
  });
});
