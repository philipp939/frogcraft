import { rpc } from "@/lib/db";
import { setCooldown } from "@/app/admin/actions";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ERR: Record<string, string> = {
  invalid_password: "Falsches Passwort.",
  locked: "Zu viele Fehlversuche. Bitte warte 15 Minuten.",
  invalid_minutes: "Bitte gib eine Zahl von 0 bis 1440 ein.",
  technisch: "Gerade technisch nicht möglich. Bitte versuche es gleich noch einmal.",
};

export default async function Admin({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const cur = await rpc<{ minutes: number }>("get_pvp_cooldown", {});
  return (
    <section className="panel narrow">
      <h1>Admin</h1>
      <p className="muted">Aktuelle Wartezeit für PvP-Umstellungen: <strong>{cur?.ok ? `${cur.minutes} Min.` : "nicht verfügbar"}</strong></p>
      {sp.ok && <p className="notice ok" role="status">Gespeichert.</p>}
      {sp.e && <p className="notice" role="alert">{ERR[sp.e] ?? ERR.technisch}</p>}
      <form action={setCooldown} className="form">
        <label className="field">Passwort
          <input name="password" type="password" required autoComplete="off" />
        </label>
        <label className="field">Neue Wartezeit in Minuten (0 = keine Wartezeit)
          <input name="minutes" type="number" min={0} max={1440} step={1} required defaultValue={cur?.ok ? cur.minutes : 10} />
        </label>
        <button type="submit" className="btn">Speichern</button>
      </form>
    </section>
  );
}
