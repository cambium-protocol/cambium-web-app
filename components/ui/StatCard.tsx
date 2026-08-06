export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
