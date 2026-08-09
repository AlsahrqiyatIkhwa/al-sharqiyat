import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 md:px-8">{children}</main>
      <Footer />
    </>
  );
}
