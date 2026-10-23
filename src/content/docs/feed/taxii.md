---
title: TAXII 2.1
description: Connect any TAXII 2.1 client, including Microsoft Sentinel and OpenCTI.
sidebar:
  order: 3
---

| Setting | Value |
|---|---|
| API root | `https://analytics.dugganusa.com/api/v1/taxii/` |
| Collection ID | `dugganusa-threat-intel` |
| Auth | HTTP Basic: any username, your API key as the password |
| Accept header | `application/taxii+json;version=2.1` |

Discovery is at `https://analytics.dugganusa.com/taxii2/`.

```sh
curl -sS -u "taxii:$DUGGANUSA_API_KEY" \
  -H "Accept: application/taxii+json;version=2.1" \
  "https://analytics.dugganusa.com/api/v1/taxii/collections/dugganusa-threat-intel/objects/?limit=100"
```

The collection supports `added_after`, `limit`, `next`, `match[type]` and `match[id]`. A response with `"more": true` carries a `next` value for the following page. Each page counts as one query against your [daily quota](/rate-limits/).

The server is read-only: writes return `403`.

:::caution[No key, no indicators]
A request without a key returns `200` with an empty `objects` list rather than an error. If your client imports nothing, check the credentials first.
:::

Step-by-step for Sentinel: [Microsoft Sentinel](/siem/sentinel/).
