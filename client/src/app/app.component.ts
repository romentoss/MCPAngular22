import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav class="navbar">
      <div class="nav-brand">MCP × MiniMax</div>
      <div class="nav-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Chat</a>
        <a routerLink="/journal" routerLinkActive="active">Journal de Errores</a>
      </div>
    </nav>
    <router-outlet />
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 0.75rem 1.5rem;
      background: #1a1a2e;
      border-bottom: 1px solid #2a2a4a;
    }
    .nav-brand {
      font-weight: 700;
      font-size: 1rem;
      color: #a0a0e0;
    }
    .nav-links {
      display: flex;
      gap: 1.5rem;
    }
    .nav-links a {
      color: #888;
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.3rem 0;
      border-bottom: 2px solid transparent;
      transition: color 0.2s, border-color 0.2s;
    }
    .nav-links a:hover { color: #c0c0e0; }
    .nav-links a.active {
      color: #c0c0ff;
      border-bottom-color: #6060c0;
    }
  `],
})
export class AppComponent {}
