/** @file Timezone-safe status helpers used by public and admin event views. */

import { CharityEvent } from './models';

/**
 * Compare UTC instants, independent of the visitor's device timezone.
 *
 * @param event Event containing the server-normalised UTC start instant.
 * @param now Current timestamp, injectable for deterministic tests.
 * @returns True when the event has already started.
 */
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
