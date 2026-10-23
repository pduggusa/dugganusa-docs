---
title: Search
description: Full-text and hybrid search across the DugganUSA corpus, per-index search, natural-language search, correlation, and corpus statistics.
sidebar:
  order: 1
---

Search runs over the same corpus the feed is built from: indicators, block events, CISA KEV, threat-actor profiles, research posts and more. Every route below needs a key except `/api/v1/search/stats`.

## Search across indexes

`GET /api/v1/search` or `POST /api/v1/search`

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/search?q=185.39.19.176"
```

```python
import os, requests

r = requests.get(
    "https://analytics.dugganusa.com/api/v1/search",
    params={"q": "cobalt strike", "indexes": "iocs", "limit": 20},
    headers={"Authorization": f"Bearer {os.environ['DUGGANUSA_API_KEY']}"},
    timeout=60,
)
r.raise_for_status()
for hit in r.json()["data"]["hits"]:
    print(hit["_index"], hit.get("value") or hit.get("name"))
```

| Parameter | Default | Meaning |
|---|---|---|
| `q` | required | Query text |
| `indexes` | see below | Comma-separated index names. `index` is accepted as an alias |
| `limit` | `20` | Results to return. Capped at your plan's maximum (see [Plan limits](#plan-limits)) |
| `offset` | `0` | Skip this many results |
| `filter` | none | A Meilisearch filter expression, for example `type = "ip"` |
| `sort` | none | Comma-separated `field:asc` or `field:desc` |
| `semanticRatio` | not set | `0` to `1`. When set, blends semantic (vector) ranking with keyword ranking on indexes that support it. `0` is keyword only |

`POST` takes the same fields as a JSON body; body fields override query-string fields.

```sh
curl -sS -X POST -H "Authorization: Bearer dugusa_YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"q": "CVE-2026-104935", "indexes": "iocs"}' \
  https://analytics.dugganusa.com/api/v1/search
```

Which indexes are searched:

- With `indexes`, the ones you name, if your plan includes them.
- Without `indexes`, a query that looks like an indicator (an IP, CIDR, hash, CVE id, a single domain name, or a threat keyword such as `c2` or `ransomware`) is searched in `iocs`, `blocked` and `pulses`.
- Without `indexes`, any other query is searched across every index your plan includes.

A bare IPv4 address or CVE id is matched as an exact phrase, so `185.39.19.176` returns records for that address rather than every record containing `185`.

A filter clause that a given index cannot filter on is dropped for that index instead of failing the whole search.

Response:

```json
{
  "success": true,
  "data": {
    "query": "185.39.19.176",
    "totalHits": 3,
    "hits": [
      {
        "id": "…",
        "type": "ip",
        "value": "185.39.19.176",
        "confidence": 85,
        "source": "…",
        "_index": "iocs"
      }
    ],
    "indexes": [
      { "index": "iocs", "hits": 2, "processingTimeMs": 4 },
      { "index": "blocked", "hits": 1, "processingTimeMs": 2 },
      { "index": "pulses", "hits": 0, "processingTimeMs": 1 }
    ],
    "aiEnabled": true,
    "semanticRatio": 0.5
  }
}
```

`totalHits` and each index's `hits` are Meilisearch estimates. Hit fields differ by index. `semanticRatio` in the response echoes the default when you did not set one; semantic ranking is applied only when you send it.

## Search one index

`GET /api/v1/search/:index`

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/search/cisa_kev?q=Ivanti&limit=5"
```

| Parameter | Default | Meaning |
|---|---|---|
| `q` | required | Query text |
| `limit` | `20` | Results to return |
| `offset` | `0` | Skip this many results |
| `filter` | none | Meilisearch filter expression |
| `sort` | none | Comma-separated `field:asc` or `field:desc` |
| `noHybrid` | `false` | `true` forces keyword-only ranking |
| `semanticRatio` | index default | `0` to `1`, semantic weight on indexes that have embeddings |
| `facets` | none | Up to 5 comma-separated filterable field names. Returns exact counts in `facetDistribution` |

Indexes with embeddings use hybrid ranking by default. A vector search always returns its nearest neighbors, so for "do we have any record of X" questions use `noHybrid=true` and read `estimatedTotalHits`. Bare identifiers (an IP, a CVE id, a quoted single token) are always matched keyword-only.

```json
{
  "success": true,
  "data": {
    "index": "cisa_kev",
    "query": "Ivanti",
    "searchMode": "hybrid:default",
    "hits": [
      {
        "cveID": "CVE-2026-104935",
        "vendor": "Ivanti",
        "product": "Connect Secure",
        "dateAdded": "2026-10-13",
        "ransomwareUse": "Unknown"
      }
    ],
    "estimatedTotalHits": 41,
    "limit": 5,
    "offset": 0,
    "processingTimeMs": 12
  }
}
```

`searchMode` tells you how the query was ranked: `keyword`, `keyword:exact-identifier`, `hybrid:default` or `hybrid:<ratio>`.

Counting by facet:

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/search/iocs?q=lazarus&noHybrid=true&facets=type,source&limit=1"
```

An index that does not exist, or is not available to customers, returns `404`. An index your plan does not include returns `403` (see [Errors](#errors)).

## Natural-language search

`GET /api/v1/search/nl`

Turns a plain-English question into a structured search (keywords plus filters such as country and time range) and runs it.

```sh
curl -sS -G -H "Authorization: Bearer dugusa_YOUR_KEY" \
  --data-urlencode "q=C2s in China from the last day" \
  https://analytics.dugganusa.com/api/v1/search/nl
