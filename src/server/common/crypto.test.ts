import { describe, it, expect, beforeAll } from 'vitest'
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
} from './crypto.js'

// Set env vars before tests
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars-long'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-long'
  process.env.JWT_ACCESS_EXPIRES_IN = '15m'
  process.env.JWT_REFRESH_EXPIRES_IN = '7d'
})

describe('Password Hashing', () => {
  it('should hash and verify password correctly', async () => {
    const password = 'weekend123'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(20)
    const valid = await comparePassword(password, hash)
    expect(valid).toBe(true)
  })
  it('should reject wrong password', async () => {
    const hash = await hashPassword('correct-password')
    const valid = await comparePassword('wrong-password', hash)
    expect(valid).toBe(false)
  })
})

describe('JWT Tokens', () => {
  const userId = 'user-123'
  const email = 'test@example.com'
  const role = 'user'

  it('should sign and verify access token', () => {
    const token = signAccessToken({ sub: userId, email, role })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
    const payload = verifyAccessToken(token)
    expect(payload.sub).toBe(userId)
    expect(payload.email).toBe(email)
    expect(payload.role).toBe(role)
  })

  it('should sign and verify refresh token', () => {
    const token = signRefreshToken({ sub: userId, jti: 'token-id-123' })
    expect(typeof token).toBe('string')
    const payload = verifyRefreshToken(token)
    expect(payload.sub).toBe(userId)
    expect(payload.jti).toBe('token-id-123')
  })

  it('should reject token signed with wrong secret', () => {
    const token = signAccessToken({ sub: userId, email, role })
    // Tamper with the token
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(() => verifyAccessToken(tampered)).toThrow()
  })
})

describe('generateRandomToken', () => {
  it('should return hex string of specified byte length', () => {
    const token = generateRandomToken(32)
    expect(token).toHaveLength(64) // 32 bytes = 64 hex chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
  })

  it('should generate unique tokens', () => {
    const a = generateRandomToken(16)
    const b = generateRandomToken(16)
    expect(a).not.toBe(b)
  })
})
