"use client";
import { useState, useTransition } from "react";

/** Schalter, der ohne Neuladen der Seite umschaltet. Bei einem Fehler springt er zurück und zeigt den Grund. */
export default function SwitchRow({ action, initial, label, desc, note }: {
  action: (enabled: boolean) => Promise<{ ok: boolean; message?: string }>;
  initial: boolean; label: string; desc?: string; note?: string;
}) {
  const [on, setOn] = useState(initial);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    setMsg(null);
    startTransition(async () => {
      const r = await action(next);
      if (!r.ok) { setOn(!next); setMsg({ text: r.message ?? "Das hat nicht geklappt.", error: true }); }
      else if (r.message) setMsg({ text: r.message, error: false });
    });
  }

  return (
    <div className="setting">
      <div>
        <strong>{label}</strong>
        {desc && <p className="muted small">{desc}</p>}
        {note && !msg && <p className="small note">{note}</p>}
        {msg && <p className={`small ${msg.error ? "off" : "note"}`} role={msg.error ? "alert" : "status"}>{msg.text}</p>}
      </div>
      <button type="button" className="switch" role="switch" aria-checked={on} aria-label={label} onClick={toggle} disabled={busy}>
        <span className="sr">{on ? "an" : "aus"}</span>
      </button>
    </div>
  );
}
