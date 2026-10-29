import type { Metadata } from "next";

export const metadata: Metadata = { title: "Befehle", description: "Alle wichtigen Befehle auf dem FrogCraft-Server." };

type Cmd = { cmd: string; text: string; example?: string };
const GROUPS: { title: string; items: Cmd[] }[] = [
  {
    title: "Geld & Handel",
    items: [
      { cmd: "/money", text: "Zeigt deinen aktuellen Kontostand." },
      { cmd: "/pay <Spieler> <Betrag>", text: "Überweist Geld an einen anderen Spieler.", example: "/pay Steve 100" },
      { cmd: "/sell", text: "Verkauft Gegenstände. Halte den Gegenstand dafür in der Hand." },
      { cmd: "/ac", text: "Öffnet das Auktionshaus, in dem du Gegenstände anbieten und kaufen kannst." },
    ],
  },
  {
    title: "Teleportieren",
    items: [
      { cmd: "/spawn", text: "Bringt dich zum Spawn." },
      { cmd: "/sethome [Name]", text: "Speichert deinen aktuellen Standort als Zuhause.", example: "/sethome basis" },
      { cmd: "/home [Name]", text: "Teleportiert dich zu deinem gespeicherten Zuhause.", example: "/home basis" },
      { cmd: "/tpa <Spieler>", text: "Schickt einem Spieler eine Anfrage, dass du dich zu ihm teleportieren möchtest. Er muss sie bestätigen.", example: "/tpa Steve" },
    ],
  },
  {
    title: "Rangliste, PvP & Konto",
    items: [
      { cmd: "/top geld|kills|zeit", text: "Zeigt die Top 10 im Chat: reichste Spieler, meiste Kills oder längste Spielzeit.", example: "/top kills" },
      { cmd: "/pvp", text: "Zeigt, ob dein PvP gerade aktiv ist. Ein- und ausschalten kannst du es auf der Website in deinem Konto." },
      { cmd: "/verify <Code>", text: "Bestätigt dein Website-Konto. Den Code siehst du nach der Registrierung auf der Website.", example: "/verify A1B2C3" },
    ],
  },
];

export default function Befehle() {
  return (
    <>
      <h1>Befehle</h1>
      <p className="lead">Alle wichtigen Befehle auf einen Blick. Gib sie im Spiel im Chat ein.</p>
      {GROUPS.map((g) => (
        <section key={g.title} className="panel cmdgroup">
          <h2>{g.title}</h2>
          <ul className="cmds">
            {g.items.map((c) => (
              <li key={c.cmd}>
                <code>{c.cmd}</code>
                <p>{c.text}{c.example && <> Beispiel: <code>{c.example}</code></>}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
