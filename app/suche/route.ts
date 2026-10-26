import { NextRequest, NextResponse } from "next/server";
import { findByName, NAME_RE } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Suche aus der Navigation: leitet auf die Startseite mit geöffnetem Spieler-Fenster weiter. */
export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").trim();
  const to = (qs: string) => NextResponse.redirect(new URL(`/?${qs}`, req.url), 303);
  if (!NAME_RE.test(name)) return to("spieler=ungueltig");
  const p = await findByName(name);
  if (p === undefined) return to("spieler=fehler");
  if (p === null) return to(`spieler=nicht-gefunden&name=${encodeURIComponent(name)}`);
  return to(`spieler=${p.uuid}`);
}
