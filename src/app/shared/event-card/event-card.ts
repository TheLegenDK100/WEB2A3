/** @file Reusable event summary card used by home and search results. */

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharityEvent } from '../../core/models';
import { Icon } from '../icon/icon';
import { isPastEvent } from '../../core/event-status';
@Component({
  selector: 'app-event-card',
  imports: [CurrencyPipe, DatePipe, Icon, RouterLink],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css',
})
export class EventCard {
  readonly event = input.required<CharityEvent>();
  /** Return whether the server-normalised event instant has passed. */
  isPast(): boolean {
    return isPastEvent(this.event());
  }
  /** Calculate the capped fundraising percentage shown on the card. */
  progressPercent(): number {
    return Math.min(
      100,
      Math.round((this.event().total_progress / this.event().charity_goal) * 100),
    );
  }
}
