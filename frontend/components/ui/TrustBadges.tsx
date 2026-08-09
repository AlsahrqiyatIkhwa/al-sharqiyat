import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const badges = [
  { icon: ShieldCheck, text: 'تأكيد الطلب يدوياً عبر واتساب' },
  { icon: Truck, text: 'شحن لجميع محافظات الأردن' },
  { icon: RotateCcw, text: 'إمكانية الاستبدال خلال 3 أيام' },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {badges.map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="hover-lift flex items-center gap-3 rounded-xl border border-brand-200/60 bg-brand-50/60 px-4 py-3 hover:border-brand-400 hover:shadow-soft"
        >
          <Icon className="h-5 w-5 shrink-0 text-brand-600" />
          <span className="text-xs font-medium text-ink-900/80">{text}</span>
        </div>
      ))}
    </div>
  );
}
