# Contributing

Thanks for helping keep Identity Ops Lab Lite useful and safe.

## Development

```bash
npm install
npm run dev
```

Run checks before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

## Scope Guardrails

Contributions should preserve the public demo boundary. Do not add production identity-system integrations, real tenant data, real employee data, paid external service dependencies, or real secrets.

Keep changes small, readable, deterministic, and easy to run locally.
