/** @file Administration event list and safe-delete workflow. */

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { readableError } from '../../core/http-error';
import { CharityEvent } from '../../core/models';
import { isPastEvent } from '../../core/event-status';
import { Icon } from '../../shared/icon/icon';
@Component({
  imports: [CurrencyPipe, DatePipe, Icon, RouterLink],
  templateUrl: './admin-events.html',
  styleUrl: './admin-events.css',
})
export class AdminEvents implements OnInit {
  @ViewChild('deleteDialog') private deleteDialog!: ElementRef<HTMLDialogElement>;
  readonly deleting = signal(false);
  readonly events = signal<CharityEvent[]>([]);
  readonly loading = signal(true);
  readonly message = signal('');
  readonly error = signal('');
  readonly deleteTarget = signal<CharityEvent | null>(null);
  constructor(
    private readonly api: ApiService,
    router: Router,
  ) {
    this.message.set(router.currentNavigation()?.extras.state?.['message'] || '');
  }
  ngOnInit(): void {
    this.load();
  }
  /** Refresh all event records, including suspended events. */
  load(): void {
    this.loading.set(true);
    this.api.getAdminEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(readableError(error));
        this.loading.set(false);
      },
    });
  }
  /** Return the administration status label for one event. */
  status(event: CharityEvent): string {
    if (event.is_suspended) return 'Suspended';
    return isPastEvent(event) ? 'Past' : 'Upcoming';
  }
  publicCount(): number {
    return this.events().filter((event) => !event.is_suspended).length;
  }
  suspendedCount(): number {
    return this.events().filter((event) => event.is_suspended).length;
  }
  registrationCount(): number {
    return this.events().reduce((total, event) => total + event.registration_count, 0);
  }
  /** Delete an event only after the dialog and registration safeguards pass. */
  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || target.registration_count > 0 || this.deleting()) return;
    this.deleting.set(true);
    this.message.set('');
    this.error.set('');
    this.api.deleteEvent(target.id).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.deleting.set(false);
        this.closeDelete();
        this.load();
      },
      error: (error) => {
        this.error.set(readableError(error));
        this.deleting.set(false);
        this.closeDelete();
      },
    });
  }
  /** Open the confirmation dialog for the selected event. */
  openDelete(event: CharityEvent): void {
    this.deleteTarget.set(event);
    this.deleteDialog.nativeElement.showModal();
  }
  closeDelete(): void {
    if (this.deleting()) return;
    this.deleteDialog.nativeElement.close();
    this.deleteTarget.set(null);
  }
}
