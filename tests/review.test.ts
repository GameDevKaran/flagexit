import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyReview, verifyReview, verifyWrongReviewControl, CANDIDATE_PATH } from '../src/review.js';
import { getOwnedScenario, verifyOwnedCandidate } from '../src/fixtures.js';
import { analyzeRetirement } from '../src/core.js';

function workspace(t:{after:(callback:()=>void)=>void}) {
  const root=mkdtempSync(join(tmpdir(),'flagexit-review-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const {input}=getOwnedScenario('express-true');
  for(const folder of ['baseline','src']) {mkdirSync(join(root,'examples/express-checkout',folder),{recursive:true});writeFileSync(join(root,'examples/express-checkout',folder,'checkout.ts'),input.files[0]!.source);}
  writeFileSync(join(root,'examples/express-checkout/rollout.json'),JSON.stringify(input.evidence));
  return root;
}
test('actual source file retirement preserves original and verifies all owned behavior cases',t=>{
  const root=workspace(t),original=readFileSync(join(root,CANDIDATE_PATH),'utf8');
  assert.equal(verifyReview(root).status,'baseline_only');
  assert.equal(verifyReview(root,true).status,'failed');
  const applied=applyReview(root);
  assert.equal(applied.status,'verified_retirement');assert.equal(applied.changed,true);
  assert.equal(applied.verification.cases.length,3);
  assert.notEqual(readFileSync(join(root,CANDIDATE_PATH),'utf8'),original);
  assert.equal(readFileSync(join(root,'examples/express-checkout/baseline/checkout.ts'),'utf8'),original);
  assert.equal(applyReview(root).changed,false);
  assert.deepEqual(readdirSync(join(root,'examples/express-checkout/src')),['checkout.ts']);
});
test('stale rollout refuses before any candidate write',t=>{
  const root=workspace(t),{input}=getOwnedScenario('express-true');
  input.evidence[0]!.sourceSha256='0'.repeat(64);
  writeFileSync(join(root,'examples/express-checkout/rollout.json'),JSON.stringify(input.evidence));
  assert.throws(()=>applyReview(root),/stale_source_evidence/);
  assert.equal(readFileSync(join(root,CANDIDATE_PATH),'utf8'),input.files[0]!.source);
});
test('editing original baseline cannot redefine expected behavior',t=>{
  const root=workspace(t),original=readFileSync(join(root,CANDIDATE_PATH),'utf8');
  writeFileSync(join(root,'examples/express-checkout/baseline/checkout.ts'),original+'\n// changed');
  assert.throws(()=>applyReview(root),/baseline changed/);
  assert.equal(readFileSync(join(root,CANDIDATE_PATH),'utf8'),original);
});
test('unrecognized candidate is neither executed nor overwritten',t=>{
  const root=workspace(t),candidate="throw new Error('must never execute');";
  writeFileSync(join(root,CANDIDATE_PATH),candidate);
  assert.throws(()=>applyReview(root),/unrecognized changes/);
  assert.equal(verifyReview(root,true).verification.status,'refused');
  assert.equal(readFileSync(join(root,CANDIDATE_PATH),'utf8'),candidate);
  assert.equal(verifyOwnedCandidate('express-true',candidate).cases.length,0);
});
test('wrong-value source patch fails the real-file behavior gate and control never writes',t=>{
  const root=workspace(t),{input}=getOwnedScenario('express-true');
  const original=readFileSync(join(root,CANDIDATE_PATH),'utf8');
  const control=verifyWrongReviewControl(root);
  assert.equal(control.status,'control_rejected');assert.equal(control.candidateWritten,false);
  assert.equal(readFileSync(join(root,CANDIDATE_PATH),'utf8'),original);
  input.finalValue=false;input.evidence[0]!.finalValue=false;
  const wrong=analyzeRetirement(input).changes[0]!.after;
  writeFileSync(join(root,CANDIDATE_PATH),wrong);
  const result=verifyReview(root,true);
  assert.equal(result.status,'failed');assert.equal(result.verification.variant,'opposite_value_control');
  assert.ok(result.verification.cases.some(row=>!row.passed));
});
