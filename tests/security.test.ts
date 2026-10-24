import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRetirement, hashSources, LIMITS } from '../src/core.js';
import { getOwnedScenario } from '../src/fixtures.js';

test('large valid-size unsupported inventory bounds diagnostics and refuses every change', () => {
  const input = getOwnedScenario('express-true').input;
  const source = 'flag;\n'.repeat(10_000);
  assert.ok(Buffer.byteLength(source) < LIMITS.fileBytes);
  for (let index = 0; index < 4; index++) input.files.push({ path: `unsupported-${index}.ts`, source });
  assert.ok(input.files.reduce((bytes, file) => bytes + Buffer.byteLength(file.source), 0) < LIMITS.totalBytes);
  input.evidence[0]!.sourceSha256 = hashSources(input.files);

  const report = analyzeRetirement(input);
  assert.equal(report.status, 'refused');
  assert.equal(report.reasons.length, LIMITS.diagnostics);
  assert.equal(report.reasons.filter(reason => reason.code === 'diagnostic_limit').length, 1);
  assert.match(report.reasons.at(-1)!.message, /omitted.*no candidate/i);
  assert.ok(report.reasons.some(reason => reason.code === 'unknown_api_use'));
  assert.equal(report.candidateSha256, null);
  assert.deepEqual(report.changes, []);
});
