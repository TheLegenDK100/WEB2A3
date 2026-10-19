/** @file Typed HTTP client for the HopeBridge REST API. */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CharityEvent, EventPayload, Organisation, RegistrationPayload } from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  /** @param http Angular HTTP client used for all API requests. */
  constructor(private readonly http: HttpClient) {}

  /** Read public events using any combination of date, location, and category filters. */
  getEvents(
    filters: { date?: string; location?: string; category?: string } = {},
  ): Observable<CharityEvent[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<CharityEvent[]>(`${this.baseUrl}/events/search`, { params });
  }

  /** Read one public event. Suspended events are deliberately unavailable through this endpoint. */
  getEvent(id: number): Observable<CharityEvent> {
    return this.http.get<CharityEvent>(`${this.baseUrl}/events/${id}`);
  }
  /** Read the database-provided event categories for the search form. */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }
  getOrganisations(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(`${this.baseUrl}/organisations`);
  }

  /** Create a visitor registration; the API enforces one email address per event. */
  register(
    payload: RegistrationPayload,
  ): Observable<{ id: number; event_name: string; message: string }> {
    return this.http.post<{ id: number; event_name: string; message: string }>(
      `${this.baseUrl}/registrations`,
      payload,
    );
  }
  getAdminEvents(): Observable<CharityEvent[]> {
    return this.http.get<CharityEvent[]>(`${this.baseUrl}/admin/events`);
  }

  /** Read an event and its full registration contact list for the administration view. */
  getAdminEvent(id: number): Observable<CharityEvent> {
    return this.http.get<CharityEvent>(`${this.baseUrl}/admin/events/${id}`);
  }
  createEvent(payload: EventPayload): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.baseUrl}/admin/events`, payload);
  }
  updateEvent(id: number, payload: EventPayload): Observable<{ id: number; message: string }> {
    return this.http.put<{ id: number; message: string }>(
      `${this.baseUrl}/admin/events/${id}`,
      payload,
    );
  }
  deleteEvent(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/admin/events/${id}`);
  }
}
