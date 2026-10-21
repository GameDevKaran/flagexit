import { readFileSync } from 'node:fs';
import { analyzeRetirement } from './core.js';
import { listOwnedScenarios,verifyOwnedScenario } from './fixtures.js';
import { applyReview,verifyReview,verifyWrongReviewControl } from './review.js';
const [command,arg,...options]=process.argv.slice(2);
if(command==='review') {
  try {
    if(options.some(option=>option!=='--require-retired')||(arg!=='verify'&&options.length))throw Error('Unsupported review option');
    const result=arg==='apply'?applyReview():arg==='verify'?verifyReview(process.cwd(),options.includes('--require-retired')):arg==='control'?verifyWrongReviewControl():null;
    if(!result)throw Error('Expected review apply, verify [--require-retired], or control');
    console.log(JSON.stringify(result,null,2));
    if(result.status==='failed'||result.status==='gate_failed')process.exitCode=1;
  } catch(error) {console.log(JSON.stringify({status:'refused',error:(error as Error).message},null,2));process.exitCode=1;}
}
else if(command==='demo')console.log(JSON.stringify(verifyOwnedScenario(arg??'express-true'),null,2));
else if(command==='list')console.log(JSON.stringify(listOwnedScenarios(),null,2));
else if(command==='analyze'&&arg){const body=readFileSync(arg);if(body.length>400_000)throw Error('Input too large');console.log(JSON.stringify(analyzeRetirement(JSON.parse(body.toString('utf8'))),null,2));}
else {console.error('Usage: node dist/src/cli.js demo [owned-id] | list | analyze input.json | review apply|verify [--require-retired]|control');process.exitCode=2;}
