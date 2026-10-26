import Avatar from "@/components/Avatar";
import { fmtDate, fmtNum, fmtTime, kd, type Player, type Ranks } from "@/lib/db";

export default function PlayerCard({ p, ranks, showDates = true }: { p: Player; ranks: Ranks; showDates?: boolean }) {
  const stats: [string, string][] = [
    ["Spielzeit", fmtTime(p.playtime_minutes)], ["Kills", fmtNum(p.kills)], ["Deaths", fmtNum(p.deaths)],
    ["K/D", kd(p.kills, p.deaths)], ["Kontostand", `${fmtNum(p.balance)} $`], ["Rang", p.rank_group ?? "–"],
  ];
  const rk: [string, number | null][] = [["Kills", ranks.kills], ["Spielzeit", ranks.playtime], ["Kontostand", ranks.balance]];
  return (
    <div className="pcard">
      <div className="profile">
        <Avatar uuid={p.uuid} size={80} />
        <div>
          <h2 className="pname">{p.username}</h2>
          <p className="muted uuid">{p.uuid}</p>
        </div>
      </div>
      <dl className="stats">
        {stats.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <ul className="chips" aria-label="Ranglisten-Positionen">
        {rk.map(([k, v]) => (<li key={k}><span>{k}</span><strong>{v === null ? "–" : `#${fmtNum(v)}`}</strong></li>))}
      </ul>
      {showDates && <p className="muted small">Erster Beitritt: {fmtDate(p.joined_at)} · Letzter Login: {fmtDate(p.last_seen)}</p>}
    </div>
  );
}
