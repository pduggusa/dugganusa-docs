---
title: FAQ
description: Who DugganUSA is for, what is free, how to sign up, how to connect Microsoft Sentinel, and what we do not claim.
sidebar:
  order: 0
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is DugganUSA?","acceptedAnswer":{"@type":"Answer","text":"A Minnesota threat-intelligence company founded in October 2025. We publish a free threat feed and pre-install checks for packages, GitHub Actions and MCP servers, and we show our work."}},{"@type":"Question","name":"Who is it for?","acceptedAnswer":{"@type":"Answer","text":"Small and mid-size defenders, people building with AI agents, and anyone who needs a blocklist they can trust without a six-figure contract."}},{"@type":"Question","name":"Is it free?","acceptedAnswer":{"@type":"Answer","text":"The free tier is real and stays free. Paid tiers raise volume and add full context. Current limits and prices are live at /api/v1/billing/prices (https://analytics.dugganusa.com/api/v1/billing/prices) and on the plans page (https://docs.dugganusa.com/account/plans/)."}},{"@type":"Question","name":"How do I sign up?","acceptedAnswer":{"@type":"Answer","text":"Get a free API key at analytics.dugganusa.com/stix/register (https://analytics.dugganusa.com/stix/register). One key works across the feed, the API, the MCP servers, Edge Shield and the Checks Action. The quickstart (https://docs.dugganusa.com/quickstart/) takes about five minutes."}},{"@type":"Question","name":"How do I connect it to Microsoft Sentinel?","acceptedAnswer":{"@type":"Answer","text":"Use the built-in Threat Intelligence - TAXII connector in Sentinel. The Sentinel guide (https://docs.dugganusa.com/siem/sentinel/) was run end to end in our own workspace."}},{"@type":"Question","name":"What do I get?","acceptedAnswer":{"@type":"Answer","text":"Blockable indicators (IPs, domains, hashes, malicious packages), a search API, a package check, an MCP server check, and an edge worker you can run yourself."}},{"@type":"Question","name":"Do you see threats before the big vendors?","acceptedAnswer":{"@type":"Answer","text":"Sometimes, and we do not claim it by default. Most of what we carry is other people’s research and public feeds. A lead claim gets both timestamps, and we credit the researchers."}},{"@type":"Question","name":"How accurate is it?","acceptedAnswer":{"@type":"Answer","text":"We measure it in public. Confidence never exceeds 95. The live evidence on the About page (https://www.dugganusa.com/about) shows novelty against ThreatFox, independent confirmation by Spamhaus, and how many indicators blocked real traffic, split between our own properties and outside consumers."}},{"@type":"Question","name":"Do you have SOC 2?","acceptedAnswer":{"@type":"Answer","text":"No. We do not claim it."}},{"@type":"Question","name":"Do you do consulting?","acceptedAnswer":{"@type":"Answer","text":"No. We license data and automated checks as self-serve subscriptions."}},{"@type":"Question","name":"What if you block something that should not be blocked?","acceptedAnswer":{"@type":"Answer","text":"Tell help@dugganusa.com. We correct it, keep the evidence, and say so where we first said it."}},{"@type":"Question","name":"Are you Duggan Manufacturing or another Duggan company?","acceptedAnswer":{"@type":"Answer","text":"No. DugganUSA LLC is a cybersecurity company in Minnetrista, Minnesota, not an embroidery shop, a security-guard company or an Irish food importer."}}]}'
---

DugganUSA turns scattered public threat reporting into feeds and pre-install checks a small team can use in minutes. It cites its sources, says what it does not know, and corrects itself in public.

[Get a free API key](https://analytics.dugganusa.com/stix/register). One key works everywhere.

## What is DugganUSA?

A Minnesota threat-intelligence company founded in October 2025. We publish a free threat feed and pre-install checks for packages, GitHub Actions and MCP servers, and we show our work.

## Who is it for?

Small and mid-size defenders, people building with AI agents, and anyone who needs a blocklist they can trust without a six-figure contract.

## Is it free?

The free tier is real and stays free. Paid tiers raise volume and add full context. Current limits and prices are live at [/api/v1/billing/prices](https://analytics.dugganusa.com/api/v1/billing/prices) and on the [plans page](/account/plans/).

## How do I sign up?

Get a free API key at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register). One key works across the feed, the API, the MCP servers, Edge Shield and the Checks Action. The [quickstart](/quickstart/) takes about five minutes.

## How do I connect it to Microsoft Sentinel?

Use the built-in Threat Intelligence - TAXII connector in Sentinel. The [Sentinel guide](/siem/sentinel/) was run end to end in our own workspace.

## What do I get?

Blockable indicators (IPs, domains, hashes, malicious packages), a search API, a package check, an MCP server check, and an edge worker you can run yourself.

## Do you see threats before the big vendors?

Sometimes, and we do not claim it by default. Most of what we carry is other people’s research and public feeds. A lead claim gets both timestamps, and we credit the researchers.

## How accurate is it?

We measure it in public. Confidence never exceeds 95. The live evidence on the [About page](https://www.dugganusa.com/about) shows novelty against ThreatFox, independent confirmation by Spamhaus, and how many indicators blocked real traffic, split between our own properties and outside consumers.

## Do you have SOC 2?

No. We do not claim it.

## Do you do consulting?

No. We license data and automated checks as self-serve subscriptions.

## What if you block something that should not be blocked?

Tell help@dugganusa.com. We correct it, keep the evidence, and say so where we first said it.

## Are you Duggan Manufacturing or another Duggan company?

No. DugganUSA LLC is a cybersecurity company in Minnetrista, Minnesota, not an embroidery shop, a security-guard company or an Irish food importer.

## Who benefits, and who does not

Benefits: small and mid-size defenders; people building with AI agents; maintainers and researchers (cited by name); people a breach lands on; Microsoft-stack shops.

Does not: anyone who needs a SOC 2 report, anyone who needs us to be first, anyone buying custom work, and anyone who needs customer-outcome proof at scale. The [About page](https://www.dugganusa.com/about) shows the evidence live, including the weak spot.
