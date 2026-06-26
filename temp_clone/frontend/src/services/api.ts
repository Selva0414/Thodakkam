import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const defaultBaseURL = '/api';

const api = axios.create({
  baseURL: (import.meta.env && import.meta.env.VITE_API_BASE_URL) || defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── In-memory GET cache + in-flight request deduplication ────────────────
// Goal: when the same endpoint is requested multiple times in a short window
// (e.g., dashboard widgets, sidebar polls, focus refetches), reuse the answer
// instead of hammering the backend. Any non-GET request to the same base path
// invalidates the cache. Cache is bypassed when the caller passes
// `headers['x-no-cache'] = '1'` or sets `params.__noCache`.
const GET_CACHE_TTL_MS = 15_000;
const GET_ERROR_CACHE_TTL_MS = 5_000; // Cache 4xx errors briefly to stop retry storms
type CacheEntry = { data: any; status: number; headers: any; expires: number };
type ErrorCacheEntry = { error: any; expires: number };
const responseCache = new Map<string, CacheEntry>();
const errorCache = new Map<string, ErrorCacheEntry>();
const inflight = new Map<string, Promise<AxiosResponse>>();

const stableStringify = (v: any): string => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const keys = Object.keys(v).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
};
const cacheKey = (cfg: AxiosRequestConfig) => `${(cfg.method || 'get').toUpperCase()} ${cfg.url || ''} ${stableStringify(cfg.params || {})}`;
const basePath = (url?: string) => (url || '').split('?')[0];
const invalidateCacheFor = (url?: string) => {
  const path = basePath(url);
  if (!path) return;
  for (const k of responseCache.keys()) {
    if (k.includes(path)) responseCache.delete(k);
  }
};

const isPrefixedUrl = (url: string) => {
  return (
    url.startsWith('/admin') ||
    url.startsWith('/startup') ||
    url.startsWith('/startups') ||
    url.startsWith('/student/') ||
    url.startsWith('/students') ||
    url.startsWith('/jobs') ||
    url.startsWith('/applications') ||
    url.startsWith('/community') ||
    url.startsWith('/messages') ||
    url.startsWith('/user') ||
    url.startsWith('/health') ||
    url.startsWith('/notifications')
  );
};

const resolveNamespace = () => {
  if (typeof window === 'undefined') return 'startup';
  if (window.location.pathname.startsWith('/master-admin')) return 'admin';
  if (window.location.pathname.startsWith('/student')) return 'student';
  return 'startup';
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const namespace = resolveNamespace();

    if (url && !isPrefixedUrl(url)) {
      config.url = `/${namespace}${url.startsWith('/') ? url : `/${url}`}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    let token =
      namespace === 'admin'
        ? localStorage.getItem('adminToken')
        : namespace === 'student'
          ? localStorage.getItem('studentToken')
          : localStorage.getItem('startup_token');

    // Fallback to backup token if startup_token is missing and we are on /startup/trial-expired
    if (namespace === 'startup' && !token && typeof window !== 'undefined' && window.location.pathname === '/startup/trial-expired') {
      token = localStorage.getItem('startup_locked_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cache + dedup wrapper installed on top of the axios instance. We can't
// short-circuit from a request interceptor (it must return a config), so
// monkey-patch `request` to consult the cache and inflight map first.
const originalRequest = api.request.bind(api);
(api as any).request = function cachedRequest<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const method = (config.method || 'get').toLowerCase();
  const noCache = (config.headers as any)?.['x-no-cache'] === '1' || (config.params as any)?.__noCache;

  if (method !== 'get') {
    // Mutating call: invalidate any cached entries for this path.
    invalidateCacheFor(config.url);
    return originalRequest(config);
  }

  if (noCache) {
    return originalRequest(config);
  }

  const key = cacheKey(config);

  // Return cached error for a short TTL to avoid retry storms on 4xx responses
  const cachedErr = errorCache.get(key);
  if (cachedErr && cachedErr.expires > Date.now()) {
    return Promise.reject(cachedErr.error);
  }
  const cached = responseCache.get(key);
  const now = Date.now();
  if (cached && cached.expires > now) {
    return Promise.resolve({
      data: cached.data,
      status: cached.status,
      statusText: 'OK',
      headers: cached.headers,
      config,
    } as AxiosResponse<T>);
  }

  const existing = inflight.get(key);
  if (existing) return existing as Promise<AxiosResponse<T>>;

  const p = originalRequest(config)
    .then((res) => {
      if (res && res.status >= 200 && res.status < 300) {
        responseCache.set(key, {
          data: res.data,
          status: res.status,
          headers: res.headers,
          expires: Date.now() + GET_CACHE_TTL_MS,
        });
      }
      return res;
    })
    .catch((err) => {
      // Cache 4xx errors briefly to prevent parallel/rapid retry storms
      const errStatus = err?.response?.status;
      if (errStatus && errStatus >= 400 && errStatus < 500) {
        errorCache.set(key, { error: err, expires: Date.now() + GET_ERROR_CACHE_TTL_MS });
      }
      throw err;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p as Promise<AxiosResponse<T>>;
};

// Response interceptor to redirect on 401/403 for both startup and admin flows.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const namespace = resolveNamespace();

    // 403 — startup status guard (REJECTED/SUSPENDED/PENDING/LOCKED)
    if (status === 403 && namespace === 'startup' && error?.response?.data?.status) {
      if (typeof window !== 'undefined') {
        const data = error.response.data;

        if (data.status === 'LOCKED') {
          // Backup the token and user details so they aren't lost during page changes or parallel error cleanups
          const tok = localStorage.getItem('startup_token');
          const usr = localStorage.getItem('startup_user');
          if (tok) localStorage.setItem('startup_locked_token', tok);
          if (usr) localStorage.setItem('startup_locked_user', usr);

          // Do NOT clear the token — the startup needs it to pay and unlock.
          // Only redirect if not already on the trial-expired page.
          if (window.location.pathname !== '/startup/trial-expired') {
            window.location.href = '/startup/trial-expired';
          }
          return Promise.reject(error);
        }

        if (data.status === 'STUDENT_LIMIT_REACHED') {
          // Dispatch a custom event so App.tsx can show the PaymentPopup modal
          window.dispatchEvent(new CustomEvent('startup_payment_required', { detail: { mode: 'extra-student' } }));
          return Promise.reject(error);
        }

        // For PENDING / REJECTED / SUSPENDED — clear session and redirect to login
        localStorage.removeItem('startup_token');
        localStorage.removeItem('startup_user');
        const onAuthPage = window.location.pathname === '/startup/login';
        if (!onAuthPage) {
          const params = new URLSearchParams({ status: data.status });
          if (data.reason) params.set('reason', data.reason);
          window.location.href = `/startup/login?${params.toString()}`;
        }
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      if (typeof window !== 'undefined') {
        if (namespace === 'admin') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          const onAuthPage = window.location.pathname === '/master-admin/login';
          if (!onAuthPage) {
            window.location.href = '/master-admin/login';
          }
        } else if (namespace === 'startup') {
          // Don't redirect to login if on trial-expired page — the user needs to stay
          // there to complete payment. Their token may have just expired but they've
          // already been locked and redirected here legitimately.
          const onTrialExpiredPage = window.location.pathname === '/startup/trial-expired';
          if (!onTrialExpiredPage) {
            // Backup before clearing if the account was locked
            try {
              const userStr = localStorage.getItem('startup_user');
              const tok = localStorage.getItem('startup_token');
              if (userStr && tok) {
                const userObj = JSON.parse(userStr);
                if (userObj.is_locked || userObj.status === 'LOCKED') {
                  localStorage.setItem('startup_locked_token', tok);
                  localStorage.setItem('startup_locked_user', userStr);
                }
              }
            } catch (e) {
              console.error('Backup token on 401 error failed:', e);
            }

            localStorage.removeItem('startup_token');
            localStorage.removeItem('startup_user');
            const onAuthPage = window.location.pathname === '/startup/login';
            if (!onAuthPage) {
              window.location.href = '/startup/login';
            }
          }
        } else if (namespace === 'student') {
          localStorage.removeItem('studentToken');
          localStorage.removeItem('studentName');
          const onAuthPage = window.location.pathname === '/student/login';
          if (!onAuthPage) {
            window.location.href = '/student/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
