"use client";
import { useState } from "react";

export default function CopyIp({ ip }: { ip: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(ip);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch { window.prompt("Server-IP kopieren:", ip); }
  }
  return (
    <button type="button" className="ip" onClick={copy} aria-live="polite">
      <code>{ip}</code><span>{done ? "Kopiert ✓" : "Kopieren"}</span>
    </button>
  );
}
