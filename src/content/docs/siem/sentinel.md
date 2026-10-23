---
title: Microsoft Sentinel
description: Connect the DugganUSA TAXII 2.1 feed to Microsoft Sentinel with the built-in Threat Intelligence - TAXII connector.
sidebar:
  order: 1
---

Sentinel's built-in **Threat Intelligence - TAXII** connector pulls DugganUSA indicators directly. There is no code to run and nothing to host. Setup takes about ten minutes.

This flow was run end to end in DugganUSA's own Sentinel workspace on 2026-10-19 (Threat Intelligence solution 3.0.21, Basic auth exactly as below). Indicators landed in `ThreatIntelIndicators` within minutes of clicking **Add**.

## What you need

- A Microsoft Sentinel workspace and permission to enable data connectors.
- A DugganUSA API key. The same key works for the feed, search, MCP servers and Edge Shield. Register free at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register).
- The **Threat Intelligence** solution from the Sentinel Content hub. It includes the TAXII connector.

## Connector values

| Field | Value |
|---|---|
| Friendly name | `DugganUSA` (letters, digits, `-` and `_` only; Sentinel rejects spaces) |
| API root URL | `https://analytics.dugganusa.com/api/v1/taxii/` |
| Collection ID | `dugganusa-threat-intel` |
| Username | anything, for example `sentinel` |
| Password | your DugganUSA API key |

The key is read from the password field (or from the username if the password is empty), so it never goes in a URL.

## Steps

1. In Microsoft Sentinel, open **Content hub** and install **Threat Intelligence**.
2. Go to **Data connectors** and open **Threat Intelligence - TAXII**.
3. Enter the values above.
4. Choose how much history to import and a polling frequency (see [Quota and polling](#quota-and-polling)), then click **Add**.
5. After the first poll, confirm indicators arrived. Depending on your workspace they appear in `ThreatIntelIndicators` or the older `ThreatIntelligenceIndicator` table.

## Confirm what arrived

```kql
ThreatIntelIndicators
| where SourceSystem == "DugganUSA"
| summarize n = count(), maxConfidence = max(Confidence) by tostring(split(ObservableKey, ":")[0])
```

`SourceSystem` is the friendly name you entered. Every indicator also carries `created_by_ref` set to the DugganUSA identity, `identity--f4a8c3d2-1b9e-4f7a-8c2d-9e3f5b6a7c8d`; filter on that if you rename the connector.

In the 2026-10-19 check:

- Indicators began landing in `ThreatIntelIndicators` within minutes, with `SourceSystem` set to the friendly name.
- Every indicator had a valid STIX 2.1 id and the `created_by_ref` above.
- Confidence never exceeded 95. It is capped on purpose; no indicator is certain.
- A hunting query joining DugganUSA IPs to network sessions matched a test session end to end.

## Quota and polling

Each TAXII request returns one page (100 objects by default) and counts as one query against your key's daily quota. One poll returns at most 10,000 objects.

A full poll of 10,000 objects is 100 pages, so it costs 100 queries. A poll that sends `added_after` only pages through what is new, and costs less.

| Plan | Daily quota | Full polls the quota covers per day |
|---|---|---|
| Free | 10 | None: one poll reaches about 1,000 objects. Poll once a day |
| Shield | 300 | 3 |
| Pro | 2,000 | 20 |
| Enterprise | 50,000 | 500 |

Your quota is shared with everything else the key does, so leave headroom.

Free keys receive real-time data, the same indicators paid tiers receive. The difference is volume. Current plans: [Plans](/account/plans/).

## Test the TAXII server yourself

If the connector shows nothing, make the same requests it makes.

Discovery and collections need no key:

```sh
curl -sS -H "Accept: application/taxii+json;version=2.1" \
  https://analytics.dugganusa.com/api/v1/taxii/collections/
```

```json
{
  "collections": [
    {
      "id": "dugganusa-threat-intel",
      "title": "DugganUSA Threat Intelligence",
      "can_read": true,
      "can_write": false,
      "media_types": ["application/stix+json;version=2.1"]
    }
  ]
}
```

Objects need the key. Use Basic auth with any username and the key as the password:

```sh
curl -sS -u "sentinel:dugusa_YOUR_KEY" \
  -H "Accept: application/taxii+json;version=2.1" \
  "https://analytics.dugganusa.com/api/v1/taxii/collections/dugganusa-threat-intel/objects/?limit=100"
```

```python
import os, requests

r = requests.get(
    "https://analytics.dugganusa.com/api/v1/taxii/collections/dugganusa-threat-intel/objects/",
    params={"limit": 100},
    auth=("sentinel", os.environ["DUGGANUSA_API_KEY"]),
    headers={"Accept": "application/taxii+json;version=2.1"},
    timeout=120,
)
r.raise_for_status()
page = r.json()
print(len(page["objects"]), page.get("more"), page.get("next"))
```

A response with `"more": true` and a `next` value means there is another page; pass `next` back as `?next=`. Sentinel follows pages automatically. `added_after` limits a poll to objects added after a timestamp.

A request to `objects/` with no key returns `200` with an empty `objects` array. If you see that, the connector is not sending the key.

## Why not `externaldata()`

KQL's `externaldata()` cannot send a request header, and the CSV lanes need your key. The only way to use them with `externaldata()` is to put the key in the URL, where it ends up in query history and logs. Use the TAXII connector instead.

## Using the indicators

- Every indicator carries a confidence score. Sentinel's matching analytics apply to everything you import, so if you want only high-confidence matches, filter on `Confidence` in your analytics rules.
- Indicators from third-party feeds DugganUSA redistributes, for example abuse.ch, say so in their source fields. They are not relabeled as DugganUSA observations.
- Corrections, including DugganUSA's own mistakes, are published at [analytics.dugganusa.com/updates](https://analytics.dugganusa.com/updates).

For ready-made KQL detections, see [Detection rules](/siem/detection-rules/): every catalog rule exports as KQL.

```sh
curl -sS "https://analytics.dugganusa.com/api/v1/detection-rules/dugganusa-010/export?format=kql"
```
