import { createHash } from 'node:crypto';
import ts from 'typescript';

export interface SourceFile { path: string; source: string }
export interface RolloutEvidence {
  flag: string;
  finalValue: boolean;
  rollout: 'complete';
  coveragePercent: number;
  activeOverrides: number;
  reference: string;
  sourceSha256: string;
}
export interface RetirementInput {
  flag: string;
  finalValue: boolean;
  files: SourceFile[];
  evidence: RolloutEvidence[];
}
export interface Refusal { code: string; message: string; path?: string; line?: number }
export interface Change { path: string; before: string; after: string; diff: string; replacements: number }
export interface RetirementReport {
  schemaVersion: 1;
  application: 'FlagExit';
  status: 'accepted' | 'refused';
  flag: string;
  finalValue: boolean;
  sourceSha256: string;
  candidateSha256: string | null;
  reasons: Refusal[];
  changes: Change[];
  summary: { filesInspected: number; flagCalls: number; replacements: number };
  limitations: string[];
}

const API = '@flagexit/flags';
export const LIMITS = { files: 8, fileBytes: 65_536, totalBytes: 262_144 } as const;
const LIMITATIONS = [
  'Accepted means a bounded static proposal, not approval to merge or proof of whole-program equivalence.',
  'Only supplied TypeScript files and the declared pure boolean @flagexit/flags API are inspected. External consumers and configuration are outside this analysis.',
  'Rollout records are caller-supplied evidence. Their consistency and source binding are checked; their real-world truth is not independently verified.',
  'No submitted source is executed. Runtime verification is available only for the repository-owned fixture catalog.',
  'No GitLab Duo session, merge request, pipeline, deployment or provider integration is implied by local analysis.',
];

export function hashSources(files: SourceFile[]): string {
  const sorted = files.map(file => ({ path: file.path, source: file.source })).sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}

function sourceAt(source: ts.SourceFile, node: ts.Node): { path: string; line: number } {
  return { path: source.fileName, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 };
}

function isFlagCall(node: ts.Node): node is ts.CallExpression {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'flag';
}

function staticFlagCall(node: ts.Node): node is ts.CallExpression {
  return isFlagCall(node) && !node.questionDotToken && !node.typeArguments?.length && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!);
}

function booleanCondition(node: ts.Expression): boolean {
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return true;
  if (ts.isParenthesizedExpression(node)) return booleanCondition(node.expression);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) return booleanCondition(node.operand);
  if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind)) return booleanCondition(node.left) && booleanCondition(node.right);
  return staticFlagCall(node);
}

function enclosingCondition(node: ts.Node): ts.Expression | null {
  let current = node;
  while (current.parent) {
    const parent = current.parent;
    if (ts.isIfStatement(parent) && parent.expression === current) return parent.expression;
    if (ts.isConditionalExpression(parent) && parent.condition === current) return parent.condition;
    if (ts.isParenthesizedExpression(parent) || (ts.isPrefixUnaryExpression(parent) && parent.operator === ts.SyntaxKind.ExclamationToken)
      || (ts.isBinaryExpression(parent) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken].includes(parent.operatorToken.kind))) {
      current = parent;
    } else return null;
  }
  return null;
}

