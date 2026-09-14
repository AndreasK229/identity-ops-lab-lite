import Fastify from 'fastify';
import cors from '@fastify/cors';
import { applyAdminAction, closeTicket, publicState, resetSimulation, sendTicketMessage } from './simulation.js';
import type { AdminAction } from '../shared/types.js';

const host = process.env.IOL_API_HOST ?? '127.0.0.1';
const port = Number(process.env.IOL_API_PORT ?? 4173);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.IOL_WEB_ORIGIN ?? 'http://localhost:5173'
});

app.get('/api/health', async () => ({ ok: true, name: 'identity-ops-lab-lite' }));
app.get('/api/state', async () => publicState());
app.post('/api/reset', async () => resetSimulation());

app.post<{ Body: unknown }>('/api/admin-action', async (request, reply) => {
  if (!isAdminAction(request.body)) return reply.status(400).send({ error: 'Invalid admin action payload.' });
  return {
    ok: true,
    state: applyAdminAction(request.body)
  };
});

app.post<{ Params: { ticketId: string }; Body: unknown }>('/api/tickets/:ticketId/messages', async (request, reply) => {
  if (!isMessageBody(request.body)) return reply.status(400).send({ error: 'Message body is required.' });
  return sendTicketMessage(request.params.ticketId, request.body.body);
});

app.post<{ Params: { ticketId: string } }>('/api/tickets/:ticketId/close', async (request) => closeTicket(request.params.ticketId));

await app.listen({ host, port });

function isAdminAction(value: unknown): value is AdminAction {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'add_group' || value.type === 'remove_group') {
    return typeof value.employeeId === 'string' && typeof value.groupId === 'string';
  }
  if (value.type === 'reset_mfa' || value.type === 'complete_mfa_registration' || value.type === 'disable_account' || value.type === 'revoke_sessions') {
    return typeof value.employeeId === 'string';
  }
  if (value.type === 'mark_device_compliant') return typeof value.deviceId === 'string';
  return false;
}

function isMessageBody(value: unknown): value is { body: string } {
  return isRecord(value) && typeof value.body === 'string' && value.body.trim().length > 0 && value.body.length <= 1000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
