/** @file Shared responsive navigation component. */

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../../shared/icon/icon';
@Component({
  selector: 'app-site-header',
  imports: [Icon, RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  readonly menuOpen = signal(false);
  /** Close the mobile navigation after a route selection. */
  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
