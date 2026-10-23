---
title: Errors
description: Status codes and error bodies the API returns, and what to do about each.
sidebar:
  order: 4
---

JSON endpoints return a body with `success: false`, an `error` string and usually a `detail`. CSV lanes return the same information as `#` comment lines so a firewall importing the file does not choke on JSON.

| Status | When | What to do |
|---|---|---|
| `400` | A required parameter is missing or malformed | Read `error`; it names the parameter |
| `401` | No key, or the key is not recognized | Send `Authorization: Bearer <key>`; check for a typo or a deleted key |
| `403` | The key is valid but not for this resource (for example a key without feed scope on the STIX bundle), or the request was refused as automated | Check your plan and the endpoint's requirements |
| `404` | Unknown path or object | Check the URL against the [endpoint reference](/reference/endpoints/) |
| `429` | Daily quota or per-minute limit reached | Wait for `X-RateLimit-Reset`, or upgrade |
| `5xx` | Our fault | Retry with backoff; current service status is at `GET /api/v1/status` |

An unrecognized key:

```json
{
  "success": false,
  "error": "Invalid API key",
  "detail": "This key is not recognized. It may never have been registered, or was mistyped.",
  "register_url": "https://analytics.dugganusa.com/stix/register"
}
```

A CSV lane without a key answers `401` with comment lines:

```text
# UNAUTHORIZED - API key required. Registration is free and takes about 30 seconds.
# Register free (10 queries/day, no card): https://analytics.dugganusa.com/stix/register
```

MCP servers answer in JSON-RPC. On Jeevesus, an invalid key returns error code `-32001`, and a rate limit returns HTTP `429` with error code `-32029`:

```json
{ "jsonrpc": "2.0", "id": null, "error": { "code": -32029, "message": "rate_limited: minute cap 60" } }
```
