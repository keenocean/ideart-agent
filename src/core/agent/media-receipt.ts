import { AUTH_SECRET_PLACEHOLDER, envConfigs } from '@/config';

import type { AgentMediaType, AgentVerifiedMedia } from './types';

const RECEIPT_VERSION = 1;
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const MAX_RECEIPT_CHARS = 4_096;

export interface AgentMediaReceiptPayload extends AgentVerifiedMedia {
  v: typeof RECEIPT_VERSION;
  userId: string;
  chatId: string;
  exp: number;
}

export interface CreateAgentMediaReceiptParams {
  userId: string;
  chatId: string;
  mediaType: AgentMediaType;
  url: string;
  now?: number;
  ttlMs?: number;
}

export interface VerifyAgentMediaReceiptParams {
  receipt: string;
  userId: string;
  chatId: string;
  mediaType: AgentMediaType;
  url: string;
  now?: number;
}

export async function createAgentMediaReceipt({
  userId,
  chatId,
  mediaType,
  url,
  now = Date.now(),
  ttlMs = DEFAULT_TTL_MS,
}: CreateAgentMediaReceiptParams): Promise<string> {
  const payload: AgentMediaReceiptPayload = {
    v: RECEIPT_VERSION,
    userId,
    chatId,
    mediaType,
    url,
    exp: now + ttlMs,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${await sign(encoded)}`;
}

export async function verifyAgentMediaReceipt({
  receipt,
  userId,
  chatId,
  mediaType,
  url,
  now = Date.now(),
}: VerifyAgentMediaReceiptParams): Promise<AgentVerifiedMedia | null> {
  if (receipt.length > MAX_RECEIPT_CHARS) return null;
  const [encoded, signature, extra] = receipt.split('.');
  if (!encoded || !signature || extra !== undefined) return null;
  if (!(await timingSafeEqual(signature, await sign(encoded)))) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(encoded));
  } catch {
    return null;
  }
  if (!isReceiptPayload(payload)) return null;
  if (
    payload.userId !== userId ||
    payload.chatId !== chatId ||
    payload.mediaType !== mediaType ||
    payload.url !== url ||
    payload.exp <= now
  ) {
    return null;
  }
  return { mediaType: payload.mediaType, url: payload.url };
}

function isReceiptPayload(value: unknown): value is AgentMediaReceiptPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.v === RECEIPT_VERSION &&
    typeof record.userId === 'string' &&
    record.userId.length > 0 &&
    typeof record.chatId === 'string' &&
    record.chatId.length > 0 &&
    (record.mediaType === 'image' ||
      record.mediaType === 'audio' ||
      record.mediaType === 'video') &&
    typeof record.url === 'string' &&
    record.url.length > 0 &&
    Number.isInteger(record.exp)
  );
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(receiptSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value)
  );
  return base64UrlEncode(new Uint8Array(signature));
}

function receiptSecret(): string {
  const secret = envConfigs.auth_secret.trim();
  if (!secret || secret === AUTH_SECRET_PLACEHOLDER) {
    throw new Error(
      'A non-placeholder AUTH_SECRET is required for media receipts.'
    );
  }
  return secret;
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

function base64UrlEncode(value: string | Uint8Array): string {
  const bytes =
    typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const padded = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    '='
  );
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0))
  );
}
