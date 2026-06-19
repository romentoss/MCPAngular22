# MCP MiniMax + Angular 22

**Chat web con IA en tiempo real, sin terminal, sin configuración compleja.**

---

## Propósito

Esta aplicación permite a **cualquier persona con una API key de MiniMax** usar un chat web completo con IA, sin necesidad de abrir terminal, consola de comandos ni configurar Claude Code. Solo necesita:

1. Tener sus propias API keys (MiniMax + Tavily)
2. Ejecutar `pnpm install && pnpm dev` en el servidor
3. Ejecutar `pnpm install && pnpm start` en el cliente
4. Abrir `http://localhost:4200` en el navegador

La webapp también sirve como **proyecto educativo** para aprender:

- **Angular 22** con sus novedades (standalone components, new control flow `@if/@for`, signals, inject())
- **Model Context Protocol (MCP)** cómo conectar apps con modelos de lenguaje via tools
- **Tool calling** — cómo los modelos invocan funciones automáticamente
- **Programación reactiva** con RxJS y Angular HttpClient
- **Node.js + Express** como puente entre frontend y APIs de IA

---

## Stack tecnológico

| Capa | Tecnología | Qué hace |
|------|-----------|-----------|
| Frontend | **Angular 22** | SPA con standalone components, control flow nuevo, signals |
| Servidor | **Node.js + Express** | Expone endpoints REST y conecta con MiniMax |
| IA | **MiniMax-M2.7** | Modelo de lenguaje con tool calling |
| Búsqueda | **Tavily Search API** | Búsqueda web en tiempo real (1000 req/día gratis) |
| Protocolo | **MCP (Model Context Protocol)** | Estándar para conectar apps con modelos + tools |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Navegador                                  │
│  ┌──────────────────┐       ┌──────────────────────────────┐  │
│  │  Angular 22 SPA  │──────►│  http://localhost:3000       │  │
│  │  localhost:4200   │◄──────│  Express + MCP Server        │  │
│  └──────────────────┘       └──────────────┬───────────────┘  │
└──────────────────────────────────────────────│──────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────┐
                    │                          ▼                  │
                    │  ┌──────────────────────────────┐           │
                    │  │  ¿MiniMax necesita info      │           │
                    │  │  actualizada?                 │           │
                    │  │         SÍ ▼                  │           │
                    │  │  ┌──────────────────────┐    │           │
                    │  │  │ Tavily Search API    │    │           │
                    │  │  │ (búsqueda web)      │    │           │
                    │  │  └──────────────────────┘    │           │
                    │  │              NO ▼             │           │
                    │  └──────────────────────────────┘           │
                    │                    │                        │
                    ▼                    ▼                        ▼
            ┌─────────────────────────────────────────────────────┐
            │              MiniMax API (api.minimax.io)            │
            │              MiniMax-M2.7 + tool calling             │
            └─────────────────────────────────────────────────────┘
