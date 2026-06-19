import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export type ContentBlock = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

export interface McpMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
}

interface ChatSimpleResponse { response: string; }
interface ChatResponse { response: string; }
interface WebSearchResponse { results: Array<{ title: string; url: string; snippet: string }>; }
interface ErrorResponse { error: string; }

@Injectable({ providedIn: 'root' })
export class McpService {
  private readonly http = inject(HttpClient);
  private readonly serverUrl = environment.mcpServerUrl;

  chatSimple(prompt: string, system?: string): Observable<string> {
    return this.http
      .post<ChatSimpleResponse | ErrorResponse>(`${this.serverUrl}/chat_simple`, {
        prompt,
        system,
      })
      .pipe(
        switchMap((result) => {
          if ('error' in result) {
            throw new Error(result.error);
          }
          return [result.response];
        })
      );
  }

  chat(messages: McpMessage[]): Observable<string> {
    return this.http
      .post<ChatResponse | ErrorResponse>(`${this.serverUrl}/chat`, { messages })
      .pipe(
        switchMap((result) => {
          if ('error' in result) {
            throw new Error(result.error);
          }
          return [result.response];
        })
      );
  }

  webSearch(query: string): Observable<WebSearchResponse['results']> {
    return this.http
      .post<WebSearchResponse | ErrorResponse>(`${this.serverUrl}/web_search`, { query })
      .pipe(
        switchMap((result) => {
          if ('error' in result) {
            throw new Error(result.error);
          }
          return [result.results];
        })
      );
  }
}
