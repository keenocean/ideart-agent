// Mint a new chat session id in the `s-<ts_ms>-<rand6>` format
// (e.g. `s-1777280106721-q5mzjc`). The same id is used as the chat row id,
// the open-agent-sdk session id, and the per-session workspace directory
// name, so it must stay filesystem- and URL-safe.
export function newAgentSessionId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `s-${ts}-${rand}`;
}

export function isAgentSessionId(value: string): boolean {
  return /^s-\d{10,}-[a-z0-9]{4,}$/.test(value);
}

/** An image the user attached to a composer, tracked through its upload. */
export interface PendingAttachment {
  id: string;
  name: string;
  /** Object URL while uploading, remote URL once uploaded. */
  preview: string;
  url?: string;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

export function newAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Upload one image and return its public URL. Requires a signed-in session. */
export async function uploadChatImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('files', file);

  const res = await fetch('/api/storage/upload-image', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  const json = await res.json();
  if (json.code !== 0 || !json.data?.urls?.[0]) {
    throw new Error(json.message || 'Upload failed');
  }
  return json.data.urls[0] as string;
}

/**
 * Image files carried by a paste event. Screenshots arrive as a single
 * `image/*` item with no name, so we synthesize one.
 */
export function imageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files = Array.from(data.files).filter((file) =>
    file.type.startsWith('image/')
  );
  if (files.length > 0) return files;

  return Array.from(data.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file);
}
