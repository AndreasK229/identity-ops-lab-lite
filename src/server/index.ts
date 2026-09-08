import Fastify from 'fastify';
import cors from '@fastify/cors';
import { applyAdminAction, closeTicket, publicState, resetSimulation, scenarioSummaries, sendTicketMessage } from './simulation.js';
import type { AdminAction } from '../shared/types.js';

const host = process.env.IOL_API_HOST ?? '127.0.0.1';
const port = Number(process.env.IOL_API_PORT ?? 4173);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.IOL_WEB_ORIGIN ?? 'http://localhost:5173'
});

app.get('/api/health', async () => ({ ok: true, name: 'identity-ops-lab-lite' }));
app.get('/api/state', async () => publicState());
app.get('/api/scenarios', async () => scenarioSummaries());
app.post('/api/reset', async () => resetSimulation());

app.post<{ Body: AdminAction }>('/api/admin-action', async (request) => ({
  ok: true,
  state: applyAdminAction(request.body)
}));

app.post<{ Params: { ticketId: string }; Body: { body: string } }>('/api/tickets/:ticketId/messages', async (request) =>
  sendTicketMessage(request.params.ticketId, request.body.body)
);

app.post<{ Params: { ticketId: string } }>('/api/tickets/:ticketId/close', async (request) => closeTicket(request.params.ticketId));

await app.listen({ host, port });
