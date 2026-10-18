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
  isPast(): boolean {
    return isPastEvent(this.event());
  }
  progressPercent(): number {
    return Math.min(
      100,
      Math.round((this.event().total_progress / this.event().charity_goal) * 100),
    );
  }
}
