import { describe, it, expect } from 'vitest'
import {
  canTransition,
  transition,
  getNextStates,
  isTerminal,
  isBookable,
  isCancellable,
} from './actionStateMachine.js'

describe('ActionStateMachine', () => {
  describe('canTransition', () => {
    it('should allow DRAFT → PENDING', () => {
      expect(canTransition('DRAFT', 'PENDING')).toBe(true)
    })
    it('should allow DRAFT → CANCELLED', () => {
      expect(canTransition('DRAFT', 'CANCELLED')).toBe(true)
    })
    it('should NOT allow DRAFT → CONFIRMED', () => {
      expect(canTransition('DRAFT', 'CONFIRMED')).toBe(false)
    })
    it('should NOT allow terminal states to transition', () => {
      expect(canTransition('EXPIRED', 'DRAFT')).toBe(false)
      expect(canTransition('CANCELLED', 'PENDING')).toBe(false)
      expect(canTransition('EXECUTED', 'DRAFT')).toBe(false)
    })
    it('should allow FAILED → EXECUTING (retry)', () => {
      expect(canTransition('FAILED', 'EXECUTING')).toBe(true)
    })
    it('should NOT allow CONFIRMED → DRAFT', () => {
      expect(canTransition('CONFIRMED', 'DRAFT')).toBe(false)
    })
  })

  describe('transition', () => {
    it('should return ok for valid transition', () => {
      const result = transition('DRAFT', 'PENDING')
      expect(result.ok).toBe(true)
      expect(result.from).toBe('DRAFT')
      expect(result.to).toBe('PENDING')
    })
    it('should return error for invalid transition', () => {
      const result = transition('EXPIRED', 'DRAFT')
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Invalid transition')
    })
  })

  describe('getNextStates', () => {
    it('DRAFT can go to PENDING or CANCELLED', () => {
      expect(getNextStates('DRAFT')).toEqual(['PENDING', 'CANCELLED'])
    })
    it('EXECUTED has no next states', () => {
      expect(getNextStates('EXECUTED')).toEqual([])
    })
  })

  describe('isTerminal', () => {
    it('EXPIRED is terminal', () => { expect(isTerminal('EXPIRED')).toBe(true) })
    it('CANCELLED is terminal', () => { expect(isTerminal('CANCELLED')).toBe(true) })
    it('EXECUTED is terminal', () => { expect(isTerminal('EXECUTED')).toBe(true) })
    it('DRAFT is not terminal', () => { expect(isTerminal('DRAFT')).toBe(false) })
    it('EXECUTING is not terminal', () => { expect(isTerminal('EXECUTING')).toBe(false) })
  })

  describe('isBookable', () => {
    it('CONFIRMED is bookable', () => { expect(isBookable('CONFIRMED')).toBe(true) })
    it('DRAFT is not bookable', () => { expect(isBookable('DRAFT')).toBe(false) })
    it('PENDING is not bookable', () => { expect(isBookable('PENDING')).toBe(false) })
  })

  describe('isCancellable', () => {
    it('DRAFT is cancellable', () => { expect(isCancellable('DRAFT')).toBe(true) })
    it('PENDING is cancellable', () => { expect(isCancellable('PENDING')).toBe(true) })
    it('CONFIRMED is cancellable', () => { expect(isCancellable('CONFIRMED')).toBe(true) })
    it('EXPIRED is not cancellable', () => { expect(isCancellable('EXPIRED')).toBe(false) })
    it('EXECUTED is not cancellable', () => { expect(isCancellable('EXECUTED')).toBe(false) })
  })

  describe('full lifecycle', () => {
    it('happy path: DRAFT → PENDING → CONFIRMED → EXECUTING → EXECUTED', () => {
      expect(transition('DRAFT', 'PENDING').ok).toBe(true)
      expect(transition('PENDING', 'CONFIRMED').ok).toBe(true)
      expect(transition('CONFIRMED', 'EXECUTING').ok).toBe(true)
      expect(transition('EXECUTING', 'EXECUTED').ok).toBe(true)
    })
    it('expiry path: PENDING → EXPIRING → EXPIRED', () => {
      expect(transition('PENDING', 'EXPIRING').ok).toBe(true)
      expect(transition('EXPIRING', 'EXPIRED').ok).toBe(true)
    })
    it('cancel path: CONFIRMED → CANCELLED', () => {
      expect(transition('CONFIRMED', 'CANCELLED').ok).toBe(true)
    })
    it('retry path: EXECUTING → FAILED → EXECUTING', () => {
      expect(transition('EXECUTING', 'FAILED').ok).toBe(true)
      expect(transition('FAILED', 'EXECUTING').ok).toBe(true)
    })
  })
})
