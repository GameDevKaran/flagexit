# FlagExit architecture

The public Cloud Run workbench runs Node 24. `src/core.ts` performs bounded TypeScript AST analysis; `src/fixtures.ts` compares ten original finite behavior cases; `src/server.ts` serves a stateless HTTP API and vanilla browser UI. Only fixed repository-owned fixtures execute. Uploaded inventories receive static analysis, not arbitrary execution. Optional browser storage owns saved reports; no shared server database or GitLab credentials are required by the public workbench.

The separate private GitLab workflow uses the project skill, custom Duo flow and fixed review CLI. The actual flow inspected the owned express=true nomination, generated one permitted checkout transformation and verified it on Node 20.20.2. An operator promoted only the checkout source change to a draft MR. Candidate CI on Node 24 passed the generic verification and blocking required-retirement gate. [Exact provider records](GITLAB_INTEGRATION.md) identify the source, session, MR and successful pipeline. Main retains the original checkout until review and an authorized merge.

## Boundaries and failure handling

Support is limited to one declared boolean-flag API, static references and pure boolean if/ternary conditions. Unsupported bindings, incomplete source-bound rollout evidence and unsafe transformations refuse without partial output. Evidence consistency does not establish a real production rollout. Owned finite comparisons do not prove arbitrary-program equivalence.

The public UI and private provider chain are separate. Browser actions do not automatically launch Duo, create MRs, publish source, merge or deploy a preview. The custom flow permits only the requested working-tree candidate; operator promotion and manual CI preserve review boundaries. Keep original inputs, source versions and provider identifiers, and expose failures without substituting a successful local result for provider evidence. See [public release](LIVE_RELEASE.md) and [fixed review workflow](../examples/express-checkout/README.md).
