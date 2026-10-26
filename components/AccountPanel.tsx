import Link from "next/link";
import { login, logout, newCode, register, setPvp } from "@/app/konto/actions";
import type { Session } from "@/lib/auth";

const ERR: Record<string, string> = {
  invalid: "Name oder Passwort ist falsch. Hast du dich schon registriert und im Spiel verifiziert?",
  locked: "Zu viele falsche Versuche. Bitte warte 15 Minuten.",
  name: "Bitte gib einen gültigen Minecraft-Namen ein (3–17 Zeichen: Buchstaben, Zahlen, _ und .).",
  passwort: "Das Passwort muss zwischen 8 und 72 Zeichen lang sein.",
  gleich: "Die Passwörter stimmen nicht überein.",
  invalid_username: "Bitte gib einen gültigen Minecraft-Namen ein.",
  invalid_password: "Das Passwort muss zwischen 8 und 72 Zeichen lang sein.",
  unknown_player: "Dieser Spieler war noch nie auf dem Server. Betritt den Server einmal und versuche es danach erneut.",
  exists: "Für diesen Spieler gibt es schon ein verifiziertes Konto. Bitte melde dich an.",
  technisch: "Gerade technisch nicht möglich. Bitte versuche es gleich noch einmal.",
};

type Props = { session: Session | null; mode: string; fehler?: string; info?: string; wait?: string };

export default function AccountPanel({ session: s, mode, fehler, info, wait }: Props) {
  if (!s) {
    const reg = mode === "registrieren";
    return (
      <div>
        <h2 className="pname">{reg ? "Registrieren" : "Anmelden"}</h2>
        <nav className="tabs" aria-label="Konto">
          <Link href="/?konto=login" scroll={false} aria-current={!reg ? "page" : undefined}>Anmelden</Link>
          <Link href="/?konto=registrieren" scroll={false} aria-current={reg ? "page" : undefined}>Registrieren</Link>
        </nav>
        {reg && <p className="muted small">Du bekommst danach einen Code, den du im Spiel mit <code>/verify</code> bestätigst. So stellen wir sicher, dass du der echte Spieler bist.</p>}
        {fehler && <p className="notice" role="alert">{ERR[fehler] ?? ERR.technisch}</p>}
        <form action={reg ? register : login} className="form">
          <label className="field">Minecraft-Name
            <input name="name" required minLength={3} maxLength={17} pattern="[A-Za-z0-9_.]{3,17}" autoComplete="username" autoCapitalize="off" spellCheck={false} />
          </label>
          <label className="field">Passwort{reg ? " (mind. 8 Zeichen)" : ""}
            <input name="password" type="password" required minLength={8} maxLength={72} autoComplete={reg ? "new-password" : "current-password"} />
          </label>
          {reg && (
            <label className="field">Passwort wiederholen
              <input name="password2" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
            </label>
          )}
          <button type="submit" className="btn">{reg ? "Konto erstellen" : "Anmelden"}</button>
        </form>
      </div>
    );
  }

  const mins = Math.max(1, Math.ceil(Number(wait ?? s.cooldown_seconds) / 60));
  return (
    <div>
      <h2 className="pname">Mein Konto</h2>
      <p className="muted">Angemeldet als <strong>{s.username}</strong></p>
      {info === "gespeichert" && <p className="notice ok" role="status">Gespeichert.</p>}
      {info === "cooldown" && <p className="notice" role="alert">Du kannst PvP erst in etwa {mins} Min. wieder umstellen.</p>}
      {info === "technisch" && <p className="notice" role="alert">{ERR.technisch}</p>}

      {!s.verified ? (
        <section className="sub">
          <h3>Konto verifizieren</h3>
          {s.verify_code ? (
            <>
              <p>Betritt den Server und gib diesen Befehl im Chat ein:</p>
              <p className="code">/verify {s.verify_code}</p>
              <p className="muted small">Der Code ist 15 Minuten gültig.</p>
            </>
          ) : (<p>Dein Code ist abgelaufen. Fordere einen neuen an.</p>)}
          <div className="row">
            <Link href="/?konto=1" scroll={false} className="btn">Status prüfen</Link>
            <form action={newCode}><button type="submit" className="btn ghost">Neuer Code</button></form>
          </div>
        </section>
      ) : (
        <section className="sub">
          <h3>PvP</h3>
          <p>Dein PvP ist aktuell <strong className={s.pvp_enabled ? "on" : "off"}>{s.pvp_enabled ? "AN" : "AUS"}</strong>.</p>
          <p className="muted small">Kämpfen kannst du nur mit der PvP-Rolle auf dem Server und eingeschaltetem PvP. Änderung alle 10 Minuten möglich.</p>
          <form action={setPvp}>
            <input type="hidden" name="enabled" value={s.pvp_enabled ? "0" : "1"} />
            <button type="submit" className="btn">{s.pvp_enabled ? "PvP ausschalten" : "PvP einschalten"}</button>
          </form>
        </section>
      )}
      <div className="row" style={{ marginTop: "1.25rem" }}>
        <form action={logout}><button type="submit" className="btn ghost">Abmelden</button></form>
      </div>
    </div>
  );
}
