---
title: Am I affected? (site check)
description: A free, email-delivered check of what your homepage loads against our threat list. What it looks at, what it does not, what the three results mean, and what we keep.
---

[Am I affected?](https://analytics.dugganusa.com/am-i-affected) is a free check for site owners. Enter a domain and an email address. We load that domain's homepage once, compare every script and host it pulls in against our threat list, and email you the result after you click a confirmation link. No API key is needed.

It answers one question: **does your homepage, as it loads right now, pull in anything on our list?** That is the shape of the recent script-supply-chain campaigns, where a vendor's script on thousands of sites was swapped for a skimmer or wallet-drainer.

## What it checks, and what it does not

It checks:

- The homepage of the domain you enter, fetched once from our checker.
- The scripts, frames and linked resources (stylesheets, preloads, icons) that page references, plus hosts named inside its inline scripts, compared with our threat list.

It does not check:

- Other pages: checkout, login and account pages are where skimmers usually sit, and they are not loaded.
- The past. A script that was injected last week and removed today will not show.
- Anything the page's scripts load later. We read the page; we do not run it. A script that pulls in a second script, or loads only after a click, a login or a consent banner, is not followed.
- Hosting and CDN platforms as a whole (for example Webflow, WordPress.com, Google Fonts). A domain-level match on one would flag every site on the platform, so those hosts are listed as carriers, not matches. A specific malicious URL on a platform is still reported.

A clean result is "we did not see anything on our list", never "your site is safe".

## The three results

| Result | Meaning |
|---|---|
| Your homepage loads something on our list | At least one host or script your homepage loads matches an indicator. The email lists each one, with its source and the steps to take. |
| We did not see anything on our list on your homepage | Nothing the homepage loaded today matched. See the limits above. |
| We could not complete the check | The check did not finish, and the email says why. One common reason: your site's bot protection declined our checker. That is a control working, not a fault on your site. |

## Why a confirmation link first

The report goes only to an address that clicks the link, so the result reaches only someone who controls that inbox. The form never shows a result on screen.

## Limits

- Up to three reports per email address per day (UTC). Past that, the form still says a link is on its way, but nothing more is sent until the next day. That is deliberate: the form never reveals whether an address has used it.
- A domain can be checked a limited number of times per day across everyone.
- Our own sites and hosting-platform addresses cannot be checked, and IP addresses are not accepted.

## What we keep

For abuse prevention we keep a keyed fingerprint and a masked form of your address, and the domain you checked, for 90 days. Unconfirmed requests are deleted after 48 hours. We don't keep a copy of the emails we send, and we don't add you to a mailing list.

## Next step if something matches

Block the listed indicators. The same indicators are in our free [threat-intel feed](/feed/), so a [free key](https://analytics.dugganusa.com/stix/register?utm_source=docs&utm_medium=am-i-affected) lets your firewall or DNS filter pull them automatically.
