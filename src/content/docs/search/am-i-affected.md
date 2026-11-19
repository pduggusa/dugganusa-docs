---
title: Am I affected? (site check)
description: A free, email-delivered check of what your homepage loads against our threat list. What it looks at, what it does not, what the three results mean, and what we keep.
---

[Am I affected?](https://analytics.dugganusa.com/am-i-affected) is a free check for site owners. Enter a domain and an email address. We load that domain's homepage once, compare every script and host it pulls in against our threat list, and email you the result after you click a confirmation link. No API key is needed.

It answers one question: **does your homepage, as it loads right now, pull in anything on our list?** That is the shape of the recent script-supply-chain campaigns, where a vendor's script on thousands of sites was swapped for a skimmer or wallet-drainer.

## What it checks, and what it does not

It checks:

- The homepage of the domain you enter, fetched once from our checker.
- The scripts, frames and linked resources (stylesheets and preloads) that page references, plus hosts named inside its inline scripts, compared with our threat list.
- Up to 20 of the script files the page loads, opened and read as text. We never run them. Web addresses and host names written inside those files are compared with our threat list too. This is how a known-bad host hidden inside a legitimate vendor's script shows up, as it did in the November 2026 Optimizely campaign. The email says how many of those files we could read.

It does not check:

- Other pages: checkout, login and account pages are where skimmers usually sit, and they are not loaded.
- The past. A script that was injected last week and removed today will not show.
- Anything the page's scripts do when they run. We read script files, we do not run them. A host that a script builds at run time (pieced together, encoded, or fetched from somewhere else), a script loaded only after a click, a login or a consent banner, and the files a script loads in turn are not followed.
- Script files we could not read: ones that timed out, were refused by bot protection, sent a compressed or non-script response, redirected (we do not follow redirects), were past the first 20 or past two per destination site, or are on a host already on our list (we never contact a host we hold). We fetch script files without their query string, so a file that only works with one may not be readable. The email counts them. A file we could not read is "not checked", not "clear".
- Hosting and CDN platforms as a whole (for example Webflow, WordPress.com, Google Fonts). A domain-level match on one would flag every site on the platform, so those hosts are listed as carriers, not matches. A specific malicious URL on a platform is still reported.

A host on our list that is only named inside your page's code (an inline script or a script file) is listed separately as "named inside `<file host>`'s file", not as something your homepage loads. We read that code; we did not see it run. Treat it as worth a look, not a finding.

If we could not fully check every script file your homepage loads, the result is not "nothing seen": the email says "we could not fully check N of M script files, so this check is incomplete". A busy vendor can hit our per-vendor rate limit; trying again a few minutes later usually completes it.

Standards identifiers such as `http://www.w3.org/2000/svg` or `schema.org`, which appear in almost every page's code, are never treated as matches when they are only named in code.

A clean result is "we did not see anything on our list", never "your site is safe".

## The three results

| Result | Meaning |
|---|---|
| Your homepage loads something on our list | At least one host or script your homepage loads matches an indicator. The email lists each one, with its source and the steps to take. |
| We did not see anything on our list on your homepage | Nothing the homepage loaded today matched, and every script file was fully checked. If your page's code only names something on our list, the headline says so instead. See the limits above. |
| We could not complete the check | The check did not finish, or some script files could not be fully checked, and the email says which. One common reason: your site's bot protection declined our checker. That is a control working, not a fault on your site. |

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
