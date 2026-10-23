---
title: Malicious packages
description: The npm and PyPI deny-list as a feed, for CI gates and package proxies.
sidebar:
  order: 5
---

Known-malicious npm and PyPI packages, drawn mainly from the OSV malicious-packages database. Use it to fail a build when a lockfile names a listed package.

```sh
curl -sS -H "Authorization: Bearer $DUGGANUSA_API_KEY" \
  "https://analytics.dugganusa.com/api/v1/stix-feed/packages.json?ecosystem=npm"
```

| URL | Format |
|---|---|
| `/api/v1/stix-feed/packages.json` | JSON |
| `/api/v1/stix-feed/packages.csv` | CSV |

Filter with `ecosystem=npm` or `ecosystem=pypi`.

```csv
ecosystem,package,affected_versions,all_versions_affected,confidence,source,osv_id
npm,kmf-vendor-pack,99.0.0;100.100.101;100.100.100;100.100.106,false,90,feed-osv-malicious,MAL-2026-17744
```

When `all_versions_affected` is `false`, only the versions in `affected_versions` (semicolon-separated) are listed.

To check one package at install time instead of mirroring the list, use [check-package](/agents/check-package/).
