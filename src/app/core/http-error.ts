import { HttpErrorResponse } from '@angular/common/http';
export function readableError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string')
    return error.error.error;
  return fallback;
}
