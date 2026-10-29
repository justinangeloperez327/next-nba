# Group 5 — Frontend completion

## Navigation and discoverability

- Responsive navigation indicates the current page using `aria-current="page"`.
- The teams directory supports search and East/West filtering with `aria-pressed` controls.
- Every team links to `/games?team=XXX`, where XXX is a known NBA abbreviation.
- Game cards link each team abbreviation to its game schedule for the selected NBA date.
- Game-day navigation keeps the chosen team filter; the All Teams link clears it.
- The full date slate stays chronological. The homepage promotes up to three games, prioritizing in-progress games, then scheduled, then final.

## Accessibility and semantics

- Keyboard focus rings and minimum 44px controls for date navigation, filters and refresh.
- Accessible labels for team badge links, game statuses, and loading/errors.
- Score lists do not use a blanket `aria-live` region, preventing repeated announcements every 30 seconds.
- Reduced-motion users are not subjected to continuous skeleton animation.
- UTC server-rendering and locally formatted tip-off times on hydration remain unchanged.

## Data and scope

- Team directory names and abbreviations are static; scores are never invented.
- Team filters operate on already-fetched daily games and incur no extra upstream API requests.
- No separate team-detail API, player profiles, standings API, UI libraries, database or external image assets.
- Live polling, cache controls, and provider quota limitations remain as documented in [live-scores.md](live-scores.md).

## Validation

`npm test` verifies team search, abbreviations, combined game/team filters, and homepage prioritization.
`npm run lint`, `npm run typecheck`, and `npm run build` are part of CI.
Browser-based accessibility and responsive viewport testing remain Group 6 release gates.
