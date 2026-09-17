# Identity Ops Lab Lite

Identity Ops Lab Lite is a clone-and-run IAM operations simulator for practicing identity support workflows without touching a real tenant.

It is built to show practical IAM operations judgment: investigating access tickets, reading sign-in and Conditional Access evidence, checking account/MFA/group/device state, applying safe simulated admin remediation, verifying retry attempts, and closing a case only when the simulated identity state is actually fixed.

![Screenshot placeholder](docs/screenshot-placeholder.svg)

## What This Demonstrates

For IAM hiring managers and reviewers, this repo demonstrates:

- Identity support triage using realistic symptoms, sign-in evidence, and audit trails.
- Server-side access decision logic for account, MFA, app assignment, group membership, and managed-device compliance.
- Safe simulated remediation actions with audit events.
- Retry verification that runs a fresh access check after the operator asks the user to try again.
- Resolution gates that block case closure until the underlying identity state is fixed.
- Public-safe engineering boundaries: synthetic data, no secrets, no live tenant writes, and deterministic behavior.

## At A Glance

- **Stack:** React, TypeScript, Vite, Fastify, npm, Docker Compose.
- **Data:** 6 synthetic employees, 5 applications, 5 groups, managed devices, MFA state, account state, sign-in logs, and audit logs.
- **Scenarios:** missing app group, MFA reset, non-compliant device, terminated user still enabled.
- **Personas:** deterministic scripted replies only.
- **Default bind:** localhost-only.

This is a public community/demo edition. It is intentionally limited to a local, deterministic simulator with synthetic data and no production identity-system integration.

## Lite Scope And Extension Boundary

Identity Ops Lab Lite is intentionally scoped as a deterministic local simulator. It demonstrates the operator workflow, evidence model, access decision loop, audited remediation, retry verification, and close gate.

Capabilities outside the local simulator boundary are intentionally excluded from this public edition. Keeping the project small preserves safety, reviewability, and a clean public trust boundary.

## Why This Is Not A Ticket System

The ticket queue is only the intake surface. The lab models the IAM operation behind the ticket:

- A server-side access engine evaluates account, MFA, group, application, and managed-device state.
- Operators see IAM evidence and closure controls, while scenario labels and hidden remediation recipes stay server-side.
- Remediation actions mutate simulated identity state and write audit events.
- Retry phrases trigger a fresh server-side access check.
- Ticket closure is blocked by a hidden server-side resolution gate until the identity state is fixed.

```text
Ticket symptom
  -> IAM evidence
  -> server-side access engine
  -> simulated admin action
  -> audit event
  -> retry verification
  -> close gate
```

## Quickstart With Docker

```bash
git clone https://github.com/YOUR-ORG/identity-ops-lab-lite.git
cd identity-ops-lab-lite
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173).

Docker Compose serves the built React console and Fastify API from one localhost-bound app container on `127.0.0.1:5173`.

## Quickstart With Node

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

In Node development mode, Vite serves the console on `127.0.0.1:5173` and proxies API calls to Fastify on `127.0.0.1:4173`.

## Demo Role

You are the IAM Support Operator. The simulator gives you realistic evidence, not hidden scenario truth. Use the identity case queue, employee profile, policy evidence, authentication evidence, audit log, closure review, simulated admin actions, and ticket conversation to diagnose each case.

When you type `test login again`, `try again`, `retry`, or `testa logga in igen`, the persona performs a fresh server-side access check and reports whether access is fixed or still blocked.

## Suggested Review Path

If you are reviewing the repo quickly, open the console and try this flow:

1. Select **LedgerPro opens but says I am not assigned**.
2. Compare **Policy Evidence** with **Authentication & CA Evidence**.
3. Notice that authentication succeeds but app assignment is missing.
4. Click **Add app group**.
5. Ask the employee to `test login again`.
6. Confirm **Access Check Timeline** shows the admin action and successful retry.
7. Click **Close ticket** and observe that closure is allowed only after remediation.

That path shows the core simulator loop: symptom -> IAM evidence -> server-side access engine -> simulated admin action -> audit event -> retry verification -> close gate.

## Lite Scenarios

- Missing application group membership while authentication succeeds.
- MFA reset required after phone replacement.
- Conditional Access block from a non-compliant managed device.
- Terminated user account still enabled and requiring session revocation.

The seed includes 6 synthetic employees, 5 applications, 5 groups, managed device state, MFA state, account state, deterministic sign-in logs, and deterministic persona replies.

## Security And Trust Boundaries

- All names, devices, IP addresses, apps, and groups are synthetic.
- Scenario labels and hidden remediation recipes stay in the server module; the browser receives realistic IAM evidence and a neutral closure review.
- Admin actions are simulated and create audit events.
- `.env` files are ignored; `.env.example` contains only safe localhost defaults.
- Default services bind to localhost.
- There are no real secrets, tenant IDs, production identity-system writes, external identity-provider integrations, or paid service dependencies.

## Out Of Scope

- Real identity-provider execution.
- Production tenant discovery or mapping.
- Shared production operation.
- AI-generated persona behavior.
- Assessment workflows beyond basic closure validation.
- Paid external services.

## Useful Commands

```bash
npm run lint
npm test
npm run build
docker compose config
```
