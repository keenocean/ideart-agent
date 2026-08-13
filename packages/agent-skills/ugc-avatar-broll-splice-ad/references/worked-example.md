# Worked Example

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Example Brand Grounding

- Product: dashboard SaaS for weekly reporting.
- Audience: busy agency operators.
- Brand accent: electric blue `#2F6BFF`.
- Dark UI pad color: `#090D18`.
- Caption preset: `clean-bold`, Anton, active word `#2F6BFF`.
- Confirm delivery mode before production: Mode A separate clips + edit map, or Mode B single finished video.
- Caption coverage is a per-ad choice: avatar-only by default, or throughout when the user asks.
- Music, when used, is instrumental and mixed under the voice at 12-15% volume.

## 30s Script Map

| Beat   | Duration | Visual                                           | Voice                                                                                                                 |
| ------ | -------: | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Hook   |       8s | Avatar selfie, natural light, blue sleeve accent | "If your Monday reports still take half the morning, stop. This is the shortcut I wish I had sooner."                 |
| Demo 1 |       8s | User screen recording: import/source selection   | "I connect the client sources once, pick the reporting view, and it builds the first draft before my coffee is done." |
| Demo 2 |       9s | User screen recording: final chart/output reveal | "The part that sold me is the cleanup. It turns messy notes into something I can actually send."                      |
| CTA    |       5s | Avatar selfie returns                            | "Go check out MetricDesk. It's the edge your reporting week needs."                                                   |

## Mode A Deliverables

- `avatar:segment:hook`
- `avatar:segment:demo1_audio`
- `avatar:segment:demo2_audio`
- `avatar:segment:cta`

Edit map:

| Timeline | Source             | In/Out                | Notes       |
| -------- | ------------------ | --------------------- | ----------- |
| 0-8s     | avatar hook        | full                  | captions on |
| 8-16s    | broll_1 + demo1 VO | trim to output reveal | broll muted |
| 16-25s   | broll_2 + demo2 VO | trim to final chart   | broll muted |
| 25-30s   | avatar CTA         | full                  | captions on |

Mode A rule: render avatar performance for demo beats too, but deliver only the audio/timing for those middle beats so the user's B-roll hides the avatar video.

## Mode B Timeline Schema

```json
[
  {
    "type": "avatar_video",
    "asset_url": "avatar:segment:hook",
    "audio_url": "avatar:segment:hook:audio",
    "words_file": "avatar:segment:hook:words",
    "duration": 8
  },
  {
    "type": "broll_under_avatar_vo",
    "asset_url": "broll:demo1:padded",
    "audio_url": "avatar:segment:demo1:audio",
    "words_file": "avatar:segment:demo1:words",
    "duration": 8,
    "broll_audio": "muted"
  }
]
```

## Mode B ffmpeg Recipes

Pad tall or narrow B-roll to 1080x1920:

```bash
ffmpeg -i broll.mov -vf "scale=1080:-2:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x090D18,setsar=1" -an broll_padded.mp4
```

Stretch a short recording to the VO duration:

```bash
ffmpeg -i broll_padded.mp4 -vf "setpts=1.159*PTS" -an broll_stretched.mp4
```

Trim a long recording:

```bash
ffmpeg -ss 00:00:03.200 -i broll_padded.mp4 -t 8.0 -an broll_trimmed.mp4
```

## QA Frames

Pull representative frames:

```bash
ffmpeg -i final.mp4 -vf "select='eq(n,0)+eq(t,8)+eq(t,16)+eq(t,25)',scale=270:480,tile=4x1" qa-strip.jpg
```

Check avatar identity, caption coverage, B-roll fill, muted B-roll audio, and brand accent color.
