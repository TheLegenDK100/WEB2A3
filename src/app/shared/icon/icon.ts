/** @file Small Lucide icon adapter used by accessible action controls. */

import { Component, ElementRef, Input } from '@angular/core';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarDays,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
  createElement as createLucideElement,
} from 'lucide';

const ICONS = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  check: Check,
  calendar: CalendarDays,
  menu: Menu,
  pencil: Pencil,
  plus: Plus,
  reset: RotateCcw,
  save: Save,
  search: Search,
  trash: Trash2,
  close: X,
} as const;

export type IconName = keyof typeof ICONS;

/** Renders the project's approved Lucide symbols with consistent sizing. */
@Component({
  selector: 'app-icon',
  template: '',
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      line-height: 0;
    }
  `,
})
export class Icon {
  /** @param host Element that receives the generated SVG icon. */
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  @Input({ required: true })
  set name(value: IconName) {
    const svg = createLucideElement(ICONS[value], {
      width: 18,
      height: 18,
      'stroke-width': 2,
    });
    svg.setAttribute('focusable', 'false');
    this.host.nativeElement.replaceChildren(svg);
  }
}
