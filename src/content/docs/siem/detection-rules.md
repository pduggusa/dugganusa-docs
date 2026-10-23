---
title: Detection rules
description: A keyless catalog of detection rules exportable as Sigma, SPL, KQL or JSON, plus keyed generators that build YARA, Sigma and Suricata rules from live indicators.
sidebar:
  order: 3
---

Two kinds of rules:

| Kind | Endpoints | Key |
|---|---|---|
| **Catalog**: hand-written detections, each available as Sigma, Splunk SPL, KQL and JSON | `/api/v1/detection-rules`, `/api/v1/detection-rules/:id`, `/api/v1/detection-rules/:id/export` | Not required |
| **Generators**: rules built on request from current indicators | `/api/v1/detection-rules/yara`, `/sigma/ioc`, `/suricata`, `/bundle` | Required |

## Catalog

### List rules

`GET /api/v1/detection-rules`

```sh
curl -sS https://analytics.dugganusa.com/api/v1/detection-rules
```

```json
{
  "meta": { "total": 17, "filters": {} },
  "rules": [
    {
      "id": "dugganusa-001",
      "name": "High-Confidence Malicious IP Detection",
      "category": "Network Traffic",
      "severity": "high",
      "mitre": ["T1071 - Application Layer Protocol", "T1595 - Active Scanning"],
      "description": "Detects IPs with high abuse confidence scores (>15) AND multiple reports, indicating sustained malicious activity",
      "falsePositiveRate": "5.96%",
      "platforms": ["Any SIEM", "Firewall", "IDS/IPS"],
      "sigma": "title: High-Confidence Malicious IP Detection\n...",
      "splunk": "index=firewall OR index=proxy OR index=network\n...",
      "kql": "..."
    }
  ]
}
```

Each rule object also carries `rationale`, `detectionMethod` and `source`.

Filter with one of these query parameters. If you pass more than one, only the last in this order applies: `category`, then `mitre`, then `severity`.

| Parameter | Match | Example |
|---|---|---|
| `category` | Exact category name | `?category=Ransomware%20Defense` |
| `mitre` | Substring of any listed technique | `?mitre=T1190` |
| `severity` | Exact: `critical`, `high`, `medium` | `?severity=critical` |

`GET /api/v1/detection-rules/stats` returns counts by category, MITRE technique and severity.

### Get one rule

`GET /api/v1/detection-rules/:id` returns the rule object, or `404` with `{"error": "Rule not found"}`.

### Export a rule

`GET /api/v1/detection-rules/:id/export?format=<format>`

| `format` | Content-Type | File extension |
|---|---|---|
| `sigma` (default) | `text/yaml` | `.yml` |
| `splunk` | `text/plain` | `.spl` |
| `kql` | `text/plain` | `.kql` |
| `json` | `application/json` | `.json` |

The response is the rule body only, sent as an attachment named `dugganusa-<id>.<extension>`. An unknown id or format returns `404`.

```sh
curl -sS -OJ "https://analytics.dugganusa.com/api/v1/detection-rules/dugganusa-010/export?format=sigma"
curl -sS "https://analytics.dugganusa.com/api/v1/detection-rules/dugganusa-010/export?format=kql"
```

```python
import requests

BASE = "https://analytics.dugganusa.com/api/v1/detection-rules"
for rule in requests.get(BASE, params={"severity": "critical"}, timeout=60).json()["rules"]:
    sigma = requests.get(f"{BASE}/{rule['id']}/export", params={"format": "sigma"}, timeout=60)
    sigma.raise_for_status()
    open(f"{rule['id']}.yml", "w").write(sigma.text)
```

Catalog rules reference generic index, table and lookup names (for example `index=firewall`, `abuseipdb_cache`). Adapt them to your data before you deploy them.

## Generators

The generators read current indicators, apply the same filters the feed applies (never-block lists, domain hygiene, false-positive flags, confidence floor), and return rules. They need a key, and each call counts as one query against your daily quota. They never accept anonymous browser access.

All four take:

| Parameter | Default | Meaning |
|---|---|---|
| `min_confidence` | `50` | Drop indicators scored below this |
| `limit` | `500` | Indicators to read, newest first. Capped at `1000` |

`yara`, `sigma/ioc` and `suricata` responses carry `X-Sanitize-Dropped`, a summary of what the filters withheld, for example `domain-never-block=3;policy=1`, or `none`.

### Suricata

`GET /api/v1/detection-rules/suricata`

Extra parameter: `start_sid` (default `9000001`). Each IP produces an outbound and an inbound `alert ip` rule; domains produce `alert dns ... dns.query` rules; URLs produce HTTP rules. Returned as `text/plain`, attachment `dugganusa.rules`.

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/detection-rules/suricata?min_confidence=80" \
  -o dugganusa.rules
```

For OPNsense, use the OPNsense lane instead, which starts at SID `9100001` and can append TLS certificate rules: [OPNsense](/firewall/opnsense/).

### Sigma

`GET /api/v1/detection-rules/sigma/ioc`

Up to three rules in one multi-document YAML file (`text/yaml`, attachment `dugganusa-ioc-rules.yml`), each listing at most 100 values:

| Rule | `logsource` | Field |
|---|---|---|
| Malicious IP | `category: firewall` | `dst_ip` |
| Malicious domain | `category: dns` | `query\|contains` |
| Malicious file hash | `category: process_creation`, `product: windows` | `Hashes\|contains` |

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  https://analytics.dugganusa.com/api/v1/detection-rules/sigma/ioc -o dugganusa-ioc-rules.yml
sigma convert -t splunk dugganusa-ioc-rules.yml
```

### YARA

`GET /api/v1/detection-rules/yara`

`text/plain`, attachment `dugganusa-rules.yar`. Rules for MD5 and SHA-256 values (up to 100 each), IPv4 addresses (up to 200), domains (up to 200) and URLs (up to 100), each as YARA strings with `any of them`.

These rules match files or memory that **contain** an indicator value, such as a binary with a C2 address embedded in it. They do not compare a file's own hash. To match files by hash, load `hashes.csv` into your EDR or use YARA's `hash` module with the values from that lane. See [CSV blocklists](/feed/csv-blocklists/).

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  https://analytics.dugganusa.com/api/v1/detection-rules/yara -o dugganusa-rules.yar
yara -r dugganusa-rules.yar /path/to/scan
```

### Bundle

`GET /api/v1/detection-rules/bundle`

A ZIP (`application/zip`, attachment `dugganusa-detection-rules.zip`) with the three generated rule sets and the full catalog in every format:

```text
yara/dugganusa-ioc.yar
sigma/dugganusa-ioc-dynamic.yml
sigma/dugganusa-static-rules.yml
suricata/dugganusa.rules
splunk/dugganusa-queries.spl
kql/dugganusa-sentinel.kql
json/dugganusa-rules.json
README.md
```

```python
import os, requests

r = requests.get(
    "https://analytics.dugganusa.com/api/v1/detection-rules/bundle",
    params={"min_confidence": 80},
    headers={"Authorization": f"Bearer {os.environ['DUGGANUSA_API_KEY']}"},
    timeout=300,
)
r.raise_for_status()
open("dugganusa-detection-rules.zip", "wb").write(r.content)
```

## Errors

| Status | Cause |
|---|---|
| `401` | Generator called without a key, or with an unrecognized key |
| `404` | Unknown rule id or export format |
| `429` | Daily quota used up |
| `500` | Rule generation failed; the body has `error` and `message` |
| `501` | Bundle generation is unavailable on this server; use the individual generators |
