'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { bootstrapAdminSession } from '@/lib/api';

// Note: <Toaster /> is already mounted once in the root app/layout.tsx,
// so it is intentionally not repeated here.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  // The access token now lives only in memory (see lib/api.ts), so every
  // hard refresh/new tab starts with none. Before rendering any protected
  // admin UI, silently try to exchange the httpOnly refresh cookie for a
  // fresh access token; only fall through to the login redirect if that
  // fails (session truly expired/revoked).
  const [sessionReady, setSessionReady] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    bootstrapAdminSession().then((restored) => {
      if (cancelled) return;
      if (restored) {
        setSessionReady(true);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!sessionReady) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f4f1]">
      <AdminSidebar />
      <div className="mr-64 flex-1 p-8">{children}</div>
    </div>
  );
}
