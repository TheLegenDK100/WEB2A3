/** @file Deep-link route table for public visitor and administration pages. */

import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Search } from './pages/search/search';
import { EventDetail } from './pages/event-detail/event-detail';
import { Register } from './pages/register/register';
import { AdminEvents } from './pages/admin-events/admin-events';
import { AdminEventForm } from './pages/admin-event-form/admin-event-form';
import { NotFound } from './pages/not-found/not-found';
/** Route metadata also supplies browser document titles for each page. */
export const routes: Routes = [
  { path: '', component: Home, title: 'HopeBridge | Charity Events' },
  { path: 'search', component: Search, title: 'Search Events | HopeBridge' },
  { path: 'events/:id', component: EventDetail, title: 'Event Details | HopeBridge' },
  { path: 'register', component: Register, title: 'Register | HopeBridge' },
  { path: 'admin/events', component: AdminEvents, title: 'Manage Events | HopeBridge' },
  { path: 'admin/events/new', component: AdminEventForm, title: 'Create Event | HopeBridge' },
  { path: 'admin/events/:id/edit', component: AdminEventForm, title: 'Edit Event | HopeBridge' },
  { path: '**', component: NotFound, title: 'Page Not Found | HopeBridge' },
];
