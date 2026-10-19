/** @file Home page orchestration for organisations and public event cards. */

import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { readableError } from '../../core/http-error';
import { CharityEvent, Organisation } from '../../core/models';
import { EventCard } from '../../shared/event-card/event-card';
import { isPastEvent } from '../../core/event-status';
@Component({ imports: [EventCard, RouterLink], templateUrl: './home.html', styleUrl: './home.css' })
export class Home implements OnInit {
  readonly events = signal<CharityEvent[]>([]);
  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor(private readonly api: ApiService) {}
  /** Load the independent home-page resources in one observable transaction. */
  ngOnInit(): void {
    forkJoin({
      events: this.api.getEvents(),
      organisations: this.api.getOrganisations(),
    }).subscribe({
      next: ({ events, organisations }) => {
        this.events.set(
          events.sort(
            (a, b) =>
              Number(isPastEvent(a)) - Number(isPastEvent(b)) ||
              Date.parse(a.starts_at) - Date.parse(b.starts_at),
          ),
        );
        this.organisations.set(organisations);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(
          readableError(error, 'Events could not be loaded. Please check the server connection.'),
        );
        this.loading.set(false);
      },
    });
  }
}
