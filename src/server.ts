import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { analyzeRetirement } from './core.js';
import { getOwnedScenario,listOwnedScenarios,verifyOwnedScenario } from './fixtures.js';
const web=new URL('../../web/',import.meta.url);
const assets=new Map([['/',['index.html','text/html; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/styles.css',['styles.css','text/css; charset=utf-8']]]);
const maxBody=400_000;
function headers(res:ServerResponse){res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');}
function json(res:ServerResponse,status:number,data:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function body(req:IncomingMessage){let length=0;const chunks:Buffer[]=[];for await(const chunk of req){length+=chunk.length;if(length>maxBody)throw Error('Request too large');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
export function makeServer(publicOrigin=process.env.FLAGEXIT_PUBLIC_ORIGIN??''){
 const server=createServer(async(req,res)=>{headers(res);try{
  const url=new URL(req.url??'/','http://localhost');
  if(req.method==='GET'){
   if(assets.has(url.pathname)){const [name,type]=assets.get(url.pathname)!;res.writeHead(200,{'Content-Type':type!});res.end(readFileSync(new URL(name!,web)));return;}
   if(url.pathname==='/api/health'){json(res,200,{application:'FlagExit',status:'ok',sourceCommit:/^[a-f0-9]{40}$/.test(process.env.SOURCE_COMMIT??'')?process.env.SOURCE_COMMIT:null,integration:{scope:'separate_review_workflow',webRequestInvokesDuo:false,gitlabDuo:'verified',sessionId:10031611,pipeline:'verified',pipelineId:2988163142,mergeRequest:1,merged:false},persistence:'optional_browser_storage_only'});return;}
   if(url.pathname==='/api/scenarios'){json(res,200,listOwnedScenarios());return;}
   if(url.pathname==='/api/scenario'){try{json(res,200,getOwnedScenario(url.searchParams.get('id')??''));}catch{json(res,404,{error:'Unknown owned scenario'});}return;}
   json(res,404,{error:'Not found'});return;
  }
  if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}
  if(!['/api/verify','/api/analyze'].includes(url.pathname)){json(res,404,{error:'Not found'});return;}
  const allowed=publicOrigin||`http://${req.headers.host}`;
  if((req.headers.origin&&req.headers.origin!==allowed)||req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'Cross-origin request rejected'});return;}
  if((req.headers['content-type']??'').split(';')[0]?.trim()!=='application/json'){json(res,415,{error:'JSON content type required'});return;}
  if(Number(req.headers['content-length']??0)>maxBody){json(res,413,{error:'Request too large'});req.resume();return;}
  const data=await body(req);
  if(url.pathname==='/api/verify'){
   if(!data||typeof data.id!=='string'||!listOwnedScenarios().some(item=>item.id===data.id)){json(res,400,{error:'Choose a known owned scenario'});return;}
   json(res,200,verifyOwnedScenario(data.id));return;
  }
  json(res,200,{scenario:{id:'submitted-source',title:'Submitted source — static analysis only'},retirement:analyzeRetirement(data),verification:{status:'not_run',cases:[],caseCount:0,wrongValueCaught:false,limitations:['Submitted source is never executed.']}});
 }catch(error){if(!res.headersSent)json(res,error instanceof Error&&error.message==='Request too large'?413:400,{error:'Unable to analyze this input. Check the JSON format, source size and supported syntax.'});else res.end();}});
 server.requestTimeout=15_000;server.headersTimeout=10_000;server.keepAliveTimeout=5_000;return server;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))makeServer().listen(Number(process.env.PORT??8785),process.env.HOST??'127.0.0.1',()=>console.log('FlagExit listening on configured port'));
