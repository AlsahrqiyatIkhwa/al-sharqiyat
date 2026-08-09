'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { api, getErrorMessage, setAccessToken } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/auth/login', { username, password });
      setAccessToken(res.data.token);
      // Non-sensitive marker cookie (no token value) purely so the Next.js
      // middleware UX-gate can avoid flashing protected UI before redirect.
      // The real security boundary is still the backend's requireAdminAuth.
      document.cookie = 'admin_token_present=1; path=/; max-age=28800';
      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'اسم المستخدم أو كلمة المرور غير صحيحة'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Lock className="h-5 w-5 text-brand-700" />
          </div>
          <h1 className="font-cairo text-xl font-bold text-ink-900">لوحة تحكم شرقيات الإخوة</h1>
          <p className="text-xs text-ink-900/50">تسجيل الدخول للمسؤولين فقط</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              اسم المستخدم
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          دخول
        </Button>
      </form>
    </div>
  );
}
