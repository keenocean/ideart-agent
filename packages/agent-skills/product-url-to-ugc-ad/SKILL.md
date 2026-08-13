---
name: product-url-to-ugc-ad
description: Turn a public product page, a user-provided brief, or existing project assets into a grounded vertical UGC-style social ad. Use when a user asks for a testimonial, unboxing, how-to, review, showcase, or short product video from any of those evidence sources.
---

# Product URL to UGC Ad

Create a product-faithful, reviewable short-form ad campaign from a public product page or an existing Active Ads Product. The durable Ads workflow produces one concept and exactly three controlled Hook variants. Default to the Phase 1 vertical short-video profile and respect the locked Campaign Brief rather than silently inventing production defaults.

## Runtime contract

When selected without an active execution receipt, call `run_skill` for `product-url-to-ugc-ad` once before the first concrete UGCmind tool. The Ads production sequence uses `ingest_ad_product`, `get_ad_product_context`, `create_ad_campaign`, `get_ad_campaign_context`, `create_ad_creative_variants`, and `enqueue_ad_variant_generations`. Supporting tools remain available for inspecting or preparing approved Project Assets, but do not replace the Ads domain tools with direct provider calls.

## 1. Build the evidence sheet

Start with at least one evidence source. Keep the source for every material fact:

- If a public product URL is supplied, call `ingest_ad_product` with the exact page URL and the applicable `brandId` when known. In a new Project with no active Ads Brand, the App creates one sparse, reviewable Brand inside this authorized tool call and returns its `brandId`; do not invent a separate Brand or bypass the tool. If it returns queued or running, end the turn and wait for the user to continue after the product draft and extracted assets are ready for review. When ingestion completes, direct the user to the returned `reviewPath`; do not proceed until review is complete. After the user approves the product draft, call `get_ad_product_context` with the reviewed `productId` before writing or generating. Do not fetch the page directly, summarize product facts from raw page content, or use candidate asset/claim ids from ingestion receipts.
- If the user supplies a brief without a URL, treat only explicit user-provided facts as approved evidence. Preserve unresolved claims as placeholders instead of silently strengthening them.
- If existing project assets are the product source, call `search_project_assets` when the asset is not already identified, then `read_project_asset` to verify its project, kind, metadata, and available product context.

For a user-provided brief or verified project assets, collect the information needed to create or review an Ads Product; do not treat those inputs as an Active Product automatically:

- product and brand name, category, intended use, variants, and price;
- materials, ingredients, features, constraints, and explicit proof;
- direct public product-image URLs supplied by the user or verified project image asset ids;
- exact source wording for every benefit, offer, or comparison that may appear.

Create a private claims allowlist with provenance for each entry. Every price, discount, statistic, certification, performance claim, health or beauty outcome, guarantee, shipping statement, and comparison must be supported by the evidence sheet. Do not turn a feature into a stronger outcome. Product imagery alone does not prove benefits or performance.

## 2. Create and lock the Campaign Brief

Infer only low-risk suggestions. Pass the explicit production inputs to `create_ad_campaign` and record:

- audience and recognizable pain point;
- core positioning and one primary benefit;
- available proof and likely objection;
- platform, aspect ratio, duration, tone, CTA, and ad mode;
- required product visibility and prohibited claims.

`create_ad_campaign` creates a versioned draft Brief from App-owned Brand and Product Context. Return the `campaignId`, Brief version, visible defaults, and review path or workspace location. Do not approve or lock the Brief on the user's behalf. End the production step until the user has approved and locked the latest Brief.

## 3. Prepare project assets

After `ingest_ad_product` completes and the user continues, call `get_ad_product_context` for the reviewed active `productId`. Use only the approved cleared Project Asset ids and approved claims returned by that context. If the user separately supplies a direct product-image URL, call `create_file_by_url` on that image URL. Never use the HTML product page as an image input. The returned asset id is the product reference.

If a verified project product asset already exists, reuse its asset id. Do not re-import or duplicate it. When the brief has no usable product image, use text-to-video only for non-identity-sensitive scenes. If accurate packaging or product appearance is important, return the grounded plan and identify the missing product reference instead of inventing it.

If trusted runtime context contains `generationContext.avatar.actorId`, treat that exact approved actor as the user's explicit casting choice: call `search_ugc_actors` with that actor id, do not recast, and materialize the selected approved image with `create_file_by_url`. Otherwise, if the user requests a presenter or reusable actor, call `search_ugc_actors` using only requested non-sensitive facets. Optionally call `prepare_reference_asset` once for the actor as `character` and once for the product as `product`.

If no actor matches, continue with a generated presenter unless exact identity consistency is required. Do not expose internal catalog records.

## 4. Define one concept and three controlled Hooks

After `get_ad_campaign_context` confirms that the latest Brief is locked, define one shared concept and exactly three unique Hook treatments. Use pattern interrupt, question, bold grounded claim, demonstration, POV, or curiosity. Keep the body structure, CTA, duration, platform, placement, language, assets, Claims, actor and voice controls identical across A/B/C:

- problem → product → benefit → CTA;
- hook → demonstration → proof → CTA;
- unboxing → first impression → product detail → CTA;
- objection → mechanism → grounded result → CTA.

Call `create_ad_creative_variants` once with the locked `campaignId`, `briefId`, shared production intent, and exactly three Hooks. Never create three unrelated concepts and label them an experiment. The App freezes the Generation Spec, Platform Spec and QA Rubric and rejects changed dimensions other than Hook.

## 5. Enqueue the three Variant generations

Call `enqueue_ad_variant_generations` once for the created `campaignId` and `creativeId`. This domain tool validates the locked Brief, resolves all three Variant snapshots, invokes the existing `video_generation` Tool Runtime path with Ads lineage, and returns three task receipts. Do not call `video_generation` separately for those Variants and do not pass raw provider URLs.

If a controlled first frame, actor, voice, or composite is required, prepare only approved Project Assets before creating the Variants and reference their stable Asset IDs in the Brief/Generation Spec. Do not mutate a locked Variant's inputs after task submission.

Generation completion is not ad approval. The App materializes output Assets, links them to each Variant, and runs deterministic QA. A `block` cannot be approved; warnings require explicit acknowledgement or waiver. Only a human review decision can approve a Variant.

When `enqueue_ad_variant_generations` returns accepted, queued, or running tasks, end the turn. On a later user turn, call `get_ad_campaign_context` to read bounded task, QA, review, and export status. Do not poll in a loop or submit another generation unless the user requests recovery for a retryable Variant.

## Output

Report stable `productId`, `campaignId`, `briefId`, `creativeId`, three `variantIds`, task receipts, Claims used, and current QA/review/export states. Mention unsupported Claims that were omitted. Never call a queued task an approved ad, never call a generated output a platform export, and never claim completion before human review and a distinct persisted export Asset exist.

Read `references/upstream.md` only for provenance of the earlier workflow adaptation; it is not an execution guide.
