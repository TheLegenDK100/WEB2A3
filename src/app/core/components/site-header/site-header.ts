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
  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
