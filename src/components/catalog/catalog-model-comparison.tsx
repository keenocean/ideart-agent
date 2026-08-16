import { CatalogSection } from './catalog-section';
import { CatalogSectionHeading } from './catalog-section-heading';

export type CatalogModelComparisonRow = {
  label: string;
  values: readonly string[];
};

export function CatalogModelComparison({
  title,
  description,
  modelLabel,
  models,
  rows,
}: {
  title: string;
  description: string;
  modelLabel: string;
  models: readonly string[];
  rows: readonly CatalogModelComparisonRow[];
}) {
  if (models.length === 0) return null;
  return (
    <CatalogSection width="wide" surface="muted">
      <CatalogSectionHeading title={title} description={description} />
      <div className="border-border bg-card mt-10 overflow-x-auto rounded-3xl border">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground px-5 py-4 font-medium">
                {modelLabel}
              </th>
              {models.map((model) => (
                <th key={model} className="px-5 py-4 font-semibold">
                  {model}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-border border-b last:border-0"
              >
                <th className="text-muted-foreground px-5 py-4 font-medium">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={`${row.label}:${index}`} className="px-5 py-4">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CatalogSection>
  );
}
