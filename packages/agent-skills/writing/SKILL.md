---
name: writing
description: 'Primary skill for writing and generating documents. Use for ANY request to write, create, draft, or analyze content in form of: articles, deep analysis, research reports, papers, manuals, white papers, essays. Handles file generation (DOCX/PDF) and content revision.'
when: 'flags.general_refactor_v2 and mode == 0'
tools:
  - write_free_doc
  - publish_artifact
  - web_search
---

> App runtime migration note: this MVP imports the create-new-document path for catalog/run/load smoke. Legacy DOCX/PDF conversion helpers and the doc revision subagent are not included until App/FastClaw typed helpers are wired.

# Document Generation Skill

## Time Cost

Writing tasks are usually about **1-2 minutes** for short/simple work, **3-4 minutes** for standard documents or revisions, and **5-10+ minutes** for complex long-form work, heavy research, many source files, images, DOCX/PDF generation, or major revisions.

## Decision Framework

**First, determine: Modify or Create?**

Ask: **does the user have an existing document they want changed?** If yes → Modify. If the user wants a brand-new document produced → Create.

- **Modify** (revise agent, Scenario C): The user points to an existing document — uploaded or previously generated — and wants it changed. The scope of changes does not matter: replacing text, swapping images, updating personal info, restructuring sections, or polishing language are all Modify. Uploaded images, logos, or other assets alongside the document are materials for the modification, not signals to create.
- **Create** (`write_free_doc`, Scenario A/B): The user wants a brand-new document. Uploaded files, if any, are source material to draw from — not documents to be changed. Translation, summarization, and rewriting into a different form are also creation.

| User Intent                                                        | Action                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| **Modify** an existing document (uploaded or previously generated) | Scenario C — not available in this MVP; report the revision gap |
| **Create** a new document (with or without uploaded source files)  | Scenario A / B — `write_free_doc`                               |
| **Convert** an existing HTML document to Word/PDF                  | Not available in this MVP; report the conversion gap            |

---

## Prompt Inspiration Library

When prompt-library tools are available, use `find_prompt` when the user asks to find writing prompts, reusable prompt templates, prompt examples, inspiration, reference cards, content pattern ideas, campaign concepts, or content-generation instructions. Use `resultMode: "gallery"` for reference cards; otherwise keep the default compact result. Include the content type, audience, tone, format, model, language, and constraints when known. Skip it for direct drafting, factual reports, source-based writing, document conversion, revisions, or when the user provides a complete prompt/outline; if the tool is unavailable, continue from the user's brief.

Use `get_inspiration` only after a search result is clearly useful or the user chooses a result. Do not silently copy a full inspiration prompt; adapt only the relevant structure, style, or constraints to the user's writing brief.

Do not use `web_search`, `web_fetch`, or shell tools for prompt-library lookup. Use `web_search` only when the writing task itself needs current public facts or external research.

---

## `write_free_doc` Parameters

| Parameter     | Type      | Required | Description                                                                                                                                                                                                                                                                                                 |
| ------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `file_name`   | str       | Yes      | Output filename for the document. The final format (.html or .md) is auto-detected from the user's request                                                                                                                                                                                                  |
| `task`        | str       | No       | The user's writing request, passed faithfully. Copy or closely paraphrase what the user said -- MUST NOT add any requirements the user did not explicitly state (e.g. word count, tone, audience, structure, number of sections). Less is more: if unsure whether the user implied something, leave it out. |
| `file_list`   | list[str] | No       | Source references whose **full inline text content** is automatically fed to the writing agent -- do NOT read these files with `read_file` beforehand. Accepts project asset/artifact ids, simple artifactRef strings, generated artifact workspace paths, uploaded Parsed Text paths, URI, or title.       |
| `upload_flag` | bool      | No       | Set `True` when user uploaded files. Activates knowledge-based writing mode that prioritizes file content                                                                                                                                                                                                   |

**What goes into `file_list`:**

- Uploaded files' `Parsed Text` path from the workspace files table
- Prior `write_free_doc` results by `artifactRef.artifactId`, `asset_id`, `artifact_id`, or the generated workspace path shown by the app
- Any other material files the agent deems relevant to the writing task (data files, code output, extracted content, etc.)
- `web_search` results do NOT need to be in `file_list` -- they are captured in conversation history automatically

**IMPORTANT -- Avoid duplicate reading:**
Files in `file_list` are read in full and injected into the writing agent's context automatically. Do NOT call `read_file` on any file that will be (or has been) included in `file_list` -- doing so only duplicates content and wastes context window. The conversation history (including all prior tool call results) is also forwarded, so information already present in the dialogue does not need to be re-read either.

---

## Scenario A: Create New Document Using Uploaded Files as Source Material

Applies when the user wants to **create a new document** using uploaded files as **source material** (indicated by the workspace files table). If the user instead wants to modify the uploaded document in place, go to **Scenario C**.

**Do NOT call `read_file` on uploaded files.** The workspace files table already provides summaries, and `write_free_doc` will read the full content of every file in `file_list` internally. Reading files beforehand only creates duplicate content in context.

### 1. Evaluate Whether Web Search is Needed

