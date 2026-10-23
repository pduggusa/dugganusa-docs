---
title: Enrichment, adversaries and KEV
description: Get a verdict on an IP or domain, look up threat-actor profiles, and search the CISA Known Exploited Vulnerabilities catalog.
sidebar:
  order: 2
---

| Endpoint | Key | Use it for |
|---|---|---|
| `GET /api/v1/threat-intel/enrichment` | Required | One verdict on an IP or domain, from the DugganUSA corpus plus third-party reputation sources |
| `GET /api/v1/adversaries` and `/api/v1/adversaries/:name` | Not required | Threat-actor profiles |
| `GET /api/v1/threat-intel/kev/search` and `/kev/stats` | Not required | The CISA KEV catalog |

## Enrich an IP or domain

`GET /api/v1/threat-intel/enrichment?ip=<ip-or-domain>`

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/threat-intel/enrichment?ip=185.39.19.176"
```

```python
import os, requests

r = requests.get(
    "https://analytics.dugganusa.com/api/v1/threat-intel/enrichment",
    params={"ip": "185.39.19.176"},
    headers={"Authorization": f"Bearer {os.environ['DUGGANUSA_API_KEY']}"},
    timeout=60,
)
r.raise_for_status()
summary = r.json()["data"]["summary"]
print(summary["verdict"], summary["threat_score"]["score"], summary["in_dugganusa_corpus"])
```

| Parameter | Meaning |
|---|---|
| `ip` | An IPv4 address or a domain name. A URL is trimmed to its host |
| `indicator` | Alias for `ip` |

A domain is resolved with DNS. The first resolved IPv4 address is enriched along with the domain itself; up to four more resolved addresses are listed in `additional_ips` for you to enrich separately.

Each call counts as one query against your daily quota. Third-party lookups are cached, so repeated calls for the same indicator return quickly.

### Response

Read `data.summary` for automation. `data.sources` holds the per-source detail.

```json
{
  "success": true,
  "data": {
    "indicator": "185.39.19.176",
    "type": "ip",
    "ip": "185.39.19.176",
    "domain": null,
    "timestamp": "2026-10-23T15:20:00.000Z",
    "sources": {
      "abuseipdb": { "abuseConfidenceScore": 100, "totalReports": 412 },
      "virustotal": { "last_analysis_stats": { "malicious": 9 } },
      "threatfox": { "query_status": "ok", "data": [ { "malware": "…" } ] },
      "shodan": { "…": "…" },
      "otx": { "pulseCount": 3 },
      "dugganusa": { "in_corpus": true, "match": "exact", "ioc_count": 2, "block_events": 14 }
    },
    "threatScore": { "score": 78, "severity": "CRITICAL", "factors": ["…"] },
    "blockRecommendation": {
      "shouldBlock": true,
      "reason": "AbuseIPDB: 100% abuse confidence, 412 reports",
      "reasons": ["AbuseIPDB: 100% abuse confidence, 412 reports", "VirusTotal: 9 engines flagged as malicious"]
    },
    "summary": {
      "verdict": "malicious",
      "threat_score": { "score": 78, "severity": "CRITICAL" },
      "block_recommended": { "shouldBlock": true },
      "malware_family": null,
      "threat_type": null,
      "confidence": null,
      "first_seen": null,
      "last_seen": null,
      "in_dugganusa_corpus": true,
      "dugganusa_match": "exact",
      "dugganusa_block_coverage": false,
      "dugganusa_covered_by": null,
      "dugganusa_ioc_count": 2,
      "dugganusa_block_events": 14,
      "virustotal_detections": "9/94",
      "abuseipdb_score": 100,
      "threatfox_hit": true
    }
  }
}
```

| Field | Meaning |
|---|---|
| `summary.verdict` | `malicious` (threat score 50 or more), `suspicious` (score 10 or more, or a block is recommended), or `clean` |
| `summary.threat_score` | `score` (0 to 100), `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and the `factors` behind it |
| `summary.block_recommended` | `shouldBlock`, plus `reason` and `reasons` in plain language |
| `summary.in_dugganusa_corpus` | `true` only when this exact indicator is in the DugganUSA corpus |
| `summary.dugganusa_match` | `exact`, `cidr` (only a containing range is listed), or `null` |
| `summary.dugganusa_block_coverage` | `true` when a listed range covers the address even though the address itself is not listed |
| `summary.first_seen` | When the indicator entered the DugganUSA index. It is not when the threat began |

