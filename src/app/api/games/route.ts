import { serveGames } from "../../../lib/nba/http.ts";
import { nbaFeed, nbaProvider } from "../../../lib/nba/server.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return serveGames(request, nbaProvider, new Date(), nbaFeed);
}
