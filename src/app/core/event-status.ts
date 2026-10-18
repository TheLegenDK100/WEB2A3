import { CharityEvent } from './models';

/** Compare UTC instants, independent of the visitor's device timezone. */
export function isPastEvent(event: CharityEvent, now = Date.now()): boolean {
  return Date.parse(event.starts_at) <= now;
}

export const EVENT_TIMEZONES = [
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Adelaide',
  'Australia/Perth',
  'Australia/Darwin',
  'Australia/Hobart',
];
