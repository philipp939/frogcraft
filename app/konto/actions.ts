"use server";
import { redirect } from "next/navigation";
import { NAME_RE, rpc } from "@/lib/db";
import { clearSessionCookie, getToken, setSessionCookie } from "@/lib/auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function register(f: FormData) {
  const name = str(f, "name").trim();
  const pw = str(f, "password");
  const to = (e: string) => `/?konto=registrieren&fehler=${encodeURIComponent(e)}`;
  if (!NAME_RE.test(name)) redirect(to("name"));
  if (pw.length < 8 || pw.length > 72) redirect(to("passwort"));
  if (pw !== str(f, "password2")) redirect(to("gleich"));
  const r = await rpc<{ token: string }>("auth_register", { p_username: name, p_password: pw });
  if (!r) redirect(to("technisch"));
  if (!r.ok) redirect(to(r.error ?? "technisch"));
  await setSessionCookie(r.token);
  redirect("/?konto=1");
}

export async function login(f: FormData) {
  const name = str(f, "name").trim();
  const pw = str(f, "password");
  const to = (e: string) => `/?konto=login&fehler=${encodeURIComponent(e)}`;
  if (!NAME_RE.test(name) || !pw) redirect(to("invalid"));
  const r = await rpc<{ token: string }>("auth_login", { p_username: name, p_password: pw });
  if (!r) redirect(to("technisch"));
  if (!r.ok) redirect(to(r.error ?? "technisch"));
  await setSessionCookie(r.token);
  redirect("/");
}

export async function logout() {
  const token = await getToken();
  if (token) await rpc("auth_logout", { p_token: token });
  await clearSessionCookie();
  redirect("/");
}


export async function newCode() {
  const token = await getToken();
  if (!token) redirect("/?konto=login");
  await rpc("account_new_code", { p_token: token });
  redirect("/?konto=1");
}



export async function togglePvp(enabled: boolean): Promise<{ ok: boolean; message?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, message: "Bitte melde dich erneut an." };
  const r = await rpc<{ wait_seconds?: number }>("account_set_pvp", { p_token: token, p_enabled: enabled });
  if (!r) return { ok: false, message: "Gerade technisch nicht möglich. Bitte versuche es gleich noch einmal." };
  if (!r.ok) {
    if (r.error === "cooldown") return { ok: false, message: `Du kannst PvP erst in etwa ${Math.max(1, Math.ceil((r.wait_seconds ?? 60) / 60))} Min. wieder umstellen.` };
    return { ok: false, message: "Das ist gerade nicht möglich. Ist dein Konto verifiziert?" };
  }
  return { ok: true, message: "Gilt ab deinem nächsten Beitritt zum Server." };
}

export async function toggleHidden(enabled: boolean): Promise<{ ok: boolean; message?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, message: "Bitte melde dich erneut an." };
  const r = await rpc("account_set_hidden", { p_token: token, p_hidden: enabled });
  if (!r || !r.ok) return { ok: false, message: "Das hat nicht geklappt. Bitte versuche es gleich noch einmal." };
  return { ok: true, message: "Gespeichert." };
}