```

| Parameter | Default | Meaning |
|---|---|---|
| `q` | required | The question |
| `limit` | `20` | Results to return |
| `forceLLM` | `false` | `true` always uses the language-model parser, even when the built-in parser recognizes the query |

```json
{
  "success": true,
  "data": {
    "parsed": {
      "method": "quick",
      "keywords": "c2",
      "filter": "country = 'CN' AND threat_type = 'c2'",
      "timeRange": { "phrase": "last day", "ms": 86400000, "since": "2026-10-22T15:00:00.000Z" }
    },
    "query": { "q": "c2", "filter": "country = 'CN' AND threat_type = 'c2'" },
    "results": { "totalHits": 120, "hits": [], "indexes": [] }
  }
}
```

`parsed.method` is `quick` (or `quick-fallback`) when the built-in parser handled the query and `llm` when a language model did; the `llm` form also reports `intent` and `cost`.

`GET /api/v1/search/parse?q=...` returns the parse alone, without running the search, along with the supported filter schema, country names and threat-type aliases.

Limited to 20 requests per minute per client IP.

## Hybrid threat search

`GET /api/v1/search/hybrid`

| Parameter | Default | Meaning |
|---|---|---|
| `q` | required | Query text |
| `limit` | `20` | Results to return |
| `useSemantic` | `true` | Run the search stage. `false` returns only the pre-check stages |
| `useBloom`, `useLSH` | `true` | Run the probabilistic pre-check stages |

Returns `hits` and `indexes` like `/api/v1/search`, plus a `stages` array describing each stage and its timing. Use `hits`; the stage results are diagnostic. Limited to 20 requests per minute per client IP.

## Correlate an indicator (Pro and above)

`GET /api/v1/search/correlate`

Searches across indexes and groups matches by index, so you can see where else an indicator appears: block events, threat-actor profiles, research posts, phishing records.

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" \
  "https://analytics.dugganusa.com/api/v1/search/correlate?q=209.99.186.235&limit=20"
```

| Parameter | Default | Meaning |
|---|---|---|
| `q` | required | Indicator or text |
| `limit` | `20` | Results to return |

```json
{
  "success": true,
  "data": {
    "query": "209.99.186.235",
    "correlations": {
      "iocs": [ { "value": "209.99.186.235", "source": "…", "_index": "iocs" } ],
      "blog": [ { "title": "…", "_index": "blog" } ]
    },
    "strength": "4%",
    "crossIndexMatches": 2,
    "aiEnabled": true
  }
}
```

Free and Shield keys get `403` with `"error": "This endpoint requires professional+ tier"`.

## Similar documents (Pro and above)

`GET /api/v1/search/similar/:index/:id?limit=10`

Returns documents semantically similar to the document with that id in that index.

## Pattern analysis (Enterprise)

`GET /api/v1/search/patterns/:index?sampleSize=100`

Samples an index and summarizes clusters and recurring values.

## Corpus statistics (no key)

`GET /api/v1/search/stats`

Document counts per index, cached for 5 minutes. Use it for current corpus sizes instead of hard-coding numbers.

```sh
curl -sS https://analytics.dugganusa.com/api/v1/search/stats
```

```json
{
  "success": true,
  "data": {
    "databaseSize": 97843994624,
    "lastUpdate": "2026-10-23T15:18:01.040Z",
    "indexes": {
      "iocs": { "numberOfDocuments": 2011006, "isIndexing": false },
      "cisa_kev": { "numberOfDocuments": 1754, "isIndexing": false }
    }
  }
}
```

The listing includes indexes that are not searchable by customers.

## Plan limits

| Plan | Indexes | Max results per `/api/v1/search` call | Multi-index requests |
|---|---|---|---|
| Free | `epstein_files`, `the_finders`, `iocs`, `blocked`, `pulses`, `content` | 20 | One index at a time when you name indexes |
| Shield | Same as Free | 50 | One index at a time when you name indexes |
| Pro | All customer indexes | 500 | Yes |
| Enterprise | All customer indexes | 1,000 | Yes |

Customer indexes on Pro and Enterprise include `iocs`, `blocked`, `block_events`, `pulses`, `content`, `blog`, `cisa_kev`, `adversaries`, `phishing`, `tor_relays`, `mcp_servers`, `mcp_findings`, `mcp_dependencies`, `oz_decisions`, `isp_reputations`, `precursor_history`, `paranormal`, `uap_files`, `epstein_files`, `the_finders`, `bishop_accountability`, `icij_offshore` and `icij_relationships`.

On Free and Shield, a search without `indexes` covers all six included indexes. Naming two or more indexes in one request returns `403 Cross-index search restricted`; name one at a time.

Every keyed search counts as one query against your daily quota. See [Plans](/account/plans/).

### Per-minute limits

Independent of your daily quota, search routes are limited per client IP:

| Routes | Limit |
|---|---|
| All `/api/v1/search/*` routes | 100 requests per minute |
| `/api/v1/search/nl`, `/api/v1/search/hybrid` | 20 requests per minute |

Over the limit returns `429` with `RateLimit-*` headers and `"error": "Rate limited. Max 100 searches per minute."` (or the AI-search equivalent).

## Errors

| Status | Body `error` | Cause |
|---|---|---|
| `400` | `Missing required query parameter: q` | No `q` |
| `401` | `API key required` / `Invalid API key` | No key, or an unrecognized key |
| `403` | `Index access restricted` | Your plan does not include a named index. The body lists `permitted_indexes` |
| `403` | `Cross-index search restricted` | Free or Shield key naming more than one index |
| `403` | `This endpoint requires professional+ tier` | Correlate or similar without Pro; patterns without Enterprise |
| `404` | `Index not found` | The index does not exist or is not available to customers |
| `429` | `Daily rate limit exceeded` | Daily quota used up; resets at midnight UTC |
| `429` | `Rate limited. …` | Per-minute IP limit |

See also [Enrichment](/search/enrichment/) for a single-call verdict on an IP or domain.
