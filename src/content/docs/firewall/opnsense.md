---
title: OPNsense
description: Load DugganUSA indicators into OPNsense as a URL Table alias, a Suricata ruleset and an Unbound DNS blocklist.
sidebar:
  order: 1
---

Three plain-text lanes are built for OPNsense:

| Lane | URL | Use it for |
|---|---|---|
| IP blocklist | `https://analytics.dugganusa.com/api/v1/opnsense/ip-blocklist` | Firewall alias (URL Table) |
| Suricata rules | `https://analytics.dugganusa.com/api/v1/opnsense/suricata-rules` | Intrusion Detection |
| DNS blocklist | `https://analytics.dugganusa.com/api/v1/opnsense/dns-blocklist` | Unbound DNS sinkhole |

Every lane needs an API key. Any tier works, including Free. Register at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register).

## Authentication

Send the key in a header whenever the client can:

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  https://analytics.dugganusa.com/api/v1/opnsense/ip-blocklist -o dugganusa-ips.txt
```

HTTP Basic also works (any username, the key as the password).

Some OPNsense screens accept only a URL. For those, the OPNsense lanes accept the key as a `token` query parameter:

```text
https://analytics.dugganusa.com/api/v1/opnsense/ip-blocklist?token=dugusa_YOUR_KEY
```

:::caution[The key will be in the URL]
A key in a URL is stored in your OPNsense configuration and backups, and it appears in proxy and web-server logs along the way. If you use `?token=`, use a key dedicated to this firewall, so you can delete and replace it without touching any other integration. See [Separate keys for exposed integrations](/account/keys/#separate-keys-for-exposed-integrations).
:::

`?token=` is ignored when an `Authorization` header is present.

## Quota

Every fetch of any lane counts as one query against your key's daily quota (Free: 10 per day). The responses are cached on our side for 15 minutes, so fetching more often than that returns the same body and still spends a query.

A plan for a Free key that leaves room for other use:

| Lane | Refresh | Queries per day |
|---|---|---|
| IP blocklist | every 6 hours | 4 |
| DNS blocklist | daily | 1 |
| Suricata rules | daily | 1 |

On Shield (300 per day) or above, hourly refresh of all three is fine. See [Plans](/account/plans/).

## IP blocklist

`GET /api/v1/opnsense/ip-blocklist`

Plain text, one IPv4 address per line, with a short `#` comment header.

```text
# DugganUSA OPNsense IP Blocklist
# Generated: 2026-10-23T15:00:00.000Z
# Source: https://analytics.dugganusa.com/api/v1/opnsense/ip-blocklist
# IPs: 25000
# Min Confidence: 70 | Days: 30
...
#
203.0.113.17
198.51.100.240
```

| Parameter | Default | Meaning |
|---|---|---|
| `min_confidence` | `70` | Drop indicators scored below this (0 to 100) |
| `country` | all | Only addresses whose recorded country matches this two-letter code, for example `CN` |
| `limit` | `25000` | Maximum addresses returned. Capped at `50000` |
| `exclude_residential` | `true` | Leave out addresses classified as residential. Set `false` to include them |

Private and loopback ranges (10/8, 172.16/12, 192.168/16, 127/8) are never emitted.

Response headers:

| Header | Meaning |
|---|---|
| `X-DugganUSA-Count` | Addresses in this response |
| `X-DugganUSA-Updated` | When the response was generated |
| `X-DugganUSA-Feed` | `ip-blocklist` |
| `X-Protected-Excluded` | Addresses withheld by our never-block list |

If the never-block list cannot be loaded, the lane returns `503` with `Retry-After: 60` instead of an unfiltered list.

### Add it as a URL Table alias

1. Go to **Firewall > Aliases** and add an alias.
2. **Name:** `DugganUSA_Blocklist`
3. **Type:** URL Table (IPs)
4. **Content:** the lane URL with your key, for example `https://analytics.dugganusa.com/api/v1/opnsense/ip-blocklist?token=dugusa_YOUR_KEY&min_confidence=80`. If your OPNsense release offers an authorization setting on URL Table aliases, use it with the key and leave `token` off the URL.
5. **Refresh Frequency:** set it to match your quota (6 hours on Free).
6. Save and apply.
7. Go to **Firewall > Rules**, and on your WAN interface add a rule that blocks traffic with **Source** set to `DugganUSA_Blocklist`. To stop inside hosts reaching listed addresses, add a block rule on your LAN interfaces with **Destination** set to the alias.

To check the alias loaded, open **Firewall > Diagnostics > Aliases** and select `DugganUSA_Blocklist`.

## Suricata rules

`GET /api/v1/opnsense/suricata-rules`

A Suricata `.rules` file generated from current indicators. Each IP produces two `alert` rules (outbound and inbound); domains produce `dns.query` rules and URLs produce HTTP rules. Rules alert; they do not drop unless you change the action in OPNsense.

```text
alert ip $HOME_NET any -> 203.0.113.17 any (msg:"DugganUSA: Blocked-Threat C2 [XX]"; sid:9100001; rev:1; classtype:trojan-activity; ...)
alert ip 203.0.113.17 any -> $HOME_NET any (msg:"DugganUSA: Blocked-Threat C2 [XX] - Inbound"; sid:9100002; rev:1; classtype:attempted-recon; ...)
alert dns $HOME_NET any -> any any (msg:"DugganUSA: DNS query for IOC-Feed infrastructure"; dns.query; content:"example-bad.test"; nocase; sid:...; rev:1; ...)
```

