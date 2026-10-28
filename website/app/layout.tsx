import "./globals.css";
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import type { Metadata, Viewport } from "next";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FrogCraft – Minecraft-Server", template: "%s · FrogCraft" },
  description: "Ranglisten und Spielerprofile des FrogCraft Minecraft-Servers.",
};
export const viewport: Viewport = { themeColor: "#161616" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={pixel.variable}>
      <body>
        <header className="nav">
          <div className="wrap navin">
            <Link href="/" className="brand">FrogCraft</Link>
            <nav aria-label="Hauptnavigation">
              <Link href="/rangliste">Ranglisten</Link>
              <Link href="/?konto=1" scroll={false}>Konto</Link>
            </nav>
            <form action="/suche" method="get" className="navsearch" role="search">
              <label htmlFor="navname" className="sr">Spieler suchen</label>
              <input id="navname" name="name" placeholder="Spieler suchen" required minLength={3} maxLength={17} pattern="[A-Za-z0-9_.]{3,17}" autoComplete="off" autoCapitalize="off" spellCheck={false} />
              <button type="submit" aria-label="Suchen">Los</button>
            </form>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
