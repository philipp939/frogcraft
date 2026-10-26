import { cookies } from "next/headers";
import { rpc, type Player } from "@/lib/db";

export const COOKIE = "fc_session";
const TOKEN_RE = /^[0-9a-f]{64}$/;

export type Session = {
  token: string; uuid: string; username: string; verified: boolean;
  verify_code: string | null; verify_expires: string | null; pvp_enabled: boolean; cooldown_seconds: number;
};

export async function getToken(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  return t && TOKEN_RE.test(t) ? t : null;
}

export async function getSession(): Promise<Session | null> {
  const token = await getToken();
  if (!token) return null;
  const r = await rpc<Omit<Session, "token">>("auth_me", { p_token: token });
  return r && r.ok ? { ...r, token } : null;
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

/** Eigenes, vollständiges Profil (auch wenn es für andere versteckt ist). */
export async function getMyProfile(token: string): Promise<Player | null> {
  const r = await rpc<Player>("account_get", { p_token: token });
  return r && r.ok ? (r as unknown as Player) : null;
}

export type HistoryItem = { enabled: boolean; at: string };
export async function getPvpHistory(token: string): Promise<HistoryItem[]> {
  const r = await rpc<{ items: HistoryItem[] }>("account_pvp_history", { p_token: token });
  return r && r.ok ? r.items : [];
}
