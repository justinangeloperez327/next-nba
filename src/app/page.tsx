import Link from "next/link";
import { TodaysGames } from "../components/games/todays-games";
import { getNbaScheduleDate } from "../lib/nba/date";

export const dynamic = "force-dynamic";

export default function Home() {
  const nbaDate = getNbaScheduleDate();
  return (
    <>
      <section className="court-intro" aria-labelledby="home-title">
        <div className="court-intro-inner">
          <div className="court-copy">
            <p className="court-eyebrow">NBA · Schedule & scores</p>
            <h1 id="home-title">Stay close<br />to the <span>game.</span></h1>
            <p className="court-description">Today’s matchups, the latest scores, and your next game. All in one place.</p>
            <Link href={`/games?date=${nbaDate}`} className="court-button">
              View today&apos;s games <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="court-art" aria-hidden="true">
            <div className="court-key" />
            <div className="court-circle" />
            <div className="court-hoop" />
            <span className="court-art-label">NEXT NBA / GAME CENTER</span>
          </div>
        </div>
      </section>

      <TodaysGames date={nbaDate} />

      <section className="court-explore" aria-labelledby="explore-title">
        <div className="court-explore-heading">
          <p className="court-eyebrow">Around the league</p>
          <h2 id="explore-title">Follow your side.</h2>
          <p>Find a franchise or plan the next game night.</p>
        </div>
        <div className="court-explore-links">
          <Link href="/teams" className="court-destination">
            <div><span className="court-eyebrow">Team directory</span><h3>All 30. Your one.</h3><p>Browse teams and their schedules.</p></div>
            <span className="court-link-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link href="/games" className="court-destination">
            <div><span className="court-eyebrow">Full schedule</span><h3>Pick your game night.</h3><p>Find matchups and results by date.</p></div>
            <span className="court-link-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
