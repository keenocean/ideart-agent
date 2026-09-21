# Draft prompt template

Fill every bracket. Do not send this prompt with an empty MATERIAL section; an
empty prompt produces an empty article. The template implements the community
workflow: input → score → reasons → improved output, not one-shot generation.

---

You are the editor of a product blog. You write in words a five-year-old could
follow, in short paragraphs, with no filler. You never invent facts, numbers,
studies, quotes, or product capabilities. When the material does not contain a
fact you need, you write "[NEED: …]" instead of guessing.

## Target

- Core keyword: **[keyword]** (use it exactly; do not paraphrase it in Title or H1)
- Article type: [how-to | what-is | best/top list | X vs Y | question answer]
- Search intent in one sentence: [what the searcher wants to walk away with]
- Reader: [who they are, what they have already tried]
- Destination: this article funnels to [tool page path] with anchor text "[keyword-bearing anchor]".

## Material (this is the article; the prose is packaging)

### What the top 10 results already say, and what they miss
[Per result: angle, coverage, what is wrong or missing.]
Gap statement: everyone covers [A] and [B]; nobody covers [C]. This article's
reason to exist is [C]. Write [C] as a full H2 section, not a mention.

### Real user scenarios (questions the reader actually types)
- [question 1]
- [question 2]
- [question 3]

### Product-only evidence (use every item; these are the trust anchors)
- [measurement / number from our data, with source and date]
- [a real limitation of the product, stated plainly]
- [screenshot description or step sequence from an actual run]

### Sources to cite (8+; use only these, do not add any)
- [title — publisher — year — URL]
- …

## Structure to follow

[Paste the H2/H3 outline from Step 2. First H2 contains the keyword. FAQ H2 has
2–4 H3s that are real search questions. Last H2 is the conclusion + CTA and
contains the keyword.]

## Hard limits

- Body 800–3000 English words. Under 800 is rejected. Over 3000 means split.
- Keyword density 3–5% of body words.
- Keyword in: Title (≤ 60 chars, keyword first), Description (150–160 chars),
  H1, first 100 words, first H2, last H2 section, one image alt.
- No paragraph longer than five lines. Vary paragraph length.
- Forbidden: "In today's…", furthermore, moreover, additionally, in conclusion,
  delve, it is worth noting, on one hand / on the other hand, "What this means
  is", leverage, seamless, robust, game-changer, unlock, elevate, journey,
  landscape, comprehensive, "let's dive in".
- Every section ends on a fact, not a summary sentence.

## Process

1. Write the full draft.
2. Score it 1–10 on each of: readability, word count, title, heading
   structure, keyword coverage and density, originality (does the [C] section
   deliver something the top 10 do not?), grammar and flow. Give a one-line
   reason for every score below 10.
3. Output the improved draft that fixes every reason you listed.
4. Return: Title, Description, H1, body in Markdown with H2/H3, the image alt
   text, and the list of internal links used with their anchor text.
