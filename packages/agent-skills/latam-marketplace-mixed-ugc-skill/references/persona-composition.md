<!-- Reconstructed from SKILL.md context; not an original creative platform side file. -->

# LatAm Persona Composition

Persona prompt fragments for the marketplace presenter. The goal is a local
peer-friend, not influencer polish.

## Global Prompt Base

Use this base in every country variant:

`mid-20s local Latina woman, warm peer-friend energy, sun-kissed tan skin, dark almond eyes, dark espresso wavy hair, natural freckles or warm undertones, modest urban-casual wardrobe, cream or oatmeal crew tee, open chunky knit cardigan in camel/oatmeal/rust, dark indigo high-waisted jeans, no visible logos, no statement jewelry, bright modest apartment living room, cream couch, terracotta textile accent, light wood floor, terracotta plant pots, sheer curtains, natural daylight, handheld vertical selfie realism, not studio-pristine, not influencer-hyped`

## Country Nuance

### Chile

Add:

- Apartment: Santiago/Valparaiso modest daylight apartment
- Warmth cues: practical, friendly, `te muestro` delivery
- Avoid: overdone luxury styling, European fashion-model default

### Mexico

Add:

- Apartment: CDMX or Guadalajara warm urban home, woven textile accent
- Warmth cues: relaxed, helpful, slightly playful
- Avoid: caricatured costume cues or tourist color overload

### Colombia

Add:

- Apartment: Bogota/Medellin bright apartment with plants and warm wood
- Warmth cues: approachable, clear, `chevere` only when context fits
- Avoid: pageant/glam styling

### Argentina

Add:

- Apartment: Buenos Aires casual living room, mate or neutral home prop optional
- Warmth cues: confident, practical, conversational
- Avoid: fashion-editorial polish

### Peru

Add:

- Apartment: Lima modest living room, neutral textiles, daylight
- Warmth cues: gentle, useful, no hard sell
- Avoid: folkloric costume shorthand unless the brief explicitly asks

## Scene-Specific Framing

| Scene     | Persona prompt additions                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1 Hook    | `arm's-length selfie POV, direct eye contact, slight natural sway, head below top 18 percent if possible so hook overlay has room` |
| 2 Catalog | `hands only holding phone, single thumb hover over category tiles, no scroll, no face required`                                    |
| 4 Trust   | `locked-off mid-shot on couch, brown delivery box nearby, relaxed posture, daylight, slight handheld breath`                       |
| 5 CTA     | `selfie POV, presenter points downward with index finger toward bottom-center CTA pill, clear face, friendly close`                |

## Voice Continuity

After the first persona voice is generated, capture and reuse all available
voice identifiers, including `voice_asset_id` and provider-specific ids such as
`kling_voice_id`. Apply the same voice to scenes 2 and 3 voice-over and to
direct-address scenes 1, 4, and 5.

## Negative Prompt Guard

Include when generation drifts:

`not fair-European default, not model-perfect skin, not glossy influencer studio, no ring-light glare, no logos on clothes, no heavy makeup, no luxury apartment, no neon color grade`
