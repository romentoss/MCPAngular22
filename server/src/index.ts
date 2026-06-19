import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { chatCompletion, ChatMessage } from './minimax-client.js';
import { webSearch } from './gemini-client.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const USE_STDIO = process.env.STDIO === 'true';

// Tool de búsqueda para MiniMax (formato Anthropic)
const minimaxTools = [
  {
    name: 'web_search',
    description: 'Busca información actualizada en internet cuando no tienes la información en tu conocimiento training.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'La consulta de búsqueda para encontrar información actualizada.',
        },
      },
      required: ['query'],
    },
  },
];

// ─── HTTP Server (para Angular) ────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/chat_simple', async (req, res) => {
  const { prompt, system, temperature } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const messages: ChatMessage[] = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    // Pasar tools para que MiniMax pueda buscar si no sabe la respuesta
    const result = await chatCompletion(messages, temperature, minimaxTools);
    res.json({ response: result.choices[0].message.content });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/chat', async (req, res) => {
  const { messages, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const result = await chatCompletion(messages, temperature, minimaxTools);
    res.json({ response: result.choices[0].message.content });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/web_search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const results = await webSearch(query);
    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── MCP Server (para stdio — Claude Code, etc.) ───────────────────────────────
const mcpServer = new Server(
  { name: 'minimax-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools: Tool[] = [
  {
    name: 'chat',
    description: 'Envía mensajes estructurados a MiniMax.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Mensajes de la conversación',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant', 'system'] },
              content: { type: 'string' },
            },
            required: ['content', 'role'],
          },
        },
        temperature: { type: 'number', description: 'Temperatura (0-2)' },
      },
      required: ['messages'],
    },
  },
  {
    name: 'chat_simple',
    description: 'Envía un prompt simple a MiniMax.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'El prompt' },
        system: { type: 'string', description: 'Mensaje de sistema opcional' },
        temperature: { type: 'number', description: 'Temperatura (0-2)' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'web_search',
    description: 'Busca información actualizada en internet.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'La consulta de búsqueda' },
      },
      required: ['query'],
    },
  },
];

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'chat') {
      const result = await chatCompletion(args.messages as ChatMessage[], args.temperature, minimaxTools);
      return { content: [{ type: 'text', text: result.choices[0].message.content }] };
    }

    if (name === 'chat_simple') {
      const messages: ChatMessage[] = [];
      if (args.system) messages.push({ role: 'system', content: args.system });
      messages.push({ role: 'user', content: args.prompt });
      const result = await chatCompletion(messages, args.temperature, minimaxTools);
      return { content: [{ type: 'text', text: result.choices[0].message.content }] };
    }

    if (name === 'web_search') {
      const results = await webSearch(args.query);
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (USE_STDIO) {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('MiniMax MCP Server running on stdio');
  } else {
    app.listen(PORT, () => {
      console.error(`MiniMax MCP Server running on http://localhost:${PORT}`);
    });
  }
}

main().catch(console.error);
