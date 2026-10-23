---
title: Endpoint reference
description: Every customer endpoint by product area, with method, path, authentication and response format.
---

Base URL: `https://analytics.dugganusa.com`

**Auth** column:

- **none**: no key needed.
- **key**: any valid key, any plan. Send `Authorization: Bearer dugusa_YOUR_KEY` (see [Authentication](/authentication/)). Counts against your daily quota unless noted.
- **Pro**: Pro or Enterprise key.
- **Enterprise**: Enterprise key.

## Threat-intel feed

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| GET | `/api/v1/stix-feed` | key | STIX 2.1 bundle of current indicators. `format=bundle` (default), `splunk`, `csv`, `simple`, `indicators` | JSON |
| GET | `/api/v1/stix-feed/v2` | key | STIX 2.1 with observable, indicator and relationship objects | JSON |
| GET | `/api/v1/stix-feed/ips.csv` | key | IP addresses and CIDR ranges. `format=plain` for one per line | CSV or text |
| GET | `/api/v1/stix-feed/domains.csv` | key | Domains. `format=plain` for one per line | CSV or text |
| GET | `/api/v1/stix-feed/urls.csv` | key | URLs | CSV |
| GET | `/api/v1/stix-feed/hashes.csv` | key | File hashes. `format=plain` for one per line | CSV or text |
| GET | `/api/v1/stix-feed/certs.csv` | key | C&C TLS certificate fingerprints | CSV |
| GET | `/api/v1/stix-feed/packages.csv` | key | Malicious npm and PyPI packages | CSV |
| GET | `/api/v1/stix-feed/packages.json` | key | Malicious npm and PyPI packages | JSON |
| GET | `/api/v1/stix-feed/misp/manifest.json` | key | MISP feed manifest | JSON |
| GET | `/api/v1/stix-feed/misp/:uuid.json` | key | One MISP event | JSON |
| GET | `/api/v1/stix-feed/info` | key | Feed metadata | JSON |
| GET | `/api/v1/stix-feed/schema` | key | Field descriptions for the bundle | JSON |
| GET | `/api/v1/stix-feed/help` | none | Feed parameters and examples | JSON |

Lane parameters: [CSV blocklists](/feed/csv-blocklists/), [STIX bundle](/feed/stix-bundle/).

## TAXII 2.1

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| GET | `/taxii2/` | none | Server discovery | TAXII JSON |
| GET | `/api/v1/taxii/` | none | API root information | TAXII JSON |
| GET | `/api/v1/taxii/collections/` | none | Collection list (`dugganusa-threat-intel`) | TAXII JSON |
| GET | `/api/v1/taxii/collections/:id/` | none | One collection | TAXII JSON |
| GET | `/api/v1/taxii/collections/:id/objects/` | key | Indicators, paged (`limit`, `next`, `added_after`, `match[type]`, `match[id]`). One query per page. Without a key the response is an empty `objects` array | TAXII JSON |
| GET | `/api/v1/taxii/collections/:id/objects/:objectId/` | key | One object | TAXII JSON |
| GET | `/api/v1/taxii/collections/:id/manifest/` | key | Object manifest, paged | TAXII JSON |

HTTP Basic with the key as the password is accepted on TAXII routes. Setup: [Microsoft Sentinel](/siem/sentinel/), [TAXII](/feed/taxii/).

## Firewalls and IDS

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| GET | `/api/v1/opnsense/ip-blocklist` | key | IPv4 blocklist, one per line | text |
| GET | `/api/v1/opnsense/suricata-rules` | key | Suricata rules from current indicators | text |
| GET | `/api/v1/opnsense/dns-blocklist` | key | Unbound `local-zone` and `local-data` lines | text |
| GET | `/api/v1/opnsense/info` | key | Lane URLs and data-source counts | JSON |
| GET | `/api/v1/opnsense/help` | key | Lane parameters | JSON |

These five routes also accept the key as `?token=` for clients that can only take a URL. See [OPNsense](/firewall/opnsense/). Edge Shield uses the feed lanes above: [Edge Shield](/firewall/edge-shield/).

## SIEM and detection rules

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| GET | `/api/v1/detection-rules` | none | Rule catalog. Filters: `category`, `mitre`, `severity` | JSON |
| GET | `/api/v1/detection-rules/stats` | none | Catalog counts | JSON |
| GET | `/api/v1/detection-rules/:id` | none | One rule | JSON |
| GET | `/api/v1/detection-rules/:id/export` | none | One rule as `format=sigma`, `splunk`, `kql` or `json` | YAML, text or JSON |
| GET | `/api/v1/detection-rules/yara` | key | YARA rules from current indicators | text |
| GET | `/api/v1/detection-rules/sigma/ioc` | key | Sigma rules from current indicators | YAML |
| GET | `/api/v1/detection-rules/suricata` | key | Suricata rules from current indicators | text |
| GET | `/api/v1/detection-rules/bundle` | key | All generated and catalog rules | ZIP |

