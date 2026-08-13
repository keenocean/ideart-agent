/**
 * Providers sometimes append a complete JSON response (including an echoed
 * request) to their error. Return the useful sentence without passing that
 * potentially sensitive body back into the chat transcript.
 */
export function summarizeProviderError(message: string): string {
  const start = message.search(/[[{]/);
  if (start === -1) return truncate(message);

  const prefix = message
    .slice(0, start)
    .trim()
    .replace(/[:\s]+$/, '');
  let payload: any;
  try {
    payload = JSON.parse(message.slice(start));
  } catch {
    return truncate(message);
  }

  const detail = payload?.detail ?? payload;
  const first = Array.isArray(detail) ? detail[0] : detail;
  const summary =
    (typeof first?.msg === 'string' && first.msg) ||
    (typeof first?.message === 'string' && first.message) ||
    (typeof payload?.error?.message === 'string' && payload.error.message) ||
    (typeof detail === 'string' && detail) ||
    '';
  if (!summary) return truncate(message);

  const type = typeof first?.type === 'string' ? ` (${first.type})` : '';
  return truncate(
    prefix ? `${prefix}: ${summary}${type}` : `${summary}${type}`
  );
}

function truncate(value: string, max = 300): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}
