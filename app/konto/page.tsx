import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout, newCode, setPvp } from "@/app/konto/actions";

export const metadata = { title: "Mein Konto", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Konto({ searchParams }: { searchParams: Promise<{ info?: string; wait?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const { info, wait } = await searchParams;
  const mins = Math.max(1, Math.ceil(Number(wait ?? s.cooldown_seconds) / 60));
  return (
    <>
      <h1>Mein Konto</h1>
      <p className="lead">Angemeldet als <strong>{s.username}</strong></p>

      {info === "gespeichert" && <p className="notice ok" role="status">Gespeichert.</p>}
      {info === "cooldown" && <p className="notice" role="alert">Du kannst PvP erst in etwa {mins} Min. wieder umstellen.</p>}
      {info === "technisch" && <p className="notice" role="alert">Gerade technisch nicht möglich. Bitte versuche es gleich noch einmal.</p>}

      {!s.verified ? (
        <section className="panel">
          <h2>Konto verifizieren</h2>
          {s.verify_code ? (
            <>
              <p>Betritt den Server und gib diesen Befehl im Chat ein:</p>
              <p className="code">/verify {s.verify_code}</p>
              <p className="muted small">Der Code ist 15 Minuten gültig. Danach hier „Status prüfen“ klicken.</p>
            </>
          ) : (
            <p>Dein Code ist abgelaufen. Fordere einen neuen an.</p>
          )}
          <div className="row">
            <Link href="/konto" className="btn">Status prüfen</Link>
            <form action={newCode}><button type="submit" className="btn ghost">Neuen Code anfordern</button></form>
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>PvP</h2>
          <p>Dein PvP ist aktuell <strong className={s.pvp_enabled ? "on" : "off"}>{s.pvp_enabled ? "AN" : "AUS"}</strong>.</p>
          <p className="muted small">Kämpfen kannst du nur, wenn du die PvP-Rolle auf dem Server hast und PvP hier eingeschaltet ist. Du kannst die Einstellung alle 10 Minuten ändern.</p>
          <form action={setPvp}>
            <input type="hidden" name="enabled" value={s.pvp_enabled ? "0" : "1"} />
            <button type="submit" className="btn">{s.pvp_enabled ? "PvP ausschalten" : "PvP einschalten"}</button>
          </form>
        </section>
      )}

      <div className="row" style={{ marginTop: "1.5rem" }}>
        <Link href={`/spieler/${s.uuid}`} className="btn ghost">Mein Profil</Link>
        <form action={logout}><button type="submit" className="btn ghost">Abmelden</button></form>
      </div>
    </>
  );
}
