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
    title: 'Prompt examples to adapt',
    description:
      'These examples show how to make the request concrete. They are prompts, not claims that every run will produce an identical result.',
    items: [
      {
        title: 'Product campaign concept',
        description:
          'Useful when you need a clear subject, controlled materials, and a commercial lighting direction.',
        prompt:
          'A premium skincare serum bottle on a shallow mirror of water, cool silver palette, soft diffused studio light, close product crop, clean luxury campaign photography, no extra objects.',
        image: {
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
        image: {
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
        image: {
          assetId: 'tools-ai-image-generator-eee9f320ac365d1e',
          alt: 'Unbranded black running shoe suspended above a red track with a burst of white chalk dust',
        },
      },
    ],
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
