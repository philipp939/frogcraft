import Link from "next/link";
import CopyIp from "@/components/CopyIp";
import Avatar from "@/components/Avatar";
import { SERVER_IP, serverStatus } from "@/lib/server";
import { leaderboard, totalPlayers, fmtNum, configured } from "@/lib/db";

export const revalidate = 30;

export default async function Home() {
  const [status, total, top] = await Promise.all([serverStatus(), totalPlayers(), leaderboard("kills", 1, 3)]);
  return (
    <>
      <section className="hero">
        <h1>Willkommen bei FrogCraft</h1>
        <p className="lead">Schau dir Statistiken, Profile und Ranglisten aller Spieler an.</p>
        {SERVER_IP ? (
          <div className="row">
            <CopyIp ip={SERVER_IP} />
            {status && (
              <span className={`pill ${status.online ? "ok" : "off"}`}>
                {status.online ? `Online · ${status.players ?? 0}${status.max ? ` / ${status.max}` : ""} Spieler` : "Offline"}
              </span>
            )}
          </div>
        ) : (
          <p className="muted">Die Server-Adresse ist noch nicht hinterlegt.</p>
        )}
        <form id="suche" action="/suche" method="get" className="search" role="search">
          <label htmlFor="name" className="sr">Minecraft-Spielername</label>
          <input id="name" name="name" placeholder="Spielername eingeben" required minLength={3} maxLength={17} pattern="[A-Za-z0-9_.]{3,17}" autoComplete="off" autoCapitalize="off" spellCheck={false} />
          <button type="submit" className="btn">Suchen</button>
        </form>
      </section>
      {!configured && <p className="card err">Datenbank nicht konfiguriert. Bitte SUPABASE_URL und SUPABASE_PUBLISHABLE_KEY setzen.</p>}
      <section className="grid">
        <div className="card"><h2>Erfasste Spieler</h2><p className="big">{total === null ? "–" : fmtNum(total)}</p></div>
        <div className="card">
          <h2>Top-Kills</h2>
          {top === null ? <p className="muted">Daten gerade nicht verfügbar.</p> : top.rows.length === 0 ? <p className="muted">Noch keine Spieler erfasst.</p> : (
            <ol className="list">
              {top.rows.map((p) => (
                <li key={p.uuid}><Link href={`/spieler/${p.uuid}`}><Avatar uuid={p.uuid} size={24} />{p.username}</Link><span>{fmtNum(p.kills)}</span></li>
              ))}
            </ol>
          )}
          <p><Link href="/rangliste" className="more">Alle Ranglisten →</Link></p>
        </div>
      </section>
    </>
  );
}
