# Machine tells: how to recognise and remove them

Google does not detect whether text was AI-generated. It judges quality, and it
judges publishing speed. So "avoid writing an AI article" means two things:
remove the machine feel from each article, and never publish in bulk.

This file covers the first. Read the draft against each tell in order and edit.
A paragraph that trips two or more tells gets rewritten, not patched.

## The six tells

| # | Tell | What it looks like | Fix |
| --- | --- | --- | --- |
| 1 | **Boilerplate opening** | "In today's digital age…", "With the rapid development of…", "Welcome to our blog", "Have you ever wondered…" | Delete the first two sentences. Open on the scenario: *"You just finished recording a podcast. Now you need a transcript. Here's how."* The keyword still has to appear in the first 100 words. |
| 2 | **Filler connectives** | Furthermore / Moreover / In addition / Additionally / It is worth noting that / It is important to note / Notably | Delete them all. Use a short sentence as the transition. Two in one paragraph means the paragraph is padding; rewrite it. |
| 3 | **Forced balance** | "On one hand… on the other hand", "While X has its benefits, it also has drawbacks", "There are pros and cons" | State the conclusion. Use a two-sided structure only in a vs article where you actually measured both sides. A how-to does not need dialectics. |
| 4 | **Paragraph-closing summary** | "What this means is…", "As we can see…", "In other words…", "This highlights the importance of…" | Cut the last sentence. The fact is the ending. |
| 5 | **No specifics** | "This is a good practice", "many users find", "can significantly improve" | Replace with something only this team could write: a measurement, a date, a screenshot, a named failure. Minimum two per article. If you do not have one, get one from the user; do not write around it. |
| 6 | **Uniform rhythm** | Every paragraph is five or six lines; every section has the same shape; every H2 is followed by exactly one paragraph and a list | Break it on purpose. A one-line paragraph. A three-line one. Then a longer one. Vary whether a section opens with a sentence, a number, or a question. |

## Banned words and phrases

Strip on sight. Each one is a marker readers have learned to associate with unedited AI output.

- delve / delve into
- moreover, furthermore, additionally
- in conclusion, to sum up, in summary
- in today's digital landscape / digital age / fast-paced world
- it is worth noting, it is important to note, notably
- a testament to, a game-changer, revolutionize, unlock, elevate, seamless, robust, leverage (as a verb), harness, navigate (the complexities of)
- crucial, vital, essential (when used as intensifiers rather than literal claims)
- comprehensive guide, ultimate guide (in body text; a Title may use "guide" once)
- whether you're a beginner or an expert
- rich tapestry, landscape, realm, journey (metaphorical)
- Let's dive in / Let's explore / Without further ado

## Voice rules that prevent tells in the first place

- Plain words. The community standard is "a five-year-old could follow the vocabulary." Explain like you would to a friend across a table.
- Short paragraphs: never more than four or five lines. If a point needs a list, a table, or a screenshot, use that instead of a long sentence.
- Say what you measured, not what is generally true. "Our reference set of 24 photos" beats "studies show".
- Say what the product cannot do. A real limitation reads as human; a page with no caveats reads as marketing.
- One idea per sentence. Cut every clause that exists only to sound thorough.
- No hedged verdicts. If the answer is "use a side part", write that.

## A fallback for short, non-article text

For forum replies and comments that keep getting flagged as AI, one community
member found this works: instruct the model to write in the style of a Chinese
learner of English, plain and literal, limited vocabulary, no slang or
contractions. It lowers detector scores markedly. It is not the standard for a
full article; use the six-tell pass above for those. Keep it as a last resort
for short-form only.

## The three-layer filter

```
Layer 1: AI first draft   (prompt + keyword + scenario + material)
Layer 2: AI self-score    (readability, length, density, structure, grammar; score → reason → revised draft)
Layer 3: human read       (this file as the checklist, line by line)   ← never skipped
Layer 4: native-speaker review (multilingual sites; optional otherwise)
```

Layer 3 is not skimming. It is reading every paragraph against the six tells and
editing. The skill can perform layers 1 and 2 and a first pass of layer 3; the
final layer-3 read belongs to a person, and the hand-off must say so.
