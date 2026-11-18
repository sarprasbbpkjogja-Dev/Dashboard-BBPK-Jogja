type Props = { label: string; value: React.ReactNode; note?: string };

export function StatCard({ label, value, note }: Props) {
  return (
    <div className="card flex flex-col gap-1.5 px-5 py-4">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
      {note ? <span className="text-sm font-semibold text-muted">{note}</span> : null}
    </div>
  );
}
