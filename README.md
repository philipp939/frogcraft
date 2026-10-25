# FrogCraft

- `website/` – Next.js-Website (Vercel)
- `plugin/` – Paper-Plugin FrogCraftStats (Maven, Java 25)
- `supabase/migrations/` – SQL (bereits im Projekt angewendet)

## Datenfluss
Plugin (Secret Key) schreibt → Supabase `pvp_players` → Website liest (Publishable Key, per RLS nur freigegebene Spalten).
Kopfgeld und PvP-Status sind bewusst nicht Teil der Website und des Plugins (die DB-Spalten bleiben für später).

## Website lokal starten (Windows, PowerShell)
```
cd website
copy .env.example .env.local   # Werte eintragen
npm install
npm run dev
```
Umgebungsvariablen: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SERVER_IP`.

## Auf Vercel deployen
1. Vercel → Add New → Project → GitHub-Repo `philipp939/frogcraft` importieren.
2. **Root Directory: `website`**, Framework: Next.js.
3. Die drei Umgebungsvariablen oben eintragen → Deploy. Jeder Push auf `main` deployt automatisch.

## Plugin bauen (Windows)
Benötigt JDK 25 und Maven.
```
cd plugin
mvn clean package
```
JAR: `plugin\target\FrogCraftStats.jar` → in den Ordner `plugins/` des Paper-Servers kopieren, einmal starten,
`plugins/FrogCraftStats/config.yml` ausfüllen (`supabase.url`, `supabase.secret-key`), Server neu starten.
Der Secret Key steht in Supabase unter Project Settings → API Keys. Nie committen oder teilen.
Vault + ein Economy-Plugin (z. B. EssentialsX) sind nötig, damit Kontostände übertragen werden.

## Ingame
`/top geld`, `/top kills`, `/top zeit` (Alias `/rangliste`, Permission `frogcraft.top`, Standard: alle).

## Offen / nicht verifiziert
- `paper.version` in `plugin/pom.xml` (26.3-R0.1-SNAPSHOT) und `api-version` in `plugin.yml` sind nicht gegen die offizielle Paper-API geprüft.
- Weder Plugin noch Website wurden lokal gebaut oder getestet (keine Netzwerkverbindung in der Entwicklungsumgebung).
- Spielzeit: Bei einem Absturz gehen höchstens `sync-interval-seconds` verloren; Restsekunden unter einer Minute werden beim Logout verworfen.
