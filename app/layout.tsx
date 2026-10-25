import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "FrogCraft – Minecraft-Server", template: "%s · FrogCraft" },
  description: "Ranglisten und Spielerprofile des FrogCraft Minecraft-Servers.",
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#000000" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="nav">
          <div className="wrap navin">
            <Link href="/" className="brand">FrogCraft</Link>
            <nav aria-label="Hauptnavigation">
              <Link href="/rangliste">Ranglisten</Link>
              <Link href="/#suche">Suche</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap foot">FrogCraft ist kein offizielles Minecraft-Produkt und steht in keiner Verbindung zu Mojang oder Microsoft.</footer>
      </body>
    </html>
  );
}
