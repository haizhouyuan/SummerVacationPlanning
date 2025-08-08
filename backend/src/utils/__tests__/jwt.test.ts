import { describe, it, expect, vi } from 'vitest';
import * as jsonwebtoken from 'jsonwebtoken';
import { generateToken, verifyToken } from '../jwt';

type JwtModule = typeof jsonwebtoken;

vi.mock('jsonwebtoken', (): JwtModule => ({
  sign: vi.fn().mockReturnValue('token'),
  verify: vi.fn((token: string) => {
    if (token === 'token') return { id: 'user' };
    throw new Error('Invalid token');
  }),
}) as unknown as JwtModule);

describe('jwt utils', () => {
  it('generates token', () => {
    // Arrange
    const user = { id: '1', email: 'a@b.com', role: 'user' } as any;
    // Act
    const token = generateToken(user);
    // Assert
    expect(jsonwebtoken.sign).toHaveBeenCalledWith(
      { id: '1', email: 'a@b.com', role: 'user' },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.anything() })
    );
    expect(token).toBe('token');
  });

  it('verifies token', () => {
    // Arrange
    const token = 'token';
    // Act
    const payload = verifyToken(token);
    // Assert
    expect(payload).toEqual({ id: 'user' });
  });

  it('throws on invalid token', () => {
    // Arrange
    const token = 'bad';
    // Act & Assert
    expect(() => verifyToken(token)).toThrow('Invalid token');
  });
});
