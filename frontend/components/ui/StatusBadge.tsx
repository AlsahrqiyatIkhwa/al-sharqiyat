import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_LABELS[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
