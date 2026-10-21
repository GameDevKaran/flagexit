import { readFileSync } from 'node:fs';
import { analyzeRetirement } from './core.js';
import { listOwnedScenarios,verifyOwnedScenario } from './fixtures.js';
const [command,arg]=process.argv.slice(2);
if(command==='demo')console.log(JSON.stringify(verifyOwnedScenario(arg??'express-true'),null,2));
else if(command==='list')console.log(JSON.stringify(listOwnedScenarios(),null,2));
else if(command==='analyze'&&arg){const body=readFileSync(arg);if(body.length>400_000)throw Error('Input too large');console.log(JSON.stringify(analyzeRetirement(JSON.parse(body.toString('utf8'))),null,2));}
else {console.error('Usage: node dist/src/cli.js demo [owned-id] | list | analyze input.json');process.exitCode=2;}
