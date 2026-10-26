import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { register } from "@/app/konto/actions";

export const metadata = { title: "Registrieren", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERR: Record<string, string> = {
  name: "Bitte gib einen gültigen Minecraft-Namen ein (3–17 Zeichen: Buchstaben, Zahlen, _ und .).",
  passwort: "Das Passwort muss zwischen 8 und 72 Zeichen lang sein.",
  gleich: "Die Passwörter stimmen nicht überein.",
  invalid_username: "Bitte gib einen gültigen Minecraft-Namen ein.",
  invalid_password: "Das Passwort muss zwischen 8 und 72 Zeichen lang sein.",
  unknown_player: "Dieser Spieler war noch nie auf dem Server. Betritt den Server einmal und versuche es danach erneut.",
  exists: "Für diesen Spieler gibt es schon ein verifiziertes Konto. Bitte melde dich an.",
  technisch: "Gerade technisch nicht möglich. Bitte versuche es gleich noch einmal.",
};

export default async function Registrieren({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  if (await getSession()) redirect("/konto");
  const fehler = (await searchParams).fehler;
  return (
    <section className="panel narrow">
      <h1>Registrieren</h1>
      <p className="muted">Du bekommst danach einen Code, den du im Spiel mit <code>/verify</code> bestätigst. So stellen wir sicher, dass du der echte Spieler bist.</p>
      {fehler && <p className="notice" role="alert">{ERR[fehler] ?? ERR.technisch}</p>}
      <form action={register} className="form">
        <label className="field">Minecraft-Name
          <input name="name" required minLength={3} maxLength={17} pattern="[A-Za-z0-9_.]{3,17}" autoComplete="username" autoCapitalize="off" spellCheck={false} />
        </label>
        <label className="field">Passwort (mind. 8 Zeichen)
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
        </label>
        <label className="field">Passwort wiederholen
          <input name="password2" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
        </label>
        <button type="submit" className="btn">Konto erstellen</button>
      </form>
      <p className="muted small">Schon ein Konto? <Link href="/login" className="more">Anmelden</Link></p>
    </section>
  );
}
