# FlagExit

Retire a completed boolean flag with a reviewable diff and evidence for the behavior you intend to keep.

## Status

The local review workbench is functional: TypeScript AST analysis, source-bound rollout checks, conservative refusals, before/candidate comparisons on owned fixtures, JSON export and optional browser save/reload/delete. Thirty automated tests and ten browser workflow checks pass. Actual GitLab Duo, MR/CI execution and public deployment remain pending; no sponsor integration is claimed by the local demo. See [verified scope](docs/LOCAL_MILESTONE.md).

## Intended use

A maintainer nominates a flag and final boolean value. FlagExit checks the supplied source inventory and rollout records, proposes a narrow removal, and shows a diff. Runtime comparisons are restricted to original repository-owned examples; uploaded source is only inspected. Evidence consistency is not proof that a real rollout occurred, and accepted proposals do not authorize a merge.

## Planned workflow

An issue in a new fixture application names a flag → actual GitLab Duo flow inspects declared configuration and references → selects permitted transformation → opens an MR → pipeline runs before/after behavior checks → preview deployment executes smoke tests → reviewer receives evidence and approves merge. Supervised autonomy is the default; no silent production merge or arbitrary shell command from issue text.

## Development

Use Node.js 24 and npm:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:8785. Select an owned scenario, inspect the change, compare outputs and try a refusal. No cloud credentials are needed. `HOST` and `PORT` change the local bind; set `FLAGEXIT_PUBLIC_ORIGIN` to the exact HTTPS origin when deployed. There is no server database. Browser storage is optional and belongs to that browser profile.

```sh
npm test
npx playwright install chromium
npm run test:browser
node dist/src/cli.js demo express-true
node dist/src/cli.js analyze inventory.json
```

The browser interface can download an inventory template. Each rollout record must bind to `hashSources(files)` exported by `src/core.ts`; the analysis report returns the computed hash, including on a stale-evidence refusal. Do not relabel stale evidence as real production confirmation. Only an unaliased `import { flag } from '@flagexit/flags'` in pure boolean if/ternary conditions is supported. Dynamic access, unsupported bindings, incomplete evidence and unsafe transformations refuse without partial output.

A [reviewable checkout example](examples/express-checkout/README.md) now turns the proposal into an actual source-file change. The review CLI retains its original baseline, rejects unknown edits, verifies three finite behavior cases and fails an intentionally wrong-value change. The candidate branch has a dedicated manual CI gate; no GitLab execution is inferred from local checks.

`docker build -t flagexit:local-check .` builds the non-root stateless container. Local container proof is not cloud proof. [GitLab access/next steps](docs/GITLAB_INTEGRATION.md). The prepared manual CI job preserves actual test artifacts; it has not run on GitLab.

Keep credentials in local ignored files or the deployment secret store. Do not commit user data, provider tokens or private evaluation records.

## Development approach

Developed through AI-assisted coding and ChatGPT-assisted research. Verification results and their limits are documented in this repository.

## License

Original code, fixture programs and documents use the [MIT license](LICENSE). TypeScript and Playwright are Apache-2.0; Node.js and its bundled components retain their notices. See [dependency notices](THIRD_PARTY_NOTICES.md). All source remains private until explicit owner publication authorization. MIT licensing does not itself imply permission to publish this repository.
