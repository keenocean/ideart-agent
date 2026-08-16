import type { GenerationPreset } from '@/lib/generation-entry';
import {
  ChatComposer,
  type ChatComposerProps,
} from '@/components/agent/chat-composer';

export type GenerationWorkbenchProps = ChatComposerProps & {
  locks?: GenerationPreset['locks'];
};

/**
 * Shared display surface for home, tool, and model generation entries.
 * State, persistence, uploads, and navigation stay in the controller hook.
 */
export function GenerationWorkbench({
  locks,
  ...props
}: GenerationWorkbenchProps) {
  return (
    <ChatComposer
      {...props}
      modeLocked={locks?.mediaMode}
      modelLocked={locks?.model}
    />
  );
}
