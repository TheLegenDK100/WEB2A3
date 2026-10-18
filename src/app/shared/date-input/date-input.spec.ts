import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateInput } from './date-input';

@Component({
  imports: [DateInput, ReactiveFormsModule],
  template: '<app-date-input inputId="venue-date" [withTime]="true" [formControl]="control" />',
})
class DateHost {
  readonly control = new FormControl('2026-10-24T18:30', { nonNullable: true });
}

describe('English date and venue time control', () => {
  it('preserves API values on edit, rejects impossible dates and invalid times, and resets', () => {
    const fixture = TestBed.createComponent(DateHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const fields = fixture.nativeElement.querySelectorAll(
      '.date-fields input',
    ) as NodeListOf<HTMLInputElement>;
    expect(fields[0].type).toBe('text');
    expect(fields[0].value).toBe('2026-10-24');
    expect(fields[1].value).toBe('18:30');
    const dateInput = fixture.debugElement.children[0].componentInstance as DateInput;
    const month = fixture.nativeElement.querySelector(
      'select[aria-label="Month"]',
    ) as HTMLSelectElement;
    expect(month.value).toBe(String(dateInput.month));
    expect(host.control.valid).toBe(true);
    fields[0].value = '2026-02-30';
    fields[0].dispatchEvent(new Event('input'));
    expect(host.control.invalid).toBe(true);
    fields[0].value = '2028-02-29';
    fields[0].dispatchEvent(new Event('input'));
    expect(host.control.valid).toBe(true);
    fields[1].value = '25:00';
    fields[1].dispatchEvent(new Event('input'));
    expect(host.control.invalid).toBe(true);
    fields[1].value = '07:45';
    fields[1].dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('2028-02-29T07:45');
    expect(host.control.valid).toBe(true);
    host.control.reset('');
    fixture.detectChanges();
    expect(fields[0].value).toBe('');
    expect(fields[1].value).toBe('');
  });
});
