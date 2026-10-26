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

export async function setPvp(f: FormData) {
  const token = await getToken();
  if (!token) redirect("/?konto=login");
  const home = str(f, "from") === "home";
  const to = (qs: string) => (home ? `/?${qs}` : `/?konto=1&${qs}`);
  const r = await rpc<{ wait_seconds?: number }>("account_set_pvp", { p_token: token, p_enabled: str(f, "enabled") === "1" });
  if (!r) redirect(to("info=technisch"));
  if (!r.ok) redirect(to(`info=${encodeURIComponent(r.error ?? "technisch")}&wait=${r.wait_seconds ?? 0}`));
  redirect(to("info=gespeichert"));
}

export async function newCode() {
  const token = await getToken();
  if (!token) redirect("/?konto=login");
  await rpc("account_new_code", { p_token: token });
  redirect("/?konto=1");
}

export async function saveProfile(f: FormData) {
  const token = await getToken();
  if (!token) redirect("/?konto=login");
  const r = await rpc("account_update_profile", {
    p_token: token,
    p_hidden: f.get("hidden") === "on",
    p_bio: str(f, "bio").slice(0, 400),
    p_playstyle: str(f, "playstyle"),
    p_discord: str(f, "discord").slice(0, 80),
  });
  if (!r) redirect("/?konto=1&info=technisch");
  if (!r.ok) redirect(`/?konto=1&info=${encodeURIComponent(r.error ?? "technisch")}`);
  redirect("/?konto=1&info=gespeichert");
}
