# Security policy

## Reporting vulnerabilities

Please report security issues privately using GitHub's **Report a vulnerability** option
in the repository Security tab if it is available. Do **not** publish API keys,
tokens, or reproduction data containing secrets in a public issue.

## Credential handling

- Configure `BALLDONTLIE_API_KEY` only on the server; never use `NEXT_PUBLIC_`.
- Do not commit `.env.local`, API credentials, or Playwright trace files containing sensitive information.
- Rotate keys immediately if accidentally exposed.
- Do not use live API keys in CI browser tests; all game responses are mocked.

## Implemented controls

- Input validation limits game dates to the NBA historical era through one year ahead.
- Provider responses are validated and errors are sanitized.
- Response security headers deny framing and restrict sensitive browser permissions.
- Local upstream rate limiting, shared process cache, cooldown, and bounded failure state.
- Cached stale live results expire after six hours and are identified as stale.
- CI verifies linting, types, unit/integration tests, browser flows and automated WCAG A/AA checks.

## Known constraints

The in-process quota guard does **not** enforce a global provider rate limit across
serverless instances/regions. Implement a durable distributed quota before substantial
public traffic on the five-request-per-minute free plan.

No strict Content Security Policy is configured because a nonce-based policy must be
tested against Next.js streaming/hydration on the eventual deployment platform.
Review and add CSP before claiming strong browser-side XSS protection.

Automated accessibility and security tests are not a substitute for manual keyboard,
screen-reader, penetration, dependency and licensing reviews.
