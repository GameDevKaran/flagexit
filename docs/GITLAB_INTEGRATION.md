# Verified GitLab review workflow

26 October 2026 IST. [Private GitLab project](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit) (ID 87890110) preserves the development history also held in the private GitHub repository. The public Cloud Run workbench and the authenticated GitLab review workflow are separate execution surfaces. Browser proposals alone do not open MRs or start Duo/CI.

## Actual provider chain

| Stage | Verified record | Result |
|---|---|---|
| Duo review | [Session 10031611](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/automate/agent-sessions/10031611), [job 17457962262](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/jobs/17457962262) | Completed on source `b95a197bdb7385d25e87feabbac8f0f25c3b8f89`; fixed build/review commands produced and verified the one-file candidate. |
| Operator promotion | [Draft MR !1](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/merge_requests/1), branch `review/duo-express-retirement-10031611` | Only `examples/express-checkout/src/checkout.ts` changed. Candidate commit `37110d4170d8f0b59e511babe3f2e483fd58e069`. |
| Candidate CI | [Pipeline 2988163142](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/pipelines/2988163142) | Successful manual web pipeline on that exact candidate. |
| Verification jobs | [verify_retirement](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/jobs/17458108439), [verify_review_branch](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43478475/flagexitflagexit/-/jobs/17458108440) | Both succeeded; the blocking candidate gate requires actual retirement, not merely an unchanged baseline. |

Duo inspected the project skill and source-bound synthetic express=true rollout, rejected the opposite-value control, then applied and verified the requested checkout change in its working tree. A separate operator step checked the diff and protected files, committed the one-file change, opened the draft MR and started the manual pipeline. Duo did not itself create the MR, merge or deploy it. The candidate remains a review branch; this documentation does not approve merging it.

## Evidence and limits

The real provider flow used Node 20.20.2. npm reported the repository's Node >=24 engine warning, but installation, TypeScript build and the narrow CLI gates succeeded. This establishes those commands on that provider runtime only. The public application and candidate CI use Node 24; they have their own release and CI evidence.

The retained true branch matches the preserved baseline in three original checkout cases. The opposite-value variant fails all three. The authenticated candidate job artifacts record 36 passing tests and the successful retirement gate. These finite cases and the authored rollout fixture are not production rollout measurements or proof of general program equivalence. Only the fixed owned baseline and recognized generated variants execute; uploaded source remains static analysis only.

The CLI source/candidate fingerprints hash a path-sorted JSON list of {path, source}; they are not raw file SHA-256 values. Promotion independently reconciled the raw candidate hash `aaaaad27c1192fe0bdb66ebd8a6cd7d0f28e14335e30de3280c9765021b5b393` with the path-bound candidate fingerprint `275ea7bb49e54fe4ac512b808217602d735c19f205ef9e7dae2ff8b1fdf9a91b`. The baseline, rollout record and assertions were preserved.

GitLab retains job artifacts; their presence and successful job status are provider evidence. Local JSON and environment variables alone are not. The existing public workbench remains independently deployed; no candidate-specific preview deployment or automatic merge is claimed. Both repositories stay private, so these provider links require authorized access. Source publication remains the owner's decision.

See [flow configuration and fixed commands](DUO_FLOW.md), [checkout review commands](../examples/express-checkout/README.md) and [public release evidence](LIVE_RELEASE.md).
