export interface Category {
  id: number;
  name: string;
  description: string;
}
export interface Organisation {
  id: number;
  name: string;
  mission: string;
  email: string;
  phone: string;
  website: string | null;
}
export interface PublicRegistration {
  id: number;
  display_name: string;
  ticket_count: number;
  registered_at: string;
}
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
export interface RegistrationPayload {
  event_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ticket_count: number;
}
