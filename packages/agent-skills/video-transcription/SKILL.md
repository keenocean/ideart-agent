---
name: video-transcription
description: 'Transcribe one public video/audio URL or uploaded media asset into a timestamped transcript artifact.'
tools:
  - prepare_transcription_media
  - transcribe_media
---

# Video Transcription Skill

Use this skill when the user asks to transcribe, caption, subtitle, or extract
spoken text from an audio or video source.

## Workflow

1. Accept exactly one source: one public HTTP(S) media/video-page URL or one
   uploaded audio/video project asset.
2. For every URL, call `prepare_transcription_media` first. It downloads the
   source inside the sandbox, extracts 16 kHz mono speech audio, splits long
   media into bounded chunks, and uploads those chunks directly to scoped
   object-storage URLs. Do not use `exec`, `curl`, or a raw downloader.
3. After preparation succeeds, take only the returned `prepared_media_id` and
   pass it to `transcribe_media`. Do not copy upload URLs or internal runtime
   fields into another tool call.
4. For an uploaded project audio/video asset, skip preparation and pass its
   `assetId`/`source_asset_id` directly to `transcribe_media`.
5. Preserve the user's requested language when provided. Otherwise leave the
   language unset so the provider can detect it.
6. Use `quality: "economy"` by default. This selects Groq for the lowest-cost
   transcription path and includes word timestamps.
7. Use `quality: "accurate"` when the user requests speaker diarization,
   audio-event tagging, or keyterm prompting. This selects the ElevenLabs
   option.
8. Call `transcribe_media` once with `prepared_media_id` for a URL, or with the
   uploaded project asset id for a project file.
9. If the response status is `queued`, `running`, or `waiting_provider`, end
   the turn after saying the transcript is being created. Do not call the tool
   again and do not poll from the model; the App refreshes the project artifact
   asynchronously.
10. When the completed artifact is available, mention its `artifactRef` and the
    JSON, TXT, SRT, and VTT export links returned by the tool.

## Parameters

`prepare_transcription_media` accepts:

- `source_url`: one public direct media URL or supported hosted video page.
- `file_name`: optional base filename.

`transcribe_media` accepts:

- `prepared_media_id`: the result of `prepare_transcription_media`; required
  for URL inputs.
- `assetId` or `source_asset_id`: one uploaded project audio/video asset.
- `file_name`: optional canonical transcript JSON filename.
- `language_code`: optional language hint; omit for auto-detection.
- `diarize`: request speaker labels when supported. Defaults to false.
- `tag_audio_events`: request audio-event labels when supported.
- `num_speakers`: optional expected speaker count from 1 to 32.
- `keyterms`: optional domain terms. ElevenLabs may charge a keyterm surcharge.
- `quality`: `economy` (default) or `accurate`.
- `model_option_id`: optional App-selected model option from runtime context.

## Output contract

The App persists one canonical transcript artifact with:

- normalized full text;
- language and duration;
- word-level timestamps;
- speaker-aware segments when the selected provider supports them;
- provider/model provenance without credentials;
- JSON, TXT, SRT, and VTT export URLs.

Provider keys, signed credentials, internal authorization context, and raw
secret-bearing responses must never appear in the artifact.
