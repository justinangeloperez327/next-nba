# Using `swar/nba_api` in Next NBA

Source: <https://github.com/swar/nba_api>. Python package: `nba_api==1.12.0` (MIT-licensed client code; NBA data is subject to NBA.com terms).

## Why there is a Python bridge

`swar/nba_api` is a **Python library**, not a hosted JSON REST service or npm package. The Next.js frontend cannot directly import it. The repository adds `bridge/server.py`, a small, private JSON gateway:

```
Browser -> Next.js /api/games -> NbaProvider (TypeScript) -> private Python bridge
                                                    -> nba_api -> NBA.com endpoints
```

**Current league day (America/New_York):** `nba_api.live.nba.endpoints.scoreboard.ScoreBoard`, uses the live CDN scoreboard. **Any other league date:** `nba_api.stats.endpoints.ScoreboardV3(game_date=...)`, which has historical/future schedules when NBA.com returns them. ScoreboardV2 is deprecated upstream. **Teams:** `nba_api.stats.static.teams.get_teams()` (offline package data).

It deliberately **does not** simulate missing games. A blocked or invalid upstream response produces a sanitized 502 and normal UI error/stale behavior.

## Recommended local Docker setup

Docker Compose builds a Node.js 24 application and a Python 3.12 bridge, exposes only the web server on port 3000, and selects `NBA_DATA_PROVIDER=nba-api`.

1. Create a local `.env` containing **only a random secret token**, e.g. `NBA_API_BRIDGE_TOKEN=<your long random token>`. This file is ignored by Git.
2. Run `docker compose up --build`.
3. Visit `http://localhost:3000/games`.

Neither NBA.com nor the Python bridge requires a subscription key, but the bridge requires a private bearer token to protect it against untrusted network clients. The token is never given to the browser. Rotate it if exposed.

For development without Docker, use two terminals:

```bash
# terminal 1 (Python 3.12+)
python -m venv .venv
# activate venv (platform-dependent)
pip install -r bridge/requirements.txt
# set NBA_API_BRIDGE_TOKEN in your shell environment
python bridge/server.py
```

```bash
# terminal 2 (Node.js 24)
npm ci
# in .env.local:
# NBA_DATA_PROVIDER=nba-api
# NBA_API_BRIDGE_URL=http://127.0.0.1:8765
# NBA_API_BRIDGE_TOKEN=<same secret>
npm run dev
```

For a separately hosted bridge, use a non-public/private network with TLS and `NBA_API_BRIDGE_URL=https://...` plus the bearer token. **The bridge is not included in a normal Vercel deployment of the Next.js app.** Deploy it separately to an environment with Python support and validate outbound connectivity.

## Provider behavior and limits

- Game data is normalized to `NbaGame`; game statuses 1/2/3 map to scheduled/live/final; postponed/canceled/delayed are recognized only when explicitly in status text. Unknown teams or malformed game IDs produce errors rather than incorrect matchup data.
- Scores on games not played are displayed as unknown instead of misleading zeroes.
- Python's static NBA team IDs are used for the 30-team directory.
- An in-process Node.js cache coalesces requests and applies a per-runtime upstream guard. It does not enforce globally distributed quotas.
- `ScoreboardV3` may time out or be blocked on AWS/Azure/GCP or other cloud-hosting IPs. Even the live CDN can change shape or fail.
- The Python library's MIT license **does not grant rights** to commercially reuse, redistribute, or publish NBA.com data or logos. Review <https://www.nba.com/termsofuse> before publishing.

## Tests and limitations

`python -m unittest discover -s bridge/tests -v` tests the Python bridge without live upstream calls. `npm test` tests the TypeScript adapter, normalization, secret handling and errors using mocked HTTP responses. CI also builds the Docker images.

Real NBA.com access, historical `ScoreboardV3` connectivity, score fidelity, and end-to-end Compose execution on the intended host are manual release gates. Avoid claiming these as verified merely because CI is green.
