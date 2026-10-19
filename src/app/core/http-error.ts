/** @file Converts API failures into safe, user-facing English messages. */

import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extract the server's safe error message or use a local fallback.
 *
 * @param error Unknown error received from an Angular observable.
 * @param fallback Message used when the response has no API error field.
 * @returns A displayable error message.
 */
export function readableError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string')
    return error.error.error;
  return fallback;
}
