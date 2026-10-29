"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { retryDelaySeconds } from "../lib/nba/polling";
import type { GamesPayload, NbaGame } from "../lib/nba/types";

type GamesState = {
  date: string;
  status: "loading" | "success" | "error";
  games: NbaGame[];
  fetchedAt: string | null;
  error: string | null;
  stale: boolean;
  refreshing: boolean;
  refreshAfterSeconds: number | null;
};

type ApiError = Error & { retryAfterSeconds?: number; terminal?: boolean };

function empty(date: string): GamesState {
  return { date, status: "loading", games: [], fetchedAt: null, error: null, stale: false,
    refreshing: false, refreshAfterSeconds: null };
}

function parseError(status: number, body: unknown, retryAfter: string | null): ApiError {
  const value = body && typeof body === "object" ? body as { error?: { code?: string } } : {};
  const code = value.error?.code ?? "";
  const messages: Record<string, string> = {
    NOT_CONFIGURED: "NBA data is not configured. Set BALLDONTLIE_API_KEY on the server.",
    AUTH: "NBA provider authentication failed. Check the server-side key.",
    RATE_LIMIT: "The NBA provider is rate-limited. Last received scores may be outdated.",
    TIMEOUT: "The NBA provider timed out.",
    NETWORK: "The NBA provider is unreachable.",
    UPSTREAM: "The NBA provider returned an error.",
    INVALID_RESPONSE: "The NBA provider returned unexpected data.",
  };
  const error = new Error(messages[code] ??
    (status >= 500 ? "NBA scores are temporarily unavailable." : "Unable to load NBA games.")) as ApiError;
  error.terminal = code === "AUTH" || code === "NOT_CONFIGURED";
  if (retryAfter && /^\d{1,4}$/.test(retryAfter)) {
    error.retryAfterSeconds = Number(retryAfter);
  }
  return error;
}

export function useGames(date: string) {
  const [state, setState] = useState<GamesState>(() => empty(date));
  const [reloadKey, setReloadKey] = useState(0);
  const [online, setOnline] = useState(true);
  const failed = useRef(0);
  const refresh = useCallback(() => setReloadKey((count) => count + 1), []);

  useEffect(() => {
    let active = true;
    let busy = false;
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    failed.current = 0;

    function stopTimer() {
      if (timer) clearTimeout(timer);
      timer = undefined;
    }

    function schedule(seconds: number) {
      stopTimer();
      if (active) timer = setTimeout(() => { void load(); }, seconds * 1000);
    }

    async function load() {
      if (!active || busy || document.visibilityState === "hidden" || !navigator.onLine) return;
      busy = true;
      controller = new AbortController();
      setState((previous) => previous.date === date && previous.fetchedAt
        ? { ...previous, refreshing: true }
        : empty(date));

      try {
        const response = await fetch(`/api/games?date=${encodeURIComponent(date)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const raw: unknown = await response.json();
        if (!response.ok) throw parseError(response.status, raw, response.headers.get("retry-after"));

        const data = raw as Partial<GamesPayload> | null;
        if (!data || data.date !== date || !Array.isArray(data.games) ||
            typeof data.fetchedAt !== "string") {
          throw new Error("The game feed returned an unexpected response.");
        }
        if (!active) return;
        failed.current = 0;
        const seconds = Math.max(30, data.refreshAfterSeconds ?? 300);
        setState({
          date, status: "success", games: data.games, fetchedAt: data.fetchedAt,
          error: null, stale: data.stale === true, refreshing: false,
          refreshAfterSeconds: seconds,
        });
        schedule(seconds);
      } catch (caught) {
        if (!active || controller?.signal.aborted) return;
        const error = caught as ApiError;
        failed.current++;
        const seconds = retryDelaySeconds(failed.current, error.retryAfterSeconds);
        setState((previous) => ({
          date,
          status: previous.date === date && previous.fetchedAt ? "success" : "error",
          games: previous.date === date ? previous.games : [],
          fetchedAt: previous.date === date ? previous.fetchedAt : null,
          error: error instanceof Error ? error.message : "NBA scores are unavailable.",
          stale: true, refreshing: false,
          refreshAfterSeconds: error.terminal ? null : seconds,
        }));
        if (!error.terminal) schedule(seconds);
      } finally {
        busy = false;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        stopTimer();
        controller?.abort();
      } else if (navigator.onLine) {
        void load();
      }
    }
    function onOnline() {
      setOnline(true);
      stopTimer();
      void load();
    }
    function onOffline() {
      setOnline(false);
      stopTimer();
      controller?.abort();
      setState((previous) => ({
        ...previous,
        date,
        error: "You are offline. Showing any previously received scores.",
        stale: true, refreshing: false,
        status: previous.date === date && previous.fetchedAt ? "success" : "error",
      }));
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine) void load();
    else onOffline();
    return () => {
      active = false;
      stopTimer();
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [date, reloadKey]);

  const matching = state.date === date;
  return {
    games: matching ? state.games : [],
    fetchedAt: matching ? state.fetchedAt : null,
    error: matching ? state.error : null,
    loading: !matching || state.status === "loading",
    refreshing: matching && state.refreshing,
    stale: matching && state.stale,
    refreshAfterSeconds: matching ? state.refreshAfterSeconds : null,
    online,
    refresh,
  };
}
