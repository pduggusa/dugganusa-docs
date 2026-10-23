---
title: Authentication
description: How to send your API key, which methods are accepted, and how to rotate a key.
sidebar:
  order: 2
---

Every keyed endpoint accepts the key in a header. Use one of these.

## Bearer token (recommended)

```sh
curl -H "Authorization: Bearer dugusa_YOUR_KEY" https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv
```

```python
import os, requests
r = requests.get(
    "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv",
    headers={"Authorization": f"Bearer {os.environ['DUGGANUSA_API_KEY']}"},
    timeout=60,
)
r.raise_for_status()
```

## HTTP Basic (for TAXII clients)

Tools that only offer a username and password field, such as the Microsoft Sentinel TAXII connector, can send the key as the **password**. The username can be anything. If the password is empty, the key is read from the username.

## Query string (discouraged)

The feed and search routes still accept `?api_key=` for older integrations. Avoid it: a key in a URL lands in proxy logs, browser history and SIEM query logs. Use it only for a product that can take nothing but a URL, and give that product its own key so you can rotate it alone.

The MCP servers and the account endpoints accept the header only.

## Which endpoints need a key

| Area | Key |
|---|---|
| Feed lanes (CSV, STIX, MISP, packages) | Required |
| Search and enrichment | Required |
| TAXII discovery | Not required |
| TAXII objects | Required; a request without a key returns no indicators |
| Jeevesus MCP | Optional (higher limits with a key) |
| Dredd MCP and pre-flight | Not required |
| Detection-rule catalog and exports | Not required; rules generated from live indicators need a key |
| Corpus statistics (`/api/v1/search/stats`) | Not required |

## Rotate or revoke

A key is per person and revocable. If one leaks, delete it with `DELETE /api/v1/api-keys/self` (Bearer the old key) and register again. See [API keys](/account/keys/).
