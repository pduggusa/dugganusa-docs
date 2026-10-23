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
| `check-package` | Is this npm or PyPI package, at this version, safe to install? See [check-package](/agents/check-package/) |
| `kev-vendor-risk` | Where confirmed exploitation concentrates for a vendor or product |
| `kev-exploitation-stickiness` | How long exploitation of a KEV entry keeps going |
| `stix-feed-summary` | What is in the feed right now |
| `ai-model-price` | Current published price per million tokens for a model, with source |

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
