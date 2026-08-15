export {
  getBlogCategories,
  getPublishedBlogLocales,
  isIndexableBlogListing,
  paginatePosts,
  type BlogCategory,
  type BlogPage,
  type BlogPost,
  type BlogPostDetail,
} from './listing';

export function formatPostDate(dateIso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(dateIso)
  );
}

export function formatOpenGraphLocale(locale: string): string {
  try {
    const resolved = new Intl.Locale(locale).maximize();
    return [resolved.language, resolved.region].filter(Boolean).join('_');
  } catch {
    return locale.replaceAll('-', '_');
  }
}
