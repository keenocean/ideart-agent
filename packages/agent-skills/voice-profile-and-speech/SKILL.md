---
name: voice-profile-and-speech
description: Generate model-default narration or create and reuse an authorized voice profile from approved project audio. Use for voice profile creation, consent-aware voice reuse, text-to-speech production, pronunciation direction, or spoken ad assets.
---

# Voice Profile and Speech

Create voice assets only from authorized samples and keep every input inside the UGCmind project asset pipeline.

## Runtime contract

When selected without an active execution receipt, call `run_skill` for `voice-profile-and-speech` once before the first concrete UGCmind tool. Allowed tools are `create_file_by_url`, `search_project_assets`, `read_project_asset`, `create_voice_profile`, and `speech_generation`.

## Safety gate

Do not create a voice profile unless the user explicitly requests it and confirms authorization to use the source speaker's voice. Do not infer consent from a public URL. Refuse deceptive impersonation, fraud, harassment, evasion, or unauthorized cloning. When identity reuse is unnecessary or authorization is missing, call `speech_generation` without a voice profile and use the selected model's default voice. The runtime does not expose a browsable catalog-voice tool.

## Workflow

1. Identify whether the task needs authorized identity reuse or only generated speech. Trusted `generationContext.voice` is the user's explicit selection for this turn: use its `profileId` when its mode is `profile` or `project_default`, and omit voice references when its mode is `model_default`. Default to reference-free narration when a reusable identity is not required.
2. For a public authorized audio URL, call `create_file_by_url` and use the returned project asset id. Never give the raw URL to profile or speech tools.
3. For existing assets, call `search_project_assets`, then `read_project_asset` to verify the chosen files are audio and belong to the intended project.
4. For profile creation, select one to three clean samples with one speaker, little background noise, and representative pronunciation. Call `create_voice_profile` with the project audio asset ids, a non-deceptive display name, language notes, and the authorization context requested by its schema.
5. For narration, prepare the exact approved script. Add pronunciation, pause, pacing, and emotional direction only where needed. Call `speech_generation` with the approved `voiceProfileId` when identity reuse is authorized. Otherwise omit voice references and let the selected model provide its default voice; do not invent a catalog voice id.
6. If the tool returns queued or running, end the turn and do not create a duplicate task. Report the task reference rather than claiming the audio is complete.

## Script preparation

- Expand ambiguous abbreviations and numbers when pronunciation matters.
- Add phonetic guidance for product names in tool instructions, not the final transcript.
- Break long copy into natural breath groups.
- Preserve required legal language exactly.
- Estimate duration from delivery pace and shorten the copy before forcing unnatural speed.

## Output

Return whether the generation used model-default narration or an authorized profile, the authorization basis and sample asset ids when applicable, the created voice profile id, speech task status, and the final audio `assetId` or `artifactRef` only when available. Clearly separate a queued job from a completed asset.
