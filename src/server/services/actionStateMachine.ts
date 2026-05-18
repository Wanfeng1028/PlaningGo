export type ActionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'

export interface TransitionResult {
  ok: boolean
  from: ActionStatus
  to: ActionStatus
  error?: string
}

const VALID_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'EXPIRING', 'CANCELLED'],
  CONFIRMED: ['EXECUTING', 'EXPIRING', 'CANCELLED'],
  EXPIRING: ['CONFIRMED', 'EXPIRED'],
  EXPIRED: [],
  CANCELLED: [],
  EXECUTING: ['EXECUTED', 'FAILED'],
  EXECUTED: [],
  FAILED: ['EXECUTING'],
}

export function canTransition(from: ActionStatus, to: ActionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function transition(from: ActionStatus, to: ActionStatus): TransitionResult {
  if (!canTransition(from, to)) {
    return { ok: false, from, to, error: `Invalid transition: ${from} → ${to}` }
  }
  return { ok: true, from, to }
}

export function getNextStates(current: ActionStatus): ActionStatus[] {
  return VALID_TRANSITIONS[current] || []
}

export function isTerminal(status: ActionStatus): boolean {
  return ['EXPIRED', 'CANCELLED', 'EXECUTED'].includes(status)
}

export function isBookable(status: ActionStatus): boolean {
  return status === 'CONFIRMED'
}

export function isCancellable(status: ActionStatus): boolean {
  return canTransition(status, 'CANCELLED')
}
