/** Zeile mit Schalter. Ein Klick sendet das Formular und kehrt den Wert um. */
export default function SwitchRow({ action, on, label, desc, from }: {
  action: (formData: FormData) => void | Promise<void>; on: boolean; label: string; desc?: string; from?: string;
}) {
  return (
    <form action={action} className="setting">
      <div>
        <strong>{label}</strong>
        {desc && <p className="muted small">{desc}</p>}
      </div>
      {from && <input type="hidden" name="from" value={from} />}
      <input type="hidden" name="enabled" value={on ? "0" : "1"} />
      <button type="submit" className="switch" role="switch" aria-checked={on} aria-label={label}>
        <span className="sr">{on ? "an" : "aus"}</span>
      </button>
    </form>
  );
}
