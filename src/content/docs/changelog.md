---
title: Changelog
description: Changes to the API, feeds and MCP servers that affect integrations.
---

Corrections, including our own mistakes, are also published at [analytics.dugganusa.com/updates](https://analytics.dugganusa.com/updates).

## 2026-10-23

- **check-package** answers `review` for versions below a security fix that shipped without an advisory, and says which version fixes it. First entries: the `@x402/*` npm packages below 2.23.0.
- **Docs** moved to this site, with the full endpoint reference public.

## 2026-10-20

- **Free tier is real-time.** Free keys no longer get feed data delayed 48 hours.

## 2026-10-19

- **STIX ids.** About 4,300 feed objects had ids that were not valid STIX 2.1; fixed. Confidence is capped at 95; some values had been 100.

## 2026-10-18

- **TAXII** objects requests returned no indicators from 2026-02-17 to 2026-10-18 for every caller. Fixed. If you connected a TAXII client in that window and saw nothing, it should populate now.
