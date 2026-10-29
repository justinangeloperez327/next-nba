export type Conference = "Eastern" | "Western";

export type Team = {
  name: string;
  abbreviation: string;
  conference: Conference;
};

export const teams: readonly Team[] = [
  { name: "Atlanta Hawks", abbreviation: "ATL", conference: "Eastern" },
  { name: "Boston Celtics", abbreviation: "BOS", conference: "Eastern" },
  { name: "Brooklyn Nets", abbreviation: "BKN", conference: "Eastern" },
  { name: "Charlotte Hornets", abbreviation: "CHA", conference: "Eastern" },
  { name: "Chicago Bulls", abbreviation: "CHI", conference: "Eastern" },
  { name: "Cleveland Cavaliers", abbreviation: "CLE", conference: "Eastern" },
  { name: "Detroit Pistons", abbreviation: "DET", conference: "Eastern" },
  { name: "Indiana Pacers", abbreviation: "IND", conference: "Eastern" },
  { name: "Miami Heat", abbreviation: "MIA", conference: "Eastern" },
  { name: "Milwaukee Bucks", abbreviation: "MIL", conference: "Eastern" },
  { name: "New York Knicks", abbreviation: "NYK", conference: "Eastern" },
  { name: "Orlando Magic", abbreviation: "ORL", conference: "Eastern" },
  { name: "Philadelphia 76ers", abbreviation: "PHI", conference: "Eastern" },
  { name: "Toronto Raptors", abbreviation: "TOR", conference: "Eastern" },
  { name: "Washington Wizards", abbreviation: "WAS", conference: "Eastern" },
  { name: "Dallas Mavericks", abbreviation: "DAL", conference: "Western" },
  { name: "Denver Nuggets", abbreviation: "DEN", conference: "Western" },
  { name: "Golden State Warriors", abbreviation: "GSW", conference: "Western" },
  { name: "Houston Rockets", abbreviation: "HOU", conference: "Western" },
  { name: "Los Angeles Clippers", abbreviation: "LAC", conference: "Western" },
  { name: "Los Angeles Lakers", abbreviation: "LAL", conference: "Western" },
  { name: "Memphis Grizzlies", abbreviation: "MEM", conference: "Western" },
  { name: "Minnesota Timberwolves", abbreviation: "MIN", conference: "Western" },
  { name: "New Orleans Pelicans", abbreviation: "NOP", conference: "Western" },
  { name: "Oklahoma City Thunder", abbreviation: "OKC", conference: "Western" },
  { name: "Phoenix Suns", abbreviation: "PHX", conference: "Western" },
  { name: "Portland Trail Blazers", abbreviation: "POR", conference: "Western" },
  { name: "Sacramento Kings", abbreviation: "SAC", conference: "Western" },
  { name: "San Antonio Spurs", abbreviation: "SAS", conference: "Western" },
  { name: "Utah Jazz", abbreviation: "UTA", conference: "Western" },
];

export function findTeam(abbreviation: string): Team | undefined {
  return teams.find((team) => team.abbreviation === abbreviation.toUpperCase());
}

export function filterTeams(
  query: string,
  conference: Conference | "All" = "All",
): Team[] {
  const needle = query.trim().toLocaleLowerCase("en-US");
  return teams.filter((team) =>
    (conference === "All" || team.conference === conference) &&
    (!needle || team.name.toLocaleLowerCase("en-US").includes(needle) ||
      team.abbreviation.toLocaleLowerCase("en-US").includes(needle)),
  );
}
