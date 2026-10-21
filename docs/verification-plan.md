# FlagExit: verification plan

Current results: 30 automated tests and ten browser workflow checks passed. Three supported original fixture scenarios cover ten finite cases; all matched the retained baseline, and each supported scenario caught an opposite-final-value control. Three unsupported scenarios refused. See LOCAL_MILESTONE.md for exact evidence and limits. The original held-out and provider targets below remain unmeasured.

## Fixtures and acceptance

six development and six held-out fixture flags covering nested conditions, dead branches, dynamic access, missing rollout evidence and interacting flags. At least five of six supported held-out changes should be correct; every intentionally unsupported case must refuse, and zero seeded behavioral regressions may pass the release gate. Compare a plain codemod plus standard CI with the evidence-driven flow; report extra runtime and false refusals. Do not claim arbitrary-program equivalence.

## Demonstration to verify

flag-retirement issue → actual Duo analysis → MR → a deliberately wrong branch caught → corrected preview and evidence summary. Long pipeline waits may be edited with honest timestamps.

## Result record

For each run, record the source commit, fixture version, runtime/provider versions, actual pass and failure counts, latency, cost where relevant, and limitations. Keep development and held-out inputs separate. Report negative findings; freeze the protocol before inspecting held-out results.

A release requires a functioning end-to-end workflow and a clean-session replay. Documentation, repository creation and HTTP availability alone do not establish application correctness.
