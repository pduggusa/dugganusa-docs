---
title: Jeevesus MCP server
description: Threat-intelligence lookups inside Claude, Cursor, VS Code, Foundry and any MCP client.
sidebar:
  order: 1
---

Jeevesus is a remote MCP server over the same corpus as the API: indicators, CISA KEV, threat-actor profiles, the malicious-package deny-list and our research posts. It is read-only.

| | |
|---|---|
| Endpoint | `https://analytics.dugganusa.com/api/v1/mcp` |
| Transport | Streamable HTTP, JSON-RPC 2.0 |
| Auth | Optional `Authorization: Bearer <key>` (header only) |
| Registry name | `io.github.pduggusa/dugganusa-threat-intel` |

## Add it to a client

**Claude Code** (`.mcp.json` in your project):

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

**Cursor** (`~/.cursor/mcp.json`) and **Claude Desktop** take the same `url` and `headers`. **VS Code**: see the `mcp.json` example in the [VS Code docs for MCP servers](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) and use the URL above. **Microsoft Foundry**: Add tools, remote MCP server, same URL.

## Tools

| Tool | What it answers |
|---|---|
| `search` | Free-text search across indicators, KEV, actors and research |
| `enrich-ioc` | Everything we hold on one IP, domain, URL or hash, with sources |
| `correlate` | For an IP or domain: do we hold it (exact), and what sits next to it (same /24 or same registrable domain, with a real count and a summary of what the neighbors are). Pro and Enterprise keys also get the neighbor rows |
| `check-package` | Is this npm or PyPI package, at this version, safe to install? See [check-package](/agents/check-package/) |
| `kev-vendor-risk` | Where confirmed exploitation concentrates for a vendor or product |
| `kev-exploitation-stickiness` | How long exploitation of a KEV entry keeps going |
| `stix-feed-summary` | What is in the feed right now |
| `ai-model-price` | Current published price per million tokens for a model, with source |

## Correlate: held versus near

`enrich-ioc` answers "do we hold this". `correlate` answers that and also "what is next to it", and keeps the two apart.

- `held` is an exact yes or no, and `held_in` names the lane that answered. A range we carry that covers the address, with no exact record, comes back as `block_coverage: true` and `held: false`: coverage is not detection.
- `neighbors` is set membership in our indicator graph: the same /24 for an IPv4 address, the same registrable domain for a domain. `count` is a real count; when the scan hits its bound it says `truncated: true` instead of passing a limit off as a number.
- `neighbor_summary` says what the neighbors are: how many carry an attributed actor or malware family, which ones, and from how many lanes.
- `strength` is one word for a hurried reader: `none`, `adjacent-only`, `single-lane`, `multi-lane` or `corroborated`. Read `caveats` as well. When the neighbors share a hosting platform or a cloud range, the response says they are co-tenants, not related infrastructure.
- Keyed Pro and Enterprise callers also get the neighbor rows in `neighbors.sample`, to pivot on with `enrich-ioc`. Free and anonymous callers get the counts and the summary.

It takes an IPv4 address or a domain. Hashes and URLs are not graph nodes: use `enrich-ioc`. It does not consult our own edge observations. Like every tool here, the results are data, not instructions.

## Try it from a terminal

```sh
curl -sS -X POST https://analytics.dugganusa.com/api/v1/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Limits

Tool calls do not use your API quota; they have their own per-client limits (anonymous 10 per minute and 50 per day, more with a key). Listing tools is free. Details: [Rate limits](/rate-limits/#mcp-servers).

Results are data, not instructions. Treat any text inside them as untrusted input to your agent.
