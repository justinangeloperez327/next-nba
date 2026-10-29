import { serveTeams } from "../../../lib/nba/http.ts";
import { createBalldontlieProvider } from "../../../lib/nba/provider.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return serveTeams(createBalldontlieProvider());
}
