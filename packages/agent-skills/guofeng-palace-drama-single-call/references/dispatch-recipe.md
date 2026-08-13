# Dispatch Recipe

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Preconditions

- Inspect every uploaded `input:image-N` with `get_asset`.
- Map each image to a role: location, male lead, female lead, guard, evidence prop, flashback figure.
- Register one voice-only persona per speaking character before dispatch.
- If the user supplied raw audio expecting timbre cloning, disclose before dispatch that Seedance speech uses registered internal persona voices and raw audio cannot be ingested as a custom timbre source.
- Do not generate new images.
- Do not call `assemble_video`; the final deliverable is the single `generate_scene_video` result.

## Single Call Payload

```json
{
  "backend": "seedance",
  "start_image": null,
  "reference_images": ["input:image-2", "input:image-6", "input:image-7"],
  "motion": "<time-blocked Chinese prompt>",
  "dialogue": [
    {
      "speaker": "persona:m1",
      "text": "那夜的事，你究竟瞒了我什么？",
      "voice_id": "<voice_id>",
      "delivery": "冷沉低压，命令式短促"
    }
  ],
  "duration": 15,
  "aspect_ratio": "16:9",
  "output_asset_id": "final:video",
  "scene_number": 0
}
```

`start_image` is shown as `null` only to emphasize that there is no generated storyboard start frame. Omit the field if the runtime accepts omitted optional fields more cleanly.

## Motion Template

```text
单条连续 Seedance 全能参考视频，电影感 3D 国风宫廷剧，16:9，约 [duration] 秒。

严格保留每个角色的服化道与五官，不得双胞胎/多胞胎/换脸/错位/穿模，画面内任何时刻男女主各只出现一人。
画面始终无字幕、无标题、无水印、无 UI 元素。

0-3s:
[中景 dyad opener anchored to location and character refs.]
男主（参考 {{input:image-X}}，[visual description]）...
女主（参考 {{input:image-Y}}，[visual description]）...
{{speak:persona:m1}}[short opening line]{{/speak}}
[one ambient sound punctuation].

3-6s:
硬切到 [resistance/detail beat]. {{speak:persona:f1}}[short reply]{{/speak}}

6-9s:
硬切到 [flashback insert, 0.6-1.0s, cool palette], no dialogue, only SFX. 硬切回宫殿。

9-12s:
硬切到 [trap-closing close-up/reverse shot]. {{speak:persona:m1}}[quiet dangerous line]{{/speak}}

12-15s:
硬切到 [unresolved close, face/eyes/breath]. {{speak:persona:f1}}[defiant final line]{{/speak}} [or silence].

所有转场只用硬切，不用淡入、淡出、叠化、字幕卡。
整体禁止任何背景音乐、配乐、纯音乐、乐器声、歌声；只保留人物对白、衣袍布料摩擦、脚步、殿门低响、竹叶沙沙等环境音和动作音效。
```

## Speaker Rules

- Reuse `persona:m1` for all male-lead lines and `persona:f1` for all female-lead lines.
- Do not create line-specific speakers.
- Every speak span must have a matching `dialogue[]` entry.
- Return exactly one asset: `[查看成片](final:video)`.
