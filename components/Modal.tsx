"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Modal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") router.push("/", { scroll: false }); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [router]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={label}>
      <Link href="/" scroll={false} className="backdrop" aria-label="Fenster schließen" tabIndex={-1} />
      <div className="sheet" ref={sheet} tabIndex={-1}>
        <Link href="/" scroll={false} className="close" aria-label="Schließen">✕</Link>
        {children}
      </div>
    </div>
  );
}
