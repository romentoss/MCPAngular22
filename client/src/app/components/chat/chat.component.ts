import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { McpService, McpMessage } from '../../services/mcp.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header>
        <h1>MiniMax MCP Client</h1>
      </header>

      <div class="chat-window">
        @for (msg of messages(); track $index) {
          <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            <strong>{{ msg.role }}:</strong>
            <pre>{{ msg.content }}</pre>
          </div>
        }
        @if (loading()) {
          <div class="message assistant">
            <span class="loading-dots">Pensando<span>.</span><span>.</span><span>.</span></span>
          </div>
        }
      </div>

      <div class="input-area">
        <textarea
          [(ngModel)]="promptText"
          placeholder="Escribe tu mensaje..."
          rows="3"
          [disabled]="loading()"
          (keydown.ctrl.enter)="send()"
        ></textarea>
        <button (click)="send()" [disabled]="loading() || !promptText().trim()">
          Enviar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 800px; margin: 0 auto; padding: 1rem; display: flex; flex-direction: column; height: calc(100vh - 50px); }
    header { padding: 1rem 0; border-bottom: 1px solid #333; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; color: #fff; }
    .chat-window { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0; }
    .message { padding: 0.75rem; border-radius: 8px; background: #1a1a1a; max-width: 85%; }
    .message.user { background: #1a3a1a; align-self: flex-end; }
    .message.assistant { background: #1a1a3a; align-self: flex-start; }
    .message strong { text-transform: capitalize; }
    pre { margin: 0.3rem 0 0; white-space: pre-wrap; word-break: break-word; font-size: 0.9rem; }
    .input-area { display: flex; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #333; }
    textarea { flex: 1; background: #1a1a1a; border: 1px solid #333; border-radius: 6px; color: #e0e0e0; padding: 0.75rem; resize: none; font-family: inherit; }
    textarea:focus { outline: none; border-color: #555; }
    button { padding: 0.75rem 1.5rem; background: #3a3a8a; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 600; }
    button:hover:not(:disabled) { background: #4a4a9a; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading-dots span { animation: blink 1.4s infinite both; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
  `],
})
export class ChatComponent {
  private readonly mcp = inject(McpService);

  // ── Signals (Angular 22) ────────────────────────────────────
  // signal() crea estado reactivo que detecta cambios automáticamente
  // No necesita ChangeDetectorRef ni Zone.js para disparar re-renders
  promptText = signal('');
  loading = signal(false);
  messages = signal<McpMessage[]>([]);

  // ── Métodos ─────────────────────────────────────────────────
  send(): void {
    const text = this.promptText().trim();
    if (!text) return;

    // Actualizar signals — Angular detecta el cambio automáticamente
    this.messages.update((msgs) => [...msgs, { role: 'user', content: text }]);
    this.promptText.set('');
    this.loading.set(true);

    this.mcp.chatSimple(text).subscribe({
      next: (response) => {
        this.messages.update((msgs) => [...msgs, { role: 'assistant', content: response }]);
        this.loading.set(false);
      },
      error: (err) => {
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'assistant', content: `Error: ${err.message}` },
        ]);
        this.loading.set(false);
      },
    });
  }
}
