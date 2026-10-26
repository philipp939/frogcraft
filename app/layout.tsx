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
              <Link href="/#suche">Suche</Link>
              <Link href="/konto">Konto</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap foot">FrogCraft ist kein offizielles Minecraft-Produkt und steht in keiner Verbindung zu Mojang oder Microsoft.</footer>
      </body>
    </html>
  );
}
