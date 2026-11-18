// Status selalu tampil sebagai teks di dalam pill, tidak hanya warna.

export type PillTone = "primary" | "soft" | "warn" | "danger" | "neutral";

const TONE: Record<PillTone, string> = {
  primary: "bg-primary text-surface",
  soft: "bg-primary-soft text-primary",
  warn: "bg-warn-soft text-warn-ink",
  danger: "bg-danger-soft text-danger-ink",
  neutral: "bg-neutral-soft text-neutral-ink",
};

export function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[tone]}`}>
      {children}
    </span>
  );
}
