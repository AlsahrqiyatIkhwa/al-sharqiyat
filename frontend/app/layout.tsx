import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'شرقيات الإخوة Sharqiyat Ikhwa | أزياء تراثية فاخرة',
    template: '%s | شرقيات الإخوة Sharqiyat Ikhwa',
  },
  description:
    'شرقيات الإخوة (Sharqiyat Ikhwa) — دار أزياء أردنية فاخرة متخصصة في العبايات والقفاطين التراثية المعاصرة.',
  keywords: [
    'شرقيات الإخوة',
    'شرقيات الاخوة',
    'Sharqiyat Ikhwa',
    'Sharqiyat Al Ikhwa',
    'sharqiyat ikhwa',
    'عبايات',
    'قفاطين',
    'أزياء تراثية',
    'الأردن',
  ],
alternates: {
    canonical: '/',
  },
  verification: {
    google: '_3NSAicn2L8aoyCEazDm-gcjeihCJn8AV3_lL6l6C2Y',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_JO',
    url: SITE_URL,
    siteName: 'شرقيات الإخوة | Sharqiyat Ikhwa',
    title: 'شرقيات الإخوة | Sharqiyat Ikhwa',
    description:
      'دار أزياء أردنية فاخرة متخصصة في العبايات والقفاطين التراثية المعاصرة.',
    images: ['/logo-mark.png'],
  },
  twitter: {
    card: 'summary',
    title: 'شرقيات الإخوة | Sharqiyat Ikhwa',
    description:
      'دار أزياء أردنية فاخرة متخصصة في العبايات والقفاطين التراثية المعاصرة.',
    images: ['/logo-mark.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="font-tajawal">
        <script
          type="application/ld+json"
          // Structured data: helps search engines associate the Arabic
          // brand name with its Latin transliteration ("Sharqiyat Ikhwa")
          // so the site surfaces for either spelling.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ClothingStore',
              name: 'شرقيات الإخوة',
              alternateName: ['Sharqiyat Ikhwa', 'Sharqiyat Al Ikhwa', 'شرقيات الاخوة'],
              url: SITE_URL,
              image: `${SITE_URL}/logo-mark.png`,
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'JO',
                addressRegion: 'المفرق',
              },
            }),
          }}
        />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-tajawal)',
              borderRadius: '12px',
              direction: 'rtl',
            },
          }}
        />
      </body>
    </html>
  );
}
