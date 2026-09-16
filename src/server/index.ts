import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAdminAction, closeTicket, publicState, resetSimulation, sendTicketMessage } from './simulation.js';
import type { AdminAction } from '../shared/types.js';

const host = process.env.IOL_API_HOST ?? '127.0.0.1';
const port = parsePort(process.env.IOL_API_PORT ?? '4173');
const webOrigin = parseOrigin(process.env.IOL_WEB_ORIGIN ?? 'http://localhost:5173');

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: webOrigin
});

app.get('/api/health', async () => ({ ok: true, name: 'identity-ops-lab-lite' }));
app.get('/api/state', async () => publicState());
app.post('/api/reset', async () => resetSimulation());

app.post<{ Body: unknown }>('/api/admin-action', async (request, reply) => {
  if (!isAdminAction(request.body)) return reply.status(400).send({ error: 'Invalid admin action payload.' });
  try {
    return {
      ok: true,
      state: applyAdminAction(request.body)
    };
  } catch (error) {
    return domainError(reply, error);
  }
});

app.post<{ Params: { ticketId: string }; Body: unknown }>('/api/tickets/:ticketId/messages', async (request, reply) => {
  if (!isMessageBody(request.body)) return reply.status(400).send({ error: 'Message body is required.' });
  try {
    return sendTicketMessage(request.params.ticketId, request.body.body);
  } catch (error) {
    return domainError(reply, error);
  }
});

app.post<{ Params: { ticketId: string } }>('/api/tickets/:ticketId/close', async (request, reply) => {
  try {
    return closeTicket(request.params.ticketId);
  } catch (error) {
    return domainError(reply, error);
  }
});

const distPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
if (existsSync(distPath)) {
  await app.register(fastifyStatic, {
    root: distPath,
    wildcard: false
  });
  app.setNotFoundHandler((request, reply) => {
    if (request.raw.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.sendFile('index.html');
    }
    return reply.status(404).send({ error: 'Not found.' });
  });
}

await app.listen({ host, port });

function isAdminAction(value: unknown): value is AdminAction {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'add_group' || value.type === 'remove_group') {
    return isId(value.employeeId) && isId(value.groupId);
  }
  if (value.type === 'reset_mfa' || value.type === 'complete_mfa_registration' || value.type === 'disable_account' || value.type === 'revoke_sessions') {
    return isId(value.employeeId);
  }
  if (value.type === 'mark_device_compliant') return isId(value.deviceId);
  return false;
}

function isMessageBody(value: unknown): value is { body: string } {
  return isRecord(value) && typeof value.body === 'string' && value.body.trim().length > 0 && value.body.length <= 1000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{3,64}$/i.test(value);
}

function domainError(reply: { status: (code: number) => { send: (payload: { error: string }) => unknown } }, error: unknown) {
  if (error instanceof Error && error.message.startsWith('Unknown ')) {
    return reply.status(404).send({ error: error.message });
  }
  throw error;
}

function parsePort(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new Error('IOL_API_PORT must be an integer from 1 to 65535.');
  return parsed;
}

function parseOrigin(value: string) {
  if (value === '*') throw new Error('Wildcard IOL_WEB_ORIGIN is not allowed.');
  return value.split(',').map((origin) => {
    const trimmed = origin.trim();
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('IOL_WEB_ORIGIN must use http or https.');
    return trimmed;
  });
}
