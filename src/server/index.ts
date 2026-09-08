import Fastify from 'fastify';
import cors from '@fastify/cors';

const host = process.env.IOL_API_HOST ?? '127.0.0.1';
const port = Number(process.env.IOL_API_PORT ?? 4173);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.IOL_WEB_ORIGIN ?? 'http://localhost:5173'
});

app.get('/api/health', async () => ({ ok: true, name: 'identity-ops-lab-lite' }));

await app.listen({ host, port });
