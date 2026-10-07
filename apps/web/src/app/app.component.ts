import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StoreService } from './core/store.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly store = inject(StoreService);
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
}
