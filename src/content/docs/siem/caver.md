---
title: Caver
description: Pull the DugganUSA TAXII feed into Caver's indicator store, match the CSV lanes through lookup tables, and use the detection rules, with their SQL-over-OCSF form.
sidebar:
  order: 4
---

[Caver](https://getcaver.com) is an enterprise SIEM on an open OCSF Parquet lakehouse, from RedEye Security. It can pull the DugganUSA feed over TAXII 2.1 into its indicator store, match our CSV lanes against events through lookup tables, and run our detection rules. There is no DugganUSA app for Caver: you configure a feed subscription with your key. `caver.example.com` below stands for your own Caver host.

This page was contributed by Matt Lucas at [RedEye Security](https://getcaver.com), who also found and reported five defects in our detection rules while translating them. Those are fixed in the live catalog as of 2026-11-07. The Caver-specific steps below are his and have not been run by DugganUSA, so check them against [Caver's docs](https://getcaver.com/docs/).

## What works

| Use | Works | Notes |
|---|---|---|
| TAXII 2.1 collection `dugganusa-threat-intel` into Caver's indicator store | Yes | HTTP Basic auth, key as the password |
| CSV lanes as lookup tables for event matching | Yes, with limits | Exact match only; see the limits below |
| Detection rules | Yes | Caver imports Sigma; our rules are also served as Splunk SPL |
| Caver's `iocmatch` command against our feed | No | It reads one feed from environment settings and sends the key as a `token` query parameter, not a header. Our API takes keys in a header only |

Caver API calls below go to your Caver gateway with a Caver token that holds the `edit_feeds` capability. The `CAVER_TOKEN` variable holds it.

## Store the key

Caver keeps a feed key on the server inside the subscription and never returns it from its API. Put your DugganUSA key in a file only your shell user can read, then create the subscription without a key and set the key from that file so it never appears in a command line or shell history.

```bash
install -m 600 /dev/null ~/.dugganusa.key
printf '%s' 'dugusa_YOUR_KEY' > ~/.dugganusa.key
```

```bash
curl -sS -X POST https://caver.example.com/api/feeds/subscriptions \
  -H "Authorization: Bearer $CAVER_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "DugganUSA",
    "base_url": "https://analytics.dugganusa.com",
    "auth_mode": "basic",
    "collections": ["dugganusa-threat-intel"],
    "enabled": true,
    "cron": "0 6 * * *"
  }'

jq -Rn '{token: ("taxii:" + input)}' < ~/.dugganusa.key \
  | curl -sS -X POST https://caver.example.com/api/feeds/subscriptions/dugganusa/key \
      -H "Authorization: Bearer $CAVER_TOKEN" -H "Content-Type: application/json" -d @-
```

DugganUSA TAXII accepts any username with the key as the password, so the Basic token is `taxii:` followed by the key. Test the connection:

```bash
curl -sS -X POST https://caver.example.com/api/feeds/subscriptions/dugganusa/test \
  -H "Authorization: Bearer $CAVER_TOKEN"
```

## Pull the feed

Caver does TAXII 2.1 discovery at `https://analytics.dugganusa.com/taxii2/`, follows the API root `https://analytics.dugganusa.com/api/v1/taxii/`, lists collections and walks `objects/` until the collection is exhausted. Run a pull now, or wait for the cron:

```bash
curl -sS -X POST https://caver.example.com/api/feeds/subscriptions/dugganusa/sync \
  -H "Authorization: Bearer $CAVER_TOKEN"
curl -sS https://caver.example.com/api/feeds/subscriptions/dugganusa \
  -H "Authorization: Bearer $CAVER_TOKEN"
```

The second call returns the subscription's `last_status`, `total` and `by_type`. **A TAXII request without a valid key returns HTTP 200 with an empty `objects` list**, not an error. So `up` with `total: 0` most likely means the key was not accepted: check the key first.

Indicators of type IP, domain, URL and hash are parsed from the STIX patterns into Caver's indicator store. Per RedEye, mirrored indicators expire after seven days unless the next pull refreshes them.

## CSV lanes as lookup tables

Use this to match events in a search or rule. Per RedEye, Caver reads lookup tables from CSV files in the directory named by `CAVER_LOOKUPS_DIR`, and the table name is the file name without `.csv`. Limits that matter:

- **Exact match only.** Caver lookup tables have no CIDR match type. `ips.csv` carries network ranges (for example hijacked networks from the Spamhaus DROP list) and a large share of a high-confidence pull can be ranges, which never match an event. Single addresses do.
- **Row cap.** Per RedEye a table over 5,000 rows by default is skipped whole, not truncated. Shrink the lane with `min_confidence` and `limit`, or raise Caver's cap.
- **Comment lines.** An unauthenticated request to our CSVs returns a `#` comment body; an authenticated one does not. Strip `#` lines anyway so a failed pull cannot break a table.
- **Reload.** Tables are read at service start, so restart the Caver services after you refresh a file.

```bash
#!/bin/sh
# Refresh the DugganUSA IP lookup. Run from cron, then restart Caver services.
set -eu
KEY_FILE="$HOME/.dugganusa.key"
OUT="${CAVER_LOOKUPS_DIR:?set CAVER_LOOKUPS_DIR}/dugganusa_ips.csv"
TMP="$(mktemp)"
curl -fsS -H "Authorization: Bearer $(cat "$KEY_FILE")" \
  "https://analytics.dugganusa.com/api/v1/stix-feed/ips.csv?min_confidence=80&days=7" \
  | grep -v '^#' | grep -v '^[^,]*/' > "$TMP"
[ "$(wc -l < "$TMP")" -ge 2 ] || { echo "empty response, keeping previous table" >&2; rm -f "$TMP"; exit 1; }
mv "$TMP" "$OUT"
```

The last `grep` drops rows whose first column holds a network range that an exact-match table cannot use. The columns are `ip,confidence,threat_type,source,first_seen`. The other lanes work the same way, for example `domains.csv` saved as `dugganusa_domains.csv`.

Match firewall events against the table with SPL:

```
search index=firewall
| lookup dugganusa_ips ip AS src_ip OUTPUT confidence threat_type source first_seen
| where isnotnull(confidence) AND confidence >= 80
| stats count, min(_time) AS first, max(_time) AS last by src_ip, confidence, threat_type, source
```

A lookup against a table that does not exist does not error: every output column comes back null and the `isnotnull` test returns nothing. If a match query is empty, confirm the table loaded.

## Detection rules

The catalog needs no key and is at `/api/v1/detection-rules`, exportable per rule as Sigma, Splunk SPL, KQL, SQL over OCSF (`/api/v1/detection-rules/<id>/export?format=sql`) or JSON. Caver imports Sigma natively through `caver-migrate-sigma`, and its search language is SPL-style. See [Detection rules](/siem/detection-rules/) for what each rule needs.

- **Re-pull the catalog.** Five rules (007, 011, 012, 016, 017) were corrected on 2026-11-07, and six Sigma thresholds that were written as quoted text now use numeric comparisons. A translation made from the earlier export carries the old logic.
- **Create the lookup tables a rule calls** before enabling it (for example `abuseipdb_cache`, `virustotal_cache`, `geoip`, `whois_cache`, `cisa_kev_catalog`, `sanctioned_rmm`). A rule whose table is missing fires on nothing or on everything. Rule 015 fires on every match without `sanctioned_rmm`.
- **Adapt index and field names** to yours, and test a rule against known-good data before enabling it.

The SQL form maps each rule to OCSF classes in its first CTE and keeps the detection logic over flat columns. The logic is run by our tests on SQLite; the OCSF mapping and the SQL dialect have not been run on Caver or any lakehouse, so expect to adjust the first CTE. Rule 007 needs the request body in `unmapped.request_body`, because OCSF has no body field. RedEye has also translated the catalog into Caver's native rule format as a draft, which is not published here.

## Polling and quota

Each pull of any lane counts as one query against your key's daily quota. Free keys get 10 queries per day; see [Rate limits](/rate-limits/) and [Plans](/account/plans/). Lanes are cached for a few minutes on our side, so polling more often than every 15 minutes gains nothing. A Caver subscription runs on its `cron`; on a free key set it to once a day as above. One TAXII sync walks the whole collection, so if our pages are smaller than Caver's request, a sync costs one query per page. The CSV script above costs one query per run.

## If a tool accepts only a URL

Caver's feed client has no URL-only mode and does not send `?api_key=`. Its query-string mode sends `?token=`, which is not our form, and our API takes keys in a header only. Use `auth_mode: basic` for TAXII and the header in the CSV script. If you cannot send a header, put a small proxy in front that adds one, with a key dedicated to Caver so you can replace it without touching anything else.

## Limits

DugganUSA has not run the Caver side of this page. Feed contents change, and confidence scores are our assessments, not guarantees. Indicators are for blocking and triage, and some are shared infrastructure: review before enforcing.
