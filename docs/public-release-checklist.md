# Public Release Checklist

- [ ] Repository contains no real secrets, tokens, tenant IDs, or personal data.
- [ ] `.env` files are ignored and `.env.example` has localhost-only safe defaults.
- [ ] Default Docker and Node quickstarts bind services to localhost.
- [ ] No Microsoft Graph write path exists.
- [ ] No real Entra tenant integration exists.
- [ ] No Ollama or LLM-backed persona generation exists in lite scope.
- [ ] Scenario truth is not exposed through client API responses.
- [ ] All visible buttons perform an action or have been removed.
- [ ] Tests, lint, build, and Docker checks pass.
- [ ] README clearly states lite scope and intentional exclusions.
- [ ] SECURITY.md and CONTRIBUTING.md are present.
