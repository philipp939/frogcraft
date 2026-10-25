import Link from "next/link";
import CopyIp from "@/components/CopyIp";
import Avatar from "@/components/Avatar";
import { SERVER_IP, serverStatus } from "@/lib/server";
import { leaderboard, fmtNum, fmtTime, configured, type Player, type Sort } from "@/lib/db";

export const revalidate = 30;

const BOARDS: { sort: Sort; title: string }[] = [
  { sort: "kills", title: "Kills" },
  { sort: "playtime_minutes", title: "Spielzeit" },
  { sort: "balance", title: "Kontostand" },
];
const value = (s: Sort, p: Player) =>
  s === "playtime_minutes" ? fmtTime(p.playtime_minutes) : s === "balance" ? `${fmtNum(p.balance)} $` : fmtNum(p.kills);

export default async function Home() {
  const [status, ...boards] = await Promise.all([serverStatus(), ...BOARDS.map((b) => leaderboard(b.sort, 1, 5))]);
  return (
    <>
      <section className="hero">
        <h1>FrogCraft</h1>
        <p className="lead">Ranglisten und Spielerprofile des Servers.</p>
        {SERVER_IP && (
          <div className="row">
            <CopyIp ip={SERVER_IP} />
            {status && (
              <span className={`pill ${status.online ? "ok" : ""}`}>
                {status.online ? `Online · ${status.players ?? 0}${status.max ? ` / ${status.max}` : ""} Spieler` : "Offline"}
              </span>
            )}
          </div>
        )}
        <form id="suche" action="/suche" method="get" className="search" role="search">
          <label htmlFor="name" className="sr">Minecraft-Spielername</label>
          <input id="name" name="name" placeholder="Spieler suchen" required minLength={3} maxLength={17} pattern="[A-Za-z0-9_.]{3,17}" autoComplete="off" autoCapitalize="off" spellCheck={false} />
          <button type="submit" className="btn">Suchen</button>
        </form>
      </section>

      {!configured && <p className="notice">Die Datenbank ist nicht verbunden. In Vercel fehlen SUPABASE_URL und SUPABASE_PUBLISHABLE_KEY.</p>}

      <section className="boards">
        {BOARDS.map((b, i) => {
          const data = boards[i];
          return (
            <div className="panel" key={b.sort}>
              <h2>{b.title}</h2>
              {data === null ? <p className="muted">Gerade nicht verfügbar.</p> : data.rows.length === 0 ? <p className="muted">Noch keine Einträge.</p> : (
                <ol className="list">
                  {data.rows.map((p, n) => (
                    <li key={p.uuid}>
                      <Link href={`/spieler/${p.uuid}`}>
                        <span className="rank">{n + 1}</span>
                        <Avatar uuid={p.uuid} size={24} />
                        <span className="nm">{p.username}</span>
                        <span className="v">{value(b.sort, p)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
              <p><Link href={`/rangliste?sort=${b.sort}`} className="more">Alle anzeigen</Link></p>
            </div>
          );
        })}
      </section>
    </>
  );
}
