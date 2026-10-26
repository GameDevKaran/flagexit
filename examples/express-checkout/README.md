# Reviewable checkout retirement

This is an original, synthetic checkout example for the FlagExit review branch. It is not a production rollout. `baseline/checkout.ts` preserves the independent original; `src/checkout.ts` starts with the same code. `rollout.json` declares the synthetic final value and binds to the exact baseline source hash.

After `npm ci` and `npm run build`, from the repository root:

```sh
node dist/src/cli.js review verify
node dist/src/cli.js review control
```

The initial result is `baseline_only`. The non-mutating control generates the opposite-final-value change and must reject it through actual finite behavior comparisons. Neither result claims a completed retirement.

On a review branch, generate the actual one-file source change:

```sh
node dist/src/cli.js review apply
node dist/src/cli.js review verify --require-retired
git diff -- examples/express-checkout/src/checkout.ts
```

`apply` checks the preserved original and source-bound evidence, verifies the candidate and atomically replaces only `src/checkout.ts`. It is idempotent for the generated correct result, refuses unknown edits and never rewrites the baseline or rollout record. Commit the candidate file and attach the actual command output to the requested MR. Do not merge automatically.

The retirement gate exits nonzero for the original baseline, opposite-value candidate, stale rollout record, changed baseline or unrecognized candidate. Only the exact original and two deterministic generated variants can execute; arbitrary source is refused before execution. Three original cases are finite evidence, not arbitrary-program equivalence.

CI remains manual and requires confirmed runner coverage. The generic job records `source-review.json` and `wrong-value-control.json`; the separate `verify_review_branch` job requires an actual retired candidate. On the baseline that latter job deliberately fails. Actual Duo session 10031611 and [draft MR !1](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/merge_requests/1) are recorded in [the provider evidence](../../docs/GITLAB_INTEGRATION.md). Candidate pipeline 2988163142 passed both jobs on `37110d4170d8f0b59e511babe3f2e483fd58e069`. This review branch remains unmerged and has no separate preview deployment.
