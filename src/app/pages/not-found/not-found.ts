import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  template: `<section class="container page-band">
    <div class="page-heading">
      <p class="eyebrow">404 error</p>
      <h1>Page not found</h1>
      <p>The page may have moved or the address may be incorrect.</p>
    </div>
    <a class="button" routerLink="/">Return home</a>
  </section>`,
})
export class NotFound {}
