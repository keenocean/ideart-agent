# Podcast Troubleshooting

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## P0: Persona Missing

Symptom: preflight cannot canonicalize speaker or voice. Fix by bailing to producer: host and guest must be registered with `setup_persona`.

## P1: Composite Missing From Chunk References

Symptom: room or seating changes across chunks. Fix `reference_images[0] = podcast:composite`.

## P2: Eyes-To-Camera

Symptom: interview becomes presenter video. Add explicit inward eyeline clauses to composite, storyboard, and chunk prompt.

## P3: Microphones Missing Or Branded

Symptom: no podcast identity or unwanted brand text. Describe only generic black condenser mics; never name models.

## P4: B&W Storyboard Violation

Symptom: colored storyboard sheet. Regenerate with "strict black line art on pure white #FFFFFF; no color; no grey wash".

## P5: 180-Degree Break

Symptom: host/guest swap sides between panels or chunks. Restate host camera-left and guest camera-right in every guide prompt.

## P6: Listener Mouth Moves During Voiceover

Symptom: off-camera speech animates visible listener. Use `[voice-over, off-camera]` plus `[silent - mouth stays closed]` for visible listener.

## P7: Silent Tail Leaks Into Middle Chunk

Symptom: dead air before a splice. Remove all silent-hold language except final chunk.

## P8: Chunk Starts Like A New Episode

Symptom: greetings or reintroductions. Rewrite middle chunks to begin mid-thought.

## P9: Camera Moves

Symptom: push-ins, pans, handheld. Add exact lock line: "no camera motion, locked tripod, no zoom, no pan, no push, no pull".

## P10: Overacting

Symptom: exaggerated laughter or gestures. Add "understated, ordinary conversation, subtle movement".

## P11: Refusal Or Policy Soft-Fail

Symptom: generation declines because prompt sounds like imitation of a real show or person. Remove celebrity-style names and describe format generically.

## P12: Dead-Air Timing

Symptom: too little speech for 8-15s. Target 2.3-2.7 spoken words/sec and add natural micro-pauses only where needed.

## P13: Dialogue Mismatch

Symptom: transcription/caption mismatch. Ensure speak spans, dialogue entries, and `script_text` are verbatim identical.

## P14: Wrong Vibe

Symptom: room too warm/cold or not podcast-like. Regenerate composite with a positive setting description; do not rely on vague "podcast vibe".