```

**Flujo completo:**
1. Usuario escribe mensaje en Angular
2. Angular envía a Express via `POST /chat_simple`
3. Express pasa el mensaje a MiniMax con `tools: [web_search]`
4. Si MiniMax detecta que necesita info actualizada → invoca `web_search`
5. Express ejecuta la búsqueda en Tavily → devuelve `tool_result`
6. MiniMax responde con la información actualizada
7. Angular muestra la respuesta en el chat

---

## Novedades de Angular 22 usadas en este proyecto

| Feature | Cómo se usa |
|---------|------------|
| **Standalone components** | Todos los componentes son `standalone: true`, sin NgModules |
| **New control flow** | `@if`, `@for`, `@else` en templates (reemplazan `*ngIf`, `*ngFor`) |
| **`inject()` function** | Inyección de dependencias con `inject(McpService)` en vez de constructor |
| **`signal()`** | Estado reactivo: `promptText = signal("")`, `loading = signal(false)`, `messages = signal([])`. No necesita Zone.js para re-render. |
| **`computed()`** | Estado derivado reactivo (ej: `canSend = computed(() => !loading() && prompt().trim() !== "")`) |
| **`update()` en signals** | Modifica arrays reactivos: `messages.update(msgs => [...msgs, newMsg])` |
| **Rutas con `routerLink`** | Navegación SPA entre Chat y Journal |
| **Sin ChangeDetectorRef** | Signals reemplazan el workaround de `markForCheck()` — son más granulares y eficientes |

---

## Servidor MCP (`/server`)

### Dependencias

#### `@modelcontextprotocol/sdk`
Biblioteca oficial del **Model Context Protocol** mantenida por Anthropic. Se usa para el servidor MCP stdio (para conectar con Claude Code).

#### `express` + `cors`
Servidor HTTP minimalista que expone los endpoints REST `/chat_simple`, `/chat`, `/web_search`.

#### `dotenv`
Carga variables de entorno desde `.env` (API keys fuera del código).

#### `zod`
Validación de esquemas TypeScript-first para los payloads de la API.

### Endpoints REST

| Método | Path | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/chat_simple` | Envía un prompt simple con tool calling automático |
| `POST` | `/chat` | Envía mensajes estructurados |
| `POST` | `/web_search` | Búsqueda directa en Tavily |

---

## Cliente Angular (`/client`)

### Dependencias

Angular 22 completo con `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`, `@angular/animations`, `@angular/platform-browser`.

**RxJS** — Programación reactiva para el servicio MCP:
```typescript
chatSimple(prompt: string): Observable<string> {
  return this.http.post<...>(url, body).pipe(
    switchMap((result) => {
      if ('error' in result) throw new Error(result.error);
      return [result.response];
    })
  );
}
```

**Zone.js** — Change detection automático. Sin él, cada respuesta HTTP requeriría `ChangeDetectorRef.detectChanges()` manual.

---

## Variables de entorno

### Servidor (`server/.env`)

```bash
MINIMAX_API_KEY=tu_api_key_de_minimax
TAVILY_API_KEY=tu_api_key_de_tavily
PORT=3000
STDIO=true   # Para usar como servidor MCP stdio (Claude Code)
```

### Cliente (`client/src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  mcpServerUrl: 'http://localhost:3000',
};
```

---

## Setup rápido

```bash
# 1. Servidor
cd MCPAngular22/server
cp .env.example .env
# Editar .env con tus API keys
pnpm install
pnpm dev          # http://localhost:3000

# 2. Cliente (otra terminal)
cd MCPAngular22/client
pnpm install
pnpm approve-builds  # una vez, seleccionar todos los paquetes
pnpm start           # http://localhost:4200
```

---

## Features implementadas

- ✅ Chat con MiniMax-M2.7
- ✅ Búsqueda web automática (MiniMax invoca tools cuando no sabe)
- ✅ Tool calling loop (MiniMax → tool → resultado → MiniMax responde)
- ✅ Navegación SPA (Chat + Journal de errores)
- ✅ Angular Signals para estado reactivo (sin Zone.js/ChangeDetectorRef)

## Features intentadas (fallidas)

- ❌ **Imágenes** — MiniMax-M2.7 no soporta visión. Necesitaría MiniMax-VL.

---

## Journal de errores

Todo el proceso de debugging está documentado en `/journal` dentro de la app y en `JOURNAL.md`. 13 pasos incluyendo la migración a Angular Signals.

---

## Extensiones sugeridas para estudiar

- **Streaming SSE** — Recibir respuestas token por token en vez de esperar el texto completo
- **Historial de chat** — Guardar conversación en localStorage o base de datos
- **Más tools MCP** — `image_generation`, `web_search` avanzada, `code_execution`
- **Autenticación** — Proteger endpoints con JWT
- **Despliegue** — Dockerizar servidor y cliente para deploy en producción
