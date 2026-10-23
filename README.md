# DugganUSA developer docs

Source for [docs.dugganusa.com](https://docs.dugganusa.com): how to integrate DugganUSA threat-intelligence feeds, search, and the pre-flight checks for AI agents (check-package, Dredd) into firewalls, SIEMs, CI pipelines and MCP clients.

- **Humans:** start at [docs.dugganusa.com/quickstart](https://docs.dugganusa.com/quickstart/).
- **AI assistants and agents:** the whole site as Markdown at [/llms.txt](https://docs.dugganusa.com/llms.txt), [/llms-full.txt](https://docs.dugganusa.com/llms-full.txt) and [/llms-small.txt](https://docs.dugganusa.com/llms-small.txt).

## Run locally

```sh
npm ci
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Built with [Astro Starlight](https://starlight.astro.build). Pages live in `src/content/docs/`. Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## Accuracy

Every page is checked against the running API and its code. If something here disagrees with what the API does, the API is right and this is a bug: open an issue.

## License

Documentation text: [CC BY 4.0](LICENSE). Code samples may be copied without attribution.
