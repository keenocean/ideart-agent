export {
  dedupePosts,
  getBlogCategories,
  paginatePosts,
  type BlogCategory,
  type BlogPage,
  type BlogPost,
  type BlogPostDetail,
} from './listing';

export function formatPostDate(dateIso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(dateIso));
}
