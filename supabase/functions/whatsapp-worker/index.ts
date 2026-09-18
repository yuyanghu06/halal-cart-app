declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
import { dispatch } from '../_shared/whatsapp.ts';
import { config, configured, env, matchesSecret, reply, service } from '../_shared/runtime.ts';
Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!await matchesSecret(request.headers.get('x-worker-secret') || '', env('WHATSAPP_WORKER_SECRET'))) return reply(401, { error: 'Unauthorized' });
  const settings = config();
  if (!configured(settings)) return reply(503, { error: 'Notifications are not configured' });
  // Keep dispatch alive after acknowledging pg_net; claims make overlapping ticks safe.
  EdgeRuntime.waitUntil(dispatch(service, settings).catch(() => { /* A lost claim becomes unknown; no blind resend. */ }));
  return reply(202, { scheduled: true });
});
