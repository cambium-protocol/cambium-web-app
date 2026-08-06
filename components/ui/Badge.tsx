type BadgeTone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'violet';

const toneClasses: Record<BadgeTone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({
  tone = 'gray',
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
