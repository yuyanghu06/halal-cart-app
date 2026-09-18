import type { Service, Settings } from './whatsapp.ts';
export const env = (name: string) => Deno.env.get(name) || '';
export const service: Service = async (action, data = {}) => {
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/whatsapp_service`, {
    method: 'POST', headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_action: action, p_data: data }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Notification storage unavailable');
  return response.json();
};
export const config = (): Settings => ({ token: env('WHATSAPP_ACCESS_TOKEN'), phoneId: env('WHATSAPP_PHONE_NUMBER_ID'), wabaId: env('WHATSAPP_WABA_ID'), version: env('WHATSAPP_GRAPH_VERSION'), language: env('WHATSAPP_TEMPLATE_LANGUAGE'), templates: { created: env('WHATSAPP_TEMPLATE_CREATED'), ready: env('WHATSAPP_TEMPLATE_READY'), cancelled: env('WHATSAPP_TEMPLATE_CANCELLED') } });
export const configured = (value: Settings) => !!(value.token && /^\d+$/.test(value.phoneId) && /^\d+$/.test(value.wabaId) && /^v\d+\.\d+$/.test(value.version) && value.language && Object.values(value.templates).every(Boolean));
export const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function matchesSecret(value: string, secret: string) {
 if (!value || !secret) return false;
 const encoder = new TextEncoder();
 const a = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
 const b = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(secret)));
 let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]; return diff === 0;
}
