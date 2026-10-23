---
title: check-package
description: Ask before you install. A block, review or allow verdict for one npm or PyPI package and version.
sidebar:
  order: 3
---

One call before `npm install` or `pip install`. Available as an MCP tool on [Jeevesus](/agents/jeevesus/) and used by the [Checks Action](/agents/checks-action/).

```json
{ "ecosystem": "npm", "name": "@x402/svm", "version": "2.22.0" }
```

```json
{
  "ecosystem": "npm",
  "package": "@x402/svm",
  "version": "2.22.0",
  "malicious": false,
  "verdict": "review",
  "reason": "Not malicious, but version 2.22.0 is below a security fix the maintainer shipped without an advisory (fixed in 2.23.0): ...",
  "advice": "Upgrade to 2.23.0 or later. OSV, npm audit and pip-audit will not flag this version, because no advisory exists."
}
```

## Verdicts

| Verdict | Means | Agent instruction |
|---|---|---|
| `block` | The package (or this version) is on the malicious-package deny-list, or its registry reputation looks like a staging package | Refuse to install and say why |
| `review` | Not malicious, but this version has published vulnerabilities, or sits below a security fix shipped without an advisory, or reputation is unusual | Prefer a fixed version; ask a person |
| `allow` | No evidence against it today | Install; still pin the version |

**Always pass `version`.** Without it, only the name is checked: version-scoped entries and known vulnerabilities cannot be evaluated.

## What it checks

1. The malicious-package deny-list (mostly OSV malicious-package records, version-aware).
2. Registry reputation: whether the package exists, its age and its download volume.
3. Published vulnerabilities for that exact version (OSV).
4. A short, cited list of security fixes shipped without any advisory, which no vulnerability database can flag.

`allow` means none of these hold anything against the package today. A package published an hour ago by an attacker can look exactly like that.

## A prompt for your agent

> Before installing any npm or PyPI dependency, call `check-package` with its ecosystem, name and exact version. If the verdict is `block`, do not install it and report the reason. If it is `review`, stop and ask me.

For CI, mirror the list with the [packages feed](/feed/packages/) or use the [Checks Action](/agents/checks-action/).
