import type { ToolPageContent } from '../../types';

export const content = {
  entityId: 'ai-image-generator',
  locale: 'en',
  seo: {
    title: 'AI Image Generator from Text | UGC Mind',
    description:
      'Turn a written visual brief into an image, choose aspect ratio, resolution, and quality, then continue refining the result with the AI agent.',
  },
  directory: {
    title: 'AI Image Generator',
    description:
      'Create a still image from a text prompt and continue refining it in one agent conversation.',
  },
  hero: {
    eyebrow: 'Text to image',
    title: 'Create an AI image from a clear visual brief',
    description:
      'Describe the subject, composition, lighting, and style you need. Choose image settings in the workbench, start a generation, and keep iterating in the same chat.',
  },
  workbench: {
    title: 'Describe the image you want to create',
    description:
      'Start with text only, or add a reference image when you want the conversation to move toward editing or visual guidance.',
    placeholder:
      'A studio product photo of a translucent orange water bottle on pale stone, soft window light, subtle shadow, editorial composition…',
  },
  inputOutput: {
    title: 'Inputs and output controls',
    description:
      'This entry locks the generation mode to images while leaving the supported image settings available in the composer.',
    items: [
      {
        title: 'Required input',
        description:
          'A text prompt. Reference images are optional and change the task toward guided generation or editing.',
      },
      {
        title: 'Image controls',
        description:
          'Choose a supported aspect ratio, 1K, 2K, or 4K resolution, and low, medium, or high quality.',
      },
      {
        title: 'Continuation',
        description:
          'The first request opens a chat session so you can ask for revisions instead of restarting the task.',
      },
    ],
  },
  examples: {
    title: 'AI image prompt gallery',
    description:
      'Explore still-image directions for products, editorial scenes, social campaigns, and cinematic concepts, then send any prompt back to the generator.',
    labels: {
      quickStart: 'Quick start',
      image: 'Image',
      video: 'Video',
      prompt: 'Prompt',
      download: 'Download original',
      previous: 'Previous example',
      next: 'Next example',
      close: 'Close preview',
      usePrompt: 'Use this prompt',
      expand: 'View all examples',
    },
    items: [
      {
        title: 'Product campaign concept',
        description:
          'Useful when you need a clear subject, controlled materials, and a commercial lighting direction.',
        prompt:
          'A premium skincare serum bottle on a shallow mirror of water, cool silver palette, soft diffused studio light, close product crop, clean luxury campaign photography, no extra objects.',
        media: {
          assetId: 'tools-ai-image-generator-0241fe76c3058fcd',
          alt: 'Unbranded glass serum bottle standing in shallow water under cool silver studio light',
        },
      },
      {
        title: 'Editorial illustration',
        description:
          'Combines a recognizable scene with a restrained visual language and a defined page composition.',
        prompt:
          'An editorial illustration about remote collaboration across time zones, three connected desks floating above a night city, limited navy and coral palette, geometric shapes, generous negative space for a headline.',
        media: {
          assetId: 'tools-ai-image-generator-5d01838c8320ab5f',
          alt: 'Three illuminated desks connected above a night city in a navy and coral editorial illustration',
        },
      },
      {
        title: 'Social launch visual',
        description:
          'Specifies the platform shape, focal object, motion cue, and space reserved for later layout work.',
        prompt:
          'Vertical 9:16 launch visual for a running shoe, shoe suspended above a red track with a sharp burst of chalk dust, energetic side light, bold modern sports photography, clear space at the top for copy.',
        media: {
          assetId: 'tools-ai-image-generator-eee9f320ac365d1e',
          alt: 'Unbranded black running shoe suspended above a red track with a burst of white chalk dust',
        },
      },
      {
        title: 'Moonlit monster bakery',
        description:
          'Defines a character, an expressive action, a warm focal light, and a contrasting night palette.',
        prompt:
          'A small orange horned creature startled by a floating loaf in an enchanted bakery, moonlit window, warm copper oven glow, flour suspended in the air, cinematic family-animation detail, wide story frame.',
        media: {
          assetId: 'tools-ai-image-generator-c59b7a4f2cbfdc3b',
          alt: 'Orange horned creature watching a loaf float above a glowing oven in a moonlit bakery',
        },
      },
      {
        title: 'Gentle creature on the subway',
        description:
          'Combines an unusual central subject with documentary framing and restrained commuter reactions.',
        prompt:
          'A gentle moss-green furry creature carrying a tiny leather briefcase on a crowded subway at dawn, commuters seated around it, natural window light, cinematic documentary composition, realistic textures.',
        media: {
          assetId: 'tools-ai-image-generator-39da1e8785d8efb2',
          alt: 'Large gentle green creature holding a briefcase between commuters inside a subway carriage',
        },
      },
      {
        title: 'Fireflies in a night conservatory',
        description:
          'Uses a panoramic environment, one color accent, reflections, and atmospheric light to establish scale.',
        prompt:
          'An abandoned glass conservatory flooded after rain at midnight, a lone visitor in a yellow raincoat, hundreds of blue fireflies over the water, moon reflections, panoramic cinematic realism.',
        media: {
          assetId: 'tools-ai-image-generator-f2570c70c73667db',
          alt: 'Visitor in a yellow raincoat facing blue fireflies reflected in a flooded moonlit conservatory',
        },
      },
      {
        title: 'Porcelain koi train',
        description:
          'Directs a surreal editorial scene through material, movement, weather, and symmetrical framing.',
        prompt:
          'A ballet dancer moving through an empty vintage train carriage while porcelain koi float around her, rain on the windows, deep blue night, warm table lamp, symmetrical cinematic composition.',
        media: {
          assetId: 'tools-ai-image-generator-4465b33d8cac5a5f',
          alt: 'Ballet dancer and floating porcelain koi inside a rain-darkened vintage train carriage',
        },
      },
      {
        title: 'Floating loaf',
        description:
          'Warm character animation built around one impossible event and a clear reaction.',
        prompt:
          'Animate the loaf rising from the oven as flour drifts through warm light and the orange creature reacts with surprise.',
        media: {
          assetId: 'tools-ai-image-generator-8c2cfa5620e683cc',
          alt: 'Short motion preview of a floating loaf and an orange creature in a glowing bakery',
        },
      },
      {
        title: 'Morning commute',
        description:
          'Documentary camera movement gives an unusual commuter a believable place in the scene.',
        prompt:
          'Animate subtle subway movement, passing window light, and small reactions around the gentle green commuter.',
        media: {
          assetId: 'tools-ai-image-generator-96a88f4a9d15525b',
          alt: 'Short motion preview of a green creature riding a subway with morning commuters',
        },
      },
      {
        title: 'Blue fireflies',
        description:
          'A panoramic night environment animated through drifting light and reflective water.',
        prompt:
          'Animate blue fireflies drifting over reflected water while moonlight moves softly across the conservatory glass.',
        media: {
          assetId: 'tools-ai-image-generator-c72381045001af4e',
          alt: 'Wide motion preview of blue fireflies moving through a flooded night conservatory',
        },
      },
      {
        title: 'Porcelain koi',
        description:
          'Slow character motion, rain, and floating porcelain forms create a surreal editorial beat.',
        prompt:
          'Animate the dancer turning slowly as porcelain koi glide through the carriage and rain trails down the windows.',
        media: {
          assetId: 'tools-ai-image-generator-7da3695ed4c4a534',
          alt: 'Short motion preview of a dancer and floating porcelain koi in a vintage train',
        },
      },
      {
        title: 'Volcanic asteroid field',
        description:
          'Builds a high-contrast science-fiction scene from material, scale, color, and depth cues.',
        prompt:
          'A dense asteroid field in deep space, fractured charcoal rocks glowing with electric blue crystal and orange magma, layered depth, dramatic rim light, cinematic science-fiction realism.',
        media: {
          assetId: 'tools-ai-image-generator-db46761ada6e3d50',
          alt: 'Dark asteroids split by electric blue crystal and orange magma in deep space',
        },
      },
      {
        title: 'Poppies waking in the desert',
        description:
          'Uses a restrained landscape and one emerging color accent to direct a gradual visual change.',
        prompt:
          'A quiet sandy desert plain after rare rain, small red poppies emerging between dry grass, distant dunes, clear pale-blue morning sky, low natural camera angle, poetic cinematic realism.',
        media: {
          assetId: 'tools-ai-image-generator-f9c7a08a07b871e0',
          alt: 'Small red poppies emerging among dry grass on a bright desert plain',
        },
      },
      {
        title: 'Glacier titan',
        description:
          'Combines a monumental subject with aerial scale, fractured ice, and cold environmental light.',
        prompt:
          'A colossal stone form pushing upward through a fractured glacier, aerial wide shot, fresh snow and blue crevasses, overcast polar light, immense environmental scale, photoreal cinematic detail.',
        media: {
          assetId: 'tools-ai-image-generator-3c275d1ea7d9223d',
          alt: 'Colossal rounded stone form breaking through a cracked snow-covered glacier',
        },
      },
      {
        title: 'Mirror sphere on a rainy street',
        description:
          'Directs a surreal urban focal object through reflection, weather, traffic color, and street-level framing.',
        prompt:
          'A seamless mirrored sphere floating above a rain-darkened London street, red buses reflected across its curved surface, pedestrians and shop lights in soft focus, street-level cinematic photography.',
        media: {
          assetId: 'tools-ai-image-generator-126e53051fa7c68f',
          alt: 'Floating mirrored sphere reflecting red buses on a wet city street',
        },
      },
      {
        title: 'Paper storybook landscape',
        description:
          'Specifies a handcrafted material language, simple shapes, and warm directional light.',
        prompt:
          'An open handmade paper storybook becoming a layered pastel landscape, colored pencils scattered around it, warm afternoon window light, tactile cut-paper textures, playful stop-motion art direction.',
        media: {
          assetId: 'tools-ai-image-generator-fb51d0665ffb5fbf',
          alt: 'Open paper storybook forming a pastel landscape on a desk with colored pencils',
        },
      },
      {
        title: 'Night market inside a puddle',
        description:
          'Creates an impossible reveal using a mundane foreground, miniature scale, and warm/cool contrast.',
        prompt:
          'A rain puddle on an empty city street revealing a bustling miniature night market beneath the surface, warm lantern tents, wet asphalt reflections, low macro viewpoint, magical cinematic realism.',
        media: {
          assetId: 'tools-ai-image-generator-5664a0dee41494f4',
          alt: 'A glowing miniature night market appearing beneath a puddle on a dark wet street',
        },
      },
      {
        title: 'Sailcloth laundromat',
        description:
          'Uses a familiar symmetrical room and one surreal material transformation for a clear concept frame.',
        prompt:
          'An empty fluorescent laundromat at night where long white sailcloth streams from open machines, ocean visible beyond the windows, centered symmetrical frame, cool surreal cinematic lighting.',
        media: {
          assetId: 'tools-ai-image-generator-02b0b7a8d6d66167',
          alt: 'White sailcloth flowing between washing machines in a cool-lit night laundromat',
        },
      },
      {
        title: 'Tidal library',
        description:
          'Balances an orderly interior with slow environmental intrusion and quiet practical lighting.',
        prompt:
          'A historic reading room slowly filling with clear seawater, bookshelves and two wooden desks untouched, warm table lamps, cold daylight through the center window, calm symmetrical cinematic composition.',
        media: {
          assetId: 'tools-ai-image-generator-bf2655c56961d96f',
          alt: 'Seawater covering the floor of a symmetrical old library lit by two table lamps',
        },
      },
      {
        title: 'Volcanic asteroids',
        description:
          'A high-motion space study with layered depth and two contrasting internal light sources.',
        prompt:
          'Animate the asteroid field drifting past camera as blue crystal and orange magma pulse beneath fractured rock.',
        media: {
          assetId: 'tools-ai-image-generator-da9cec431f963fbc',
          alt: 'Motion preview of glowing volcanic asteroids drifting through deep space',
        },
      },
      {
        title: 'Desert bloom',
        description:
          'Subtle natural motion turns a quiet desert landscape into a gradual reveal.',
        prompt:
          'Animate red poppies opening between dry desert grass while a light breeze crosses the sand.',
        media: {
          assetId: 'tools-ai-image-generator-dc695c6c59eedafa',
          alt: 'Motion preview of red poppies emerging across a bright desert plain',
        },
      },
      {
        title: 'Glacier titan',
        description:
          'A monumental environmental reveal driven by fractured ice, snow, and aerial scale.',
        prompt:
          'Animate the stone titan rising through the glacier as ice plates fracture and snow falls into blue crevasses.',
        media: {
          assetId: 'tools-ai-image-generator-28464f03f575b12e',
          alt: 'Motion preview of a colossal stone form breaking through a glacier',
        },
      },
      {
        title: 'Mirror sphere',
        description:
          'Moving reflections bind a surreal object to the rhythm of a rainy city street.',
        prompt:
          'Animate the mirrored sphere gliding along the wet street as red buses and shop lights move across its surface.',
        media: {
          assetId: 'tools-ai-image-generator-ef56dc352549bc2b',
          alt: 'Motion preview of a mirrored sphere floating between red buses on a rainy street',
        },
      },
      {
        title: 'Paper storybook',
        description:
          'Layered paper forms unfold with tactile, handcrafted stop-motion energy.',
        prompt:
          'Animate the paper storybook unfolding into a layered pastel landscape while cut-paper shapes rise from each page.',
        media: {
          assetId: 'tools-ai-image-generator-cd6a1545d0bb900d',
          alt: 'Motion preview of a handmade paper storybook unfolding on a desk',
        },
      },
      {
        title: 'Puddle market',
        description:
          'A macro viewpoint reveals a miniature lantern market moving beneath a rain puddle.',
        prompt:
          'Animate lanterns and tiny shoppers beneath the puddle while raindrops ripple the street reflection above.',
        media: {
          assetId: 'tools-ai-image-generator-0c6193822673c248',
          alt: 'Motion preview of a miniature lantern market visible beneath a rain puddle',
        },
      },
      {
        title: 'Sailcloth laundromat',
        description:
          'Flowing white fabric transforms a symmetrical fluorescent interior into a surreal seascape.',
        prompt:
          'Animate white sailcloth flowing from the washing machines as mist rises under fluorescent light.',
        media: {
          assetId: 'tools-ai-image-generator-e89f518697d042d0',
          alt: 'Motion preview of white sailcloth moving through a night laundromat',
        },
      },
      {
        title: 'Tidal library',
        description:
          'Quiet water movement and warm lamp reflections reshape an orderly historic reading room.',
        prompt:
          'Animate a gentle tide moving across the library floor while lamp reflections shimmer between the desks.',
        media: {
          assetId: 'tools-ai-image-generator-f657512a8700976c',
          alt: 'Motion preview of seawater moving through a lamplit old library',
        },
      },
    ],
  },
  showcase: {
    workflows: {
      title: 'AI Image Tools',
      description:
        'Start with a focused image workflow, then keep refining the result in the same private agent conversation.',
      items: [
        {
          id: 'text-to-image',
          title: 'Text-to-image generator',
          description:
            'Turn a written visual brief into a composed still image.',
          prompt:
            'A premium skincare serum bottle on a shallow mirror of water, cool silver palette, soft diffused studio light, close product crop, clean luxury campaign photography, no extra objects.',
          media: [
            {
              assetId: 'tools-ai-image-generator-0241fe76c3058fcd',
              alt: 'Glass serum bottle in a cool silver studio scene',
            },
            {
              assetId: 'tools-ai-image-generator-5d01838c8320ab5f',
              alt: 'Navy and coral editorial illustration above a city',
            },
          ],
        },
        {
          id: 'campaign-visuals',
          title: 'Campaign image generator',
          description:
            'Direct product, launch, and social visuals with precise composition.',
          prompt:
            'Vertical 9:16 launch visual for a running shoe, shoe suspended above a red track with a sharp burst of chalk dust, energetic side light, bold modern sports photography, clear space at the top for copy.',
          media: [
            {
              assetId: 'tools-ai-image-generator-eee9f320ac365d1e',
              alt: 'Running shoe launch visual over a red track',
            },
            {
              assetId: 'tools-ai-image-generator-c59b7a4f2cbfdc3b',
              alt: 'Orange creature in a cinematic moonlit bakery',
            },
          ],
        },
        {
          id: 'reference-guided-edit',
          title: 'Reference-guided image edit',
          description:
            'Add an image to guide subject, composition, or visual direction.',
          prompt:
            'Use my reference image as the composition guide. Preserve the main subject and framing, then rebuild the scene with cinematic natural light, realistic materials, and a restrained color palette.',
          media: [
            {
              assetId: 'tools-ai-image-generator-39da1e8785d8efb2',
              alt: 'Green creature riding a subway with commuters',
            },
            {
              assetId: 'tools-ai-image-generator-f2570c70c73667db',
              alt: 'Flooded night conservatory filled with blue fireflies',
            },
          ],
        },
        {
          id: 'style-transform',
          title: 'Style transformation',
          description:
            'Restyle a reference while keeping its core subject recognizable.',
          prompt:
            'Restyle my reference as a tactile handmade paper illustration. Keep the central subject and overall silhouette recognizable, use layered cut-paper shapes, soft warm directional light, and a restrained pastel palette.',
          media: [
            {
              assetId: 'tools-ai-image-generator-4465b33d8cac5a5f',
              alt: 'Dancer and porcelain koi in a cinematic train carriage',
            },
            {
              assetId: 'tools-ai-image-generator-fb51d0665ffb5fbf',
              alt: 'Handmade paper storybook landscape',
            },
          ],
        },
      ],
    },
    models: {
      title: 'AI Image Models',
      description:
        'GPT Image 2 is the image model currently connected to this generator. More model cards will appear only after their runtime routes are available.',
      items: [
        {
          id: 'gpt-image-2',
          runtimeModelKey: 'gpt-image-2',
          title: 'GPT Image 2',
          description:
            'Prompt-faithful image generation and reference-guided editing with flexible aspect ratios and quality controls.',
          media: {
            assetId: 'tools-ai-image-generator-126e53051fa7c68f',
            alt: 'Mirrored sphere reflecting a rainy city street',
          },
        },
      ],
    },
  },
  videoInspiration: {
    title: 'Get Inspired by AI-Generated Videos',
    description:
      'Explore motion studies and open any clip for its full prompt. These R2-hosted videos are creative references; this page still generates images.',
  },
  workflow: {
    title: 'How the image workflow works',
    description:
      'The tool prepares a focused first turn and hands it to the existing agent runtime.',
    items: [
      {
        title: '1. Write the visual brief',
        description:
          'Name the main subject and add the details that affect the result: setting, composition, light, material, mood, and intended use.',
      },
      {
        title: '2. Choose image settings',
        description:
          'Select the aspect ratio, resolution, and quality that fit the destination before you submit.',
      },
      {
        title: '3. Continue in chat',
        description:
          'After the first generation starts, use the same session to request focused changes or create another direction.',
      },
    ],
  },
  features: {
    title: 'Built for iterative image creation',
    description:
      'The page uses the same validated generation path as the agent workspace rather than a separate marketing-only demo.',
    items: [
      {
        title: 'Image-mode handoff',
        description:
          'The entry fixes the task modality to images and the server verifies that identity again before generation.',
      },
      {
        title: 'Practical output choices',
        description:
          'Aspect ratio, resolution, and quality controls stay visible so the request can match its intended placement.',
      },
      {
        title: 'Conversation after generation',
        description:
          'The request becomes the first turn of a session, preserving context for revisions and follow-up work.',
      },
    ],
  },
  promptGuide: {
    title: 'Write prompts that are easier to direct',
    description:
      'A useful prompt is specific about the visual decision without stuffing every possible adjective into one sentence.',
    items: [
      {
        title: 'Lead with the subject and purpose',
        description:
          'State what must appear and where the image will be used before adding stylistic language.',
      },
      {
        title: 'Describe composition and light',
        description:
          'Camera distance, point of view, negative space, and lighting direction usually provide more control than generic quality words.',
      },
      {
        title: 'Make constraints explicit',
        description:
          'Call out important exclusions, exact text, required colors, or layout space, then inspect the result and refine only what missed.',
      },
    ],
  },
  useCases: {
    title: 'Where text-to-image is useful',
    description:
      'Use the generator for visual exploration and production drafts where iterative review is expected.',
    items: [
      {
        title: 'Campaign concepts',
        description:
          'Explore lighting, composition, props, and art direction before a final shoot or design pass.',
      },
      {
        title: 'Product and brand visuals',
        description:
          'Create directions for product scenes, packaging concepts, presentation covers, and social layouts.',
      },
      {
        title: 'Editorial and story frames',
        description:
          'Turn an abstract idea into a concrete illustration or storyboard frame that a team can discuss.',
      },
    ],
  },
  limitations: {
    title: 'What to review before using an output',
    description:
      'Image generation is probabilistic. Treat the result as material to inspect, not as a guaranteed reconstruction of the prompt.',
    items: [
      'Fine text, small repeated objects, hands, reflections, and precise spatial relationships may need another pass.',
      'The same prompt can produce different compositions across runs; save the useful result before exploring a new direction.',
      'Uploading a reference does not guarantee pixel-level preservation. Use the dedicated editing workflow when the source image must guide the result.',
      'Generation consumes credits according to the selected image settings; the server recalculates the cost rather than trusting the browser.',
    ],
  },
  faq: {
    title: 'AI image generator questions',
    items: [
      {
        question: 'Do I need to upload an image?',
        answer:
          'No. A text prompt is enough for this tool. An optional reference image changes the request toward guided generation or editing.',
      },
      {
        question: 'Which image settings can I choose?',
        answer:
          'The current image runtime exposes supported aspect ratios, 1K, 2K, and 4K resolution, plus low, medium, and high quality choices.',
      },
      {
        question: 'Can I revise the image after the first result?',
        answer:
          'Yes. The request opens a chat session, so you can describe the change you want and continue with the existing context.',
      },
      {
        question: 'Will the same prompt always create the same image?',
        answer:
          'No. Generated images can vary between runs. Use specific composition and lighting instructions, then refine the parts that matter.',
      },
    ],
  },
  cta: {
    title: 'Start with one clear visual decision',
    description:
      'Write the subject and purpose first, choose the output settings, and let the next turn focus on revision.',
    primaryLabel: 'Open the image workbench',
    secondaryLabel: 'View pricing',
  },
} satisfies ToolPageContent;
