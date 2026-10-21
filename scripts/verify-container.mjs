import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
const out='.local/container';await fs.mkdir(out,{recursive:true});let container;
const report={application:'FlagExit',location:'local_linux_container',passed:false,checks:[],startedAt:new Date().toISOString()};
try{
 container=execFileSync('docker',['run','--detach','--rm','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','512m','--cpus','1','--pids-limit','64','-p','127.0.0.1::8785','flagexit:local-check'],{encoding:'utf8'}).trim();
 if(!/^[a-f0-9]{64}$/.test(container))throw Error('Unexpected owned container ID');
 const config=JSON.parse(execFileSync('docker',['inspect',container],{encoding:'utf8'}))[0];const port=config.NetworkSettings.Ports['8785/tcp'][0].HostPort;const base='http://127.0.0.1:'+port;
 let health;for(let attempt=0;attempt<20;attempt++){try{const r=await fetch(base+'/api/health');if(r.ok){health=await r.json();break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
 if(!health||health.integration.gitlabDuo!=='not_verified')throw Error('Container did not become ready with truthful provider status');report.checks.push('real Linux HTTP health');
 const result=await(await fetch(base+'/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'nested-flags'})})).json();
 if(result.verification.status!=='passed'||result.verification.caseCount!==4||!result.verification.wrongValueCaught)throw Error('Linux behavior comparison failed');report.checks.push('actual TypeScript transform and four Linux runtime cases');
 const rejected=await fetch(base+'/api/verify',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://foreign.example'},body:'{}'});if(rejected.status!==403)throw Error('Origin guard failed');report.checks.push('foreign-origin rejection');
 if(config.Config.User!=='node'||!config.HostConfig.ReadonlyRootfs)throw Error('Runtime isolation mismatch');report.checks.push('non-root read-only execution');report.image=config.Image;report.runtime=health;report.passed=true;
}catch(error){report.error=String(error);process.exitCode=1;}
finally{if(container&&/^[a-f0-9]{64}$/.test(container))execFileSync('docker',['stop',container],{stdio:'ignore'});report.finishedAt=new Date().toISOString();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
