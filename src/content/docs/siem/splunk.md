---
title: Splunk
description: Pull DugganUSA CSV lanes into Splunk lookups or events with the key in a header, and import detection rules as SPL.
sidebar:
  order: 2
---

There is no DugganUSA Splunk app. You pull the CSV lanes yourself, with your key in an `Authorization` header, and use them as lookups or index them as events. Detection rules export directly as SPL.

## Store the key

Keep the key in a file only the Splunk service account can read, not in a script, a saved search or a URL:

```sh
sudo install -m 600 -o splunk -g splunk /dev/null /opt/splunk/etc/auth/dugganusa.key
sudo sh -c 'printf "%s" "dugusa_YOUR_KEY" > /opt/splunk/etc/auth/dugganusa.key'
```

Adjust the path and owner to your installation. The examples below read the key from this file.

## Option 1: refresh a lookup on a schedule

A small script fetches `ips.csv` and writes it to a lookup file. Run it from cron (or a Splunk scripted input) on the Splunk search head.

```python
#!/usr/bin/env python3
# /opt/splunk/bin/scripts/dugganusa_ips.py
import os, tempfile, requests

KEY_FILE = "/opt/splunk/etc/auth/dugganusa.key"
LOOKUP = "/opt/splunk/etc/apps/search/lookups/dugganusa_ips.csv"
URL = "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv"

key = open(KEY_FILE).read().strip()
r = requests.get(
    URL,
    params={"min_confidence": 50, "days": 7},
    headers={"Authorization": f"Bearer {key}", "User-Agent": "splunk-dugganusa-lookup"},
    timeout=300,
)
r.raise_for_status()

# A lane can carry "# ..." comment lines. A lookup file must start with the
# column header, so drop comment lines.
lines = [l for l in r.text.splitlines() if l and not l.startswith("#")]
if len(lines) < 2:
    raise SystemExit("empty response, keeping the previous lookup")

fd, tmp = tempfile.mkstemp(dir=os.path.dirname(LOOKUP))
with os.fdopen(fd, "w") as f:
    f.write("\n".join(lines) + "\n")
os.replace(tmp, LOOKUP)
```

The same with curl, for a shell cron job:

```sh
curl -fsS -H "Authorization: Bearer $(cat /opt/splunk/etc/auth/dugganusa.key)" \
  "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv?min_confidence=50" \
  | grep -v '^#' > /tmp/dugganusa_ips.csv \
  && mv /tmp/dugganusa_ips.csv /opt/splunk/etc/apps/search/lookups/dugganusa_ips.csv
```

The file has these columns:

```csv
ip,confidence,threat_type,source,first_seen
```

Match firewall events against it:

```spl
index=firewall
| lookup dugganusa_ips.csv ip AS src_ip OUTPUT confidence threat_type source first_seen
| where isnotnull(confidence) AND confidence >= 80
| stats count min(_time) AS first max(_time) AS last BY src_ip confidence threat_type source
```

`ips.csv` includes CIDR ranges as well as single addresses. An exact-match lookup only matches the single addresses. To match ranges, define the lookup in `transforms.conf` with `match_type = CIDR(ip)`:

```ini
[dugganusa_ips]
filename = dugganusa_ips.csv
match_type = CIDR(ip)
max_matches = 1
```

and use `| lookup dugganusa_ips ip AS src_ip ...`.

The other lanes work the same way. Their columns:

| Lane | Columns |
|---|---|
| `domains.csv` | `domain,confidence,threat_type,source,first_seen` |
| `urls.csv` | `url,confidence,threat_type,source,first_seen` |
| `hashes.csv` | `hash,type,malware_family,confidence,first_seen,source` |

Parameters for each lane: [CSV blocklists](/feed/csv-blocklists/).

## Option 2: index the lane as events

To keep history, index each pull instead of replacing a lookup. Either point a scripted input at a script that prints the CSV to standard output, or send each row to the HTTP Event Collector:

```python
#!/usr/bin/env python3
import json, requests

KEY = open("/opt/splunk/etc/auth/dugganusa.key").read().strip()
HEC_URL = "https://splunk.example.com:8088/services/collector/event"
HEC_TOKEN = open("/opt/splunk/etc/auth/hec.token").read().strip()

r = requests.get(
    "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv",
    params={"min_confidence": 80},
    headers={"Authorization": f"Bearer {KEY}"},
    timeout=300,
)
r.raise_for_status()
rows = [l for l in r.text.splitlines() if l and not l.startswith("#")]
header = rows[0].split(",")

batch = []
for line in rows[1:]:
    values = line.split(",", len(header) - 1)
    batch.append(json.dumps({"sourcetype": "dugganusa:ioc", "event": dict(zip(header, values))}))

requests.post(HEC_URL, data="\n".join(batch),
              headers={"Authorization": f"Splunk {HEC_TOKEN}"}, timeout=120).raise_for_status()
```

The `threat_type` column is quoted text. For anything beyond a quick start, parse rows with Python's `csv` module instead of splitting on commas.

## Polling and quota

Each pull of any lane counts as one query against your key's daily quota (Free: 10 per day). Lanes are cached for a few minutes, so polling more than every 15 minutes gains nothing. A Free key covers, for example, `ips.csv` every 4 hours plus one daily pull of `domains.csv` and `hashes.csv`. See [Rate limits](/rate-limits/) and [Plans](/account/plans/).

## Detection rules as SPL

Every rule in the DugganUSA catalog exports as SPL. The catalog and exports need no key.

```sh
curl -sS "https://analytics.dugganusa.com/api/v1/detection-rules/dugganusa-001/export?format=splunk"
```

```spl
index=firewall OR index=proxy OR index=network
| lookup abuseipdb_cache ip OUTPUT abuse_score total_reports country
| where abuse_score > 15 AND total_reports > 10
| stats count by src_ip, abuse_score, total_reports, country
| sort -abuse_score
| eval severity="HIGH"
| table src_ip, country, abuse_score, total_reports, severity
```

Catalog rules are written against generic index names and lookups (here `abuseipdb_cache`). Change them to match your environment before saving the search. The response is `text/plain` with `Content-Disposition: attachment; filename="dugganusa-<id>.spl"`.

To fetch every rule's SPL at once:

```python
import requests

BASE = "https://analytics.dugganusa.com/api/v1/detection-rules"
for rule in requests.get(BASE, timeout=60).json()["rules"]:
    spl = requests.get(f"{BASE}/{rule['id']}/export", params={"format": "splunk"}, timeout=60).text
    with open(f"{rule['id']}.spl", "w") as f:
        f.write(spl + "\n")
    print(rule["id"], rule["name"])
```

Full catalog and the live-indicator rule generators: [Detection rules](/siem/detection-rules/).

## If a tool accepts only a URL

Some Splunk add-ons and threat-intelligence download settings take a URL and nothing else. The feed lanes still accept the key as `?api_key=`. This form is discouraged and kept for older integrations:

```text
https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv?api_key=dugusa_YOUR_KEY
```

The key is then stored in that tool's configuration and written to proxy and web-server logs. Use the header-based options above where you can. If you must use a URL, use a key dedicated to that one tool so you can delete and replace it without touching anything else. See [Separate keys for exposed integrations](/account/keys/#separate-keys-for-exposed-integrations).
