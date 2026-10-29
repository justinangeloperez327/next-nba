import { z } from "zod";
import type { NbaGame, NbaTeam } from "./types.ts";

const teamSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(1),
  abbreviation: z.string().min(1),
  city: z.string(),
  conference: z.enum(["East", "West"]),
  division: z.string(),
});

const statusSchema = z.enum([
  "scheduled", "in_progress", "final", "postponed", "canceled",
  "delayed", "suspended", "abandoned", "unknown",
]);

const scoreSchema = z.number().int().nonnegative().nullable().optional();

const gameSchema = z.object({
  id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  datetime: z.string().nullable().optional(),
  season: z.number().int(),
  status: z.string(),
  status_state: statusSchema.optional(),
  period: z.number().int().nonnegative().nullable().optional(),
  time: z.string().nullable().optional(),
  postseason: z.boolean().optional(),
  postponed: z.boolean().optional(),
  home_team_score: scoreSchema,
  visitor_team_score: scoreSchema,
  home_team: teamSchema,
  visitor_team: teamSchema,
});

export const gamesPageSchema = z.object({
  data: z.array(gameSchema),
  meta: z.object({
    next_cursor: z.number().int().nonnegative().nullable().optional(),
  }).optional(),
});

export const teamsPageSchema = z.object({
  data: z.array(teamSchema),
});

export function normalizeTeam(raw: z.infer<typeof teamSchema>): NbaTeam {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    abbreviation: raw.abbreviation,
    city: raw.city,
    conference: raw.conference === "East" ? "Eastern" : "Western",
    division: raw.division,
  };
}

export function normalizeGame(raw: z.infer<typeof gameSchema>): NbaGame {
  return {
    id: raw.id,
    date: raw.date,
    tipoffAt: raw.datetime ?? null,
    season: raw.season,
    status: raw.status_state ?? (raw.postponed ? "postponed" : "unknown"),
    statusText: raw.status,
    period: raw.period ?? null,
    clock: raw.time ?? null,
    postseason: raw.postseason ?? false,
    homeTeam: normalizeTeam(raw.home_team),
    awayTeam: normalizeTeam(raw.visitor_team),
    homeScore: raw.home_team_score ?? null,
    awayScore: raw.visitor_team_score ?? null,
  };
}
