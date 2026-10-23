---
title: GitHub Checks Action
description: Check new dependencies and MCP servers in every pull request.
sidebar:
  order: 4
---

`pduggusa/dugganusa-checks-action` runs [check-package](/agents/check-package/) and [Dredd](/agents/dredd/) on the dependencies and MCP servers a pull request adds or changes, and fails the job on a block.

```yaml
name: DugganUSA Checks
on:
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  membrane:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: pduggusa/dugganusa-checks-action@v1
        with:
          api-key: ${{ secrets.DUGGANUSA_API_KEY }}
```

Add your key as the repository secret `DUGGANUSA_API_KEY`. The Action runs without one at anonymous limits, which GitHub-hosted runners share with other users.

## What it reads

npm (`package.json`, `package-lock.json`), PyPI (`requirements*.txt`, `pyproject.toml`, `poetry.lock`), RubyGems (`Gemfile`, `Gemfile.lock`), MCP configs (`mcp.json`, `.claude/settings.json`, `.vscode/settings.json`, `.cursor/settings.json` and others), GitHub workflow `uses:` references, and agent instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules` and others) for invisible Unicode.

Pull requests are checked as a diff: only new or changed entries, including new transitive packages in a lockfile.

## Key inputs

| Input | Default | |
|---|---|---|
| `fail-on` | `block` | `block`, `review` or `none` |
| `fail-on-ambiguous` | `true` | Fail when an entry is shaped so the check cannot tell what would be installed |
| `fail-on-unchecked` | `true` | Fail when the API could not answer for an entry |
| `fail-on-unknown` | `false` | Also fail on entries we hold no record of |
| `include-transitive` | `auto` | Lockfile transitives in diff mode |

The full input list, outputs and the privacy statement are in the [README](https://github.com/pduggusa/dugganusa-checks-action#readme).
