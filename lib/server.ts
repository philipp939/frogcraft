const ip = process.env.NEXT_PUBLIC_SERVER_IP?.trim() ?? "";
/** Platzhalter-IPs werden nicht angezeigt. */
export const SERVER_IP = ip && !ip.includes("example.com") ? ip : null;

export async function serverStatus(): Promise<{ online: boolean; players?: number; max?: number } | null> {
  if (!SERVER_IP) return null;
  try {
    const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_IP)}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    return { online: Boolean(j.online), players: j.players?.online, max: j.players?.max };
  } catch { return null; }
}
