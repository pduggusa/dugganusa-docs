---
title: Edge Shield (Cloudflare Worker)
description: Deploy the open-source Edge Shield Worker on your Cloudflare zone to block feed-listed IPs, scanners and floods at the edge.
sidebar:
  order: 2
---

Edge Shield is an MIT-licensed Cloudflare Worker that runs on your own Cloudflare account. It pulls the DugganUSA IP lane with your key, holds it in memory, and checks every request before it reaches your origin.

Source: [github.com/pduggusa/dugganusa-edge-shield](https://github.com/pduggusa/dugganusa-edge-shield)

## What it does to a request

| Check | Response in `block` mode |
|---|---|
| Known scanner user agent or network (Shodan, Censys, LeakIX, Nuclei, ZMap and others) | `418` with a JSON body |
| Client IP matches the feed (single addresses and CIDR ranges, IPv4 and IPv6) | `403`, header `X-Blocked-Reason: ioc-match` |
| Client IP over the per-minute rate limit | `429`, header `Retry-After: 60` |
| Decoy path such as `/.env` or `/wp-login.php` (if honeypots are on) | Decoy content |
| Anything else | Passed to your origin, with geo headers added |

SASE proxies (Zscaler, Netskope, Prisma and similar) are never treated as scanners.

Requests forwarded to your origin carry added request headers: `X-CF-City`, `X-CF-Region`, `X-CF-Latitude`, `X-CF-Longitude`, `X-CF-Timezone`, `X-CF-Metro-Code`, `X-CF-Postal-Code` and `X-CF-ASN-Org` when Cloudflare knows them, plus `X-DugganUSA-Shield: active` and `X-DugganUSA-IOCs` (the number of indicators currently loaded).

## Before you start

- A Cloudflare zone, with the DNS records you want protected **proxied** (orange cloud). The Worker never sees traffic to an unproxied record.
- Node.js and `npx wrangler` (Wrangler 4), logged in with `npx wrangler login`.
- A DugganUSA API key. Register free at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register).

## Deploy

```sh
git clone https://github.com/pduggusa/dugganusa-edge-shield.git
cd dugganusa-edge-shield
cp wrangler.example.toml wrangler.local.toml
```

Edit `wrangler.local.toml`:

1. Replace the route placeholder with one catch-all route per host you want protected:

   ```toml
   routes = [
     { pattern = "www.example.com/*", zone_name = "example.com" },
   ]
   ```

