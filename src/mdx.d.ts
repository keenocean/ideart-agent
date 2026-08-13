declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const meta: {
    title: string;
    description: string;
    created_at?: string;
    updated_at?: string;
    author_name?: string;
    author_image?: string;
    image?: string;
    categories?: Array<{ slug: string; title: string }>;
  };

  const MDXComponent: ComponentType<{
    components?: Record<string, ComponentType<any>>;
  }>;
  export default MDXComponent;
}
