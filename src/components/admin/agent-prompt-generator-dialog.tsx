import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptRequirements {
  targetRole: string;
  primaryObjective: string;
  targetAudience: string;
  domainExpertise: string;
  communicationStyle: string;
  additionalRequirements: string;
}

interface GenerationResponse {
  prompt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (prompt: string) => void;
}

const EMPTY_REQUIREMENTS: PromptRequirements = {
  targetRole: '',
  primaryObjective: '',
  targetAudience: '',
  domainExpertise: '',
  communicationStyle: '',
  additionalRequirements: '',
};

export function AgentPromptGeneratorDialog({
  open,
  onOpenChange,
  onGenerated,
}: Props) {
  const [requirements, setRequirements] = useState(EMPTY_REQUIREMENTS);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<GenerationResponse>('/api/admin/agent-prompt/generate', {
        ...requirements,
      }),
    onSuccess: (result) => {
      onGenerated(result.prompt);
      onOpenChange(false);
      toast.success(m['admin.settings.agent_prompt.generate_success']());
    },
  });
  const generating = mutation.isPending;

  useEffect(() => {
    if (!open) return;
    setRequirements(EMPTY_REQUIREMENTS);
    mutation.reset();
    // The mutation object is unstable; reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canGenerate = useMemo(
    () =>
      Boolean(
        requirements.targetRole.trim() && requirements.primaryObjective.trim()
      ),
    [requirements.primaryObjective, requirements.targetRole]
  );

  function update(name: keyof PromptRequirements, value: string) {
    setRequirements((current) => ({ ...current, [name]: value }));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (generating && !nextOpen) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!generating}
      >
        <DialogHeader>
          <DialogTitle>
            {m['admin.settings.agent_prompt.generate_title']()}
          </DialogTitle>
          <DialogDescription>
            {m['admin.settings.agent_prompt.generate_description']()}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canGenerate && !generating) mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PromptInput
              id="agent-prompt-target-role"
              label={m['admin.settings.agent_prompt.target_role']()}
              value={requirements.targetRole}
              onChange={(value) => update('targetRole', value)}
              placeholder={m[
                'admin.settings.agent_prompt.target_role_placeholder'
              ]()}
              required
              maxLength={160}
            />
            <PromptInput
              id="agent-prompt-target-audience"
              label={m['admin.settings.agent_prompt.target_audience']()}
              value={requirements.targetAudience}
              onChange={(value) => update('targetAudience', value)}
              placeholder={m[
                'admin.settings.agent_prompt.target_audience_placeholder'
              ]()}
              maxLength={500}
            />
          </div>

          <PromptInput
            id="agent-prompt-primary-objective"
            label={m['admin.settings.agent_prompt.primary_objective']()}
            value={requirements.primaryObjective}
            onChange={(value) => update('primaryObjective', value)}
            placeholder={m[
              'admin.settings.agent_prompt.primary_objective_placeholder'
            ]()}
            required
            multiline
            maxLength={1000}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <PromptInput
              id="agent-prompt-domain-expertise"
              label={m['admin.settings.agent_prompt.domain_expertise']()}
              value={requirements.domainExpertise}
              onChange={(value) => update('domainExpertise', value)}
              placeholder={m[
                'admin.settings.agent_prompt.domain_expertise_placeholder'
              ]()}
              maxLength={1000}
            />
            <PromptInput
              id="agent-prompt-communication-style"
              label={m['admin.settings.agent_prompt.communication_style']()}
              value={requirements.communicationStyle}
              onChange={(value) => update('communicationStyle', value)}
              placeholder={m[
                'admin.settings.agent_prompt.communication_style_placeholder'
              ]()}
              maxLength={500}
            />
          </div>

          <PromptInput
            id="agent-prompt-additional-requirements"
            label={m['admin.settings.agent_prompt.additional_requirements']()}
            value={requirements.additionalRequirements}
            onChange={(value) => update('additionalRequirements', value)}
            placeholder={m[
              'admin.settings.agent_prompt.additional_requirements_placeholder'
            ]()}
            multiline
            maxLength={2000}
          />

          {mutation.isError && (
            <p className="text-destructive text-sm" role="alert">
              {mutation.error instanceof Error
                ? mutation.error.message
                : m['admin.settings.agent_prompt.generate_error']()}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generating}
            >
              {m['admin.settings.agent_prompt.cancel']()}
            </Button>
            <Button type="submit" disabled={!canGenerate || generating}>
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {generating
                ? m['admin.settings.agent_prompt.generating']()
                : m['admin.settings.agent_prompt.generate']()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PromptInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  multiline = false,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
  maxLength: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          rows={3}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
        />
      )}
    </div>
  );
}
