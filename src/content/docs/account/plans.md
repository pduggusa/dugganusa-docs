---
title: Plans and limits
description: Daily query quotas, result caps and feature access for the Free, Shield, Pro and Enterprise plans, and the billing endpoints.
sidebar:
  order: 2
---

Prices, annual options and current offers: [analytics.dugganusa.com/pricing](https://analytics.dugganusa.com/pricing). Checkout adjusts the USD list price for regional purchasing power automatically.

## Limits by plan

| | Free | Shield | Pro | Enterprise |
|---|---|---|---|---|
| Queries per day | 10 | 300 | 2,000 | 50,000 |
| Max results per `/api/v1/search` call | 20 | 50 | 500 | 1,000 |
| Billing | none | monthly | monthly or annual | monthly or annual |

Quotas reset at midnight UTC. Each keyed request to the feed, search, enrichment, rule generators or firewall lanes counts as one query; TAXII counts one per page. Checking your own usage (`/api/v1/api-keys/usage`, `/verify`) does not. See [Rate limits](/rate-limits/).

## Access by plan

| | Free | Shield | Pro | Enterprise |
|---|---|---|---|---|
| Feed lanes: CSV, STIX 2.1, TAXII, MISP, packages | Yes | Yes | Yes | Yes |
| Firewall lanes: OPNsense IP, Suricata and DNS lists | Yes | Yes | Yes | Yes |
| Rule generators (YARA, Sigma, Suricata, bundle) | Yes | Yes | Yes | Yes |
| Enrichment (`/api/v1/threat-intel/enrichment`) | Yes | Yes | Yes | Yes |
| Search indexes | `iocs`, `blocked`, `pulses`, `content`, `epstein_files`, `the_finders` | Same as Free | All customer indexes | All customer indexes |
| Several named indexes in one search | No | No | Yes | Yes |
| Correlate and similar-document search | No | No | Yes | Yes |
| Pattern analysis (`/api/v1/search/patterns/:index`) | No | No | No | Yes |

Free keys receive real-time feed data: the same indicators every other plan receives. Paid plans add volume and search access.

Which plan fits:

- **Free:** evaluation, a daily SIEM or firewall pull, a few manual searches.
- **Shield:** [Edge Shield](/firewall/edge-shield/) on an hourly refresh, or several integrations polling a few times a day.
- **Pro:** hourly polling of the full feed, full search and correlation.
- **Enterprise:** high-volume enrichment and automation.

The full list of customer indexes is on [Search](/search/search/#plan-limits).

## Live values

`GET /api/v1/billing/prices` returns current plans as JSON. No key needed.

```sh
curl -sS https://analytics.dugganusa.com/api/v1/billing/prices
```

```json
{
  "success": true,
  "currency": "usd",
  "source_of_truth_url": "https://analytics.dugganusa.com/pricing",
  "tiers": {
    "free":       { "price": 0, "daily_limit": 10, "results": 20 },
    "shield":     { "monthly": 24, "annual": null, "daily_limit": 300, "results": 50 },
    "pro":        { "monthly": 99, "annual": 948, "daily_limit": 2000, "results": 500 },
    "enterprise": { "monthly": 995, "annual": 9950, "daily_limit": 50000, "results": 1000 }
  },
  "annual_discount": "20%",
  "payment_methods": ["card", "ACH", "Apple Pay", "Google Pay", "invoice (NET-30 for Enterprise)"]
}
```

Response trimmed; each tier also carries descriptive fields.

## Check your plan

`GET /api/v1/billing/status` (key required; counts as one query)

```sh
curl -sS -H "Authorization: Bearer dugusa_YOUR_KEY" https://analytics.dugganusa.com/api/v1/billing/status
```

```json
{
  "success": true,
  "tier": "pro",
  "is_paid": true,
  "daily_limit": 2000,
  "results_limit": 500,
  "subscription": {
    "status": "active",
    "current_period_end": "2026-11-23T00:00:00.000Z",
    "cancel_at_period_end": false
  }
}
```

## Upgrade

Use the [pricing page](https://analytics.dugganusa.com/pricing). To start checkout from code:

`POST /api/v1/billing/checkout`

```sh
curl -sS -X POST https://analytics.dugganusa.com/api/v1/billing/checkout \
  -H "Authorization: Bearer dugusa_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro", "interval": "month"}'
```

| Field | Meaning |
|---|---|
| `tier` | `shield`, `pro` or `enterprise` |
| `interval` | `month` (default) or `year`. Shield is monthly only; `year` falls back to monthly |
| `email` | Optional for hosted checkout (Stripe collects it) |

The response carries a Stripe Checkout `url` to open. The upgrade is applied to a key in this order:

1. The key you sent as `Authorization: Bearer` when creating the checkout.
2. Otherwise, the existing key registered to the email used at checkout.
3. Otherwise, a new key is created for that email.

Your key does not change when you upgrade.

## Manage billing

`GET /api/v1/billing/portal` (key required) returns `{"success": true, "url": "…"}`, a Stripe customer portal link for the subscription attached to your key. Use it to update payment details, download invoices or cancel. A key with no subscription gets `404`.

Purchase orders and NET-30 invoicing are available for Enterprise; contact patrick@dugganusa.com. The same address handles volume above Enterprise and redistribution (MSP) permission.
