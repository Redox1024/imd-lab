// Runs in GitHub Actions. Never put the Clarivate key in public website data.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateContent,safeURL} from '../dist/schema.js';
import {issns,ensureJournal} from '../dist/publication-data.js';
export const apiBase='https://api.clarivate.com/apis/wos-journals/v1';
export function reportMetric(report,source,checked){
 const status=report.suppressed?'미제공':report.onHold?'보류':report.delisted?'제외':'확인됨';
 const value=String(report.metrics?.impactMetrics?.jif??'').trim(),valid=/^<?\d+(?:\.\d+)?$/.test(value),year=Number(report.year);
 if(!Number.isInteger(year)||year<1997||year>new Date().getFullYear())throw new Error('Invalid report year');
 return {impactFactor:status==='확인됨'&&valid?value:'',metricYear:year,metricSource:safeURL(source),metricUpdated:checked,metricStatus:status==='확인됨'&&!valid?'미제공':status};
}
export async function refreshJournal(journal,request,checked=new Date().toISOString().slice(0,10)){
 const wanted=issns(journal.issn);if(!wanted.length)return {skipped:'no ISSN'};
 const candidates=new Map();
 for(const code of wanted){const result=await request('/journals?q='+encodeURIComponent(code)+'&limit=50');for(const hit of result.hits||[])if(hit.id)candidates.set(hit.id,hit);}
 let chosen;
 for(const id of candidates.keys()){const detail=await request('/journals/'+encodeURIComponent(id));if(!issns([detail.issn,detail.eIssn].join(';')).some(x=>wanted.includes(x)))continue;if(chosen&&chosen.id!==id)throw new Error('Ambiguous ISSN match');chosen={id,detail};}
 if(!chosen)return {skipped:'no exact ISSN match'};
 const reports=(chosen.detail.journalCitationReports||[]).filter(r=>Number.isInteger(Number(r.year))).sort((a,b)=>Number(b.year)-Number(a.year));
 if(!reports.length)return {skipped:'no JCR report'};
 const latest=reports[0],path='/journals/'+encodeURIComponent(chosen.id)+'/reports/year/'+latest.year;
 let report;
 try{report=await request(path);}catch(error){if(error.status===404&&/suppress/i.test(error.apiTitle||''))report={year:Number(latest.year),suppressed:true};else throw error;}
 if(Number(report.year)!==Number(latest.year))throw new Error('Report year mismatch');
 if(Number(journal.metricYear)>Number(report.year))throw new Error('Older report refused');
 const patch=reportMetric(report,safeURL(latest.url)||apiBase+path,checked);
 return {patch:{...patch,clarivateId:chosen.id}};
}
export function makeRequest(key){return async path=>{for(let attempt=0;attempt<3;attempt++){await new Promise(r=>setTimeout(r,225));const response=await fetch(apiBase+path,{headers:{'X-ApiKey':key,Accept:'application/json'},signal:AbortSignal.timeout(20000)});if((response.status===429||response.status>=500)&&attempt<2){await new Promise(r=>setTimeout(r,1000*(attempt+1)));continue;}const data=await response.json();if(!response.ok){const error=new Error('Clarivate HTTP '+response.status);error.status=response.status;error.apiTitle=data.error?.title||'';throw error;}return data;}throw new Error('API unavailable');};}
async function main(){
 const key=process.env.CLARIVATE_API_KEY;
 if(!key||process.env.JCR_PUBLIC_DISPLAY_AUTHORIZED!=='true'){console.log('JIF refresh skipped: configure the API secret and institutional public-display authorization to enable.');return;}
 const file=new URL('../dist/data/content.json',import.meta.url),data=validateContent(JSON.parse(await readFile(file,'utf8')));for(const p of data.publications)ensureJournal(p,data.journals);
 const request=makeRequest(key);let updated=0,failed=0;
 for(const journal of data.journals){try{const result=await refreshJournal(journal,request);if(result.patch){Object.assign(journal,result.patch);updated++;}else console.log('JIF skipped:',journal.name,result.skipped);}catch(error){failed++;console.warn('JIF refresh failed:',journal.name,error.message);}}
 await writeFile(file,JSON.stringify(validateContent(data),null,2)+'\n');console.log(`JIF refresh: ${updated} updated, ${failed} failed. Failed entries retain their dated previous values.`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
