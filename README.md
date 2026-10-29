# Next NBA

A modern NBA web application built with Next.js, TypeScript, and Tailwind CSS.

## Getting started

Requirements: **Node.js 24** and npm.

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript |

## Initial scope

- Responsive app shell with an NBA-themed landing page.
- Routes for games, teams, and standings, ready for future integration.
- Componentized UI and TypeScript project conventions.
- GitHub Actions CI using Node.js 24.

**Data status:** No live NBA data source is configured yet. The starter deliberately does not show invented scores, standings, or player statistics.

## Roadmap

1. Choose and integrate a licensed NBA data provider.
2. Add game schedule, live scores and game details.
3. Add team profiles, player pages and standings.
4. Add tests, caching, and operational monitoring.

## Development notes

Use environment variables for third-party API credentials. Do not commit secrets. Run `npm install` and commit the generated `package-lock.json` to enable reproducible `npm ci` builds.
