import Link from "next/link";
import { login, logout, newCode, register, saveCooldown, toggleHidden, togglePvp } from "@/app/konto/actions";
import Avatar from "@/components/Avatar";
import SwitchRow from "@/components/SwitchRow";
import type { HistoryItem, Session } from "@/lib/auth";
import { fmtDate, type Player } from "@/lib/db";

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

type Props = { session: Session | null; mode: string; fehler?: string; info?: string; wait?: string; profile?: Player | null; history?: HistoryItem[] };

export default function AccountPanel({ session: s, mode, fehler, info, wait, profile, history = [] }: Props) {
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
      <div className="profile" style={{ margin: "0 0 1rem" }}>
        <Avatar uuid={s.uuid} size={64} />
        <div><p className="muted" style={{ margin: 0 }}>Angemeldet als</p><p className="pname" style={{ margin: 0 }}>{s.username}</p></div>
      </div>
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
          <h3>Einstellungen</h3>
          <SwitchRow action={togglePvp} initial={s.pvp_enabled} label="PvP" desc="Gilt ab deinem nächsten Beitritt zum Server. Zum Übernehmen den Server verlassen und neu betreten." note={s.pvp_pending ? "Ausstehend – wird beim nächsten Beitritt aktiv." : undefined} />
          <SwitchRow action={toggleHidden} initial={profile?.hidden ?? false} label="Profil verstecken" desc="Nicht in den Ranglisten, andere sehen nur deinen Namen." />
          <p className="muted small">PvP kannst du nur alle {s.cooldown_minutes} Min. umstellen. Die Änderung gilt ab deinem nächsten Beitritt zum Server.</p>
        </section>
      )}
      {s.verified && (
        <>
          <section className="sub">
            <h3>PvP-Verlauf</h3>
            {history.length === 0 ? (<p className="muted small">Noch keine Änderungen.</p>) : (
              <ul className="hist">
                {history.map((h) => (
                  <li key={h.at}><span className={h.enabled ? "on" : "off"}>{h.enabled ? "PvP eingeschaltet" : "PvP ausgeschaltet"}</span><span className="muted">{fmtDate(h.at)}</span></li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {s.is_owner && (
        <section className="sub">
          <h3>Owner: Wartezeit für PvP</h3>
          {info === "not_owner" && <p className="notice" role="alert">Nur der Rang Owner darf das ändern.</p>}
          {info === "cooldown_invalid" && <p className="notice" role="alert">Bitte gib eine Zahl von 0 bis 1440 ein.</p>}
          <form action={saveCooldown} className="form">
            <label className="field">Minuten zwischen zwei Umstellungen (0 = keine Wartezeit)
              <input name="minutes" type="number" min={0} max={1440} step={1} defaultValue={s.cooldown_minutes} required />
            </label>
            <button type="submit" className="btn">Speichern</button>
          </form>
        </section>
      )}
      <div className="row" style={{ marginTop: "1.25rem" }}>
        <form action={logout}><button type="submit" className="btn ghost">Abmelden</button></form>
      </div>
    </div>
  );
}
