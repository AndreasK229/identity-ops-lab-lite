# Public Release Checklist

- [ ] Repository contains no real secrets, tokens, tenant IDs, or personal data.
- [ ] `.env` files are ignored and `.env.example` has localhost-only safe defaults.
- [ ] Default Docker and Node quickstarts bind services to localhost.
- [ ] No production identity-system write path exists.
- [ ] No real tenant integration exists.
- [ ] No paid external service dependency exists.
- [ ] Scenario labels and hidden remediation recipes are not exposed through client API responses.
- [ ] All visible buttons perform an action or have been removed.
- [ ] Tests, lint, build, and Docker checks pass.
- [ ] README clearly states lite scope and intentional exclusions.
- [ ] SECURITY.md and CONTRIBUTING.md are present.
