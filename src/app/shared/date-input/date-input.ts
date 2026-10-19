/** @file English calendar control implementing Angular's ControlValueAccessor contract. */

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { Icon } from '../icon/icon';

/**
 * Validate an ISO calendar date without relying on browser locale parsing.
 *
 * @param value Date text in `YYYY-MM-DD` format.
 * @returns True when the date is a real calendar date.
 */
export function validCalendarDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

@Component({
  selector: 'app-date-input',
  imports: [Icon],
  templateUrl: './date-input.html',
  styleUrl: './date-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateInput),
      multi: true,
    },
  ],
})
export class DateInput implements ControlValueAccessor, Validator {
  private readonly changeDetector = inject(ChangeDetectorRef);
  @Input({ required: true }) inputId = '';
  @Input() withTime = false;
  @Input() invalid = false;
  @ViewChild('calendar') private calendar!: ElementRef<HTMLDialogElement>;
  readonly months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  dateValue = '';
  timeValue = '';
  disabled = false;
  year = new Date().getFullYear();
  month = new Date().getMonth();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Write the form model value into the date and time controls. */
  writeValue(value: string | null): void {
    const [date = '', time = ''] = (value || '').split('T');
    this.dateValue = date;
    this.timeValue = time;
    this.changeDetector.markForCheck();
  }
  /** Register the callback used when the user selects a new value. */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  /** Register the callback used when the control is touched. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  /** Reflect the disabled state from the parent reactive form. */
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.changeDetector.markForCheck();
  }
  /** Validate either a date-only or date-time form value. */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '');
    if (!value) return null;
    const [date] = value.split('T');
    const valid = this.withTime
      ? /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value)
      : validCalendarDate(value);
    return valid && validCalendarDate(date) ? null : { calendarDate: true };
  }
  /** Update the selected date and emit the combined control value. */
  changeDate(value: string): void {
    this.dateValue = value;
    if (this.withTime && value && !this.timeValue) this.timeValue = '09:00';
    this.emitValue();
  }
  /** Update the selected time and emit the combined control value. */
  changeTime(value: string): void {
    this.timeValue = value;
    this.emitValue();
  }
  touch(): void {
    this.onTouched();
  }
  private emitValue(): void {
    this.onChange(
      this.withTime && (this.dateValue || this.timeValue)
        ? `${this.dateValue}T${this.timeValue}`
        : this.dateValue,
    );
  }
  /** Open the locale-independent English calendar dialog. */
  openCalendar(): void {
    if (this.disabled) return;
    const selected = validCalendarDate(this.dateValue)
      ? new Date(`${this.dateValue}T00:00:00Z`)
      : null;
    this.year = selected?.getUTCFullYear() ?? new Date().getFullYear();
    this.month = selected?.getUTCMonth() ?? new Date().getMonth();
    this.calendar.nativeElement.showModal();
  }
  closeCalendar(): void {
    this.calendar.nativeElement.close();
    this.touch();
  }
  /** Move the visible calendar by a signed month offset. */
  moveMonth(offset: number): void {
    const next = new Date(Date.UTC(this.year, this.month + offset, 1));
    if (next.getUTCFullYear() < 1000 || next.getUTCFullYear() > 9999) return;
    this.year = next.getUTCFullYear();
    this.month = next.getUTCMonth();
  }
  changeYear(value: string): void {
    if (/^[1-9]\d{3}$/.test(value)) this.year = Number(value);
  }
  /** Return calendar cells, including zero placeholders before the first day. */
  days(): number[] {
    const offset = (new Date(Date.UTC(this.year, this.month, 1)).getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(this.year, this.month + 1, 0)).getUTCDate();
    return [...Array<number>(offset).fill(0), ...Array.from({ length: count }, (_, i) => i + 1)];
  }
  isoDate(day: number): string {
    return `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  dayLabel(day: number): string {
    return `${day} ${this.months[this.month]} ${this.year}`;
  }
  /** Select a calendar day and close the dialog. */
  selectDay(day: number): void {
    this.changeDate(this.isoDate(day));
    this.closeCalendar();
  }
  today(): void {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
    this.selectDay(now.getDate());
  }
  clear(): void {
    this.dateValue = '';
    this.timeValue = '';
    this.emitValue();
    this.closeCalendar();
  }
}
