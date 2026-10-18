import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { readableError } from '../../core/http-error';
import { Category, CharityEvent } from '../../core/models';
import { EventCard } from '../../shared/event-card/event-card';
import { Icon } from '../../shared/icon/icon';
import { DateInput } from '../../shared/date-input/date-input';
@Component({
  imports: [EventCard, Icon, ReactiveFormsModule, DateInput],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private searchRequest?: Subscription;
  readonly categories = signal<Category[]>([]);
  readonly results = signal<CharityEvent[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly error = signal('');
  readonly form;
  constructor(
    private readonly api: ApiService,
    fb: FormBuilder,
  ) {
    this.form = fb.nonNullable.group({ date: '', location: '', category: '' });
  }
  ngOnInit(): void {
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.categories.set(items),
        error: (error) => this.error.set(readableError(error, 'Categories could not be loaded.')),
      });
  }
  /** Cancel outdated searches so they cannot repopulate a cleared form. */
  search(): void {
    this.searchRequest?.unsubscribe();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Enter a valid event date in YYYY-MM-DD format.');
      this.results.set([]);
      this.loading.set(false);
      this.searched.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.results.set([]);
    this.searched.set(true);
    const value = this.form.getRawValue();
    this.searchRequest = this.api
      .getEvents(value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this.results.set(events);
          this.loading.set(false);
        },
        error: (error) => {
          this.results.set([]);
          this.error.set(readableError(error, 'Search failed. Please try again.'));
          this.loading.set(false);
        },
      });
  }
  clear(): void {
    this.searchRequest?.unsubscribe();
    this.form.reset();
    this.results.set([]);
    this.searched.set(false);
    this.error.set('');
    this.loading.set(false);
  }
}
