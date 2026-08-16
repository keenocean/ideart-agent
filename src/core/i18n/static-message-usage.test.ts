import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const CLIENT_SOURCE_ROOTS = [
  'src/routes',
  'src/blocks',
  'src/components',
  'src/hooks',
];
const DYNAMIC_MESSAGE_IMPORT = `@/core/i18n/${'dynamic'}`;
const PARAGLIDE_MESSAGES_IMPORT = '@/paraglide/messages.js';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

describe('client message imports', () => {
  it('keeps runtime message lookup out of client bundles', () => {
    const offenders = CLIENT_SOURCE_ROOTS.flatMap((root) =>
      sourceFiles(root)
    ).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true
      );
      const messageBindings = new Set<string>();
      const findings: string[] = [];

      for (const statement of sourceFile.statements) {
        if (
          !ts.isImportDeclaration(statement) ||
          !ts.isStringLiteral(statement.moduleSpecifier)
        ) {
          continue;
        }
        const moduleName = statement.moduleSpecifier.text;
        if (moduleName === DYNAMIC_MESSAGE_IMPORT) {
          findings.push('imports the deprecated dynamic message helper');
        }
        if (moduleName !== PARAGLIDE_MESSAGES_IMPORT) continue;

        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) {
          findings.push('namespace-imports the Paraglide messages module');
          continue;
        }
        if (!bindings || !ts.isNamedImports(bindings)) continue;
        for (const element of bindings.elements) {
          if ((element.propertyName ?? element.name).text === 'm') {
            messageBindings.add(element.name.text);
          }
        }
      }

      function unwrapExpression(expression: ts.Expression): ts.Expression {
        let current = expression;
        while (
          ts.isParenthesizedExpression(current) ||
          ts.isAsExpression(current) ||
          ts.isTypeAssertionExpression(current) ||
          ts.isNonNullExpression(current) ||
          ts.isSatisfiesExpression(current)
        ) {
          current = current.expression;
        }
        return current;
      }

      function visit(node: ts.Node): void {
        if (ts.isElementAccessExpression(node)) {
          const target = unwrapExpression(node.expression);
          const key = node.argumentExpression;
          if (
            ts.isIdentifier(target) &&
            messageBindings.has(target.text) &&
            key &&
            !ts.isStringLiteral(key) &&
            !ts.isNoSubstitutionTemplateLiteral(key)
          ) {
            const position = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(sourceFile)
            );
            findings.push(
              `uses a runtime message key at ${position.line + 1}:${position.character + 1}`
            );
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
      const displayPath = relative(process.cwd(), file);
      return findings.map((finding) => `${displayPath}: ${finding}`);
    });

    expect(offenders).toEqual([]);
  });
});
