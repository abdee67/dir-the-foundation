import { CountdownTimer } from './countdown-timer'

export function RestockCountdown({ restockAt, variant = 'full' }: { restockAt: string; variant?: 'full' | 'compact' | 'card' }) {
  return <CountdownTimer targetDate={restockAt} label="Back in stock in" variant={variant} />
}
