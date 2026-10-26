import Link from "next/link";
import CopyIp from "@/components/CopyIp";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import PlayerCard from "@/components/PlayerCard";
import AccountPanel from "@/components/AccountPanel";
import { SERVER_IP, serverStatus } from "@/lib/server";
import { getSession } from "@/lib/auth";
import { setPvp } from "@/app/konto/actions";
import { leaderboard, getPlayer, playerRanks, fmtNum, fmtTime, configured, UUID_RE, type Player, type Sort } from "@/lib/db";

export const dynamic = "force-dynamic";

const BOARDS: { sort: Sort; title: string }[] = [
  { sort: "kills", title: "Kills" },
  { sort: "playtime_minutes", title: "Spielzeit" },
  { sort: "balance", title: "Kontostand" },
];
const value = (s: Sort, p: Player) =>
  s === "playtime_minutes" ? fmtTime(p.playtime_minutes) : s === "balance" ? `${fmtNum(p.balance)} $` : fmtNum(p.kills);

type SP = { spieler?: string; konto?: string; fehler?: string; info?: string; wait?: string; name?: string };

function MsgModal({ title, text }: { title: string; text: string }) {
  return (
    <Modal label={title}>
      <h2 className="pname">{title}</h2>
      <p className="muted">{text}</p>
    </Modal>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await getSession();
  const [status, me, ...boards] = await Promise.all([
    serverStatus(),
    session ? getPlayer(session.uuid) : Promise.resolve(null),
    ...BOARDS.map((b) => leaderboard(b.sort, 1, 5)),
  ]);
  const myRanks = me ? await playerRanks(me) : null;

  // Fenster (Konto oder Spielerprofil) über die URL gesteuert
  let modal: React.ReactNode = null;
  if (sp.konto) {
    modal = (
      <Modal label="Konto">
        <AccountPanel session={session} mode={sp.konto} fehler={sp.fehler} info={sp.info} wait={sp.wait} />
      </Modal>
    );
  } else if (sp.spieler) {
    if (UUID_RE.test(sp.spieler)) {
      const p = await getPlayer(sp.spieler);
      if (p === undefined) modal = <MsgModal title="Gerade nicht erreichbar" text="Die Datenbank antwortet nicht. Bitte versuche es gleich noch einmal." />;
      else if (p === null) modal = <MsgModal title="Spieler nicht gefunden" text="Zu dieser UUID gibt es keine Daten." />;
      else modal = (<Modal label={`Spieler ${p.username}`}><PlayerCard p={p} ranks={await playerRanks(p)} /></Modal>);
    } else if (sp.spieler === "nicht-gefunden") {
      modal = <MsgModal title="Spieler nicht gefunden" text={`Für „${(sp.name ?? "").slice(0, 17)}“ gibt es keine Daten. Der Spieler muss mindestens einmal auf dem Server gewesen sein.`} />;
    } else if (sp.spieler === "ungueltig") {
      modal = <MsgModal title="Ungültiger Name" text="Erlaubt sind 3–17 Zeichen: Buchstaben, Zahlen, Unterstrich und Punkt." />;
    } else {
      modal = <MsgModal title="Gerade nicht erreichbar" text="Die Datenbank antwortet nicht. Bitte versuche es gleich noch einmal." />;
    }
  }

  const mins = session ? Math.max(1, Math.ceil(Number(sp.wait ?? session.cooldown_seconds) / 60)) : 0;
  return (
    <>
      {SERVER_IP && (
        <div className="row topip">
          <CopyIp ip={SERVER_IP} />
          {status && (
            <span className={`pill ${status.online ? "ok" : ""}`}>
              {status.online ? `Online · ${status.players ?? 0}${status.max ? ` / ${status.max}` : ""} Spieler` : "Offline"}
            </span>
          )}
        </div>
      )}

      {session ? (
        <section className="panel me" aria-label="Meine Infos">
          {me && myRanks ? <PlayerCard p={me} ranks={myRanks} showDates={false} /> : <p className="muted">Deine Daten sind gerade nicht verfügbar.</p>}
          <div className="mepvp">
            {sp.info === "gespeichert" && <p className="notice ok" role="status">Gespeichert.</p>}
            {sp.info === "cooldown" && <p className="notice" role="alert">Du kannst PvP erst in etwa {mins} Min. wieder umstellen.</p>}
            {sp.info === "technisch" && <p className="notice" role="alert">Gerade technisch nicht möglich.</p>}
            {session.verified ? (
              <form action={setPvp} className="pvprow">
                <input type="hidden" name="from" value="home" />
                <input type="hidden" name="enabled" value={session.pvp_enabled ? "0" : "1"} />
                <span>PvP: <strong className={session.pvp_enabled ? "on" : "off"}>{session.pvp_enabled ? "AN" : "AUS"}</strong></span>
                <button type="submit" className="btn">{session.pvp_enabled ? "Ausschalten" : "Einschalten"}</button>
                <Link href="/?konto=1" scroll={false} className="btn ghost">Konto</Link>
              </form>
            ) : (
              <div className="pvprow">
                <span className="off">Konto nicht verifiziert</span>
                <Link href="/?konto=1" scroll={false} className="btn">Jetzt verifizieren</Link>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="hero">
          <h1>FrogCraft</h1>
          <p className="lead">Ranglisten und Spielerprofile des Servers. Mit einem Konto kannst du dein PvP selbst steuern.</p>
          <div className="row">
            <Link href="/?konto=login" scroll={false} className="btn">Anmelden</Link>
            <Link href="/?konto=registrieren" scroll={false} className="btn ghost">Registrieren</Link>
          </div>
        </section>
      )}

      {!configured && <p className="notice">Die Datenbank ist nicht verbunden.</p>}

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
                      <Link href={`/?spieler=${p.uuid}`} scroll={false}>
                        <span className="rank">{n + 1}</span>
                        <Avatar uuid={p.uuid} size={32} />
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
      {modal}
    </>
  );
}
