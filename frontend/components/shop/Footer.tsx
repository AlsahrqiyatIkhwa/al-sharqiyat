import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Mail, MessageCircle } from 'lucide-react';

const INSTAGRAM_URL = 'https://instagram.com/YOUR_USERNAME';
const EMAIL_ADDRESS = 'alsharqiyatikhwa@gmail.com';
const WHATSAPP_URL = 'https://wa.me/YOUR_NUMBER';

const DEVELOPER_INSTAGRAM_URL = 'https://www.instagram.com/hamza.halbouni7';
const DEVELOPER_EMAIL = 'hamza.halbouni7@gmail.com';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-900/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Image
              src="/logo-mark.png"
              alt="شرقيات الإخوة"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
            <p className="mt-3 text-sm leading-relaxed text-ink-900/60">
              دار أزياء أردنية متخصصة في العبايات والقفاطين التراثية بلمسة عصرية
              فاخرة.
            </p>
          </div>
          <div>
            <h4 className="font-cairo font-semibold text-ink-900">روابط سريعة</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-900/60">
              <li>عبايات</li>
              <li>قفاطين</li>
              <li>الأكثر مبيعاً</li>
            </ul>
          </div>
          <div>
            <h4 className="font-cairo font-semibold text-ink-900">تواصل معنا</h4>
            <p className="mt-3 text-sm text-ink-900/60">الأردن — المفرق</p>
            <p className="mt-1 text-sm text-ink-900/60">الطلبات تُؤكد عبر واتساب</p>
            <p className="mt-1 text-sm text-ink-900/60" dir="ltr">{EMAIL_ADDRESS}</p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="إنستغرام"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/70 transition-colors hover:bg-brand-600 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href={`mailto:${EMAIL_ADDRESS}`}
                aria-label="البريد الإلكتروني"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/70 transition-colors hover:bg-brand-600 hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </Link>
              <Link
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/70 transition-colors hover:bg-brand-600 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-2 border-t border-ink-900/5 pt-6 text-center text-xs text-ink-900/40">
          <p>© {new Date().getFullYear()} شرقيات الإخوة. جميع الحقوق محفوظة.</p>
          <p>
            Designed and developed by{' '}
            <Link
              href={DEVELOPER_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-900/60 underline decoration-dotted underline-offset-2 transition-colors hover:text-brand-600"
            >
              HAMZA HALBOUNI
            </Link>{' '}
            |{' '}
            <Link
              href={`mailto:${DEVELOPER_EMAIL}`}
              className="underline decoration-dotted underline-offset-2 transition-colors hover:text-brand-600"
            >
              {DEVELOPER_EMAIL}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
