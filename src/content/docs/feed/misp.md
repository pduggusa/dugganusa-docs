---
title: MISP feed
description: Add DugganUSA as a MISP feed.
sidebar:
  order: 4
---

| Setting | Value |
|---|---|
| Input source | Network |
| URL | `https://analytics.dugganusa.com/api/v1/stix-feed/misp` |
| Source format | MISP feed |
| Headers | `Authorization: Bearer dugusa_YOUR_KEY` |

MISP reads `manifest.json` from that URL, then fetches each event as `/misp/<uuid>.json`. Put the key in the feed's **Headers** field, not in the URL.

```sh
curl -sS -H "Authorization: Bearer $DUGGANUSA_API_KEY" \
  "https://analytics.dugganusa.com/api/v1/stix-feed/misp/manifest.json"
```
