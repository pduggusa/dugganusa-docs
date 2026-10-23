---
title: Quickstart
description: Get a key and make your first three calls in about five minutes.
sidebar:
  order: 1
---

## 1. Get a key

Register at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register). The free tier needs only an email address; the key is delivered there. It starts with `dugusa_`.

Keep it out of source code. In a shell:

```sh
export DUGGANUSA_API_KEY="dugusa_YOUR_KEY"
```

## 2. Pull a blocklist

```sh
curl -sS -H "Authorization: Bearer $DUGGANUSA_API_KEY" \
  "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv?min_confidence=80&limit=5"
```

```csv
ip,confidence,threat_type,source,first_seen
100.24.149.244,95,"blocked",dugganusa-honeypot,2026-06-14T18:11:22.964Z
...
```

Each row is one indicator. `confidence` runs from 0 to 95; nothing we publish is scored as certain. `source` says where it came from, including third-party feeds we redistribute.

## 3. Look something up

```sh
curl -sS -H "Authorization: Bearer $DUGGANUSA_API_KEY" \
  "https://analytics.dugganusa.com/api/v1/threat-intel/enrichment?ip=185.39.19.176"
```

## 4. Give your AI agent the same data

Add the MCP server to any MCP client (Claude, Cursor, VS Code, Foundry):

```json
{
  "mcpServers": {
    "dugganusa": {
      "type": "http",
      "url": "https://analytics.dugganusa.com/api/v1/mcp",
      "headers": { "Authorization": "Bearer dugusa_YOUR_KEY" }
    }
  }
}
```

The key is optional for MCP; without one you get a smaller anonymous allowance. See [Jeevesus MCP server](/agents/jeevesus/).

## Next

- Wire a firewall: [OPNsense](/firewall/opnsense/) or [Cloudflare](/firewall/edge-shield/)
- Wire a SIEM: [Microsoft Sentinel](/siem/sentinel/) or [Splunk](/siem/splunk/)
- Gate installs in CI and agents: [check-package](/agents/check-package/)
- Limits per plan: [Rate limits](/rate-limits/)
