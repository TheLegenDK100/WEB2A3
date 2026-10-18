import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { isPastEvent } from '../../core/event-status';
import { ApiService } from '../../core/api.service';
import { readableError } from '../../core/http-error';
import { CharityEvent } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
@Component({
  imports: [CurrencyPipe, DatePipe, Icon, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly isPast = isPastEvent;
  readonly event = signal<CharityEvent | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal<{ id: number; event_name: string } | null>(null);
  readonly form;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    fb: FormBuilder,
  ) {
    this.form = fb.nonNullable.group({
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.required, Validators.pattern(/^[+()\d\s-]{8,30}$/)]],
      ticket_count: [
        1,
        [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^\d+$/)],
      ],
    });
  }
  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.event.set(null);
          this.success.set(null);
          this.error.set('');
          this.loading.set(true);
          this.form.reset();
          return this.api.getEvent(Number(params.get('event_id'))).pipe(
            catchError((error) => {
              this.error.set(readableError(error, 'The selected event could not be loaded.'));
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
  submit(): void {
    if (this.submitting() || !this.event() || isPastEvent(this.event()!)) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.api
      .register({ event_id: this.event()!.id, ...this.form.getRawValue() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.success.set({ id: response.id, event_name: response.event_name });
          this.submitting.set(false);
        },
        error: (error) => {
          this.error.set(readableError(error, 'Registration could not be completed.'));
          this.submitting.set(false);
        },
      });
  }
  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }
  total(): number {
    return (this.event()?.ticket_price || 0) * this.form.controls.ticket_count.value;
  }
}
