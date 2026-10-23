---
title: Dredd pre-flight
description: A signed verdict on an MCP server and its dependency tree before your agent connects to it.
sidebar:
  order: 2
---

Dredd answers one question before an agent connects to or calls an MCP server: is there evidence against this server, this version, or anything in its dependency tree? No key is needed.

| | |
|---|---|
| MCP endpoint | `https://analytics.dugganusa.com/api/v1/dredd/mcp` (one tool: `check_mcp_server`) |
| HTTP endpoint | `GET https://analytics.dugganusa.com/api/v1/dredd/preflight?server=<name>&version=<v>&tool=<tool>` |
| Source | [github.com/pduggusa/dredd-mcp](https://github.com/pduggusa/dredd-mcp) |

```sh
curl -sS "https://analytics.dugganusa.com/api/v1/dredd/preflight?server=@modelcontextprotocol/server-filesystem"
```

## Verdicts

| Verdict | Meaning | Suggested action |
|---|---|---|
| `BLOCK` | Known-compromised server or a known-malicious package in its dependency tree | Do not connect |
| `ADVISORY` | A published CVE affects this version | Upgrade, then connect |
| `REVIEW` | We could not establish enough to judge (for example the server name did not resolve to a known package) | A person decides |
| `ALLOW` | No evidence against it today | Connect; this is not proof of safety |

## The response

```json
{
  "success": true,
  "server": "@modelcontextprotocol/server-filesystem",
  "verdict": "REVIEW",
  "severity": "unknown",
  "known_to_us": false,
  "findings_count": 0,
  "findings": [],
  "vuln_check": { "checked": false, "reason": "server_not_resolved" },
  "package_check": { "ecosystem": "npm", "verdict": "allow" },
  "dep_graph": { "evaluated": false },
  "checked_at": "2026-10-23T15:20:00Z",
  "ttl_seconds": 300
}
```

- **`dep_graph.evaluated`** says whether the transitive dependency tree was actually checked. `false` means we could not see it, never that it is clean.
- **`ttl_seconds`**: verdicts are cached for five minutes; ask again after that.

Pass `version` whenever you know it. Without one, Dredd cannot match CVEs to the version you run.
