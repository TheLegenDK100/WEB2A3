/** A database-backed event category shown in the search filter. */
export interface Category {
  id: number;
  name: string;
  description: string;
}
/** A fictional charity organisation displayed on the home and detail pages. */
export interface Organisation {
  id: number;
  name: string;
  mission: string;
  email: string;
  phone: string;
  website: string | null;
}
/** Privacy-safe registration summary returned by the public detail endpoint. */
export interface PublicRegistration {
  id: number;
  display_name: string;
  ticket_count: number;
  registered_at: string;
}
/** Full registration record visible in the administration view. */
export interface AdminRegistration {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ticket_count: number;
  unit_price: number;
  registered_at: string;
}
/** Complete event projection shared by public and administration screens. */
export interface CharityEvent {
  id: number;
  organisation_id: number;
  category_id: number;
  name: string;
  description: string;
  event_datetime: string;
  event_timezone: string;
  starts_at: string;
  location: string;
  purpose: string;
  image_path: string;
  ticket_price: number;
  charity_goal: number;
  current_progress: number;
  total_progress: number;
  is_suspended: number;
  latitude: number;
  longitude: number;
  category_name: string;
  organisation_name: string;
  organisation_mission: string;
  organisation_email: string;
  organisation_phone: string;
  organisation_website: string | null;
  registration_count: number;
  registered_tickets: number;
  registrations?: PublicRegistration[] | AdminRegistration[];
}
/** Request body used to create or update an event. */
export interface EventPayload {
  organisation_id: number;
  category_id: number;
  name: string;
  description: string;
  event_datetime: string;
  event_timezone: string;
  location: string;
  purpose: string;
  image_path: string;
  ticket_price: number;
  charity_goal: number;
  current_progress: number;
  is_suspended: boolean;
  latitude: number;
  longitude: number;
}
/** Request body used to create a visitor registration. */
export interface RegistrationPayload {
  event_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ticket_count: number;
}
