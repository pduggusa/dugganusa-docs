---
title: STIX 2.1 bundle
description: The full feed as a STIX 2.1 bundle over HTTPS, with filters.
sidebar:
  order: 2
---

```sh
curl -sS -H "Authorization: Bearer $DUGGANUSA_API_KEY" \
  "https://analytics.dugganusa.com/api/v1/stix-feed?days=1&min_confidence=80&limit=500"
```

Returns a STIX 2.1 `bundle` whose `objects` are `indicator` objects plus the identity that created them. The key must be enabled for the threat-intel feed (keys registered for the feed are).

## Parameters

| Parameter | Meaning |
|---|---|
| `days` | Only indicators from the last N days |
| `since` | Only indicators added after this ISO 8601 time |
| `min_confidence` | Drop indicators scored below this |
| `country` | Two-letter country code of the indicator |
| `exclude_residential` | `true` drops residential IP space |
| `limit`, `offset` | Paging |
| `minimal` | `true` returns slimmer objects |

## An indicator

```json
{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--fef81cc1-9ee0-5702-9248-4e3aa52da161",
  "created_by_ref": "identity--f4a8c3d2-1b9e-4f7a-8c2d-9e3f5b6a7c8d",
  "created": "2026-10-23T02:14:42.978Z",
  "name": "Malicious IP: 110.249.202.129",
  "indicator_types": ["malicious-activity"],
  "pattern": "[ipv4-addr:value = '110.249.202.129']",
  "pattern_type": "stix",
  "pattern_version": "2.1",
  "valid_from": "2026-10-23T02:14:42.978Z",
  "valid_until": "2026-11-22T02:14:42.978Z",
  "confidence": 95,
  "labels": ["malicious-ip", "fixed-line-isp", "residential-proxy"],
  "kill_chain_phases": [{ "kill_chain_name": "mitre-attack", "phase_name": "command-and-control" }],
  "x_dugganusa_threat_intel": { "...": "enrichment: reputation, ISP, usage type" }
}
```

Indicators expire at `valid_until`: 30 days after `valid_from` for IPs and 90 days for domains, unless they are seen again. The `x_dugganusa_threat_intel` extension carries the enrichment behind the score; STIX tools that do not know it ignore it.

`created_by_ref` is always our identity, so you can filter on it after import. For pull-based tools, [TAXII 2.1](/feed/taxii/) is usually easier than paging this bundle yourself.
