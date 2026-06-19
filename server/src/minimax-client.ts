import { z } from 'zod';

const MiniMaxApiKey = process.env.MINIMAX_API_KEY;
const MiniMaxBaseUrl = 'https://api.minimax.io/anthropic/v1';

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
}

interface MiniMaxToolResult {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface MiniMaxToolResultMessage {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const toolsSchema = z.array(z.object({
  name: z.string(),
  description: z.string(),
  input_schema: z.object({
    type: z.string(),
    properties: z.record(z.any()).optional(),
    required: z.array(z.string()).optional(),
  }),
}));

type Tools = z.infer<typeof toolsSchema>;

async function chatCompletionSingle(
  messages: ChatMessage[],
  tools?: Tools,
  temperature?: number
): Promise<{
  content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }>;
  usage: { input_tokens: number; output_tokens: number };
}> {
  if (!MiniMaxApiKey) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  const body: Record<string, unknown> = {
    model: 'MiniMax-M2.7',
    messages,
    max_tokens: 4096,
  };

  if (temperature !== undefined) {
    body.temperature = temperature;
  }

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const response = await fetch(`${MiniMaxBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': MiniMaxApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MiniMax API error ${response.status}: ${error}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  return data;
}

export async function chatCompletion(
  messages: ChatMessage[],
  temperature?: number,
  tools?: Tools
): Promise<ChatCompletionResponse> {
  if (!MiniMaxApiKey) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  let result = await chatCompletionSingle(messages, tools, temperature);

  // Si MiniMax quiere usar una herramienta, ejecutarla y continuar el loop
  while (result.content.some((c) => c.type === 'tool_use')) {
    const toolCalls: MiniMaxToolResult[] = result.content
      .filter((c): c is MiniMaxToolResult => c.type === 'tool_use')
      .map((c) => ({ type: 'tool_use', id: c.id!, name: c.name, input: c.input! }));

    const toolResults: MiniMaxToolResultMessage[] = [];

    for (const tool of toolCalls) {
      const { webSearch } = await import('./gemini-client.js');

      try {
        const query = tool.input.query as string;
        const searchResults = await webSearch(query);

        const formatted = searchResults
          .slice(0, 5)
          .map((r) => `**${r.title}** — ${r.url}\n${r.snippet}`)
          .join('\n\n');

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: formatted || 'No se encontraron resultados.',
        });
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: `Error en la búsqueda: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    // Agregar las respuestas de las herramientas a los mensajes
    messages.push({
      role: 'assistant',
      content: JSON.stringify(toolCalls.map((t) => ({ type: t.type, id: t.id, name: t.name, input: t.input }))),
    });

    for (const tr of toolResults) {
      messages.push({ role: 'user', content: JSON.stringify([tr]) });
    }

    result = await chatCompletionSingle(messages, tools, temperature);
  }

  const text = result.content.find((c) => c.type === 'text')?.text ?? '';

  return {
    id: crypto.randomUUID(),
    model: 'MiniMax-M2.7',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: text },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: result.usage.input_tokens,
      completion_tokens: result.usage.output_tokens,
      total_tokens: result.usage.input_tokens + result.usage.output_tokens,
    },
  };
}