| Parameter | Default | Meaning |
|---|---|---|
| `min_confidence` | `70` | Drop indicators scored below this |
| `limit` | `1000` | Maximum indicators to build rules from. Capped at `5000` |
| `start_sid` | `9100001` | First SID. Change it if it collides with your local rules |
| `include_certs` | `true` | Append C&C TLS certificate rules (`tls.cert_fingerprint`, Suricata 5 or later) from abuse.ch SSLBL. These use SIDs from `start_sid + 80000` |

Response headers include `X-DugganUSA-Count` (rule count) and `X-Cert-Rules` (certificate rules appended, or `unavailable`).

### Load it into OPNsense

OPNsense's **Services > Intrusion Detection > Download** tab lists rulesets that OPNsense knows how to fetch. A third-party ruleset is not in that list by default, so fetch the file with a script that sends the key in a header, then reload Suricata:

```sh
#!/bin/sh
# /usr/local/bin/dugganusa-suricata.sh
KEY="$(cat /root/.dugganusa-key)"   # file containing only the key, chmod 600
curl -fsS -H "Authorization: Bearer ${KEY}" \
  "https://analytics.dugganusa.com/api/v1/opnsense/suricata-rules?min_confidence=80" \
  -o /tmp/dugganusa.rules.new && mv /tmp/dugganusa.rules.new /path/to/your/rules/dugganusa.rules
```

Point the destination at the rules directory your Suricata configuration reads, enable the ruleset in **Services > Intrusion Detection**, and apply. Keeping the key in a root-only file keeps it out of the URL, the process list and your configuration backup.

## DNS blocklist

`GET /api/v1/opnsense/dns-blocklist`

Unbound configuration lines that answer each listed domain with a sinkhole address:

```text
# DugganUSA OPNsense DNS Blocklist (Unbound Format)
# Domains: 10000
# Sinkhole: 0.0.0.0 | Risk: high+ | Phishing: true
# Allowlist: 3 critical-infrastructure domain(s) suppressed (never sinkholed)
...
local-zone: "example-bad.test" redirect
local-data: "example-bad.test A 0.0.0.0"

# End of DugganUSA DNS Blocklist — 10000 domains
```

| Parameter | Default | Meaning |
|---|---|---|
| `sinkhole_ip` | `0.0.0.0` | IPv4 address returned for listed domains. An invalid value falls back to `0.0.0.0` |
| `include_phishing` | `true` | Include phishing domains. Set `false` to leave them out |
| `min_risk` | `high` | `high`, or `medium` to include medium-risk domains as well |
| `limit` | `10000` | Maximum domains. Capped at `50000` |

Major platform domains (for example `google.com`, `github.com`) are never sinkholed; the header line `Allowlist:` reports how many were suppressed.

### Option A: Unbound include file

OPNsense's Unbound reads extra configuration from `/usr/local/etc/unbound.opnsense.d/*.conf`. Fetch the list there with the key in a header, check it, and restart Unbound:

```sh
#!/bin/sh
KEY="$(cat /root/.dugganusa-key)"
curl -fsS -H "Authorization: Bearer ${KEY}" \
  "https://analytics.dugganusa.com/api/v1/opnsense/dns-blocklist" \
  -o /tmp/dugganusa-blocklist.conf \
&& mv /tmp/dugganusa-blocklist.conf /usr/local/etc/unbound.opnsense.d/dugganusa-blocklist.conf \
&& configctl unbound restart
```

Run `unbound-checkconf` after the first install to confirm Unbound accepts the file.

### Option B: Unbound Blocklist URL

**Services > Unbound DNS > Blocklist** accepts blocklist URLs but no request header. If you prefer it, use the domain lane in plain format, one domain per line:

```text
https://analytics.dugganusa.com/api/v1/stix-feed/domains.csv?format=plain&api_key=dugusa_YOUR_KEY
```

The same caution applies: the key is stored in your configuration and travels in the URL. Use a dedicated key. Note that this lane is the general domain feed, which is not the same selection as `dns-blocklist`. See [CSV blocklists](/feed/csv-blocklists/).

## Scheduling the scripts

OPNsense's **System > Settings > Cron** schedules commands that `configd` knows about. To schedule your own script, add a `configd` action, for example `/usr/local/opnsense/service/conf/actions.d/actions_dugganusa.conf`:

```ini
[refresh]
command:/usr/local/bin/dugganusa-suricata.sh
parameters:
type:script
message:refreshing DugganUSA rules
description:Refresh DugganUSA Suricata rules
```

Run `service configd restart`, then pick **Refresh DugganUSA Suricata rules** as the command in a new cron job.

## Connectivity check

`GET /api/v1/opnsense/info` returns JSON with the lane URLs and current data-source counts. `GET /api/v1/opnsense/help` returns the parameter list. Both need a key and count as one query.

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" https://analytics.dugganusa.com/api/v1/opnsense/info
```

```json
{
  "success": true,
  "feed": "DugganUSA OPNsense Threat Intel",
  "version": "1.0.0",
  "endpoints": {
    "ip_blocklist": "/api/v1/opnsense/ip-blocklist",
    "suricata_rules": "/api/v1/opnsense/suricata-rules",
    "dns_blocklist": "/api/v1/opnsense/dns-blocklist",
    "help": "/api/v1/opnsense/help"
  },
  "refresh_interval": "15 minutes (matches OPNsense URL Table default)"
}
```

## Errors

| Status | Cause |
|---|---|
| `401` | No key, or the key is not recognized |
| `429` | Daily quota used up. The quota resets at midnight UTC |
| `503` | The never-block list could not be loaded; retry after the `Retry-After` interval |

See [Errors](/errors/) and [Rate limits](/rate-limits/).
