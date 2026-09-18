export type Service = (action: string, data?: Record<string, unknown>) => Promise<any>;
export type Settings = { token: string; phoneId: string; wabaId: string; version: string; language: string; templates: Record<string, string> };
export async function signatureValid(body: string, signature: string | null, secret: string) {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature.slice(7).match(/../g)!, hex => parseInt(hex, 16));
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(body));
}
export async function dispatch(service: Service, config: Settings, transport: typeof fetch = fetch) {
  await service('cleanup');
  let processed = 0;
  for (let i = 0; i < 3; i++) {
    const job = await service('claim');
    if (!job) break;
    const recipient = await service('authorize', { id: job.id });
    if (!recipient) continue;
    let result = 'unknown'; let messageId: string | undefined;
    try {
      const response = await transport(`https://graph.facebook.com/${config.version}/${config.phoneId}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000),
        body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient.phone.replace(/^\+/, ''), type: 'template',
          biz_opaque_callback_data: job.id,
          template: { name: config.templates[job.event], language: { code: config.language }, components: [{ type: 'body', parameters: [{ type: 'text', text: job.order_id.slice(0, 8) }] }] } }),
      });
      const data = await response.json();
      if (response.ok && typeof data.messages?.[0]?.id === 'string') { result = 'accepted'; messageId = data.messages[0].id; }
      else if (response.status === 429 && data.error && !data.messages) result = 'retry';
      else if (response.status >= 400 && response.status < 500 && data.error && !data.messages) result = 'failed';
      // Timeout, 5xx, malformed response or lost accepted response stays UNKNOWN: never blind resend.
    } catch { /* Do not log tokens, payloads, phones or provider response bodies. */ }
    await service('finish', { id: job.id, result, ...(messageId ? { message_id: messageId } : {}) });
    processed++;
  }
  return { processed };
}
export async function processWebhook(payload: any, config: Pick<Settings, 'phoneId' | 'wabaId'>, service: Service) {
  if (payload?.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) return;
  for (const entry of payload.entry) {
    if (entry.id !== config.wabaId || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      const value = change.value;
      if (change.field !== 'messages' || value?.metadata?.phone_number_id !== config.phoneId) continue;
      for (const message of value.messages ?? []) {
        if (typeof message.from !== 'string' || !/^[1-9][0-9]{7,14}$/.test(message.from)) continue;
        const text = message.text?.body ?? message.button?.text ?? message.interactive?.button_reply?.title;
        if (typeof text === 'string' && text.length <= 100) await service('inbound', { phone: `+${message.from}`, text, message_id: message.id });
      }
      for (const status of value.statuses ?? []) {
        if (typeof status.id !== 'string' || !['sent', 'delivered', 'read', 'failed'].includes(status.status) || !/^\d{1,12}$/.test(String(status.timestamp))) continue;
        await service('status', { message_id: status.id, status: status.status, timestamp: status.timestamp,
          opaque_id: typeof status.biz_opaque_callback_data === 'string' ? status.biz_opaque_callback_data : null });
      }
    }
  }
}
