import Link from "next/link";
export default function NotFound() {
  return (<section className="panel narrow"><h1>Nicht gefunden</h1><p className="muted">Diese Seite oder dieser Spieler existiert nicht.</p><p><Link href="/" className="btn">Zur Startseite</Link></p></section>);
}
