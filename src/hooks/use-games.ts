"use client";

import { useCallback, useEffect, useState } from "react";
import type { GamesPayload, NbaGame } from "../lib/nba/types";

type GamesState = {
  date: string;
  status: "loading" | "success" | "error";
  games: NbaGame[];
  fetchedAt: string | null;
  error: string | null;
};

type ApiFailure = {
  error?: {
    code?: string;
    message?: string;
  };
};

const initialState = (date: string): GamesState => ({
  date,
  status: "loading",
  games: [],
  fetchedAt: null,
  error: null,
});

function errorMessage(status: number, body: unknown): string {
  const detail = body && typeof body === "object" ? (body as ApiFailure).error : undefined;
  switch (detail?.code) {
    case "NOT_CONFIGURED":
      return "NBA data is not configured yet. Add BALLDONTLIE_API_KEY to the server environment.";
    case "RATE_LIMIT":
      return "The NBA data provider is temporarily rate-limited. Please try again later.";
    case "TIMEOUT":
    case "NETWORK":
    case "UPSTREAM":
      return "The NBA data service is temporarily unavailable. Please try again.";
    case "AUTH":
      return "NBA data authorization failed. Check the server-side API key.";
    default:
      return status >= 500
        ? "Unable to retrieve NBA scores at the moment."
        : "Unable to load games for this date.";
  }
}

export function useGames(date: string) {
  const [state, setState] = useState<GamesState>(() => initialState(date));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/games?date=${encodeURIComponent(date)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          throw new Error(errorMessage(response.status, body));
        }

        const data = body as Partial<GamesPayload> | null;
        if (
          !data ||
          data.date !== date ||
          !Array.isArray(data.games) ||
          typeof data.fetchedAt !== "string"
        ) {
          throw new Error("The game feed returned an unexpected response.");
        }

        if (!controller.signal.aborted) {
          setState({
            date,
            status: "success",
            games: data.games,
            fetchedAt: data.fetchedAt,
            error: null,
          });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          date,
          status: "error",
          games: [],
          fetchedAt: null,
          error: error instanceof Error ? error.message : "Unable to load NBA games.",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [date, version]);

  const refresh = useCallback(() => {
    setState(initialState(date));
    setVersion((previous) => previous + 1);
  }, [date]);

  const matchingDate = state.date === date;
  return {
    games: matchingDate ? state.games : [],
    fetchedAt: matchingDate ? state.fetchedAt : null,
    error: matchingDate ? state.error : null,
    loading: !matchingDate || state.status === "loading",
    refresh,
  };
}
