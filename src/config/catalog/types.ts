import type { AppLocale } from '@/config/locale';
import type {
  AgentImageModelOptionValue,
  AgentModelOptionValue,
} from '@/lib/agent-settings';

export type CatalogKind = 'tool' | 'model';
export type Publication = 'listed' | 'unlisted' | 'hidden';
export type Availability = 'live' | 'beta' | 'coming-soon';
export type Indexing = 'index' | 'noindex';

/**
 * Semantic tool-page templates. Catalog selects an information architecture;
 * React components remain owned by the Block layer.
 */
export type ToolArchetype =
  | 'image-generator'
  | 'image-editor'
  | 'text-to-video'
  | 'image-to-video'
  | 'reference-to-video'
  | 'background-editor';

export type CatalogRouteSegment = string & {
  readonly __brand: 'CatalogRouteSegment';
};

export type CatalogLocaleRoute = {
  slug: CatalogRouteSegment;
  contentModifiedAt?: string;
};

export type CatalogLocalePage = CatalogLocaleRoute & {
  indexing: Indexing;
};

export type CatalogLocaleRoutes<T = CatalogLocalePage> = Partial<
  Record<AppLocale, T>
>;

export type CatalogPlacement = {
  directoryOrder: number;
  home?: { featured: true; order: number };
};

export type CatalogVisibility =
  | {
      publication: 'listed';
      localePages: CatalogLocaleRoutes;
      placement: CatalogPlacement;
    }
  | {
      publication: 'unlisted';
      localePages: CatalogLocaleRoutes<CatalogLocaleRoute>;
      placement?: never;
    }
  | {
      publication: 'hidden';
      localePages?: CatalogLocaleRoutes<CatalogLocaleRoute>;
      placement?: never;
    };

export type DetailPageSection =
  | 'capabilities'
  | 'workflow'
  | 'prompt-guide'
  | 'model-specs'
  | 'comparison'
  | 'before-after'
  | 'use-cases'
  | 'limitations';

export type DetailPageVariant = {
  hero?: 'centered' | 'split' | 'visual-first';
  workbench?: 'composer' | 'upload-first' | 'before-after';
  examples?: 'gallery' | 'comparison' | 'timeline';
  sections?: readonly DetailPageSection[];
};

export type DeploymentReadiness = {
  executable: boolean;
  reason?:
    | 'provider-unconfigured'
    | 'model-route-unavailable'
    | 'storage-unconfigured';
};

export type MarketingImageAsset = {
  id: string;
  kind: 'image';
  url: string;
  mimeType: `image/${string}`;
  width: number;
  height: number;
  bytes: number;
};

export type MarketingVideoAsset = {
  id: string;
  kind: 'video';
  url: string;
  mimeType: `video/${string}`;
  width: number;
  height: number;
  bytes: number;
  poster: MarketingImageAsset;
};

export type MarketingAsset = MarketingImageAsset | MarketingVideoAsset;

type CatalogDefinitionCore = CatalogVisibility & {
  entityId: string;
  availability: Availability;
  related?: readonly string[];
};

export type ToolExecution = {
  kind: 'agent-preset';
  mediaMode: 'image' | 'video';
  inputPolicy: {
    minimum: number;
    maximum?: number;
    accepts: readonly ('image' | 'video' | 'audio')[];
  };
};

export type ToolDefinition = CatalogDefinitionCore & {
  kind: 'tool';
  archetype: ToolArchetype;
  execution: ToolExecution;
};

export type ModelDefinition = CatalogDefinitionCore & {
  variant?: DetailPageVariant;
} & (
    | {
        kind: 'model';
        modality: 'image';
        runtimeModelKey: AgentImageModelOptionValue;
      }
    | {
        kind: 'model';
        modality: 'video';
        runtimeModelKey: AgentModelOptionValue;
      }
  );

export type CatalogDefinition = ToolDefinition | ModelDefinition;

export type ResolvedCatalogRoute = {
  definition: CatalogDefinition;
  kind: CatalogKind;
  locale: AppLocale;
  page: CatalogLocalePage | CatalogLocaleRoute;
  path: string;
};

export type CatalogUrlRecord = {
  kind: CatalogKind;
  entityId: string;
  locale: AppLocale;
  path: string;
  modifiedAt?: string;
};
