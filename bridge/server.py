"""Private bridge from Next NBA to swar/nba_api. Not a public data API."""
from __future__ import annotations

import hmac
import json
import os
import re
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
from zoneinfo import ZoneInfo

EASTERN = ZoneInfo("America/New_York")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_RESPONSE_BYTES = 2_000_000


class BridgeError(Exception):
    pass


def valid_date(value: str) -> date:
    if not DATE_PATTERN.fullmatch(value):
        raise ValueError("Invalid schedule date")
    parsed = date.fromisoformat(value)
    if not (date(1946, 1, 1) <= parsed <= datetime.now(EASTERN).date() + timedelta(days=366)):
        raise ValueError("Schedule date out of range")
    return parsed


def fetch_games(
    requested: date,
    *,
    today: date | None = None,
    live_factory=None,
    stats_factory=None,
) -> dict:
    """Use CDN Live for today's date, ScoreboardV3 for historical/future dates."""
    if today is None:
        today = datetime.now(EASTERN).date()
    if requested == today:
        if live_factory is None:
            from nba_api.live.nba.endpoints import scoreboard
            live_factory = scoreboard.ScoreBoard
        payload = live_factory(timeout=8).get_dict()
        mode = "live"
    else:
        if stats_factory is None:
            from nba_api.stats.endpoints import ScoreboardV3
            stats_factory = ScoreboardV3
        # ScoreboardV3 supersedes the deprecated ScoreboardV2.
        payload = stats_factory(game_date=requested.isoformat(), league_id="00", timeout=8).nba_response.get_dict()
        mode = "stats"

    board = payload.get("scoreboard") if isinstance(payload, dict) else None
    games = board.get("games") if isinstance(board, dict) else None
    if not isinstance(games, list):
        raise BridgeError("NBA scoreboard returned invalid data")
    for game in games:
        if not isinstance(game, dict):
            raise BridgeError("NBA scoreboard contains an invalid game")
    return {"date": requested.isoformat(), "mode": mode, "scoreboard": {"games": games}}


def fetch_teams(*, static_getter=None) -> dict:
    if static_getter is None:
        from nba_api.stats.static import teams
        static_getter = teams.get_teams
    result = static_getter()
    if not isinstance(result, list):
        raise BridgeError("NBA teams reference is invalid")
    return {"teams": result}


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = "NextNBABridge"
    sys_version = ""

    def respond(self, status: int, payload: dict):
        data = json.dumps(payload, separators=(",", ":"), allow_nan=False).encode("utf-8")
        if len(data) > MAX_RESPONSE_BYTES:
            status = 502
            data = b'{"error":"UPSTREAM"}'
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlsplit(self.path)
        if parsed.path == "/health":
            self.respond(200, {"ok": True})
            return

        token = os.environ.get("NBA_API_BRIDGE_TOKEN", "")
        actual = self.headers.get("Authorization", "")
        if not token or not hmac.compare_digest(actual, "Bearer " + token):
            self.respond(401, {"error": "AUTH"})
            return

        query = parse_qs(parsed.query, keep_blank_values=True)
        try:
            if parsed.path == "/v1/teams":
                if query:
                    raise ValueError("Unexpected parameters")
                self.respond(200, fetch_teams())
                return
            if parsed.path == "/v1/games":
                dates = query.get("date", [])
                if set(query) != {"date"} or len(dates) != 1:
                    raise ValueError("Exactly one date is required")
                day = valid_date(dates[0])
                self.respond(200, fetch_games(day))
                return
            self.respond(404, {"error": "NOT_FOUND"})
        except (ValueError, OverflowError):
            self.respond(400, {"error": "INVALID_DATE"})
        except (BridgeError, TimeoutError):
            self.respond(502, {"error": "UPSTREAM"})
        except Exception:
            # Never echo NBA.com errors, proxy details, or configuration secrets.
            self.respond(502, {"error": "UPSTREAM"})

    def do_POST(self):
        self.respond(405, {"error": "METHOD_NOT_ALLOWED"})

    def log_message(self, format, *args):
        # Avoid logging bearer secrets or incoming URL query values.
        return


def main():
    if not os.environ.get("NBA_API_BRIDGE_TOKEN", "").strip():
        raise SystemExit("NBA_API_BRIDGE_TOKEN is required")
    host = os.environ.get("NBA_API_BIND", "127.0.0.1")
    port = int(os.environ.get("NBA_API_PORT", "8765"))
    ThreadingHTTPServer((host, port), BridgeHandler).serve_forever()


if __name__ == "__main__":
    main()
