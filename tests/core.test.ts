import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRetirement,hashSources,type RetirementInput } from '../src/core.js';
import { getOwnedScenario,verifyOwnedScenario } from '../src/fixtures.js';
function input(source:string):RetirementInput {const data=getOwnedScenario('express-true').input;data.files[0]!.source=source;data.evidence[0]!.sourceSha256=hashSources(data.files);return data;}
for(const id of ['express-true','loyalty-false','nested-flags'])test(id+' preserves finite baseline and detects wrong final value',()=>{
 const result=verifyOwnedScenario(id);assert.equal(result.retirement.status,'accepted');assert.equal(result.verification.status,'passed');assert.equal(result.verification.wrongValueCaught,true);assert.ok(result.verification.caseCount>=3);
});
for(const [id,code] of [['dynamic-refusal','dynamic_flag_use'],['rollout-refusal','missing_rollout_evidence'],['side-effect-refusal','effectful_condition']])test(id+' refuses without partial candidate',()=>{
 const {retirement,verification}=verifyOwnedScenario(id!);assert.equal(retirement.status,'refused');assert.ok(retirement.reasons.some(r=>r.code===code));assert.equal(retirement.candidateSha256,null);assert.deepEqual(retirement.changes,[]);assert.equal(verification.status,'not_run');
});
test('source edits invalidate evidence',()=>{const data=getOwnedScenario('express-true').input;data.files[0]!.source+='\n// changed';assert.ok(analyzeRetirement(data).reasons.some(r=>r.code==='stale_source_evidence'));});
test('conflicting final values refuse',()=>{const data=getOwnedScenario('express-true').input;data.evidence.push({...data.evidence[0]!,finalValue:false});assert.equal(analyzeRetirement(data).status,'refused');});
test('incomplete rollout and active overrides refuse',()=>{const data=getOwnedScenario('express-true').input;data.evidence[0]!.activeOverrides=1;assert.equal(analyzeRetirement(data).status,'refused');});
for(const source of [
"import {flag} from '@flagexit/flags'; const alias=flag; export const x=flag('express')?'new':'old';",
"import {flag} from '@flagexit/flags'; export const x=flag('express')?'new':'old'; export {flag};",
"import {flag} from '@flagexit/flags'; export function evaluate(){ if(flag('express')){var value=1;} return value;}",
"import {flag} from '@flagexit/flags'; export const x=flag('express')?'new':'old'; eval('flag(\"hidden\")');",
"import {flag as ff} from '@flagexit/flags'; export const x=ff('express')?'new':'old';",
"import {flag} from '@flagexit/flags'; export const x=flag('express');",
"import {flag} from '@flagexit/flags'; export function evaluate(flag:any){return flag('express')?'new':'old';}"
])test('unsafe source refuses: '+source.slice(-45),()=>{const report=analyzeRetirement(input(source));assert.equal(report.status,'refused');assert.deepEqual(report.changes,[]);});
test('one unsupported file prevents all changes',()=>{const data=getOwnedScenario('express-true').input;data.files.push({path:'other.ts',source:"import {flag} from '@flagexit/flags'; export const x=flag;"});data.evidence[0]!.sourceSha256=hashSources(data.files);assert.deepEqual(analyzeRetirement(data).changes,[]);});
test('negation and true OR simplify while retaining pure other flag when needed',()=>{const report=analyzeRetirement(input("import {flag} from '@flagexit/flags'; export function evaluate(){return !flag('express') ? 'old' : (flag('gift') ? 'gift' : 'new');}"));assert.equal(report.status,'accepted');assert.ok(report.changes[0]!.after.includes('gift'));assert.ok(!report.changes[0]!.after.includes("flag('express')"));});
test('malformed input and path traversal do not throw',()=>{assert.equal(analyzeRetirement(null as unknown as RetirementInput).status,'refused');const data=getOwnedScenario('express-true').input;data.files[0]!.path='../secret.ts';assert.equal(analyzeRetirement(data).status,'refused');});
test('source size bounds and duplicate paths refuse',()=>{const data=getOwnedScenario('express-true').input;data.files.push({...data.files[0]!});assert.equal(analyzeRetirement(data).status,'refused');data.files=[{path:'large.ts',source:'x'.repeat(65537)}];assert.equal(analyzeRetirement(data).status,'refused');});
test('unknown runtime scenario cannot execute submitted text',()=>assert.throws(()=>verifyOwnedScenario('process.exit()'),/Unknown/));
