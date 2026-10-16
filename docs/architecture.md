# FlagExit: architecture

Proposed design; no components have been implemented.

An issue in a new fixture application names a flag → actual GitLab Duo flow inspects declared configuration and references → selects permitted transformation → opens an MR → pipeline runs before/after behavior checks → preview deployment executes smoke tests → reviewer receives evidence and approves merge. Supervised autonomy is the default; no silent production merge or arbitrary shell command from issue text.

Build a small original TypeScript feature-demo service and dashboard, GitLab CI, Duo flow and narrow AST transforms. Support one explicit boolean-flag API, one language and static references. Dynamic flags, cross-service configuration and incomplete usage evidence produce refusal. The dashboard shows the lifecycle with real issue/MR/pipeline identifiers. The public demo is a dedicated fixture environment, not an unrelated repository.

## Failure handling and data boundaries

Preserve original inputs and make unavailable evidence explicit. Provider failures must return a visible unresolved state. Decisions that change user or provider state need the confirmation specified above. Record source versions and operation identifiers without exposing credentials.

## Implementation record

Add pinned dependencies, actual component boundaries and operational instructions when the first working slice exists. Document departures from this design with their reason; do not describe planned integrations as verified.
