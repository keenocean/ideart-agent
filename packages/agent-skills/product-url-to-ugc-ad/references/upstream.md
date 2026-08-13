# Upstream workflow provenance

This runtime skill is an App-native adaptation. It does not execute third-party
CLIs or proxy requests to third-party skill backends.

## Primary source

- Project: [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills)
- Skill: `higgsfield-generate`
- Reviewed commit: `91051d3f260ae0792708c5eb0a87b07122ad3830`
- Upstream version: `0.12.0`
- License: MIT
- Adapted ideas: product URL ingestion, a 15-second 9:16 UGC default,
  ad-mode routing, and optional presenter selection.

The provider-specific bootstrap, authentication, commands, identifiers, and
polling flow were replaced with UGCmind's `run_skill`-authorized Tool Runtime.

## Secondary source

- Project: [Pika-Labs/Pika-Plugins](https://github.com/Pika-Labs/Pika-Plugins)
- Skill: `skills/ugc-ads`
- Reviewed commit: `f27b3ba28a7be7c5f3a74d8fdd54b770f5d8157b`
- License: Apache-2.0
- Adapted ideas: source-grounded advertising claims, a five-beat short-form
  story, and post-production only after the generated clip exists.

All runtime instructions were rewritten for UGCmind's tools, billing,
project-asset model, and asynchronous-delivery contracts.
