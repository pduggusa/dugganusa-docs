---
title: CSV blocklists
description: IP, domain, URL, hash and certificate indicators as CSV, for firewalls, proxies and scripts.
sidebar:
  order: 1
---

Plain CSV, one indicator per row, refreshed continuously. All lanes need a key. Base URL: `https://analytics.dugganusa.com`.

| Lane | Path |
|---|---|
| IPs and CIDR ranges | `/api/v1/stix-feed/ips.csv` |
| Domains | `/api/v1/stix-feed/domains.csv` |
| URLs | `/api/v1/stix-feed/urls.csv` |
| File hashes | `/api/v1/stix-feed/hashes.csv` |
| TLS certificates | `/api/v1/stix-feed/certs.csv` |

```sh
curl -sS -H "Authorization: Bearer $DUGGANUSA_API_KEY" \
  "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv?min_confidence=80" -o dugganusa-ips.csv
```

## Parameters

| Parameter | Lanes | Default | Meaning |
|---|---|---|---|
| `days` | `ips.csv`, `domains.csv`, `certs.csv` | `7` | Only indicators seen in the last N days. `urls.csv` and `hashes.csv` use their own fixed windows |
| `limit` | all | the full lane | Return at most N rows |
| `min_confidence` | `ips.csv` | `50` | Drop rows scored below this |

The domain, URL and hash lanes do not filter on confidence. Every row carries its score, so filter on that column if you need a floor there.

## Columns

```csv
ip,confidence,threat_type,source,first_seen
domain,confidence,threat_type,source,first_seen
url,confidence,threat_type,source,first_seen
hash,type,malware_family,confidence,first_seen,source
```

- **`confidence`** runs from 0 to 95. We cap at 95 on purpose; no indicator is certain.
- **`source`** names where the indicator came from. Third-party feeds we redistribute, such as ThreatFox or Spamhaus, keep their own name. `dugganusa-honeypot` and `edge-honeypot` are our own sensors.
- **`first_seen`** is when the indicator entered our index, not when the threat began.

## Choosing a confidence floor

`min_confidence` is your dial. 50 casts a wide net for logging and alerting. 80 is the floor our own Cloudflare Worker blocks at. Start with alerting on everything and blocking at 80, then tune to your false-positive tolerance.

## Caching and polling

Lanes are cached for a few minutes at our edge. Polling more than every 15 minutes gains nothing, and each pull counts against your [daily quota](/rate-limits/).
