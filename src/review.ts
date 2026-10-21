import { lstatSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { analyzeRetirement, hashSources, type RolloutEvidence } from './core.js';
import { getOwnedScenario, verifyOwnedCandidate } from './fixtures.js';

const SCENARIO='express-true';
const ROOT='examples/express-checkout';
const BASELINE=`${ROOT}/baseline/checkout.ts`;
export const CANDIDATE_PATH=`${ROOT}/src/checkout.ts`;
const EVIDENCE=`${ROOT}/rollout.json`;

function boundedRegularFile(root:string, path:string):string {
  const absolute=resolve(root,path);
  let directory=dirname(absolute);
  while(directory!==resolve(root)) {
    const stat=lstatSync(directory);
    if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Review path must use real directories');
    const parent=dirname(directory);
    if(parent===directory)throw Error('Review file escaped its root');
    directory=parent;
  }
  const stat=lstatSync(absolute);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65_536)throw Error('Review input must be a bounded regular file');
  return readFileSync(absolute,'utf8');
}

function inspect(root:string) {
  const owned=getOwnedScenario(SCENARIO), baseline=boundedRegularFile(root,BASELINE);
  // Preserving the independent original blocks a patch from redefining its own
  // expected behavior or re-binding fabricated rollout evidence to new code.
  if(baseline!==owned.input.files[0]!.source)throw Error('Original owned baseline changed; review refused');
  const evidence=JSON.parse(boundedRegularFile(root,EVIDENCE)) as RolloutEvidence[];
  if(!Array.isArray(evidence))throw Error('Rollout evidence must be an array');
  const input={...owned.input,files:[{path:'checkout.ts',source:baseline}],evidence};
  const retirement=analyzeRetirement(input);
  if(retirement.status!=='accepted')throw Error(`Retirement refused: ${retirement.reasons.map(reason=>reason.code).join(', ')}`);
  return {baseline,candidate:boundedRegularFile(root,CANDIDATE_PATH),retirement};
}

export function verifyReview(root=process.cwd(), requireRetired=false) {
  const {candidate,retirement}=inspect(root);
  const verification=verifyOwnedCandidate(SCENARIO,candidate);
  const retired=verification.variant==='retired'&&verification.status==='passed';
  const status=verification.status!=='passed'?'failed':retired?'verified_retirement':requireRetired?'failed':'baseline_only';
  return {schemaVersion:1,application:'FlagExit',execution:'local_or_ci_command',scenario:SCENARIO,status,
    sourceSha256:retirement.sourceSha256,candidateSha256:hashSources([{path:'checkout.ts',source:candidate}]),
    candidatePath:CANDIDATE_PATH,verification,requireRetired,
    limitations:['Owned synthetic checkout example with caller-supplied synthetic rollout; not production rollout evidence.',
      'Only exact owned baseline/generated correct/generated opposite-value candidates can execute.',
      'Finite comparisons do not prove arbitrary-program equivalence. No Duo, MR or CI provider success is inferred.']};
}

export function applyReview(root=process.cwd()) {
  const {baseline,candidate,retirement}=inspect(root);
  const after=retirement.changes[0]!.after;
  if(candidate===after)return {...verifyReview(root,true),changed:false};
  if(candidate!==baseline)throw Error('Candidate has unrecognized changes; refusing to overwrite it');
  const verification=verifyOwnedCandidate(SCENARIO,after);
  if(verification.status!=='passed')throw Error('Candidate behavior did not pass; no file written');
  const destination=resolve(root,CANDIDATE_PATH), temporary=join(dirname(destination),`.flagexit-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary,after,{encoding:'utf8',flag:'wx'});
    if(boundedRegularFile(root,CANDIDATE_PATH)!==candidate)throw Error('Candidate changed during review; no overwrite');
    renameSync(temporary,destination);
  } finally {
    try {unlinkSync(temporary);} catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  }
  return {...verifyReview(root,true),changed:true,patch:retirement.changes[0]!.diff};
}

export function verifyWrongReviewControl(root=process.cwd()) {
  const {retirement}=inspect(root), input=getOwnedScenario(SCENARIO).input;
  input.finalValue=false;
  input.evidence=input.evidence.map(record=>({...record,finalValue:false}));
  const wrong=analyzeRetirement(input);
  if(wrong.status!=='accepted')throw Error('Owned opposite-value control failed to generate');
  const verification=verifyOwnedCandidate(SCENARIO,wrong.changes[0]!.after);
  return {schemaVersion:1,scenario:SCENARIO,status:verification.status==='failed'?'control_rejected':'gate_failed',sourceSha256:retirement.sourceSha256,
    verification,candidateWritten:false,limitations:['Intentional opposite-final-value control on owned fixture only; no provider execution.']};
}
