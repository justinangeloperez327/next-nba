import { serveTeams } from "../../../lib/nba/http.ts";
import { nbaFeed, nbaProvider, nbaSource } from "../../../lib/nba/server.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return serveTeams(nbaProvider, nbaFeed, nbaSource);
}
