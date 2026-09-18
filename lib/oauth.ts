import { db } from './supabase';

export type OAuthProvider = 'google' | 'apple';
export type OAuthAvailability = Record<OAuthProvider, boolean>;
const returnKey = 'halal-cart-oauth-return';
const validViews = new Set(['discover', 'orders', 'community', 'owner']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reconstruct a same-origin app route from known fields; never accept a redirect URL.
export function safeReturnPath(value: unknown): string {
  if (!value || typeof value !== 'object') return '/';
  const intent = value as { view?: unknown; cart?: unknown };
  const params = new URLSearchParams();
  const view = typeof intent.view === 'string' && validViews.has(intent.view) ? intent.view : 'discover';
  if (view !== 'discover') params.set('view', view);
  if (view === 'discover' && typeof intent.cart === 'string' && uuid.test(intent.cart)) params.set('cart', intent.cart);
  return params.size ? `/?${params}` : '/';
}

function rememberReturn() {
  const params = new URLSearchParams(window.location.search);
  try {
    sessionStorage.setItem(returnKey, JSON.stringify({ view: params.get('view'), cart: params.get('cart'), at: Date.now() }));
    const probe = 'halal-cart-auth-storage-check';
    localStorage.setItem(probe, 'ok');
    if (localStorage.getItem(probe) !== 'ok') throw new Error('Storage unavailable');
    localStorage.removeItem(probe);
  } catch {
    throw new Error('Enable browser storage to sign in securely. You can still browse carts without signing in.');
  }
}

function consumeReturn() {
  try {
    const raw = sessionStorage.getItem(returnKey);
    sessionStorage.removeItem(returnKey);
    if (!raw) return '/';
    const intent = JSON.parse(raw);
    if (typeof intent.at !== 'number' || Date.now() - intent.at > 60 * 60 * 1000 || intent.at > Date.now() + 60000) return '/';
    return safeReturnPath(intent);
  } catch { return '/'; }
}

export async function getOAuthAvailability(signal?: AbortSignal): Promise<OAuthAvailability> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Sign-in is temporarily unavailable. You can still explore the neighborhood.');
  const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, cache: 'no-store', signal });
  if (!response.ok) throw new Error('We couldn’t check sign-in availability. Please try again.');
  const settings = await response.json();
  return { google: settings.external?.google === true, apple: settings.external?.apple === true };
}

export async function startOAuth(provider: OAuthProvider) {
  const availability = await getOAuthAvailability();
  if (!availability[provider]) throw new Error(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is not available yet. Please use another available option or keep browsing.`);
  rememberReturn();
  const { data, error } = await db().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: provider === 'google' ? 'openid email profile' : 'name email',
      skipBrowserRedirect: true,
    },
  });
  if (error) throw new Error('We couldn’t start secure sign-in. Please try again.');
  const target = data.url ? new URL(data.url) : null;
  const authOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  if (!target || target.origin !== authOrigin || target.pathname !== '/auth/v1/authorize') throw new Error('The sign-in destination could not be verified. Please try again.');
  window.location.assign(target.href);
}

let callbackPromise: Promise<string | null> | null = null;

// This module-level promise prevents duplicate one-use code exchange under React Strict Mode.
export function completeOAuthCallback(): Promise<string | null> {
  if (callbackPromise) return callbackPromise;
  const current = new URL(window.location.href);
  const hash = new URLSearchParams(current.hash.slice(1));
  const callback = current.pathname === '/auth/callback';
  const hasError = current.searchParams.has('error') || hash.has('error') || hash.has('error_description');
  if (!callback && !hasError) return Promise.resolve(null);
  callbackPromise = (async () => {
    const destination = consumeReturn();
    const code = current.searchParams.get('code');
    // Remove all codes/provider error data before rendering or navigating elsewhere.
    window.history.replaceState({}, '', destination);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (hasError) return 'Sign-in was cancelled or could not be completed. Please try Google or Apple again.';
    if (!code) return 'This sign-in link is incomplete or expired. Please start again from Sign in.';
    try {
      const { data, error } = await db().auth.exchangeCodeForSession(code);
      if (error || !data.session) return 'We couldn’t finish sign-in. Start again in the same browser and tab where you began.';
      return null;
    } catch { return 'The sign-in connection was interrupted. Please start again.'; }
  })();
  return callbackPromise;
}
