import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import {
  authorizeLibraryMediaForChat,
  isLocalChatMediaUrl,
  mediaTypeForFile,
  newAgentSessionId,
  newAttachmentId,
  publishChatMediaSources,
  uploadChatMedia,
  type PendingAttachment,
} from '@/lib/agent';
import {
  initialTurnStorageKey,
  serializeInitialTurnHandoff,
} from '@/lib/agent-chat';
import type { AgentComposerSettings } from '@/lib/agent-settings';
import {
  applyGenerationPreset,
  requestAttachments,
  validateGenerationAttachments,
  type GenerationEntryContext,
  type GenerationPreset,
  type GenerationSettingSources,
} from '@/lib/generation-entry';
import { isVideoUrl } from '@/lib/media';
import { m } from '@/paraglide/messages.js';
import type { LibraryMedia } from '@/components/agent/chat-composer';

import {
  persistComposerSettings,
  readStoredComposerSettings,
} from './use-composer-settings';
import { useComposerSkill } from './use-composer-skill';

export type UseGenerationEntryOptions = {
  entryContext?: GenerationEntryContext;
  preset?: GenerationPreset;
  /** Preserve PromptLauncher behavior; marketing pages leave this false. */
  persistSettingsOnChange?: boolean;
};

export type GenerationEntryController = {
  value: string;
  setValue: (value: string) => void;
  attachments: PendingAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<PendingAttachment[]>>;
  settings: AgentComposerSettings;
  settingSources: GenerationSettingSources;
  setSettings: (settings: AgentComposerSettings) => void;
  saveSettingsAsDefault: () => void;
  skillName?: string;
  setSkillName: (skillName: string | undefined) => void;
  submitting: boolean;
  uploading: boolean;
  hasUploaded: boolean;
  ensureSessionId: () => string;
  addFiles: (files: File[]) => Promise<void>;
  addLibraryMedia: (media: LibraryMedia[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  submit: () => void;
};

export function useGenerationEntry({
  entryContext = { kind: 'home' },
  preset,
  persistSettingsOnChange = false,
}: UseGenerationEntryOptions = {}): GenerationEntryController {
  const router = useRouter();
  const { data: session } = useSession();
  const initial = useMemo(
    () => applyGenerationPreset(undefined, preset),
    [preset]
  );
  const [value, setValue] = useState(preset?.initialPrompt ?? '');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [settings, setSettingsState] = useState(initial.settings);
  const [settingSources, setSettingSources] = useState(initial.sources);
  const [skillName, setSkillName] = useComposerSkill();
  const [submitting, setSubmitting] = useState(false);
  const pendingSessionId = useRef<string | null>(null);

  const ensureSessionId = useCallback(() => {
    pendingSessionId.current ??= newAgentSessionId();
    return pendingSessionId.current;
  }, []);

  useEffect(() => {
    const applied = applyGenerationPreset(
      readStoredComposerSettings() ?? undefined,
      preset
    );
    setSettingsState(applied.settings);
    setSettingSources(applied.sources);
  }, [preset]);

  const setSettings = useCallback(
    (next: AgentComposerSettings) => {
      const applied = applyGenerationPreset(next, preset);
      setSettingsState(applied.settings);
      setSettingSources(applied.sources);
      if (persistSettingsOnChange) {
        try {
          persistComposerSettings(applied.settings);
        } catch {
          // Storage is optional; the in-memory choice still works.
        }
      }
    },
    [persistSettingsOnChange, preset]
  );

  const saveSettingsAsDefault = useCallback(() => {
    try {
      persistComposerSettings(settings);
    } catch {
      // Storage is optional; callers may still show their own acknowledgement.
    }
  }, [settings]);

  const policyRemaining = useCallback(
    (candidateCount: number) => {
      const maximum = preset?.inputPolicy?.maximum ?? 16;
      return Math.max(
        0,
        Math.min(candidateCount, maximum - attachments.length)
      );
    },
    [attachments.length, preset?.inputPolicy?.maximum]
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      const accepted = preset?.inputPolicy?.accepts;
      const selected = files
        .map((file) => ({ file, kind: mediaTypeForFile(file) }))
        .filter(
          (
            item
          ): item is {
            file: File;
            kind: 'image' | 'audio' | 'video';
          } => item.kind !== null && (!accepted || accepted.includes(item.kind))
        )
        .slice(0, policyRemaining(10));
      if (selected.length === 0) return;
      if (!session?.user) {
        toast.error(m['landing.hero.sign_in_to_upload']());
        return;
      }

      const created = selected.map(({ file, kind }) => ({
        id: newAttachmentId(),
        name: file.name || 'media',
        kind,
        preview: URL.createObjectURL(file),
        status: 'uploading' as const,
        file,
      }));
      setAttachments((previous) => [
        ...previous,
        ...created.map(({ file: _file, ...attachment }) => attachment),
      ]);
      try {
        const uploaded = await uploadChatMedia(
          created.map((item) => item.file),
          ensureSessionId()
        );
        setAttachments((current) =>
          current.map((item) => {
            const index = created.findIndex(
              (createdItem) => createdItem.id === item.id
            );
            return index >= 0 && uploaded[index]
              ? {
                  ...item,
                  url: uploaded[index].url,
                  receipt: uploaded[index].receipt,
                  status: 'uploaded',
                }
              : item;
          })
        );
      } catch (error) {
        const message = (error as Error).message || 'Upload failed';
        toast.error(message);
        const ids = new Set(created.map((item) => item.id));
        setAttachments((current) =>
          current.map((item) =>
            ids.has(item.id)
              ? { ...item, status: 'error', error: message }
              : item
          )
        );
      }
    },
    [
      ensureSessionId,
      policyRemaining,
      preset?.inputPolicy?.accepts,
      session?.user,
    ]
  );

  const addLibraryMedia = useCallback(
    async (media: LibraryMedia[]) => {
      const selected = media
        .filter(
          (item) =>
            !attachments.some(
              (attachment) =>
                attachment.preview === item.src || attachment.url === item.src
            )
        )
        .filter((item) => {
          const type =
            item.mediaType ?? (isVideoUrl(item.src) ? 'video' : 'image');
          return (
            !preset?.inputPolicy || preset.inputPolicy.accepts.includes(type)
          );
        })
        .slice(0, policyRemaining(media.length));
      if (selected.length === 0) return;
      if (!session?.user) {
        toast.error(m['landing.hero.sign_in_to_upload']());
        return;
      }

      const created: PendingAttachment[] = selected.map((item) => ({
        id: newAttachmentId(),
        name: item.name || 'media',
        kind: item.mediaType ?? (isVideoUrl(item.src) ? 'video' : 'image'),
        preview: item.src,
        ...(isLocalChatMediaUrl(item.src) ? {} : { url: item.src }),
        status: 'uploading',
      }));
      setAttachments((previous) => [...previous, ...created]);
      try {
        const targetSessionId = ensureSessionId();
        const uploaded = await Promise.all(
          selected.map((item) =>
            isLocalChatMediaUrl(item.src)
              ? publishChatMediaSources(
                  [{ src: item.src, name: item.name }],
                  targetSessionId
                ).then(([uploadedItem]) => uploadedItem)
              : authorizeLibraryMediaForChat(item, targetSessionId)
          )
        );
        setAttachments((current) =>
          current.map((item) => {
            const index = created.findIndex(
              (createdItem) => createdItem.id === item.id
            );
            return index >= 0 && uploaded[index]
              ? {
                  ...item,
                  url: uploaded[index].url,
                  receipt: uploaded[index].receipt,
                  status: 'uploaded',
                }
              : item;
          })
        );
      } catch (error) {
        const message = (error as Error).message || 'Upload failed';
        toast.error(message);
        const ids = new Set(created.map((item) => item.id));
        setAttachments((current) =>
          current.map((item) =>
            ids.has(item.id)
              ? { ...item, status: 'error', error: message }
              : item
          )
        );
      }
    },
    [
      attachments,
      ensureSessionId,
      policyRemaining,
      preset?.inputPolicy,
      session?.user,
    ]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target?.preview.startsWith('blob:'))
        URL.revokeObjectURL(target.preview);
      return previous.filter((item) => item.id !== id);
    });
  }, []);

  const uploading = attachments.some((item) => item.status === 'uploading');
  const hasUploaded = attachments.some((item) => item.status === 'uploaded');

  const submit = useCallback(() => {
    const prompt = value.trim();
    if ((!prompt && !hasUploaded) || uploading || submitting) return;
    if (preset?.inputPolicy) {
      const policyError = validateGenerationAttachments(
        requestAttachments(attachments),
        preset.inputPolicy
      );
      if (policyError) {
        toast.error(policyError);
        return;
      }
    }
    setSubmitting(true);
    const sessionId = ensureSessionId();
    try {
      sessionStorage.setItem(
        initialTurnStorageKey(sessionId),
        serializeInitialTurnHandoff({
          prompt,
          settings,
          skillName,
          attachments,
          entryContext,
        })
      );
    } catch {
      // The destination still opens; it simply cannot recover the initial turn.
    }
    router.push(`/chat/${sessionId}`);
  }, [
    attachments,
    ensureSessionId,
    entryContext,
    hasUploaded,
    preset?.inputPolicy,
    router,
    settings,
    skillName,
    submitting,
    uploading,
    value,
  ]);

  return {
    value,
    setValue,
    attachments,
    setAttachments,
    settings,
    settingSources,
    setSettings,
    saveSettingsAsDefault,
    skillName,
    setSkillName,
    submitting,
    uploading,
    hasUploaded,
    ensureSessionId,
    addFiles,
    addLibraryMedia,
    removeAttachment,
    submit,
  };
}
