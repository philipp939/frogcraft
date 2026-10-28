import Link from "next/link";
import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import { leaderboard, SORTS, type Sort, fmtNum, fmtTime, kd } from "@/lib/db";

export const metadata: Metadata = { title: "Ranglisten", description: "Kills, Spielzeit und Kontostand der FrogCraft-Spieler." };
export const revalidate = 30;
const SIZE = 25;
const LABEL: Record<Sort, string> = { kills: "Kills", playtime_minutes: "Spielzeit", balance: "Kontostand" };

export default async function Rangliste({ searchParams }: { searchParams: Promise<{ sort?: string; seite?: string }> }) {
  const sp = await searchParams;
  const sort = (SORTS as readonly string[]).includes(sp.sort ?? "") ? (sp.sort as Sort) : "kills";
  const page = Math.min(Math.max(parseInt(sp.seite ?? "1", 10) || 1, 1), 400);
  const data = await leaderboard(sort, page, SIZE);
  const href = (s: Sort, p = 1) => `/rangliste?sort=${s}&seite=${p}`;
  const val = (p: NonNullable<typeof data>["rows"][number]) =>
    sort === "playtime_minutes" ? fmtTime(p.playtime_minutes) : sort === "balance" ? `${fmtNum(p.balance)} $` : fmtNum(p[sort]);
  return (
    <>
      <h1>Ranglisten</h1>
      <nav className="tabs" aria-label="Sortierung">
        {SORTS.map((s) => (<Link key={s} href={href(s)} aria-current={s === sort ? "page" : undefined}>{LABEL[s]}</Link>))}
      </nav>
      {data === null ? <p className="notice">Daten gerade nicht verfügbar.</p> : data.rows.length === 0 ? <p className="panel muted">Keine Einträge vorhanden.</p> : (
        <div className="panel tablewrap">
          <table>
            <thead><tr><th>#</th><th>Spieler</th><th className="r">{LABEL[sort]}</th><th className="r hide">K/D</th></tr></thead>
            <tbody>
              {data.rows.map((p, i) => (
                <tr key={p.uuid}>
                  <td>{(page - 1) * SIZE + i + 1}</td>
                  <td><Link href={`/?spieler=${p.uuid}`} className="pl"><Avatar uuid={p.uuid} size={32} />{p.username}</Link></td>
                  <td className="r">{val(p)}</td>
                  <td className="r hide">{kd(p.kills, p.deaths)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pager">
        {page > 1 && <Link className="btn ghost" href={href(sort, page - 1)}>← Zurück</Link>}
        {data?.hasNext && <Link className="btn ghost" href={href(sort, page + 1)}>Weiter →</Link>}
      </div>
    </>
  );
}