function literal(node: ts.Expression): boolean | undefined {
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function unifiedDiff(path: string, before: string, after: string): string {
  const a = before.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const b = after.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  return [`--- a/${path}`, `+++ b/${path}`, `@@ -1,${a.length} +1,${b.length} @@`, ...a.map(line => `-${line}`), ...b.map(line => `+${line}`), ''].join('\n');
}

export function analyzeRetirement(input: RetirementInput): RetirementReport {
  const reasons: Refusal[] = [];
  const candidate = input as unknown as Record<string, unknown> | null;
  const files = Array.isArray(candidate?.files) ? candidate.files as SourceFile[] : [];
  const validFiles = files.length > 0 && files.length <= LIMITS.files && files.every(file => file && typeof file.path === 'string' && typeof file.source === 'string');
  const report: RetirementReport = {
    schemaVersion: 1, application: 'FlagExit', status: 'refused',
    flag: typeof candidate?.flag === 'string' ? candidate.flag : '',
    finalValue: candidate?.finalValue === true,
    sourceSha256: validFiles ? hashSources(files) : hashSources([]), candidateSha256: null,
    reasons, changes: [], summary: { filesInspected: 0, flagCalls: 0, replacements: 0 }, limitations: [...LIMITATIONS],
  };
  if (!candidate || !validFiles || !/^[a-z][a-z0-9_-]{0,79}$/.test(report.flag) || typeof candidate.finalValue !== 'boolean') {
    reasons.push({ code: 'invalid_request', message: 'Supply a flag name, a boolean final value and 1–8 TypeScript source files.' });
    return report;
  }
  const paths = new Set<string>();
  let size = 0;
  for (const file of files) {
    const bytes = Buffer.byteLength(file.source);
    size += bytes;
    if (!/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.ts$/.test(file.path) || paths.has(file.path.toLowerCase()) || bytes > LIMITS.fileBytes) {
      reasons.push({ code: 'invalid_file', message: 'Use unique relative .ts paths without traversal; each file is limited to 64 KiB.', path: file.path });
    }
    paths.add(file.path.toLowerCase());
  }
  if (size > LIMITS.totalBytes) reasons.push({ code: 'input_limit', message: 'Combined source exceeds 256 KiB.' });
  if (reasons.length) return report;
  const evidence = candidate.evidence;
  if (!Array.isArray(evidence) || evidence.length === 0 || evidence.length > 16) {
    reasons.push({ code: 'missing_rollout_evidence', message: 'Supply 1–16 source-bound completed-rollout records.' });
  } else {
    for (const record of evidence) {
      if (!record || typeof record !== 'object' || record.flag !== report.flag || record.finalValue !== input.finalValue) {
        reasons.push({ code: 'conflicting_rollout_evidence', message: 'Every rollout record must name this flag and the same final boolean value.' });
      } else if (record.rollout !== 'complete' || record.coveragePercent !== 100 || record.activeOverrides !== 0 || typeof record.reference !== 'string' || !record.reference.trim() || record.reference.length > 500) {
        reasons.push({ code: 'incomplete_rollout_evidence', message: 'Require completed 100% rollout, zero active overrides and a nonempty evidence reference.' });
      } else if (record.sourceSha256 !== report.sourceSha256) {
        reasons.push({ code: 'stale_source_evidence', message: 'Rollout evidence does not bind to the exact supplied source inventory.' });
      }
    }
  }

  const parsed = files.map(file => ts.createSourceFile(file.path, file.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS));
  const replacements = new Map<string, number>();
  for (const source of parsed) {
    report.summary.filesInspected += 1;
    const diagnostics = (source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
    if (diagnostics.length) reasons.push({ code: 'syntax_error', message: ts.flattenDiagnosticMessageText(diagnostics[0]!.messageText, ' '), path: source.fileName });
    let imports = 0;
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement)) {
        const clause = statement.importClause;
        const bindings = clause?.namedBindings;
        const valid = ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === API
          && !clause?.isTypeOnly && !clause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.length === 1
          && bindings.elements[0]!.name.text === 'flag' && !bindings.elements[0]!.propertyName && !bindings.elements[0]!.isTypeOnly;
        if (!valid) reasons.push({ code: 'unsupported_import', message: "Only an unaliased import { flag } from '@flagexit/flags' is supported.", ...sourceAt(source, statement) });
        else imports += 1;
      }
      if (ts.isImportEqualsDeclaration(statement) || ts.isExportDeclaration(statement)) reasons.push({ code: 'unknown_api_use', message: 'Import aliases and re-exports are outside the supported inventory.', ...sourceAt(source, statement) });
    }
    if (imports > 1) reasons.push({ code: 'ambiguous_binding', message: 'The flag API must have one unambiguous import binding.', path: source.fileName });
    const walk = (node: ts.Node): void => {
      if (ts.isVariableDeclarationList(node) && !(node.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const))) reasons.push({ code: 'unsafe_hoisting', message: 'var hoisting is outside this transformation; use block-scoped declarations.', ...sourceAt(source, node) });
      if (ts.isFunctionDeclaration(node) && !ts.isSourceFile(node.parent)) reasons.push({ code: 'unsafe_hoisting', message: 'Nested function-declaration hoisting is outside this transformation.', ...sourceAt(source, node) });
      if (ts.isIdentifier(node) && node.text === 'flag') {
        const parent = node.parent;
        const isImport = ts.isImportSpecifier(parent) && parent.name === node;
        if (!isImport && !(isFlagCall(parent) && parent.expression === node)) reasons.push({ code: 'unknown_api_use', message: 'The flag binding cannot be shadowed, aliased, exported or accessed indirectly.', ...sourceAt(source, node) });
      }
      if (isFlagCall(node)) {
        report.summary.flagCalls += 1;
        if (imports !== 1) reasons.push({ code: 'ambiguous_binding', message: 'A flag call requires exactly one supported API import.', ...sourceAt(source, node) });
        if (!staticFlagCall(node)) reasons.push({ code: 'dynamic_flag_use', message: 'Every flag call needs one static string literal and no optional/type/extra arguments.', ...sourceAt(source, node) });
        else {
          const condition = enclosingCondition(node);
          if (!condition) reasons.push({ code: 'unsupported_context', message: 'Flag reads are supported only in if and ternary boolean conditions.', ...sourceAt(source, node) });
          else if (!booleanCondition(condition)) reasons.push({ code: 'effectful_condition', message: 'The flag condition includes an unrecognized or potentially effectful expression.', ...sourceAt(source, condition) });
          if ((node.arguments[0] as ts.StringLiteral).text === report.flag) replacements.set(source.fileName, (replacements.get(source.fileName) ?? 0) + 1);
        }
      }
      if ((ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && ['eval', 'Function', 'require'].includes(node.expression.text))))
        || (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Function')) {
        reasons.push({ code: 'dynamic_code', message: 'Dynamic code and module loading prevent a complete static flag inventory.', ...sourceAt(source, node) });
      }
      ts.forEachChild(node, walk);
    };
    walk(source);
  }
  if (replacements.size === 0) reasons.push({ code: 'flag_not_found', message: 'No supported call names the nominated flag.' });
  // A refusal returns no partial candidate, even if some files were transformable.
  if (reasons.length) {
    report.reasons = reasons.filter((reason, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(reason)) === index);
    return report;
  }
  const factory: ts.TransformerFactory<ts.SourceFile> = context => {
    const visit: ts.Visitor = node => {
      if (staticFlagCall(node) && (node.arguments[0] as ts.StringLiteral).text === report.flag) return input.finalValue ? ts.factory.createTrue() : ts.factory.createFalse();
      const next = ts.visitEachChild(node, visit, context);
      if (ts.isParenthesizedExpression(next) && literal(next.expression) !== undefined) return next.expression;
      if (ts.isPrefixUnaryExpression(next) && next.operator === ts.SyntaxKind.ExclamationToken && literal(next.operand) !== undefined) return literal(next.operand) ? ts.factory.createFalse() : ts.factory.createTrue();
      if (ts.isBinaryExpression(next)) {
        const left = literal(next.left), right = literal(next.right);
        if (next.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
          if (left === false) return ts.factory.createFalse();
          if (left === true) return next.right;
          if (right === true) return next.left;
          // Do not drop an unknown left operand: it is still evaluated at runtime.
        }
        if (next.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          if (left === true) return ts.factory.createTrue();
          if (left === false) return next.right;
          if (right === false) return next.left;
        }
      }
      if (ts.isIfStatement(next)) {
        if (literal(next.expression) === true) return next.thenStatement;
        if (literal(next.expression) === false) return next.elseStatement ?? ts.factory.createBlock([], false);
      }
      if (ts.isConditionalExpression(next)) {
        if (literal(next.condition) === true) return next.whenTrue;
        if (literal(next.condition) === false) return next.whenFalse;
      }
      return next;
    };
    return source => {
      let transformed = ts.visitNode(source, visit) as ts.SourceFile;
      let retainedCalls = 0;
      const count = (node: ts.Node): void => { if (isFlagCall(node)) retainedCalls += 1; ts.forEachChild(node, count); };
      count(transformed);
      if (retainedCalls === 0) transformed = ts.factory.updateSourceFile(transformed, transformed.statements.filter(statement => !ts.isImportDeclaration(statement)));
      return transformed;
    };
  };
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const afterFiles = files.map(file => ({ ...file }));
  for (const source of parsed) {
    const count = replacements.get(source.fileName) ?? 0;
    if (!count) continue;
    const transformed = ts.transform(source, [factory]);
    try {
      const after = printer.printFile(transformed.transformed[0]!);
      const before = source.text;
      report.changes.push({ path: source.fileName, before, after, diff: unifiedDiff(source.fileName, before, after), replacements: count });
      afterFiles.find(file => file.path === source.fileName)!.source = after;
      report.summary.replacements += count;
    } finally { transformed.dispose(); }
  }
  report.status = 'accepted';
  report.candidateSha256 = hashSources(afterFiles);
  return report;
}
