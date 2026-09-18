'use client';
import { useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw } from 'lucide-react';
import { getOAuthAvailability, OAuthAvailability, OAuthProvider, startOAuth } from '@/lib/oauth';
import { Feedback, Modal, Spinner, useAction } from './ui';

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  return provider === 'google'
    ? <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.75-5.58-4.1H3.08v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.42 13.94A6 6 0 0 1 6.1 12c0-.67.12-1.32.32-1.94V7.47H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.53l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.47l3.34 2.59C7.2 7.71 9.4 5.96 12 5.96Z"/></svg>
    : <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="currentColor"><path d="M17.1 12.6c0-2 1.65-3 1.73-3.05-.95-1.39-2.43-1.58-2.95-1.6-1.26-.13-2.48.75-3.12.75-.64 0-1.65-.74-2.7-.72-1.39.02-2.69.83-3.4 2.09-1.46 2.52-.37 6.22 1.03 8.26.7 1 1.52 2.12 2.62 2.08 1.04-.04 1.44-.67 2.7-.67s1.63.67 2.72.65c1.14-.02 1.85-1 2.52-2.02.81-1.15 1.13-2.29 1.14-2.35-.02-.01-2.29-.87-2.3-3.42ZM15.03 6.62c.56-.7.95-1.64.85-2.62-.8.04-1.8.55-2.38 1.23-.52.61-.98 1.58-.86 2.52.9.07 1.8-.46 2.39-1.13Z"/></svg>;
}

export default function Auth({ close }: { close: () => void }) {
  const [providers, setProviders] = useState<OAuthAvailability | null>(null);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [redirecting, setRedirecting] = useState<OAuthProvider | null>(null);
  const action = useAction();
  useEffect(() => {
    const controller = new AbortController();
    setProviders(null); setLoadError('');
    getOAuthAvailability(controller.signal).then(setProviders).catch(error => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Sign-in availability could not be checked.');
    });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => { const restored = () => { setRedirecting(null); setRefresh(value => value + 1); }; window.addEventListener('pageshow', restored); return () => window.removeEventListener('pageshow', restored); }, []);
  return <Modal title="Your Halal Cart account" close={close}>
    <div className="auth-intro"><span className="eyebrow"><LockKeyhole size={14} /> ONE ACCOUNT. EVERY CORNER.</span><h3>Welcome to your neighborhood.</h3><p>Sign in securely with Google or Apple to order, share a sighting, or run your cart.</p></div>
    <div className="form-stack oauth-options">
      {(['google', 'apple'] as const).map(provider => <div key={provider}><button className={`oauth-button oauth-${provider}`} aria-describedby={!providers?.[provider] && providers ? `${provider}-availability` : undefined} disabled={!providers?.[provider] || action.busy || !!redirecting} onClick={() => action.run(async () => { setRedirecting(provider); try { await startOAuth(provider); } catch (error) { setRedirecting(null); throw error; } })}>{redirecting === provider ? <Spinner /> : <ProviderIcon provider={provider} />}Continue with {provider === 'google' ? 'Google' : 'Apple'}</button>{providers && !providers[provider] && <p id={`${provider}-availability`} className="provider-unavailable">{provider === 'google' ? 'Google' : 'Apple'} sign-in is not available yet.</p>}</div>)}
      {!providers && !loadError && <p className="small muted row" role="status"><Spinner />Checking secure sign-in options…</p>}
      <Feedback error={loadError || action.error} />
      {(loadError || (providers && (!providers.google || !providers.apple))) && <button className="text-button" disabled={action.busy || !!redirecting} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={15} />Refresh sign-in options</button>}
    </div>
    <p className="fine-print">Your identity provider handles sign-in. Halal Cart never asks for your provider password. By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy policy</a>.</p>
    <button className="text-button full" onClick={close}>Keep exploring without an account</button>
  </Modal>;
}
