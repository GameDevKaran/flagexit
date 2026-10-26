# FlagExit

Retire a completed boolean flag with a reviewable diff and evidence for the behavior you intend to keep.

## Status

**Live app:** https://flagexit-kc4mxxrtbq-uc.a.run.app

The deployed review workbench performs TypeScript AST analysis, source-bound rollout checks, conservative refusals, before/candidate comparisons on owned fixtures, JSON export and optional browser save/reload/delete. Ten public browser workflows and six deployed HTTP/security checks passed on 24 October 2026 IST. The separate private GitLab workflow has now completed a real Duo review, draft MR and successful candidate CI; see [verified provider evidence](docs/GITLAB_INTEGRATION.md). [Live release evidence](docs/LIVE_RELEASE.md), [verified scope](docs/LOCAL_MILESTONE.md).

## Intended use

A maintainer nominates a flag and final boolean value. FlagExit checks the supplied source inventory and rollout records, proposes a narrow removal, and shows a diff. Runtime comparisons are restricted to original repository-owned examples; uploaded source is only inspected. Evidence consistency is not proof that a real rollout occurred, and accepted proposals do not authorize a merge.

## Verified review workflow

A nominated express=true checkout fixture passes through actual GitLab Duo review, a scoped working-tree transformation, operator promotion to a draft MR and manual candidate CI. [Pipeline 2988163142](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/pipelines/2988163142) passed both the generic verification and the blocking retirement gate on commit `37110d4`. The candidate remains unmerged. The public workbench runs separately; browser proposals do not invoke Duo, open MRs or deploy previews. The actual Duo commands ran on Node 20.20.2; the application release and candidate CI use Node 24.

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

`docker build -t flagexit:local-check .` builds the non-root stateless container. The public release is documented above. [GitLab integration evidence](docs/GITLAB_INTEGRATION.md) records the real session, draft MR, candidate jobs and finite limits.

Keep credentials in local ignored files or the deployment secret store. Do not commit user data, provider tokens or private evaluation records.

## Development approach

Developed through AI-assisted coding and ChatGPT-assisted research. Verification results and their limits are documented in this repository.

## License

Original code, fixture programs and documents use the [MIT license](LICENSE). TypeScript and Playwright are Apache-2.0; Node.js and its bundled components retain their notices. See [dependency notices](THIRD_PARTY_NOTICES.md). All source remains private until explicit owner publication authorization. MIT licensing does not itself imply permission to publish this repository.
