import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { login } from "@/app/konto/actions";

export const metadata = { title: "Anmelden", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERR: Record<string, string> = {
  invalid: "Name oder Passwort ist falsch. Hast du dich schon registriert und im Spiel verifiziert?",
  locked: "Zu viele falsche Versuche. Bitte warte 15 Minuten.",
  technisch: "Gerade technisch nicht möglich. Bitte versuche es gleich noch einmal.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  if (await getSession()) redirect("/konto");
  const fehler = (await searchParams).fehler;
  return (
    <section className="panel narrow">
      <h1>Anmelden</h1>
      {fehler && <p className="notice" role="alert">{ERR[fehler] ?? ERR.technisch}</p>}
      <form action={login} className="form">
        <label className="field">Minecraft-Name
          <input name="name" required minLength={3} maxLength={17} pattern="[A-Za-z0-9_.]{3,17}" autoComplete="username" autoCapitalize="off" spellCheck={false} />
        </label>
        <label className="field">Passwort
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="current-password" />
        </label>
        <button type="submit" className="btn">Anmelden</button>
      </form>
      <p className="muted small">Noch kein Konto? <Link href="/registrieren" className="more">Jetzt registrieren</Link></p>
    </section>
  );
}
