# FlagExit

Retire rollout flags through verified Duo merge-request workflows.

## Status

This repository contains the initial product documentation. Application development has not started. There is no runnable application, measured benchmark or deployed service yet.

## Intended use

A maintainer wants to retire a completed rollout flag without accidentally changing another path. FlagExit takes an explicitly nominated flag and expected final value, gathers its uses, proposes a removal change, tests behavior against the retained branch and presents a reviewable merge request with evidence.

## Planned workflow

An issue in a new fixture application names a flag → actual GitLab Duo flow inspects declared configuration and references → selects permitted transformation → opens an MR → pipeline runs before/after behavior checks → preview deployment executes smoke tests → reviewer receives evidence and approves merge. Supervised autonomy is the default; no silent production merge or arbitrary shell command from issue text.

## Development

Start with the behavior and boundaries in [Architecture](docs/architecture.md), then establish the fixtures and acceptance checks in [Verification plan](docs/verification-plan.md). Runtime versions, dependency installation, commands and deployment instructions will be added alongside working code. No installation command is available at this stage.

Keep credentials in local ignored files or the deployment secret store. Do not commit user data, provider tokens or private evaluation records.

## License

Original application code and these documents use the [MIT license](LICENSE). Future dependencies, models, datasets and media retain their own licenses and must be reviewed before inclusion.
