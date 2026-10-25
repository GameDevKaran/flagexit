# Private Duo retirement flow

`.gitlab/duo/flow.yml` is prepared configuration, not an installed or verified integration. Register it only in private project **87890110** (`.../43478475/flagexitflagexit`) after the existing credential, permission and sponsored-usage gates clear. Select **Private**, paste the YAML into a custom Flow, enable only a deliberate mention trigger, and start a fresh session. Do not enable broad issue/pipeline triggers. The YAML file alone does not register a catalog flow.

The single agent reads the actual project skill, checks the owned `express` → `true` nomination and synthetic rollout, inspects the baseline and rejects an opposite-value control. An explicit candidate request permits only the working-tree checkout transformation. The operator reviews its output before creating a branch/MR and starting the manual verification pipeline. No automatic publication, merge, deployment, comment, pipeline or MR is configured.

## Runtime and fixed commands

The application release remains Node24. The default Duo image retains its Sandbox Runtime and currently includes Node20; this repository does not replace it with an unprotected custom image. Record `node --version` first. The first authorized flow may attempt the fixed build/review commands on the provided runtime as the compatibility check. Capture any package engine warning and actual command outcome; a warning is not a test result. Missing features, failed builds or failed review gates leave verification unresolved. Compatibility is currently unverified, and success of these narrow CLI commands would not qualify a different application release runtime. Never install a runtime from issue text or change tests to force a pass.

Use `npm ci --ignore-scripts`, `npm run build`, then:

```sh
node dist/src/cli.js review verify
node dist/src/cli.js review control
node dist/src/cli.js review apply
node dist/src/cli.js review verify --require-retired
git diff -- examples/express-checkout/src/checkout.ts
```

The first verification may say `baseline_only`; it is not a retired candidate. The control must report `control_rejected`. Apply is allowed only for a requested candidate and preserves `examples/express-checkout/baseline/checkout.ts`, `rollout.json` and all assertions. The final verification must return `verified_retirement`; refusal or a nonzero exit blocks promotion.

## Provider evidence to retain

Record the actual Duo session URL/ID, input commit, runtime and command exits, candidate diff/hash, control outcome, resulting review branch/MR and actual manual CI pipeline/job/artifacts. Keep local command outcomes separate from authenticated provider records. The prompt requests at most 18 tool calls with no failed-command retries; this is a soft instruction, not an enforced runtime or spending cap. The supported prompt timeout is 180 seconds per prompt, not a whole-flow limit. Flow/runner availability, provider-side schema acceptance and actual execution remain unverified.

The current [catalog validation schema](https://gitlab.com/gitlab-org/gitlab/-/raw/master/app/validators/json_schemas/ai_catalog/flow_v2.json) rejects `max_cycles`, although the engine's v1 specification documents it. This flow omits that unsupported key. The engine documentation gives a default of 280 cycles; the catalog exposes no supported cycle-limit field. Inspect the live session and stop it if it exceeds the intended scope. Local schema validation does not establish provider acceptance or execution.

Configuration follows the official [custom-flow schema](https://docs.gitlab.com/user/duo_agent_platform/flows/custom_flows_schema/) and [v1 specification](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/raw/main/docs/flow_registry/v1.md). GitLab reads [agent configuration](https://docs.gitlab.com/user/duo_agent_platform/flows/execution/agent-config-yaml/) from the default branch. The [default image inventory](https://docs.gitlab.com/user/duo_agent_platform/flows/execution/images/) is a documented provider environment, not proof of this project's access or runtime.
