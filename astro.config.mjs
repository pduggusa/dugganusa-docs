// docs.dugganusa.com: Astro Starlight. Left nav = the integration lanes a customer actually wires.
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';

export default defineConfig({
  site: 'https://docs.dugganusa.com',
  integrations: [
    starlight({
      title: 'DugganUSA Docs',
      // /llms.txt, /llms-full.txt, /llms-small.txt: the docs as Markdown for AI assistants and agents.
      plugins: [starlightLlmsTxt({ projectName: 'DugganUSA', description: 'Threat-intelligence feeds, search, and pre-flight checks (check-package, Dredd) for AI agents. One API key; send it as Authorization: Bearer.' })],
      description: 'Threat-intelligence feeds, search, and pre-flight checks for AI agents: how to integrate.',
      logo: { src: './src/assets/mark.svg', replacesTitle: false },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/brand.css'],
      components: { ThemeProvider: './src/components/ThemeProvider.astro' },
      lastUpdated: true,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/pduggusa' },
      ],
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' } },
      ],
      sidebar: [
        { label: 'Get started', items: ['index', 'quickstart', 'authentication', 'rate-limits', 'errors'] },
        { label: 'Threat-intel feed', items: [{ autogenerate: { directory: 'feed' } }] },
        { label: 'Firewalls & IDS', items: [{ autogenerate: { directory: 'firewall' } }] },
        { label: 'SIEM & detection', items: [{ autogenerate: { directory: 'siem' } }] },
        { label: 'Search & enrichment', items: [{ autogenerate: { directory: 'search' } }] },
        { label: 'Agent security (MCP)', items: [{ autogenerate: { directory: 'agents' } }] },
        { label: 'Account & keys', items: [{ autogenerate: { directory: 'account' } }] },
        { label: 'Research', items: [{ autogenerate: { directory: 'research' } }] },
        { label: 'Reference', items: ['reference/endpoints', 'changelog'] },
      ],
    }),
  ],
});
