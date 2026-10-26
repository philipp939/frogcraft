import Avatar from "@/components/Avatar";
import { PLAYSTYLES, fmtDate, fmtNum, fmtTime, kd, type Player, type Ranks } from "@/lib/db";

export default function PlayerCard({ p, ranks, showDates = true, own = false }: { p: Player; ranks: Ranks; showDates?: boolean; own?: boolean }) {
  const head = (
    <div className="profile">
      <Avatar uuid={p.uuid} size={80} />
      <div>
        <h2 className="pname">{p.username}</h2>
        <p className="muted uuid">{p.uuid}</p>
      </div>
    </div>
  );
  if (p.hidden && !own) {
    return (<div className="pcard">{head}<p className="notice">Dieses Profil ist privat.</p></div>);
  }
  const stats: [string, string][] = [
    ["Spielzeit", fmtTime(p.playtime_minutes)], ["Kills", fmtNum(p.kills)], ["Deaths", fmtNum(p.deaths)],
    ["K/D", kd(p.kills, p.deaths)], ["Kontostand", `${fmtNum(p.balance)} $`], ["Rang", p.rank_group ?? "–"],
  ];
  const rk: [string, number | null][] = [["Kills", ranks.kills], ["Spielzeit", ranks.playtime], ["Kontostand", ranks.balance]];
  const style = PLAYSTYLES.find(([v]) => v === p.playstyle)?.[1];
  return (
    <div className="pcard">
      {head}
      {own && p.hidden && <p className="notice small">Dein Profil ist versteckt. Andere sehen nur deinen Namen, und du erscheinst nicht in den Ranglisten.</p>}
      {(style || p.discord) && (
        <p className="tags">
          {style && <span className="badge">{style}</span>}
          {p.discord && <span className="badge dc">Discord: {p.discord}</span>}
        </p>
      )}
      {p.bio && <p className="bio">{p.bio}</p>}
      <dl className="stats">
        {stats.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      {!p.hidden && (
        <ul className="chips" aria-label="Ranglisten-Positionen">
          {rk.map(([k, v]) => (<li key={k}><span>{k}</span><strong>{v === null ? "–" : `#${fmtNum(v)}`}</strong></li>))}
        </ul>
      )}
      {showDates && <p className="muted small">Erster Beitritt: {fmtDate(p.joined_at)} · Letzter Login: {fmtDate(p.last_seen)}</p>}
    </div>
  );
}