A source that fails or is not configured appears in `sources` with an `error` field instead of data. The verdict is computed from the sources that answered.

Errors: `400` when `ip` is missing or cannot be parsed as an IP or domain; `401` without a valid key.

For indicator search without third-party lookups, use [Search](/search/search/). For where else an indicator appears in the corpus (Pro and above), use `/api/v1/search/correlate`.

## Threat-actor profiles

### List or search

`GET /api/v1/adversaries`

```sh
curl -sS "https://analytics.dugganusa.com/api/v1/adversaries?q=Lazarus&limit=1"
```

| Parameter | Default | Meaning |
|---|---|---|
| `q` | all | Search text (name, aliases, description) |
| `country` | none | Exact country value as stored, for example `KP` |
| `limit` | `50` | Profiles to return |

```json
{
  "success": true,
  "data": {
    "query": "Lazarus",
    "count": 1,
    "total": 404,
    "adversaries": [
      {
        "id": "actor-lazarus",
        "name": "Lazarus",
        "last_seen": "2026-10-22T15:03:07.000Z",
        "malware_families": ["Lazarus-DeFi", "TouchShift", "ClientHub"],
        "cves_exploited": ["CVE-2026-68820"],
        "ioc_count": 65,
        "ioc_count_is_floor": true,
        "our_coverage_count": 20,
        "our_latest_post": "https://www.dugganusa.com/post/…",
        "first_seen_basis": "blog-coverage"
      }
    ]
  }
}
```

`total` is a search estimate. Fields ending in `_is_floor` mark counts that are lower bounds. `country` values are not normalized: some profiles use ISO codes and others use names, so check `/api/v1/adversaries/stats` for the values in use.

### One profile

`GET /api/v1/adversaries/:name` returns the profile as `data`, or `404` if no profile matches.

`GET /api/v1/adversaries/:name/pulses?limit=20` returns community threat pulses that mention the actor, as `data.pulseCount` and `data.pulses`. These are third-party reports, not DugganUSA observations.

### Counts

`GET /api/v1/adversaries/stats` returns the number of indexed profiles and a count by `country`.

## CISA Known Exploited Vulnerabilities

### Search

`GET /api/v1/threat-intel/kev/search`

```sh
curl -sS "https://analytics.dugganusa.com/api/v1/threat-intel/kev/search?q=Ivanti&limit=1"
```

| Parameter | Default | Meaning |
|---|---|---|
| `q` | all | Search text: CVE id, vendor, product or words from the description |
| `limit` | `10` | Entries to return |

Results are sorted newest `dateAdded` first.

```json
{
  "success": true,
  "data": {
    "query": "Ivanti",
    "count": 1,
    "vulnerabilities": [
      {
        "cveID": "CVE-2026-104935",
        "vendor": "Ivanti",
        "product": "Connect Secure",
        "name": "Ivanti Connect Secure Authentication Bypass by Spoofing Vulnerability",
        "dateAdded": "2026-10-13",
        "dueDate": "2026-10-16",
        "ransomwareUse": "Unknown",
        "cwes": ["CWE-290"],
        "requiredAction": "Apply mitigations in accordance with vendor instructions, …",
        "isOverdue": true,
        "daysUntilDue": -7,
        "addedDaysAgo": 11
      }
    ]
  }
}
```

`isOverdue`, `daysUntilDue` and `addedDaysAgo` are computed against the federal due date when the catalog was last synced; they are not about your environment.

### Catalog counts

`GET /api/v1/threat-intel/kev/stats`

```json
{ "success": true, "data": { "total": 1754, "recentAdditions": 6, "overdue": 1751, "knownRansomware": 361 } }
```

The KEV catalog is also searchable as the `cisa_kev` index through [Search](/search/search/) on Pro and above.