See [Detection rules](/siem/detection-rules/).

## Search and enrichment

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| GET, POST | `/api/v1/search` | key | Search across indexes (`q`, `indexes`, `limit`, `offset`, `filter`, `sort`, `semanticRatio`) | JSON |
| GET | `/api/v1/search/:index` | key | Search one index (`q`, `limit`, `offset`, `filter`, `sort`, `noHybrid`, `semanticRatio`, `facets`) | JSON |
| GET | `/api/v1/search/nl` | key | Natural-language search | JSON |
| GET | `/api/v1/search/parse` | key | Parse a natural-language query without running it | JSON |
| GET | `/api/v1/search/hybrid` | key | Hybrid threat search with stage diagnostics | JSON |
| GET | `/api/v1/search/correlate` | Pro | Where an indicator appears across indexes | JSON |
| GET | `/api/v1/search/similar/:index/:id` | Pro | Documents similar to one document | JSON |
| GET | `/api/v1/search/patterns/:index` | Enterprise | Cluster and pattern summary for an index | JSON |
| GET | `/api/v1/search/stats` | none | Document counts per index | JSON |
| GET | `/api/v1/threat-intel/enrichment` | key | Verdict on an IP or domain (`ip` or `indicator`) | JSON |
| GET | `/api/v1/adversaries` | none | Threat-actor profiles (`q`, `country`, `limit`) | JSON |
| GET | `/api/v1/adversaries/stats` | none | Profile counts by country | JSON |
| GET | `/api/v1/adversaries/:name` | none | One profile | JSON |
| GET | `/api/v1/adversaries/:name/pulses` | none | Third-party pulses that mention the actor | JSON |
| GET | `/api/v1/threat-intel/kev/search` | none | Search the CISA KEV catalog (`q`, `limit`) | JSON |
| GET | `/api/v1/threat-intel/kev/stats` | none | KEV catalog counts | JSON |

See [Search](/search/search/) and [Enrichment](/search/enrichment/).

## Agent security (MCP)

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| POST | `/api/v1/mcp` | none (key raises limits) | Jeevesus MCP server, JSON-RPC | JSON |
| GET | `/api/v1/mcp` | none | Jeevesus server description and tool list | JSON |
| POST | `/api/v1/dredd/mcp` | none | Dredd MCP server, JSON-RPC | JSON |
| GET | `/api/v1/dredd/mcp` | none | Dredd server description | JSON |
| GET | `/api/v1/dredd/preflight` | none | Pre-flight verdict on an MCP server without an MCP client | JSON |

MCP tool calls do not use your daily quota. See [Jeevesus](/agents/jeevesus/) and [Dredd](/agents/dredd/).

## Account and billing

| Method | Path | Auth | Purpose | Format |
|---|---|---|---|---|
| POST | `/api/v1/api-keys/register` | none | Register a Free key. 3 per hour per IP | JSON |
| GET | `/api/v1/api-keys/usage` | key (no quota) | Today's usage and remaining quota. Bearer header only | JSON |
| GET | `/api/v1/api-keys/verify` | key (no quota) | Check a key is valid. Bearer header only | JSON |
| DELETE | `/api/v1/api-keys/self` | key (no quota) | Permanently delete your key. Bearer header only | JSON |
| GET | `/api/v1/api-keys/help` | none | Key management summary | JSON |
| GET | `/api/v1/billing/prices` | none | Current plans and limits | JSON |
| GET | `/api/v1/billing/pricing` | none | Plan prices adjusted for your region | JSON |
| POST | `/api/v1/billing/checkout` | none (key optional) | Start a Stripe checkout (`tier`, `interval`). Send your key to upgrade that key | JSON |
| GET | `/api/v1/billing/claim-key` | none | One-time retrieval of the key for a completed checkout (`session_id`) | JSON |
| GET | `/api/v1/billing/status` | key | Your plan and subscription state | JSON |
| GET | `/api/v1/billing/portal` | key | Stripe customer portal link | JSON |
| POST | `/api/v1/billing/invoice` | none | Request an Enterprise purchase-order invoice (NET-30) | JSON |
| GET | `/api/v1/billing/help` | none | Billing summary | JSON |

See [API keys](/account/keys/) and [Plans](/account/plans/).

## Status codes

| Status | Meaning |
|---|---|
| `400` | Missing or invalid parameter |
| `401` | No key, or the key is not recognized |
| `403` | The key's plan does not include this route or index |
| `404` | Unknown resource, rule, index or collection |
| `429` | Daily quota used up (resets midnight UTC), or a per-minute IP limit |
| `503` | A safety dependency is unavailable; retry after `Retry-After` |

See [Errors](/errors/).
