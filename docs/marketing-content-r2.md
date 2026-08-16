# Marketing Content on private R2

Public tool/model/home content is edited under `product/marketing/**`, but the
page bodies are not shipped in Paraglide, Worker Static Assets, or client
chunks. A build produces immutable JSON release objects which the Worker reads
from a private R2 binding.

This setup is required for every Cloudflare deployment made from this template.
It is separate from:

- the public CDN bucket used for page images and videos;
- the Admin-configured storage used for generated user media; and
- the private `AGENT_SKILLS` release bucket.

## Runtime contract

| Setting                     | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `MARKETING_CONTENT`         | Private R2 binding that locates the release object store |
| `MARKETING_CONTENT_RELEASE` | SHA-256 release ID pinned by a Worker deployment         |

Objects use deterministic immutable keys:

```text
marketing-content/releases/<releaseId>/manifest.json
marketing-content/releases/<releaseId>/pages/<kind>/<entityId>/<locale>.json
marketing-content/releases/<releaseId>/directories/<kind>/<locale>.json
```

The publisher uploads page/directory objects first and the manifest last, then
downloads and hashes every object before changing the release pointer. Unknown
or unpublished routes remain 404. A route declared by the pinned manifest whose
object cannot be read or validated returns `503 + Retry-After`; it must not be
misreported as 404.

## Bootstrap a new template deployment

Choose names from the Worker name so cloned projects do not share content by
accident:

```bash
WORKER_NAME=your-worker-name
MARKETING_BUCKET="${WORKER_NAME}-marketing-content"
pnpm exec wrangler r2 bucket info "$MARKETING_BUCKET" || \
  pnpm exec wrangler r2 bucket create "$MARKETING_BUCKET"
```

Keep the bucket private. Do not enable `r2.dev` or attach a public domain. Add
the binding and placeholder to the gitignored working `wrangler.jsonc` copied
from `wrangler.example.jsonc`:

```jsonc
{
  "vars": {
    "MARKETING_CONTENT_RELEASE": "REPLACE_WITH_OUTPUT_OF_PNPM_MARKETING_SYNC_CONTENT_RELEASE",
  },
  "r2_buckets": [
    {
      "binding": "MARKETING_CONTENT",
      "bucket_name": "<worker-name>-marketing-content",
    },
  ],
}
```

The binding name is code-level API and must remain exactly
`MARKETING_CONTENT`. The physical bucket name may differ. Multiple projects may
technically share a bucket because release keys are immutable, but a dedicated
bucket per Worker is the default for permission, lifecycle, and accidental
cross-project isolation.

The `/deploy-cloudflare` Skill performs this bootstrap automatically and
idempotently. It probes the exact bucket with `wrangler r2 bucket info`, because
bucket-list output may be paginated.

## Build, publish, and deploy

Run the local validation and external-write dry-run first:

```bash
MARKETING_BUCKET=your-worker-name-marketing-content
pnpm marketing:build-content-release
pnpm marketing:check-scale
pnpm marketing:publish-content-release -- --dry-run --bucket="$MARKETING_BUCKET"
```

After the normal deployment confirmation, publish and verify the release. The
command also replaces `vars.MARKETING_CONTENT_RELEASE` in the working
`wrangler.jsonc`; it does not deploy the Worker:

```bash
pnpm marketing:publish-content-release -- --bucket="$MARKETING_BUCKET"
pnpm cf:deploy
```

Do not deploy a new release ID before its objects and manifest have passed
remote verification. Do not upload with 100-page scale fixtures: fixture mode is
isolated and the compiler rejects publish/index synchronization in that mode.

## Post-deploy verification

For the default template release:

```bash
URL=https://your-deployed-host.example
curl -sS -o /dev/null -w '%{http_code}\n' "$URL/tools"
curl -sS -o /dev/null -w '%{http_code}\n' "$URL/tools/ai-image-generator"
curl -sS -o /dev/null -w '%{http_code}\n' "$URL/tools/missing"
```

Expected statuses are 200, 200, and 404. Also confirm the released pages retain
their recorded robots/canonical policy; publishing content does not implicitly
change `noindex` to `index`.

## Rollback

Release objects are never overwritten. Keep at least the previous release ID
from the publisher output. To roll back:

1. set `vars.MARKETING_CONTENT_RELEASE` in `wrangler.jsonc` to the previous ID;
2. run `pnpm cf:deploy` through the normal deployment confirmation;
3. repeat the 200/404 and SEO smoke checks.

Do not copy objects, rewrite a mutable `latest`, or delete the failed release as
part of the rollback. Garbage collection is a separate, reference-aware task
with a retention period and dry-run.

## Migration checklist

- Copy `wrangler.example.jsonc` to the gitignored `wrangler.jsonc`.
- Choose a project-specific Worker and bucket name.
- Create or verify the private bucket.
- Configure exact binding `MARKETING_CONTENT`.
- Build and validate `product/marketing/**`.
- Dry-run, publish, download, and hash-verify the release.
- Pin `MARKETING_CONTENT_RELEASE` only after verification.
- Deploy through `pnpm cf:deploy`.
- Verify released routes, negative 404s, robots/canonical, and 503 diagnostics.
- Record the active and previous release IDs for rollback.
