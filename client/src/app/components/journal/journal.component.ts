import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface JournalEntry {
  step: number;
  title: string;
  problem?: string;
  solution: string;
  tags: string[];
  status: 'error' | 'feature' | 'failed';
}

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="journal-page">
      <div class="hero">
        <div class="hero-badge"><span>🐛</span> Debug Journal</div>
        <h1>Así construimos este proyecto</h1>
        <p class="hero-subtitle">13 pasos, 1 chat con IA en tiempo real y mucho aprendizaje.</p>
        <div class="tech-chips">
          <span class="chip chip-angular">Angular 22</span>
          <span class="chip chip-node">Node.js + Express</span>
          <span class="chip chip-mcp">MCP Protocol</span>
          <span class="chip chip-minimax">MiniMax-M2.7</span>
          <span class="chip chip-tavily">Tavily Search</span>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat"><span class="stat-num">13</span><span class="stat-label">Pasos</span></div>
        <div class="stat"><span class="stat-num stat-err">10</span><span class="stat-label">Errores resueltos</span></div>
        <div class="stat"><span class="stat-num stat-feat">2</span><span class="stat-label">Features (búsqueda + signals)</span></div>
        <div class="stat"><span class="stat-num stat-fail">1</span><span class="stat-label">Feature fallida</span></div>
      </div>

      @for (entry of entries; track entry.step) {
        <div class="entry" [class]="'s-' + entry.status" [class.open]="expandedSteps.has(entry.step)">
          <div class="entry-hdr" (click)="toggle(entry.step)">
            <div class="badge" [class]="'b-' + entry.status">
              @if (entry.status === 'error') { 🐛 }
              @if (entry.status === 'feature') { ✨ }
              @if (entry.status === 'failed') { ❌ }
              {{ entry.step }}
            </div>
            <div class="entry-info">
              <h3>{{ entry.title }}</h3>
              <div class="tags">
                @for (tag of entry.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
            <div class="exp">{{ expandedSteps.has(entry.step) ? '−' : '+' }}</div>
          </div>
          @if (expandedSteps.has(entry.step)) {
            <div class="entry-body">
              @if (entry.problem) {
                <div class="sec sec-prob">
                  <div class="sec-label">⚠️ El problema</div>
                  <p>{{ entry.problem }}</p>
                </div>
              }
              <div class="sec sec-sol">
                <div class="sec-label">💡 Cómo lo solucionamos</div>
                <p>{{ entry.solution }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .journal-page { max-width: 860px; margin: 0 auto; padding: 1.5rem; font-family: 'Segoe UI', system-ui, sans-serif; }
    .hero { background: linear-gradient(135deg, #667eea, #764ba2, #f64f59); border-radius: 20px; padding: 2.5rem; margin-bottom: 1.5rem; color: #fff; }
    .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.2); padding: 0.4rem 0.9rem; border-radius: 50px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
    .hero h1 { font-size: 2.2rem; font-weight: 800; margin: 0 0 0.75rem; }
    .hero-subtitle { font-size: 1rem; opacity: 0.9; margin: 0 0 1.5rem; max-width: 600px; line-height: 1.6; }
    .tech-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip { padding: 0.35rem 0.8rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
    .chip-angular { background: #dd0031; color: #fff; }
    .chip-node { background: #026e00; color: #fff; }
    .chip-mcp { background: #ff6b35; color: #fff; }
    .chip-minimax { background: #00d4aa; color: #1a1a2e; }
    .chip-tavily { background: #00b4d8; color: #fff; }
    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border-radius: 14px; padding: 1rem; text-align: center; border: 2px solid #eee; }
    .stat-num { display: block; font-size: 2rem; font-weight: 800; color: #1a1a2e; }
    .stat-err { color: #f64f59; }
    .stat-feat { color: #00b4d8; }
    .stat-fail { color: #764ba2; }
    .stat-label { display: block; font-size: 0.75rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
    .entry { background: #fff; border-radius: 16px; border: 2px solid #eee; margin-bottom: 0.75rem; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .entry:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .s-error { border-color: #fde8e8; }
    .s-feature { border-color: #dffaf4; }
    .s-failed { border-color: #f3e8fd; }
    .entry-hdr { display: flex; align-items: center; gap: 0.85rem; padding: 1rem 1.2rem; cursor: pointer; }
    .badge { display: flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; border-radius: 10px; font-size: 0.85rem; font-weight: 800; min-width: 52px; justify-content: center; flex-shrink: 0; }
    .b-error { background: #fde8e8; color: #f64f59; }
    .b-feature { background: #dffaf4; color: #00b4d8; }
    .b-failed { background: #f3e8fd; color: #764ba2; }
    .entry-info { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
    .entry-info h3 { font-size: 0.95rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .tag { padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600; background: #f0f0f0; color: #666; }
    .exp { width: 26px; height: 26px; background: #f5f5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: #aaa; flex-shrink: 0; }
    .entry-body { padding: 0 1.2rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .sec { padding: 0.9rem; border-radius: 10px; }
    .sec-prob { background: #fef2f2; border-left: 4px solid #f64f59; }
    .sec-sol { background: #f0fdf4; border-left: 4px solid #22c55e; }
    .sec-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; }
    .sec-prob .sec-label { color: #f64f59; }
    .sec-sol .sec-label { color: #22c55e; }
    .sec p { margin: 0; font-size: 0.88rem; line-height: 1.65; }
    .sec-prob p { color: #7f1d1d; }
    .sec-sol p { color: #14532d; }
    @media (max-width: 600px) {
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .stat-label { font-size: 0.65rem; }
      .hero h1 { font-size: 1.6rem; }
    }
  `],
})
export class JournalComponent {
  expandedSteps = new Set<number>([1]);

  entries: JournalEntry[] = [
    { step: 1, title: 'pnpm @9 — versión inválida en packageManager', problem: 'Al ejecutar pnpm install dio error: "Cannot use packageManager pnpm@9: 9 is not a valid exact version".', solution: 'El campo "packageManager" requiere la versión completa (ej: "pnpm@9.0.0"). Lo más simple es removerlo ya que pnpm suele estar instalado globalmente.', tags: ['pnpm', 'config'], status: 'error' },
    { step: 2, title: 'pnpm approve-builds — scripts nativos bloqueados', problem: 'pnpm 11 no deja compilar dependencias nativas (esbuild, lmdb) sin aprobación explícita.', solution: 'Ejecutar pnpm approve-builds una vez y marcar todos los paquetes con Space + Enter. Es una medida de seguridad de pnpm 11.', tags: ['pnpm', 'native'], status: 'error' },
    { step: 3, title: 'TypeScript 5.6 incompatible con Angular 22', problem: 'Angular 22 necesita TypeScript >=6.0.0 pero package.json tenía "~5.6.0".', solution: 'Cambiar en client/package.json: "typescript": "~5.6.0" → "~6.0.0".', tags: ['typescript', 'angular'], status: 'error' },
    { step: 4, title: 'baseUrl deprecado en TypeScript 6', problem: 'tsconfig.json tenía "baseUrl": "./" que en TypeScript 6 genera error TS5101.', solution: 'Agregar "ignoreDeprecations": "6.0" en compilerOptions del tsconfig.json.', tags: ['typescript', 'tsconfig'], status: 'error' },
    { step: 5, title: 'Servidor HTTP mal implementado con SDK MCP', problem: 'Se intentó usar server.connection.read().requestHandler() para HTTP pero el SDK MCP solo funciona con StdioServerTransport.', solution: 'Express puro para HTTP (endpoints /chat_simple, /chat, /health). El @modelcontextprotocol/sdk se mantiene solo para el modo stdio (conectar con Claude Code).', tags: ['server', 'mcp', 'express'], status: 'error' },
    { step: 6, title: 'Endpoint wrong de MiniMax — usábamos el de OpenAI', problem: 'MiniMax API devolvía 404. Estábamos usando api.minimax.chat/v1/chat/completions (formato OpenAI).', solution: 'MiniMax usa endpoint Anthropic-compatible: https://api.minimax.io/anthropic/v1/messages.', tags: ['minimax', 'api', 'endpoint'], status: 'error' },
    { step: 7, title: 'API key de proveedor incorrecto', problem: 'Se había puesto una key "sk-api-cSmPx..." de otro proveedor. MiniMax la rechazaba con 401.', solution: 'Usar la API key de platform.minimax.io (la misma que usa Claude Code).', tags: ['minimax', 'api-key'], status: 'error' },
    { step: 8, title: 'Header de autenticación incorrecto', problem: 'Se usaba "Authorization: Bearer <key>" como en OpenAI. MiniMax lo rechazaba.', solution: 'MiniMax Anthropic-compatible usa headers: "x-api-key: <key>" + "anthropic-version: 2023-06-01".', tags: ['minimax', 'auth', 'headers'], status: 'error' },
    { step: 9, title: 'Nombre del modelo incorrecto', problem: 'Se usaba "MiniMax-Text-01" que no existe.', solution: 'El modelo correcto es "MiniMax-M2.7".', tags: ['minimax', 'model'], status: 'error' },
    { step: 10, title: 'Angular no actualizaba la vista — Fix inicial con ChangeDetectorRef', problem: 'El servidor devolvía la respuesta correcta pero la UI no se actualizaba. HttpClient opera fuera de Zone.js.', solution: 'Workaround inicial: inyectar ChangeDetectorRef y llamar cdr.markForCheck() después de modificar el array messages.', tags: ['angular', 'zone.js', 'http'], status: 'error' },
    { step: 11, title: 'MiniMax no buscaba en internet automáticamente', problem: 'MiniMax respondía "no tengo capacidad de navegar" aunque teníamos búsqueda web disponible.', solution: 'Se descubrió que MiniMax-M2.7 SÍ soporta tool calling. Ahora MiniMax invoca automáticamente web_search cuando detecta que necesita info actualizada. La búsqueda usa Tavily Search API (1000 req/día gratis).', tags: ['minimax', 'tool-calling', 'tavily', 'web-search', 'feature'], status: 'feature' },
    { step: 12, title: 'Intento fallido de soporte para imágenes', problem: '413 Payload Too Large + MiniMax devolvía "no veo ninguna imagen adjunta".', solution: 'Se aumentó límite de Express a 10MB y se implementó compresión JPEG. PERO al probar con curl, MiniMax-M2.7 respondió que no puede ver imágenes. El modelo no tiene visión. Se necesitaría MiniMax-VL.', tags: ['minimax', 'vision', 'images', 'failed'], status: 'failed' },
    { step: 13, title: 'Migración a Angular Signals (novedad Angular 22)', problem: 'Se usaba ChangeDetectorRef.markForCheck() como workaround para Zone.js.', solution: 'Se migró a signal() para estado reactivo: promptText = signal(""), loading = signal(false), messages = signal([]). Ya no hace falta ChangeDetectorRef ni Zone.js — Signals disparan re-render automáticamente. También se usa computed() para estado derivado y update() para modificar arrays. Esta es la forma moderna de Angular 22.', tags: ['angular', 'signals', 'feature'], status: 'feature' },
  ];

  toggle(step: number): void {
    if (this.expandedSteps.has(step)) {
      this.expandedSteps.delete(step);
    } else {
      this.expandedSteps.add(step);
    }
  }
}
