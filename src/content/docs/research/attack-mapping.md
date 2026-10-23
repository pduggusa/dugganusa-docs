---
title: How much to trust ATT&CK mappings in the feed
description: Where the kill_chain_phases and attack-pattern objects in the STIX feed come from, how strong each source of a mapping is, and how to use them without over-trusting them.
---

Originally published 2025-10-27 as "MITRE ATT&CK Killchain Mapping"; revised 2026-10-23.

The [STIX 2.1 bundle](/feed/stix-bundle/) and [TAXII](/feed/taxii/) collections carry MITRE ATT&CK context in two places. This page explains where each comes from and how much weight it can bear, so you can decide what to automate on.

## Two kinds of ATT&CK context

| Where | What it is | When you get it |
|---|---|---|
| `kill_chain_phases` on an `indicator` | One or more ATT&CK **tactics** (phase names such as `command-and-control`, `reconnaissance`), no technique ID | On IP indicators when at least one rule below matches |
| `attack-pattern` objects in the bundle | A fixed set of ATT&CK **techniques** with IDs and links, describing behavior we track | Only on full, unpaginated pulls. A request with `limit` returns a lean bundle of indicators without them |

As of this revision the bundle's `attack-pattern` set covers T1195.002, T1199, T1078.004, T1087 / T1087.004, T1518, T1204.002, T1555.003, T1071.001, T1041, T1595 / T1595.001 / T1595.002, T1498, T1499, T1110 and T1090. Those objects describe categories of activity. They are not a per-indicator claim that a given IP performed a given technique.

## How an indicator gets its phases

Phases on an IP indicator are inferred, in this order, and accumulate without duplicates:

1. **An explicit technique on the source record.** If the record carries a technique, its tactic is used. This is the strongest source.
2. **The upstream threat type.** `botnet`, `c2` or `cc` adds `command-and-control`; `payload` or `delivery` adds `initial-access`.
3. **The malware family name.** Stealer families add `credential-access` and `collection`; RAT families add `command-and-control` and `persistence`; loaders add `execution`; Cobalt Strike, Sliver, Metasploit and beacons add `command-and-control` and `lateral-movement`; ransomware families add `impact`.
4. **Words in our block reason.** Scan, probe or recon adds `reconnaissance`; brute, auth or login adds `credential-access`; DoS or flood adds `impact`.
5. **The network the IP sits on.** Proxy, VPN, bulletproof or hosting networks, or a network we flag as suspicious, add `defense-evasion`.
6. **A fallback.** If nothing above matched and the abuse score is 50 or higher, the indicator gets `command-and-control`.

## How strong each source is

We grade mapping evidence the way the original paper did: direct evidence, strong inference, circumstantial. Applied to the rules above:

| Source | Grade | Why |
|---|---|---|
| Explicit technique (1) | Direct | Someone or something recorded the technique for this indicator |
| Upstream threat type (2) | Strong inference | A C2 listing from a tracker is a statement about what the IP does |
| Malware family (3) | Strong inference, with a caveat | Correct when the family label is correct. Matching is by substring on the family name, so an unrelated name that contains a short keyword such as `rat` can pick up phases it should not |
| Block reason (4) | Circumstantial | Keyword match on free text; `auth` in a reason does not prove credential attacks |
| Network type (5) | Circumstantial | Hosting space is where most scanning and most legitimate servers live. `defense-evasion` here means "could be used to hide origin", nothing more |
| Fallback (6) | Weakest | A placeholder phase for a high-reputation-risk IP with no other context |

The indicator's `confidence` field scores how likely the indicator is to be malicious. It does **not** score the accuracy of its phases. A confidence-95 indicator can carry a fallback phase.

## Using the mappings

- **Block on `confidence`, not on phases.** `min_confidence` is your dial; phases are context for the analyst.
- **Route and prioritize on phases.** `command-and-control` and `credential-access` hits are reasonable to escalate first. Treat `defense-evasion` and `reconnaissance` alone as low-signal.
- **Read the enrichment before acting on a phase.** The `x_dugganusa_threat_intel` extension shows the enrichment behind the indicator, and `/api/v1/search/correlate?q=<indicator>` (Pro and above) shows where else it appears in the corpus. See [Search](/search/search/).
- **Want technique-level detections?** The [detection-rules catalog](/siem/detection-rules/) lists technique IDs per rule and filters with `?mitre=T1190`.

## Method: grade every mapping before you publish it

The original paper's lasting contribution is a habit, not a dataset: every technique mapping carries an evidence grade, and nothing is graded above 95%. Two parts of its method still hold for anyone mapping their own telemetry:

- **Cross-check instruments that see different things.** A request that reaches your edge logs but never fires a client-side analytics event came from a client that did not run your JavaScript: a script, crawler or headless tool. That is evidence about the client, not about intent.
- **Attribution has a ceiling.** Without provider records you cannot prove who sits behind a proxy or a privacy-protected domain. Grade it as inference and say so.

## What changed since the original

- **The detection stack.** The 2025 paper described a three-source setup built on free analytics tiers and a self-hosted blocker. Detection today comes from the feed pipeline, our edge sensors and the enrichment described in these docs; the old cost and volume figures no longer apply and are removed.
- **The case studies.** The original worked through specific incidents, including the attribution of one scraping campaign to a named person and the classification of a security vendor's internet-wide research scanning as an adversary campaign. Both are withdrawn. A personal attribution at inference grade does not belong in public documentation, and internet-wide research scanning is not by itself adversary activity.
- **Phases on indicators are new.** The original mapped techniques by hand per incident. Feed indicators gained automatic `kill_chain_phases` in January 2026, which is why this page now centers on how far to trust that inference.
