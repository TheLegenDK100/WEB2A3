import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CharityEvent } from '../../core/models';
import { Search } from './search';

describe('Search request lifecycle', () => {
  it('blocks impossible typed dates with an English error and clears their validation state', () => {
    let requested = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        FormBuilder,
        {
          provide: ApiService,
          useValue: {
            getCategories: () => of([]),
            getEvents: () => {
              requested = true;
              return of([]);
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Search);
    fixture.detectChanges();
    const date = fixture.nativeElement.querySelector('#search-date') as HTMLInputElement;
    date.value = '2026-02-30';
    date.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.componentInstance.search();
    expect(requested).toBe(false);
    expect(fixture.componentInstance.error()).toBe(
      'Enter a valid event date in YYYY-MM-DD format.',
    );
    fixture.componentInstance.clear();
    fixture.detectChanges();
    expect(date.value).toBe('');
    expect(fixture.componentInstance.form.valid).toBe(true);
    expect(fixture.componentInstance.error()).toBe('');
  });
  it('does not allow an in-flight response to repopulate cleared results', () => {
    const response = new Subject<CharityEvent[]>();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        FormBuilder,
        {
          provide: ApiService,
          useValue: { getCategories: () => of([]), getEvents: () => response },
        },
      ],
    });
    const component = TestBed.createComponent(Search).componentInstance;
    component.form.patchValue({ location: 'Brisbane' });
    component.search();
    expect(component.loading()).toBe(true);
    component.clear();
    response.next([{ id: 999 } as CharityEvent]);
    expect(component.results()).toEqual([]);
    expect(component.searched()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.form.controls.location.value).toBe('');
  });
});
