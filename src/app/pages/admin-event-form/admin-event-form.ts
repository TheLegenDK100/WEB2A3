/** @file Administration create/edit form for validated event records. */

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { readableError } from '../../core/http-error';
import {
  AdminRegistration,
  Category,
  CharityEvent,
  EventPayload,
  Organisation,
} from '../../core/models';
import { EVENT_TIMEZONES } from '../../core/event-status';
import { Icon } from '../../shared/icon/icon';
import { DateInput } from '../../shared/date-input/date-input';
@Component({
  imports: [CurrencyPipe, DatePipe, Icon, ReactiveFormsModule, RouterLink, DateInput],
  templateUrl: './admin-event-form.html',
  styleUrl: './admin-event-form.css',
})
export class AdminEventForm implements OnInit {
  readonly timezones = EVENT_TIMEZONES;
  readonly ready = signal(false);
  readonly eventId: number | null;
  readonly editing: boolean;
  readonly event = signal<CharityEvent | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form;
  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    route: ActivatedRoute,
    fb: FormBuilder,
  ) {
    this.editing = route.snapshot.paramMap.has('id');
    this.eventId = this.editing ? Number(route.snapshot.paramMap.get('id')) : null;
    this.form = fb.nonNullable.group({
      organisation_id: [0, [Validators.required, Validators.min(1)]],
      category_id: [0, [Validators.required, Validators.min(1)]],
      name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(180)]],
      description: [
        '',
        [Validators.required, Validators.minLength(20), Validators.maxLength(10000)],
      ],
      event_datetime: ['', Validators.required],
      event_timezone: ['Australia/Brisbane', Validators.required],
      location: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(180)]],
      purpose: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
      image_path: [
        'assets/event-coastal-colour-run.png',
        [Validators.required, Validators.pattern(/^assets\/.+/)],
      ],
      ticket_price: [0, [Validators.required, Validators.min(0), Validators.max(99999999.99)]],
      charity_goal: [
        10000,
        [Validators.required, Validators.min(0.01), Validators.max(9999999999.99)],
      ],
      current_progress: [
        0,
        [Validators.required, Validators.min(0), Validators.max(9999999999.99)],
      ],
      is_suspended: [false],
      latitude: [-27.4698, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [153.0251, [Validators.required, Validators.min(-180), Validators.max(180)]],
    });
  }
  /** Load reference data and, when editing, patch the selected event into the form. */
  ngOnInit(): void {
    forkJoin({
      categories: this.api.getCategories(),
      organisations: this.api.getOrganisations(),
      event: this.editing ? this.api.getAdminEvent(this.eventId!) : of(null),
    }).subscribe({
      next: ({ categories, organisations, event }) => {
        this.categories.set(categories);
        this.organisations.set(organisations);
        if (event) {
          this.event.set(event);
          this.form.patchValue({
            ...event,
            is_suspended: Boolean(event.is_suspended),
            event_datetime: event.event_datetime.slice(0, 16),
          });
        }
        this.ready.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(readableError(error));
        this.loading.set(false);
      },
    });
  }
  /** Validate the form and persist a new or updated event through the API. */
  save(): void {
    if (!this.ready() || this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please correct the highlighted fields.');
      return;
    }
    const value = this.form.getRawValue();
    if (value.current_progress > value.charity_goal) {
      this.error.set('Current progress cannot exceed the charity goal.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const request = this.editing
      ? this.api.updateEvent(this.eventId!, value as EventPayload)
      : this.api.createEvent(value as EventPayload);
    request.subscribe({
      next: () =>
        this.router.navigateByUrl('/admin/events', {
          state: {
            message: this.editing ? 'Event updated successfully.' : 'Event created successfully.',
          },
        }),
      error: (error) => {
        this.error.set(readableError(error));
        this.saving.set(false);
      },
    });
  }
  /** Return full registration records for the selected admin event. */
  registrations(): AdminRegistration[] {
    return (this.event()?.registrations || []) as AdminRegistration[];
  }
  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }
}
