# Security Policy

Identity Ops Lab Lite is a local simulator. It must not be wired to production identity systems or real tenant administration without a separate security review.

## Public Demo Boundaries

- No real secrets or tenant IDs belong in this repository.
- `.env` and `.env.*` are ignored, except `.env.example`.
- Default services bind to localhost.
- Admin actions are simulated only.
- The project does not perform Microsoft Graph writes or live Entra changes.
- Scenario truth must remain server-side.

## Reporting Issues

Please open a GitHub security advisory or private maintainer issue for vulnerabilities. Do not include real user data, tenant identifiers, access tokens, refresh tokens, client secrets, or production logs.
