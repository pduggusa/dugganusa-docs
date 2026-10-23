---
title: Rate limits
description: Daily query quotas per plan, per-minute limits, and the headers that report them.
sidebar:
  order: 3
---

## Daily quota

Each keyed request to the feed, search or enrichment counts as one query against your key's daily quota. Quotas reset at midnight UTC.

| Plan | Queries per day | Max results per search |
|---|---|---|
| Free | 10 | 20 |
| Shield | 300 | 50 |
| Pro | 2,000 | 500 |
| Enterprise | 50,000 | 1,000 |

Prices and current plan details: [analytics.dugganusa.com/pricing](https://analytics.dugganusa.com/pricing). The live values are also at `GET /api/v1/billing/prices`.

A TAXII client pages 100 objects per request, and each page counts as one query. On the free tier, poll once a day.

## Headers

Keyed responses carry:

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Your daily quota |
| `X-RateLimit-Remaining` | Queries left today |
| `X-RateLimit-Reset` | When the quota resets, in Unix seconds |

Over quota returns `429` with the same headers. Check where you stand without spending a query: `GET /api/v1/api-keys/usage`.

## Per-minute limits

Some routes also limit by client IP, independent of your quota:

| Route | Limit |
|---|---|
| `/api/v1/search` | 100 per minute |
| `/api/v1/search/hybrid`, `/api/v1/search/nl` | 20 per minute |
| Account registration | 3 per hour |

## MCP servers

MCP tool calls do not use your daily quota. Jeevesus limits `tools/call` per client; listing tools and the handshake are free.

| Caller | Per minute | Per day |
|---|---|---|
| No key | 10 | 50 |
| Free key | 60 | 500 |
| Pro key | 400 | 10,000 |
| Enterprise key | 2,000 | 100,000 |
