# Group 6 — Release readiness

## Automated checks

`main` and pull-request CI use Node.js 24 and deterministic `npm ci`:

- Production dependency audit for high and critical vulnerabilities.
- ESLint and strict TypeScript checks.
- Unit, NBA API response, cache, quota, date-boundary and recovery tests.
- Production Next.js build.
- Real headless Chromium tests at 1440px desktop and Pixel 7-sized mobile viewports.
- Browser-driven navigation, score filtering, provider failure/retry and no-horizontal-scroll assertions.
- Axe automated WCAG 2.0/2.1 A/AA checks on homepage, games, teams, standings.
- Security-header smoke test against the built Next.js server.

All browser responses for scores are mocked, avoiding real API keys, bandwidth costs and nondeterministic sports results.

## Code hardening

- Provider dates restricted to 1946 and later and a 366-day future schedule horizon, avoiding wasteful arbitrary-year requests.
- Date-key failure entries capped at 128, preventing unlimited failure-cache growth.
- Last-known scores older than six hours are not displayed through the transient fallback.
- Authentication failures are not masked by stale scoreboard entries.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict-origin referrer handling, feature permission restrictions, COOP and CORP.
- Framework `X-Powered-By` header disabled.

## Manual release gates — NOT verified by CI

- [ ] Obtain a valid BALLDONTLIE key and perform a real game-feed smoke test.
- [ ] Verify licensing and permitted public use of game data and protected trademarks.
- [ ] Exercise real live -> final transitions and compare against official scores.
- [ ] Load test the expected multi-instance/region deployment; verify *total* API-key quota consumption.
- [ ] Provide a distributed quota/cache solution for substantial public traffic, or use a plan that safely handles measured traffic.
- [ ] Manually test keyboard navigation, screen reader, 200% zoom, contrast and touch interactions.
- [ ] Review a strict CSP / nonce approach for the deployment platform; verify no hydration regressions.
- [ ] Confirm deployment HTTPS, environment isolation, observability, cost controls, and rollback steps.
- [ ] Publish legal/privacy information appropriate to the final deployment and data-provider terms.

## Local verification

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

No new production libraries or database are added by Group 6; Playwright and axe are development-only dependencies.

## Release decision

Passing CI establishes **technical test readiness**, not automatic production authorization. Do not tag the project as production-ready until all manual gates are completed.

## Free-default provider

The default provider is now `swar/nba_api` through the private Python bridge. No paid API subscription is required. NBA.com can block hosted requests, and NBA.com data licensing must be confirmed before unrestricted public display. CI checks the local bridge with offline static NBA team data but does not prove live historical NBA.com access.
