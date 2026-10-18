import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnChanges, OnDestroy, input, signal } from '@angular/core';
import { Subscription, timeout } from 'rxjs';
import { CharityEvent } from '../../core/models';
import { isPastEvent } from '../../core/event-status';
interface WeatherResponse {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}
@Component({
  selector: 'app-weather',
  imports: [DatePipe],
  templateUrl: './weather.html',
  styleUrl: './weather.css',
})
export class Weather implements OnChanges, OnDestroy {
  private request?: Subscription;
  readonly event = input.required<CharityEvent>();
  readonly loading = signal(false);
  readonly unavailable = signal('');
  readonly forecast = signal<{
    date: string;
    label: string;
    min: number;
    max: number;
    rain: number;
  } | null>(null);
  constructor(private readonly http: HttpClient) {}
  /** Only request dates covered by the provider's 16-day forecast window. */
  ngOnChanges(): void {
    this.request?.unsubscribe();
    this.loading.set(false);
    const event = this.event();
    const date = event.event_datetime.slice(0, 10);
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: event.event_timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const dayDifference =
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000;
    this.forecast.set(null);
    this.unavailable.set('');
    if (isPastEvent(event) || dayDifference > 15) {
      this.unavailable.set(
        isPastEvent(event)
          ? 'Weather is unavailable for past events.'
          : 'A forecast will appear within 15 days of the event.',
      );
      return;
    }
    this.loading.set(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${event.latitude}&longitude=${event.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(event.event_timezone)}&start_date=${date}&end_date=${date}`;
    this.request = this.http
      .get<WeatherResponse>(url)
      .pipe(timeout(15000))
      .subscribe({
        next: (data) => {
          const daily = data.daily;
          if (
            !daily ||
            daily.time?.[0] !== date ||
            ![
              daily.weather_code?.[0],
              daily.temperature_2m_min?.[0],
              daily.temperature_2m_max?.[0],
              daily.precipitation_probability_max?.[0],
            ].every((value) => typeof value === 'number' && Number.isFinite(value))
          ) {
            this.unavailable.set('The forecast is not available for this event date.');
            this.loading.set(false);
            return;
          }
          this.forecast.set({
            date: daily.time[0],
            label: this.weatherLabel(daily.weather_code[0]),
            min: daily.temperature_2m_min[0],
            max: daily.temperature_2m_max[0],
            rain: daily.precipitation_probability_max[0],
          });
          this.loading.set(false);
        },
        error: () => {
          this.unavailable.set('Live weather is temporarily unavailable.');
          this.loading.set(false);
        },
      });
  }
  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }
  private weatherLabel(code: number): string {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Fog possible';
    if (code <= 67) return 'Rain possible';
    if (code <= 77) return 'Snow possible';
    if (code <= 82) return 'Rain showers';
    return 'Thunderstorms possible';
  }
}
