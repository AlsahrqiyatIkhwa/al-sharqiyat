import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Required so the httpOnly refresh-token cookie is sent to /admin/auth/refresh
  // and /admin/auth/logout. Safe here because the backend's CORS config pins
  // `origin` to a single known frontend URL rather than reflecting any origin.
  withCredentials: true,
});

// ---- Access token: in-memory ONLY, never localStorage/sessionStorage. ----
// localStorage is readable by any JS running on the page, so a single XSS
// bug anywhere (this app, a future change, or even a compromised
// third-party script/dependency) would let an attacker read it directly and
// walk out with a live admin session. Keeping it only in a module-level JS
// variable means it never touches persistent, script-readable storage — an
// XSS payload running *at that moment* could still call the API as the
// admin, but it can no longer silently exfiltrate a long-lived credential
// for offline reuse. The cost is that a hard page refresh loses the token,
// which is why `bootstrapAdminSession()` below re-derives it from the
// httpOnly refresh cookie on load.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Attach the admin JWT (if present) to every outgoing request.
// Public storefront requests simply won't have a token — harmless no-op.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const csrfToken = readCookie('csrf_token');
    const res = await axios.post(
      `${API_URL}/admin/auth/refresh`,
      {},
      { withCredentials: true, headers: csrfToken ? { 'x-csrf-token': csrfToken } : {} }
    );
    const newToken = res.data.token as string;
    setAccessToken(newToken);
    return newToken;
  } catch {
    return null;
  }
}

/**
 * Call once on admin app load (see AdminLayout). Since the access token now
 * lives only in memory, a hard refresh/new tab starts with none — this
 * silently exchanges the httpOnly refresh cookie (if the session is still
 * valid) for a fresh access token, so the admin doesn't get bounced to the
 * login page on every reload. Returns true if a session was restored.
 */
export async function bootstrapAdminSession(): Promise<boolean> {
  refreshInFlight = refreshInFlight ?? refreshAccessToken();
  const token = await refreshInFlight;
  refreshInFlight = null;
  return !!token;
}

// On a 401 from an admin endpoint, try a silent refresh once (the refresh
// token lives in an httpOnly cookie, so this succeeds transparently as long
// as the admin's session hasn't fully expired) and retry the original call.
// Only falls back to a full redirect-to-login if the refresh itself fails.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error?.config;
    const isAdminRoute =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    if (
      error?.response?.status === 401 &&
      isAdminRoute &&
      window.location.pathname !== '/admin/login' &&
      originalRequest &&
      !originalRequest._retried
    ) {
      originalRequest._retried = true;
      refreshInFlight = refreshInFlight ?? refreshAccessToken();
      const newToken = await refreshInFlight;
      refreshInFlight = null;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      setAccessToken(null);
      document.cookie = 'admin_token_present=; path=/; max-age=0';
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

/** Revokes the refresh token server-side (CSRF-protected) and clears local session state. */
export async function logoutAdmin(): Promise<void> {
  try {
    const csrfToken = readCookie('csrf_token');
    await api.post(
      '/admin/auth/logout',
      {},
      { headers: csrfToken ? { 'x-csrf-token': csrfToken } : {} }
    );
  } catch {
    // Best-effort — even if the server call fails (e.g. session already
    // expired), we still want to clear local state below.
  } finally {
    setAccessToken(null);
    document.cookie = 'admin_token_present=; path=/; max-age=0';
  }
}
