import Link from "next/link";

type Props = { href?: string; tone?: "light" | "dark"; subtitle?: string };

export function Logo({ href = "/", tone = "light", subtitle = "Layanan fasilitas balai" }: Props) {
  const dark = tone === "dark";
  return (
    <Link href={href} className="flex min-h-tap items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-[10px] text-sm font-bold ${
          dark ? "bg-primary-soft text-primary" : "bg-primary text-surface"
        }`}
        aria-hidden="true"
      >
        B3
      </span>
      <span className="flex flex-col">
        <span className={`text-base font-bold ${dark ? "text-surface" : "text-ink"}`}>BBPKA PDN III</span>
        <span className={`text-xs ${dark ? "text-sidebar-quiet" : "text-muted"}`}>{subtitle}</span>
      </span>
    </Link>
  );
}
