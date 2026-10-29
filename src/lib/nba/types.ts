export type NbaDataSource = "balldontlie" | "api-nba";

export type NbaGameStatus =
  | "scheduled" | "in_progress" | "final" | "postponed"
  | "canceled" | "delayed" | "suspended" | "abandoned" | "unknown";

export type NbaTeam = {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  city: string;
  conference: "Eastern" | "Western";
  division: string;
};

export type NbaGame = {
  id: number;
  date: string;
  tipoffAt: string | null;
  season: number;
  status: NbaGameStatus;
  statusText: string;
  period: number | null;
  clock: string | null;
  postseason: boolean;
  homeTeam: NbaTeam;
  awayTeam: NbaTeam;
  homeScore: number | null;
  awayScore: number | null;
};

export type NbaProvider = {
  listGamesByDate(date: string): Promise<NbaGame[]>;
  listTeams(): Promise<NbaTeam[]>;
  minimumGameCacheSeconds?: number;
};

export type GamesPayload = {
  date: string;
  games: NbaGame[];
  source: NbaDataSource;
  fetchedAt: string;
  stale?: boolean;
  refreshAfterSeconds?: number;
};

export type TeamsPayload = {
  teams: NbaTeam[];
  source: NbaDataSource;
  fetchedAt: string;
};
