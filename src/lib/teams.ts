export type Conference = "Eastern" | "Western";

export type Team = {
  name: string;
  conference: Conference;
};

export const teams: readonly Team[] = [
  { name: "Atlanta Hawks", conference: "Eastern" },
  { name: "Boston Celtics", conference: "Eastern" },
  { name: "Brooklyn Nets", conference: "Eastern" },
  { name: "Charlotte Hornets", conference: "Eastern" },
  { name: "Chicago Bulls", conference: "Eastern" },
  { name: "Cleveland Cavaliers", conference: "Eastern" },
  { name: "Detroit Pistons", conference: "Eastern" },
  { name: "Indiana Pacers", conference: "Eastern" },
  { name: "Miami Heat", conference: "Eastern" },
  { name: "Milwaukee Bucks", conference: "Eastern" },
  { name: "New York Knicks", conference: "Eastern" },
  { name: "Orlando Magic", conference: "Eastern" },
  { name: "Philadelphia 76ers", conference: "Eastern" },
  { name: "Toronto Raptors", conference: "Eastern" },
  { name: "Washington Wizards", conference: "Eastern" },
  { name: "Dallas Mavericks", conference: "Western" },
  { name: "Denver Nuggets", conference: "Western" },
  { name: "Golden State Warriors", conference: "Western" },
  { name: "Houston Rockets", conference: "Western" },
  { name: "Los Angeles Clippers", conference: "Western" },
  { name: "Los Angeles Lakers", conference: "Western" },
  { name: "Memphis Grizzlies", conference: "Western" },
  { name: "Minnesota Timberwolves", conference: "Western" },
  { name: "New Orleans Pelicans", conference: "Western" },
  { name: "Oklahoma City Thunder", conference: "Western" },
  { name: "Phoenix Suns", conference: "Western" },
  { name: "Portland Trail Blazers", conference: "Western" },
  { name: "Sacramento Kings", conference: "Western" },
  { name: "San Antonio Spurs", conference: "Western" },
  { name: "Utah Jazz", conference: "Western" },
];