2. Review the `[vars]` block (see [Configuration](#configuration)). The example ships in `observe` mode with honeypots and hit reporting off.

Do not deploy the repository's `wrangler.toml`. It is DugganUSA's own deployment, with our routes and account.

Set the key as a Worker secret. Wrangler prompts for the value, so it never appears in a file, your shell history or the repository:

```sh
npx wrangler secret put DUGGANUSA_API_KEY -c wrangler.local.toml
```

Check the build, then deploy:

```sh
npx wrangler deploy --dry-run -c wrangler.local.toml
npx wrangler deploy -c wrangler.local.toml
```

`wrangler.local.toml` is in `.gitignore`.

## Verify

The repository includes a probe script (bash and curl only). It exits non-zero when a check fails.

```sh
scripts/verify.sh --product www.example.com --mode observe
```

- In `block` mode, a scanner user agent gets `418` and the response carries `X-Powered-By: DugganUSA Edge Shield`.
- In `observe` mode, the same request is let through and the response carries `X-DugganUSA-Observed: scanner`.
- In both modes, a normal browser user agent gets `200` (a redirect also passes).

Add `--sensor host.example.com` for any host that must not be shielded; the script checks that no shield header appears there.

Workers Logs (`[observability] enabled = true` in the example config) show refresh results. A failed feed pull logs `IOC refresh FAILED: ips.csv <status>, domains.csv <status>`.

## Configuration

Every setting is a `[vars]` entry. A value the Worker cannot parse falls back to the default and logs a `config:` warning, so a typo never loosens your posture silently.

| Variable | Default | Example config | Meaning |
|---|---|---|---|
| `SHIELD_MODE` | `block` | `observe` | `block` enforces. `observe` lets everything through and records what it would have blocked (Workers Logs line plus an `X-DugganUSA-Observed` response header). Covers scanner 418, IOC 403 and rate-limit 429; not honeypots |
| `IOC_BLOCKING` | `true` | `true` | Block feed-listed IPs. `false` also stops feed downloads |
| `IOC_MIN_CONFIDENCE` | `80` | `80` | Load only indicators at or above this confidence (0 to 100) |
| `IOC_FEED_DAYS` | `7` | `7` | Feed lookback window in days (1 to 90) |
| `IOC_REFRESH_MINUTES` | `60` | `360` | Minutes between feed refreshes (5 to 1440). See [Quota](#quota) |
| `SCANNER_418` | `true` | `true` | Answer known scanners with `418` |
| `RL_ANON` | `100` | `100` | Requests per minute per IP without an `Authorization` header or `?api_key=`. `0` disables |
| `RL_AUTH` | `500` | `500` | Requests per minute per IP that present one. `0` disables |
| `HONEYPOTS_ENABLED` | `true` | `false` | Serve decoy content on canary paths. See [Privacy](#privacy) |
| `APPLIANCE_CANARIES` | unset | unset | NetScaler Gateway decoys (`/vpn/`, `/logon/LogonPoint/`, `/cgi/login` and similar). Off on your zones unless you set `true`. Leave it off if a real NetScaler sits behind the host |
| `HARVESTED_OBSERVE` | unset | unset | Pass through requests on paths taken from public exploit proofs of concept, and report them. Off on your zones unless you set `true` |
| `FEED_HIT_REPORTING` | `true` | `false` | Report feed matches back to DugganUSA. See [Privacy](#privacy) |
| `SCHEMA_INJECT_HOSTS` | DugganUSA's hosts | empty | Hosts that get DugganUSA's own Organization JSON-LD. Leave empty on your site |
| `SENSOR_HOSTS` | none | empty | Hosts passed straight to origin, untouched. Exact hosts or `*.example.com`, comma-separated. Use for honeypots and telemetry hosts, in addition to giving them no route |
| `PATH_ORIGINS` | none | unset | Optional. Serve chosen paths from another origin after the shield has run, as `host/prefix=>https://origin/prefix`, comma-separated. GET and HEAD only. The target host must be listed in `ORIGIN_EDGE_HOSTS` |

`IOC_MIN_CONFIDENCE` and `IOC_FEED_DAYS` are passed to the feed as `min_confidence` and `days`. Blocking uses the IP lane, which honors both; see [CSV blocklists](/feed/csv-blocklists/).

### Secrets

| Secret | Required | Meaning |
|---|---|---|
| `DUGGANUSA_API_KEY` | Yes | Your DugganUSA key. Without it the Worker skips feed downloads and blocks no feed IPs |
| `ORIGIN_EDGE_SECRET` | No | Leave unset. When set, the Worker adds `x-dugganusa-edge: <secret>` to requests it forwards to the hosts in `ORIGIN_EDGE_HOSTS`, so that origin can confirm a request came through the edge before trusting `cf-connecting-ip`. If you want this for your own origin, set both, compare the header in constant time at the origin, and only then trust the client IP header |

Any copy of `x-dugganusa-edge` sent by a client is stripped before forwarding.

## Quota

Each refresh pulls two feed lanes (`ips.csv` and `domains.csv`), so it costs **2 queries**, and each Cloudflare data center that serves your traffic refreshes on its own schedule. Inside a data center the pull is shared, and refreshes closer together than 10 minutes reuse the cached copy.

| Key | Suggested `IOC_REFRESH_MINUTES` | Queries per day, per data center |
|---|---|---|
| Free (10 per day) | `360` | 8 |
| Shield (300 per day) or above | `60` | 48 |

With the default of 60 minutes, a Free key runs out of quota early in the day and the Worker keeps blocking on whatever list it last loaded, or on an empty list if no pull succeeded. The example config ships `360` for this reason. Plans and limits: [Plans](/account/plans/).

## Privacy

The Worker runs on your Cloudflare account. For ordinary traffic, including requests it blocks, DugganUSA sees only your key's feed pulls.

Two optional features send data to DugganUSA:

- **Honeypot canaries** (`HONEYPOTS_ENABLED`). A request to a decoy path sends the visitor's IP address, full User-Agent, city, region, country, ASN and organization, the full request URL, method and TLS version. That is personal data under GDPR; put a data processing agreement in place or keep this off. The decoy paths (for example `/graphql`, `/webmail/*`, anything containing `.env`) answer with deception content instead of your real response, so turn this off or edit `CANARY_PATHS` in `src/worker.js` if any of them is a real route on your site.
- **Feed hit reporting** (`FEED_HIT_REPORTING`). When a feed indicator matches, the Worker reports the indicator that matched, the action (`blocked` or `observed`), a count and the Cloudflare ray ID, authenticated with your key. It does not send the visitor's identity, your hostname or the URL. When the match came from a CIDR range, the reported address may be one DugganUSA never published individually: it is the address that matched the range you chose to block.

Harvested-path observation (`HARVESTED_OBSERVE`), if you opt in, reports the CVE, the matched path from our list, ASN, country and method; never your hostname, the visitor's User-Agent or network.

## Upgrading

```sh
git pull
npx wrangler deploy --dry-run -c wrangler.local.toml
npx wrangler deploy -c wrangler.local.toml
```

Your `wrangler.local.toml` and secrets are untouched by a pull. Read `CHANGELOG.md` in the repository before upgrading; new options default to the previous behavior unless the changelog says otherwise.

## Troubleshooting

| Symptom | Check |
|---|---|
| `verify.sh` fails: a scanner user agent is not answered with `418` | The DNS record is proxied, and the route pattern matches the host. If another Worker has a more specific route on the same host, that one runs instead |
| Your origin sees `X-DugganUSA-IOCs: 0` | Workers Logs for `IOC refresh FAILED`. A `401` means the secret is missing or wrong; `429` means the key's daily quota is used up |
| Legitimate clients get `429` | Raise `RL_ANON` or `RL_AUTH`, or set the affected tier to `0` |
| Something you expected to be blocked is let through | `SHIELD_MODE` is still `observe`, or the address is below `IOC_MIN_CONFIDENCE` |

The repository's `TROUBLESHOOTING.md` covers more cases.
