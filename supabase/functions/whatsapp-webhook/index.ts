import { processWebhook, signatureValid } from '../_shared/whatsapp.ts';
import { config, env, matchesSecret, reply, service } from '../_shared/runtime.ts';
Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    if (url.searchParams.get('hub.mode') !== 'subscribe' || !await matchesSecret(url.searchParams.get('hub.verify_token') || '', env('WHATSAPP_VERIFY_TOKEN'))) return reply(403, { error: 'Forbidden' });
    const challenge = url.searchParams.get('hub.challenge') || '';
    return /^\d{1,100}$/.test(challenge) ? new Response(challenge) : reply(400, { error: 'Invalid challenge' });
  }
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (Number(request.headers.get('content-length')) > 262144) return reply(413, { error: 'Too large' });
  const body = await request.text();
  if (body.length > 262144) return reply(413, { error: 'Too large' });
  if (!await signatureValid(body, request.headers.get('x-hub-signature-256'), env('WHATSAPP_APP_SECRET'))) return reply(401, { error: 'Invalid signature' });
  const settings = config();
  if (!settings.phoneId || !settings.wabaId) return reply(503, { error: 'Not configured' });
  try { await processWebhook(JSON.parse(body), settings, service); return reply(200, { received: true }); }
  catch { return reply(503, { error: 'Webhook unavailable' }); }
});
