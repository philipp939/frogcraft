import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import { getPlayer, rankOf, fmtTime, fmtNum, fmtDate, kd } from "@/lib/db";

export const revalidate = 30;
type Props = { params: Promise<{ uuid: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPlayer((await params).uuid);
  return p ? { title: `${p.username} – Statistiken`, description: `Statistiken von ${p.username} auf FrogCraft.` } : { title: "Spieler" };
}

export default async function Profil({ params }: Props) {
  const { uuid } = await params;
  const p = await getPlayer(uuid);
  if (p === null) notFound();
  if (p === undefined) return <section className="panel narrow"><h1>Gerade nicht erreichbar</h1><p className="muted">Die Datenbank antwortet nicht. Bitte später erneut versuchen.</p></section>;

  const [rk, rt, rm] = await Promise.all([rankOf("kills", p.kills), rankOf("playtime_minutes", p.playtime_minutes), rankOf("balance", p.balance)]);
  const stats: [string, string][] = [
    ["Spielzeit", fmtTime(p.playtime_minutes)], ["Kills", fmtNum(p.kills)], ["Deaths", fmtNum(p.deaths)], ["K/D", kd(p.kills, p.deaths)],
    ["Kontostand", `${fmtNum(p.balance)} $`], ["Rang", p.rank_group ?? "–"],
    ["Erster Beitritt", fmtDate(p.joined_at)], ["Letzter Login", fmtDate(p.last_seen)],
  ];
  const ranks: [string, number | null][] = [["Kills", rk], ["Spielzeit", rt], ["Kontostand", rm]];
  return (
    <>
      <section className="profile">
        <Avatar uuid={p.uuid} size={72} />
        <div><h1>{p.username}</h1><p className="muted uuid">{p.uuid}</p></div>
      </section>
      <section className="grid stats">
        {stats.map(([k, v]) => (<div className="panel" key={k}><h2>{k}</h2><p className="val">{v}</p></div>))}
      </section>
      <section className="panel">
        <h2>Ranglisten-Positionen</h2>
        <ul className="ranks">{ranks.map(([k, v]) => (<li key={k}><span>{k}</span><strong>{v === null ? "–" : `#${fmtNum(v)}`}</strong></li>))}</ul>
        <p className="muted small">K/D wird als Kills geteilt durch max(Deaths, 1) berechnet.</p>
      </section>
      <p><Link href="/rangliste" className="more">← Zu den Ranglisten</Link></p>
    </>
  );
}
