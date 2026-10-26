// FROGCRAFT_* hat Vorrang (eigene Variablen), sonst die von der Vercel-Supabase-Integration gesetzten.
const URL_ = process.env.FROGCRAFT_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.FROGCRAFT_SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

export type Player = {
  uuid: string; username: string; joined_at: string | null; last_seen: string | null;
  playtime_minutes: number; deaths: number; kills: number; balance: number; rank_group: string | null; hidden: boolean;
};

export const COLS = "uuid,username,hidden,joined_at,last_seen,playtime_minutes,deaths,kills,balance,rank_group";
export const NAME_RE = /^[A-Za-z0-9_.]{3,17}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SORTS = ["kills", "playtime_minutes", "balance"] as const;
export type Sort = (typeof SORTS)[number];

const headers = (extra: Record<string, string> = {}) => ({ apikey: KEY as string, ...extra });
export const configured = Boolean(URL_ && KEY);

/** null = Datenbank nicht erreichbar oder nicht konfiguriert. */
async function query(qs: string): Promise<Player[] | null> {
  if (!configured) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/player_public?${qs}`, { headers: headers(), next: { revalidate: 30 } });
    if (!r.ok) {
      console.error(`[db] Supabase antwortete ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return null;
    }
    const rows = (await r.json()) as Player[];
    return rows.map((p) => ({ ...p, balance: Number(p.balance) }));
  } catch (e) {
    console.error("[db] Anfrage fehlgeschlagen:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function findByName(name: string): Promise<Player | null | undefined> {
  if (!NAME_RE.test(name)) return undefined;
  const rows = await query(`select=${COLS}&username=ilike.${encodeURIComponent(name)}&limit=10`);
  if (rows === null) return undefined;
  const lower = name.toLowerCase();
  const hits = rows.filter((p) => p.username.toLowerCase() === lower);
  return hits.find((p) => p.username === name) ?? hits[0] ?? null;
}

export async function getPlayer(uuid: string): Promise<Player | null | undefined> {
  if (!UUID_RE.test(uuid)) return null;
  const rows = await query(`select=${COLS}&uuid=eq.${uuid}&limit=1`);
  if (rows === null) return undefined;
  return rows[0] ?? null;
}

export async function leaderboard(sort: Sort, page: number, size: number) {
  const rows = await query(`select=${COLS}&hidden=eq.false&order=${sort}.desc,username.asc&limit=${size + 1}&offset=${(page - 1) * size}`);
  if (rows === null) return null;
  return { rows: rows.slice(0, size), hasNext: rows.length > size };
}

async function count(filter: string): Promise<number | null> {
  if (!configured) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/player_public?select=uuid&hidden=eq.false${filter}`, {
      headers: headers({ Prefer: "count=exact", Range: "0-0" }), next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    const total = r.headers.get("content-range")?.split("/")[1];
    return total && total !== "*" ? Number(total) : null;
  } catch { return null; }
}

export const totalPlayers = () => count("");
export async function rankOf(col: Sort, value: number) {
  const higher = await count(`&${col}=gt.${value}`);
  return higher === null ? null : higher + 1;
}

export const fmtTime = (min: number) => {
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  return [d ? `${d} Tg.` : "", h ? `${h} Std.` : "", `${m} Min.`].filter(Boolean).join(" ");
};
export const fmtNum = (n: number) => new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short" }) : "–";
export const kd = (k: number, d: number) => fmtNum(k / Math.max(d, 1));

/** Ruft eine Datenbankfunktion auf (Konten/Sitzungen). null = technischer Fehler. */
export async function rpc<T extends object = object>(fn: string, args: Record<string, unknown>): Promise<(T & { ok: boolean; error?: string }) | null> {
  if (!configured) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[db] rpc ${fn} antwortete ${r.status}`);
      return null;
    }
    return (await r.json()) as T & { ok: boolean; error?: string };
  } catch (e) {
    console.error(`[db] rpc ${fn} fehlgeschlagen:`, e instanceof Error ? e.message : e);
    return null;
  }
}

export type Ranks = { kills: number | null; playtime: number | null; balance: number | null };
export async function playerRanks(p: Player): Promise<Ranks> {
  const [kills, playtime, balance] = await Promise.all([
    rankOf("kills", p.kills), rankOf("playtime_minutes", p.playtime_minutes), rankOf("balance", p.balance),
  ]);
  return { kills, playtime, balance };
}

/** LuckPerms-Gruppe -> Anzeige: "default" (oder leer) = Spieler, sonst der Gruppenname mit großem Anfangsbuchstaben. */
export const rankLabel = (g: string | null | undefined) =>
  !g || g.trim().toLowerCase() === "default" ? "Spieler" : g.trim().charAt(0).toUpperCase() + g.trim().slice(1);
