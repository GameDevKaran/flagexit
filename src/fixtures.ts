import vm from 'node:vm';
import ts from 'typescript';
import { analyzeRetirement, hashSources, type RetirementInput } from './core.js';

// Original, repository-owned fixtures only. Submitted source never enters this evaluator.
const catalog = [
  {id:'express-true',title:'Retire the express checkout rollout',description:'Keep express pricing; compare standard and express orders.',flag:'express',finalValue:true,source:`import { flag } from '@flagexit/flags';
export function evaluate(order: {total:number, region:string}) {
  if (flag('express')) { return {total:order.total, delivery:order.region === 'local' ? 1 : 3}; }
  else { return {total:order.total+5, delivery:7}; }
}
`,cases:[{total:0,region:'local'},{total:20,region:'remote'},{total:250,region:'local'}]},
  {id:'loyalty-false',title:'Remove a discontinued loyalty experiment',description:'Keep the original price; the intended final value is false.',flag:'loyalty',finalValue:false,source:`import { flag } from '@flagexit/flags';
export function evaluate(order: {total:number}) {
  return flag('loyalty') ? {total:order.total*0.8,tier:'experimental'} : {total:order.total,tier:'standard'};
}
`,cases:[{total:0},{total:25},{total:199}]},
  {id:'nested-flags',title:'Retire one flag and preserve another',description:'Retire express while retaining gift behavior across both gift values.',flag:'express',finalValue:true,source:`import { flag } from '@flagexit/flags';
export function evaluate(order: {total:number}) {
  if (flag('express') && !flag('gift')) { return {total:order.total,delivery:1}; }
  return {total:order.total,delivery:7};
}
`,cases:[{total:10,gift:false},{total:10,gift:true},{total:90,gift:false},{total:90,gift:true}]},
  {id:'dynamic-refusal',title:'Refuse a dynamic flag name',description:'An indirect flag reference makes the usage inventory incomplete.',flag:'express',finalValue:true,source:`import { flag } from '@flagexit/flags';
export function evaluate(order:{flagName:string}) { if(flag(order.flagName)) return 'new'; return 'old'; }
`,cases:[]},
  {id:'rollout-refusal',title:'Refuse missing rollout evidence',description:'A transformable call is insufficient without completed rollout evidence.',flag:'express',finalValue:true,source:`import { flag } from '@flagexit/flags';
export function evaluate() { return flag('express') ? 'new' : 'old'; }
`,cases:[]},
  {id:'side-effect-refusal',title:'Refuse an effectful condition',description:'Do not simplify a condition containing an unrecognized function call.',flag:'express',finalValue:true,source:`import { flag } from '@flagexit/flags';
const record = () => true;
export function evaluate() { if(flag('express') && record()) return 'new'; return 'old'; }
`,cases:[]}
] as const;
export function listOwnedScenarios() { return catalog.map(({id,title,description,flag,finalValue})=>({id,title,description,flag,finalValue})); }
export function getOwnedScenario(id:string) {
  const item=catalog.find(item=>item.id===id);
  if(!item) throw new Error('Unknown owned scenario');
  const files=[{path:'checkout.ts',source:item.source}];
  const input:RetirementInput={flag:item.flag,finalValue:item.finalValue,files,evidence:item.id==='rollout-refusal'?[]:[{flag:item.flag,finalValue:item.finalValue,rollout:'complete',coveragePercent:100,activeOverrides:0,reference:`owned synthetic rollout fixture: ${item.id}`,sourceSha256:hashSources(files)}]};
  return {id:item.id,title:item.title,description:item.description,input};
}
function executeOwned(code:string, input:unknown, flags:Record<string,boolean>):unknown {
  const compiled=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const context=vm.createContext({exports:{},__case:structuredClone(input),require:(name:string)=>{
    if(name!=='@flagexit/flags') throw Error('Unexpected owned fixture import');
    return {flag:(key:string)=>{if(!(key in flags))throw Error('Unspecified fixture flag');return flags[key];}};
  }},{codeGeneration:{strings:false,wasm:false}});
  return JSON.parse(new vm.Script(compiled+'\nJSON.stringify(exports.evaluate(__case));').runInContext(context,{timeout:150}));
}
export function verifyOwnedScenario(id:string) {
  const item=catalog.find(item=>item.id===id);
  if(!item)throw Error('Unknown owned scenario');
  const scenario=getOwnedScenario(id),retirement=analyzeRetirement(scenario.input);
  const limitations=['Finite behavior comparisons on original synthetic fixtures; not arbitrary-program equivalence.','These are actual local computations, not GitLab CI or Duo execution.'];
  if(retirement.status==='refused')return {scenario,retirement,verification:{status:'not_run',cases:[],wrongValueCaught:false,caseCount:0,limitations}};
  const candidate=retirement.changes[0]!.after;
  const cases=item.cases.map((input,index)=>{
    const flags={express:item.finalValue,loyalty:item.finalValue,gift:'gift' in input?input.gift:false};
    const baseline=executeOwned(item.source,input,flags),result=executeOwned(candidate,input,flags);
    const wrong=executeOwned(item.source,input,{...flags,[item.flag]:!item.finalValue});
    return {id:`${id}-${index+1}`,input,baseline,candidate:result,passed:JSON.stringify(baseline)===JSON.stringify(result),wrongValueDiffers:JSON.stringify(wrong)!==JSON.stringify(result)};
  });
  return {scenario,retirement,verification:{status:cases.every(item=>item.passed)?'passed':'failed',cases,wrongValueCaught:cases.some(item=>item.wrongValueDiffers),caseCount:cases.length,limitations}};
}

// The review CLI executes only these exact, repository-owned variants. This is
// deliberately not an evaluator for uploaded source or arbitrary MR patches.
export function verifyOwnedCandidate(id:string, candidate:string) {
  const item=catalog.find(item=>item.id===id);
  if(!item||!item.cases.length)throw Error('Unknown executable owned scenario');
  const scenario=getOwnedScenario(id), expected=analyzeRetirement(scenario.input);
  const wrongInput=structuredClone(scenario.input);
  wrongInput.finalValue=!wrongInput.finalValue;
  wrongInput.evidence=wrongInput.evidence.map(record=>({...record,finalValue:wrongInput.finalValue}));
  const wrong=analyzeRetirement(wrongInput);
  if(expected.status!=='accepted'||wrong.status!=='accepted')throw Error('Owned fixture cannot produce review candidates');
  const variant=candidate===item.source?'baseline':candidate===expected.changes[0]!.after?'retired':candidate===wrong.changes[0]!.after?'opposite_value_control':'unknown';
  if(variant==='unknown')return {status:'refused' as const,variant,cases:[],reason:'Candidate is not one of the exact owned variants; no source was executed.'};
  const cases=item.cases.map((input,index)=>{
    const flags={express:item.finalValue,loyalty:item.finalValue,gift:'gift' in input?input.gift:false};
    const baseline=executeOwned(item.source,input,flags), result=executeOwned(candidate,input,flags);
    return {id:`${id}-${index+1}`,input,baseline,candidate:result,passed:JSON.stringify(baseline)===JSON.stringify(result)};
  });
  return {status:cases.every(result=>result.passed)?'passed' as const:'failed' as const,variant,cases,reason:null};
}
