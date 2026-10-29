# Next NBA

A modern, independent NBA web application using Next.js 16, TypeScript, React 19 and Tailwind CSS 4.

## Requirements

- **Node.js 24** (see `.nvmrc`)
- npm
- No API key is required for the initial scaffold. Live NBA scores are not connected yet.

## Getting started

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run automated tests (Node.js built-in test runner) |

## Initial scope

- Responsive NBA-themed homepage and navigation.
- Directory of 30 NBA teams.
- Placeholder routes for games and standings; **no live data is connected**.
- GitHub Actions CI with Node.js 24, deterministic `npm ci`, lint, typecheck, tests and production build.

## Roadmap

1. Integrate a permitted NBA data provider.
2. Build schedules, live scores, and results with shared caching.
3. Improve team pages and add game details.
4. Expand to standings and player stats when supported by the API tier and rights.

## Development notes

- Commit `package-lock.json` when updating dependencies.
- Use `npm ci` for reproducible installs in CI and clean environments.
- Never commit API keys; use environment variables.
- The project is independent and not affiliated with or endorsed by the NBA.