**Default: Skip search.** Uploaded files usually provide sufficient material.

**Trigger search when:**

- User **explicitly requests** web research or online information
- Task requires **time-sensitive data** the files cannot contain (recent news, current statistics, events after file creation)
- You can identify a **specific content gap** -- files cover topic X but the task also requires data about Y that is absent from both files and your knowledge
- Task requires **comparison or competitive analysis** and files only cover one side
- **In-depth content demands** -- the document demands thorough, in-depth content (long-form reports, deep analysis, research papers, white papers, comprehensive guides). Even when uploaded files provide a foundation, conduct multi-step research to enrich the material with broader context, supporting evidence, and authoritative data

**Multi-step research** (for in-depth tasks): Don't settle for a single search. Break the topic into sub-topics or angles and run multiple targeted `web_search` calls to gather comprehensive coverage. For example, a research report on "AI in healthcare" should search for recent advances, regulatory landscape, case studies, and market data separately.

When search is triggered, use `web_search`. Results stay in conversation context and are automatically passed to the writing agent.

### 2. Collect file_list and Create the Document

Gather all material file paths into `file_list`:

- Each uploaded file's `Parsed Text` path from the workspace files table

Set `task` to the user's original request -- copy or closely paraphrase, do not expand or add constraints the user never mentioned.

Call `write_free_doc(file_name=..., task="...", file_list=[...], upload_flag=True)`.

### 3. Format Conversion

DOCX/PDF conversion is not available in this MVP runtime slice. If the user explicitly asks for Word/DOCX or PDF, create the document with `write_free_doc` when useful and report that conversion still needs an App/FastClaw typed helper.

---

## Scenario B: No Uploaded Files

Applies when the user provides only a text request without uploading any files.

### 1. Evaluate Whether Search is Needed

**Default: Call `write_free_doc` directly.** Internal knowledge is sufficient for most writing tasks (established topics, creative writing, general how-to, standard knowledge).

**Trigger search when:**

- **Timeliness** -- latest news, recent policies, current data, events likely after your training cutoff
- **High specificity** -- specific non-famous quantitative data, niche entity details, obscure technical facts
- **Fact-checking** -- user wants to verify a claim or find authoritative sources
- **Explicit request** -- user says "search", "research", "look up", "find information about"
- **In-depth content** -- the task demands thorough, long-form output (research reports, deep analysis, white papers, comprehensive guides, academic-style papers). These benefit significantly from multi-step research to provide factual grounding, diverse perspectives, and authoritative sources

**Multi-step research** (for in-depth tasks): Break the topic into key sub-topics or angles and run multiple targeted `web_search` calls to cover them comprehensively. A deep analysis should gather data from multiple dimensions -- don't rely on a single search query.

Use `web_search` for all search needs. Results stay in conversation context automatically and are passed to `write_free_doc`.

**Tie-breaker:** When uncertain whether search is necessary for a simple task, skip it. But when the user asks for a thorough, detailed, or research-oriented document, err on the side of searching.

### 2. Create the Document

Set `task` to the user's original request -- copy or closely paraphrase, do not expand or add constraints the user never mentioned.

Call `write_free_doc(file_name=..., task="...")`.

### 3. Format Conversion

Same as Scenario A step 3.

---

## Tool Orchestration

### Execution Pipeline

```
[web_search] → write_free_doc(file_list, upload_flag)
```

Brackets = optional. Each stage must complete before the next begins.

### Concurrency

- `web_search` calls **must finish** before `write_free_doc` is called
- `write_free_doc` must **never** run concurrently with search tools

### Modification vs. Creation

| Situation                                            | Tool                                               |
| ---------------------------------------------------- | -------------------------------------------------- |
| Create new content (even if based on uploaded files) | `write_free_doc`                                   |
| Modify an existing document in place                 | Not available in this MVP; report the revision gap |

### Format Conversion (Scenario A/B only — does NOT apply to Scenario C revise flow)

- `write_free_doc` auto-detects the output format (HTML or Markdown) based on the user's request — this applies only to Scenario A/B creation workflows
- Conversion requires a future App/FastClaw typed helper. Do not call local shell conversion scripts in this MVP runtime slice.
- **Scenario C (revise) has no format default.** The revise agent decides the output format by inspecting the target file.

### Artifact Delivery

`write_free_doc` returns a project artifact and an `artifactRef`. Treat that as already delivered. Do **not** call `publish_artifact` after `write_free_doc` unless you have a real workspace file that still needs publishing.

Use `publish_artifact(file_path="...")` only for real `/workspace` files created by sandbox tools. Do not pass `asset_id`, `artifact_id`, or `artifactRef`; existing project assets are already delivered or should be handled by explicit asset tools.

After any artifact is delivered, respond with a brief task-completion confirmation. Do not summarize the document's content — the file is automatically delivered to the user, and you cannot see the actual generated content.

---

## Scenario C: Document Modification / Revision

Document revision is not available in this MVP runtime slice because the legacy revise subagent has not been migrated. If the user asks to modify an existing document in place, explain that the current `writing` slice supports catalog/run/load and new-document creation only, then ask them to request a new generated document instead if that meets their need.
