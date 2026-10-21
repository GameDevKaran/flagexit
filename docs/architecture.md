# FlagExit: architecture

Current local implementation: `src/core.ts` performs bounded AST analysis, `src/fixtures.ts` compares ten original finite behavior cases, and `src/server.ts` serves a stateless HTTP API and vanilla browser review UI. Only fixed repository-owned fixtures can execute; submitted JSON is analyzed without execution. Optional browser storage replaces server persistence. The provider workflow below remains the release target, not completed integration evidence.

An issue in a new fixture application names a flag → actual GitLab Duo flow inspects declared configuration and references → selects permitted transformation → opens an MR → pipeline runs before/after behavior checks → preview deployment executes smoke tests → reviewer receives evidence and approves merge. Supervised autonomy is the default; no silent production merge or arbitrary shell command from issue text.

Build a small original TypeScript feature-demo service and dashboard, GitLab CI, Duo flow and narrow AST transforms. Support one explicit boolean-flag API, one language and static references. Dynamic flags, cross-service configuration and incomplete usage evidence produce refusal. The dashboard shows the lifecycle with real issue/MR/pipeline identifiers. The public demo is a dedicated fixture environment, not an unrelated repository.

## Failure handling and data boundaries

Preserve original inputs and make unavailable evidence explicit. Provider failures must return a visible unresolved state. Decisions that change user or provider state need the confirmation specified above. Record source versions and operation identifiers without exposing credentials.

## Implementation record

Add pinned dependencies, actual component boundaries and operational instructions when the first working slice exists. Document departures from this design with their reason; do not describe planned integrations as verified.
