import type { ZodType } from 'zod';

function issuePath(path: PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join('.') : '<root>';
}

export function parseProductFile<T>(
  fileName: string,
  schema: ZodType<T>,
  value: unknown
): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `${issuePath(issue.path)}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid ${fileName}: ${details}`);
}
