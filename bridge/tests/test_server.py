import importlib.util
import io
import json
import os
import unittest
from datetime import date
from http.server import HTTPServer
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "nba_bridge", os.path.join(os.path.dirname(__file__), "..", "server.py")
)
bridge = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bridge)


class FakeScoreboard:
    def __init__(self, timeout=8):
        self.timeout = timeout

    def get_dict(self):
        return {"scoreboard": {"games": [{"gameId": "0022600012"}]}}


class FakeStats:
    def __init__(self, game_date, league_id, timeout):
        self.arguments = (game_date, league_id, timeout)
        self.nba_response = self

    def get_dict(self):
        return {"scoreboard": {"games": [{"gameId": "0022400012"}]}}


class DataTests(unittest.TestCase):
    def test_valid_date(self):
        self.assertEqual(bridge.valid_date("2024-02-29"), date(2024, 2, 29))
        for value in ("2026-02-29", "123", "9999-12-31", "2026-01-01abc"):
            with self.assertRaises(ValueError):
                bridge.valid_date(value)

    def test_today_uses_live_only(self):
        output = bridge.fetch_games(date(2026, 10, 29), today=date(2026, 10, 29), live_factory=FakeScoreboard)
        self.assertEqual(output["mode"], "live")
        self.assertEqual(output["scoreboard"]["games"][0]["gameId"], "0022600012")

    def test_other_date_uses_v3(self):
        output = bridge.fetch_games(date(2026, 10, 28), today=date(2026, 10, 29), stats_factory=FakeStats)
        self.assertEqual(output["mode"], "stats")
        self.assertEqual(output["scoreboard"]["games"][0]["gameId"], "0022400012")

    def test_empty_day_is_valid(self):
        class EmptyScoreboard:
            def __init__(self, timeout):
                pass

            def get_dict(self):
                return {"scoreboard": {"games": []}}
        output = bridge.fetch_games(date(2026, 10, 29), today=date(2026, 10, 29), live_factory=EmptyScoreboard)
        self.assertEqual(output["scoreboard"]["games"], [])

    def test_invalid_upstream_never_appears_empty(self):
        class Broken:
            def __init__(self, timeout):
                pass

            def get_dict(self):
                return {"error": "blocked"}
        with self.assertRaises(bridge.BridgeError):
            bridge.fetch_games(date(2026, 10, 29), today=date(2026, 10, 29), live_factory=Broken)

    def test_teams_are_static(self):
        output = bridge.fetch_teams(static_getter=lambda: [{"id": 1, "abbreviation": "BOS"}])
        self.assertEqual(output["teams"][0]["abbreviation"], "BOS")


class HandlerTests(unittest.TestCase):
    def setUp(self):
        self.http = HTTPServer(("127.0.0.1", 0), bridge.BridgeHandler)
        self.client = self.http.socket.getsockname()
        self.environment = patch.dict(os.environ, {"NBA_API_BRIDGE_TOKEN": "supersecret"})
        self.environment.start()

    def tearDown(self):
        self.environment.stop()
        self.http.server_close()

    def send(self, url, auth=None):
        from http.client import HTTPConnection
        from threading import Thread
        thread = Thread(target=self.http.handle_request, daemon=True)
        thread.start()
        conn = HTTPConnection(*self.client, timeout=3)
        headers = {"Authorization": auth} if auth else {}
        conn.request("GET", url, headers=headers)
        response = conn.getresponse()
        data = json.loads(response.read())
        status = response.status
        conn.close()
        thread.join(timeout=3)
        return status, data

    def test_health_and_private_auth(self):
        status, _ = self.send("/health")
        self.assertEqual(status, 200)
        status, content = self.send("/v1/teams")
        self.assertEqual((status, content["error"]), (401, "AUTH"))
        status, content = self.send("/v1/teams", "Bearer incorrect")
        self.assertEqual((status, content["error"]), (401, "AUTH"))

    def test_invalid_date_and_no_extra_params(self):
        status, _ = self.send("/v1/games?date=2026-02-30", "Bearer supersecret")
        self.assertEqual(status, 400)
        status, _ = self.send("/v1/games?date=2026-10-29&date=2026-10-30", "Bearer supersecret")
        self.assertEqual(status, 400)

    def test_healthy_teams_does_not_fetch_stats(self):
        with patch.object(bridge, "fetch_teams", return_value={"teams": [{"id": 1}]}):
            status, data = self.send("/v1/teams", "Bearer supersecret")
        self.assertEqual(status, 200)
        self.assertEqual(data["teams"], [{"id": 1}])

    def test_upstream_failure_sanitized(self):
        with patch.object(bridge, "fetch_games", side_effect=RuntimeError("secret data")):
            status, body = self.send("/v1/games?date=2026-10-29", "Bearer supersecret")
        self.assertEqual(status, 502)
        self.assertEqual(body, {"error": "UPSTREAM"})


if __name__ == "__main__":
    unittest.main()
