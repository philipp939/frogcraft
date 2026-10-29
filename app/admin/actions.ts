"use server";
import { redirect } from "next/navigation";
import { rpc } from "@/lib/db";

export async function setCooldown(f: FormData) {
  const password = String(f.get("password") ?? "").slice(0, 200);
  const minutes = Number.parseInt(String(f.get("minutes") ?? ""), 10);
  if (!Number.isFinite(minutes)) redirect("/admin?e=invalid_minutes");
  const r = await rpc("admin_set_cooldown", { p_password: password, p_minutes: minutes });
  if (!r) redirect("/admin?e=technisch");
  redirect(r.ok ? "/admin?ok=1" : `/admin?e=${encodeURIComponent(r.error ?? "technisch")}`);
}
