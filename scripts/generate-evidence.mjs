import fs from 'node:fs/promises';
import {listOwnedScenarios,verifyOwnedScenario} from '../dist/src/fixtures.js';
const results=listOwnedScenarios().map(item=>verifyOwnedScenario(item.id));
const successful=results.filter(item=>item.retirement.status==='accepted');
if(successful.some(item=>item.verification.status!=='passed'||!item.verification.wrongValueCaught))throw Error('Fixture release gate failed');
const ci=process.env.CI==='true'&&process.env.CI_PROJECT_ID&&process.env.CI_PIPELINE_ID;
await fs.mkdir('artifacts',{recursive:true});
await fs.writeFile('artifacts/retirement-evidence.json',JSON.stringify({application:'FlagExit',recordedAt:new Date().toISOString(),execution:ci?'gitlab_ci_environment':'local',sourceCommit:process.env.CI_COMMIT_SHA??null,projectId:process.env.CI_PROJECT_ID??null,pipelineId:process.env.CI_PIPELINE_ID??null,pipelineUrl:process.env.CI_PIPELINE_URL??null,duoExecutionVerified:false,results},null,2));
console.log(`Saved ${results.length} actual fixture reports; ${ci?'CI environment metadata attached (provider verification still required)':'local execution, no GitLab claim'}.`);
