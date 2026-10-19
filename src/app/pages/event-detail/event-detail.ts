/** @file Event-detail page driven by the route event identifier. */

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { isPastEvent } from '../../core/event-status';
import { ApiService } from '../../core/api.service';
import { readableError } from '../../core/http-error';
import { CharityEvent, PublicRegistration } from '../../core/models';
import { Weather } from '../../shared/weather/weather';
@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink, Weather],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly event = signal<CharityEvent | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
  ) {}
  /** Reload the selected event whenever the route parameter changes. */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.event.set(null);
          this.loading.set(true);
          this.error.set('');
          return this.api.getEvent(Number(params.get('id'))).pipe(
            catchError((error) => {
              this.error.set(readableError(error, 'Sorry, no matching event was found.'));
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.event.set(event);
        this.loading.set(false);
      });
  }
  readonly isPast = isPastEvent;
  /** Convert fundraising totals into a capped progress-bar percentage. */
  progress(event: CharityEvent): number {
    return Math.min(100, Math.round((event.total_progress / event.charity_goal) * 100));
  }
  /** Expose only the privacy-safe registration projection to the template. */
  publicRegistrations(event: CharityEvent): PublicRegistration[] {
    return (event.registrations || []) as PublicRegistration[];
  }
}
