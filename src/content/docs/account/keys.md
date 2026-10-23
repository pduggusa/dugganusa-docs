---
title: API keys
description: Register a key, check its usage, verify it, delete it, and rotate it safely.
sidebar:
  order: 1
---

One key works across the feed, search, enrichment, the firewall lanes, the MCP servers and Edge Shield. Keys look like `dugusa_` followed by 32 URL-safe characters.

## Register

Use the form at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register), or call the API:

`POST /api/v1/api-keys/register`

```sh
curl -sS -X POST https://analytics.dugganusa.com/api/v1/api-keys/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.org", "name": "Your Name", "use_case": "SIEM enrichment", "product": "both"}'
```

| Field | Required | Meaning |
|---|---|---|
| `email` | Yes | A real, deliverable address. The key and recovery help go here |
| `name` | Yes | At least 2 characters |
| `use_case` | No | Free text: what you will use the key for |
| `product` | No | `stix`, `epstein` or `both`. Default `epstein`. Every new key is on the Free plan whichever you choose |
| `agree_to_terms` | No | `true` opts in to "Powered by DugganUSA" attribution. Not required to get a key |

Response (`201`):

```json
{
  "success": true,
  "data": {
    "api_key": "dugusa_YOUR_KEY",
    "product": "both",
    "tier": "free",
    "daily_limit": 10,
    "warning": "SAVE THIS KEY NOW. It will not be shown again.",
    "usage_endpoint": "/api/v1/api-keys/usage",
    "documentation": "https://analytics.dugganusa.com/api/v1/stix-feed/help"
  }
}
```

The key is shown once. DugganUSA stores only a hash of it and cannot show it to you again. A welcome email follows.

Registration rules:

| Rule | Response |
|---|---|
| Malformed, placeholder (`example.com`-style), disposable or non-routable email domain | `400` |
| Email domain has no mail exchanger | `400`, `"error": "undeliverable_domain"` |
| `name` missing or shorter than 2 characters | `400` |
| A key already exists for that mailbox. `+tags` and Gmail dots count as the same mailbox | `409` |
| More than 3 registrations from one IP address in an hour | `429` |
| The request matches automated key-farming patterns | `429` with `registration_refused`, `registration_velocity` or `automated_access_detected` |

If you are refused in error, email butterbot@dugganusa.com.

## Send the key

Send the key in the `Authorization` header:

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/search?q=185.39.19.176"
```

```python
import os, requests

session = requests.Session()
session.headers["Authorization"] = f"Bearer {os.environ['DUGGANUSA_API_KEY']}"
r = session.get("https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv", timeout=120)
r.raise_for_status()
```

TAXII clients can use HTTP Basic with the key as the password. Do not put the key in a URL: URLs are written to proxy, server and SIEM logs, browser history and shared configuration. A few products can take only a URL; for those, see [Authentication](/authentication/) and give that product its own key.

Load the key from an environment variable or a secret store. Never commit it.

## Check usage

`GET /api/v1/api-keys/usage`

Does not count against your quota. Bearer header only.

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" https://analytics.dugganusa.com/api/v1/api-keys/usage
```

```json
{
  "success": true,
  "data": {
    "tier": "free",
    "daily_limit": 10,
    "used_today": 3,
    "remaining": 7,
    "queries_total": 214,
    "resets_at": "2026-10-24T00:00:00.000Z",
    "attribution_required": true,
    "status": "active"
  }
}
```

Quotas reset at midnight UTC. Usage counters can lag by a few minutes across our servers.

## Verify a key

`GET /api/v1/api-keys/verify`

Does not count against your quota. Bearer header only.

```json
{ "success": true, "valid": true, "tier": "free", "status": "active" }
```

An unknown key returns `401` with `"valid": false`.

## Delete a key

`DELETE /api/v1/api-keys/self`

Permanently deletes the key and its account record. It cannot be undone. Bearer header only.

```sh
curl -sS -X DELETE -H "Authorization: Bearer dugusa_YOUR_KEY" \
  https://analytics.dugganusa.com/api/v1/api-keys/self
```

```json
{
  "success": true,
  "message": "Your API key and account record have been permanently deleted.",
  "deleted": { "email": "you@example.org", "tier": "free", "product": "both" }
}
```

A deleted key can keep working for up to 5 minutes on servers that had it cached.

## Rotate a key

There is no in-place rotation for self-service keys, and each mailbox can hold one key. To replace a Free key:

1. Delete the old key with `DELETE /api/v1/api-keys/self`.
2. Register again with the same email.
3. Update every integration to the new key.

Integrations using the old key fail with `401` between steps 1 and 3, so do this when a short gap is acceptable.

Because deleting a key also deletes its account record, **do not delete a key on a paid plan** to rotate it: the record links the key to your subscription. Email butterbot@dugganusa.com to rotate a paid key.

If a key leaks, delete it immediately and register a replacement. A leaked key spends your quota and its use is attributed to you.

### Separate keys for exposed integrations

Some integrations store the key where others can read it: a firewall alias URL, a shared SIEM configuration, a CI variable. A dedicated key for each of those means a leak costs you one integration, not all of them. Because each mailbox holds one key, ask for additional keys by replying to your welcome email or writing to butterbot@dugganusa.com.

## Lost a key

Email butterbot@dugganusa.com from the address you registered with.
