import { redirect } from "next/navigation";
import Link from "next/link";
import { findByName, NAME_RE, configured } from "@/lib/db";

export const metadata = { title: "Spielersuche", robots: { index: false } };

function Msg({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel narrow">
      <h1>{title}</h1><p className="muted">{text}</p>
      <p><Link href="/#suche" className="btn">Neue Suche</Link></p>
    </section>
  );
}

export default async function Suche({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const name = ((await searchParams).name ?? "").trim();
  if (!configured) return <Msg title="Datenbank nicht verbunden" text="In Vercel fehlen die Umgebungsvariablen SUPABASE_URL und SUPABASE_PUBLISHABLE_KEY." />;
  if (!NAME_RE.test(name)) return <Msg title="Ungültiger Name" text="Erlaubt sind 3–17 Zeichen: Buchstaben, Zahlen, Unterstrich und Punkt." />;
  const p = await findByName(name);
  if (p === undefined) return <Msg title="Gerade nicht erreichbar" text="Die Datenbank antwortet nicht. Bitte versuche es in einem Moment erneut." />;
  if (p === null) return <Msg title="Spieler nicht gefunden" text={`Für „${name}“ gibt es keine Daten. Der Spieler muss mindestens einmal auf dem Server gewesen sein.`} />;
  redirect(`/spieler/${p.uuid}`);
}
