// Run against the supplied original; no PDF content is sent to any service.
// Usage: node scripts/test-paper-pdf.mjs /absolute/path/s40820-026-02167-y.pdf
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {paperFromText,upsertImported} from '../dist/publication-data.js';

const path=process.argv[2];
if(!path)throw new Error('Pass the original s40820-026-02167-y PDF path as the first argument.');
if(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES){const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json'),canvas=require('@napi-rs/canvas');Object.assign(globalThis,{DOMMatrix:canvas.DOMMatrix,Path2D:canvas.Path2D,ImageData:canvas.ImageData});}
const {extractDocument,importDocument}=await import('../dist/document-import.js');
const expected={
 title:'Growth-Directing Nanostructured Interfaces via Block Copolymer-Templated Au Nanoseed Arrays for Stabilized Zinc Anodes in Lean-Zinc Batteries',
 authors:'Dong Won Hae, Hoseok Lee, Hyeong Jun Kook, Ga Hee Kim, Saehun Kim, Jaecheol Choi, Min Pyeong Kim, Seok Hun Kang, Won Jun Lee, Young-Gi Lee, Hyeong Min Jin, Jongsoon Kim, Dong Ok Shin',
 venue:'Nano-Micro Letters',year:2026,doi:'https://doi.org/10.1007/s40820-026-02167-y',issn:'2150-5551',details:'18:355',
 keywords:'Aqueous zinc-ion battery; Block copolymer template; Au nanoseed'
};
const file=new File([await readFile(path)],'s40820-026-02167-y.pdf',{type:'application/pdf'}),originalFetch=globalThis.fetch;
let networkCalls=0;globalThis.fetch=async()=>{networkCalls++;throw new Error('Network disabled for this regression test');};
try{
 const extracted=await extractDocument(file,'publications');
 assert.equal(extracted.ocr,false);assert.equal(extracted.xmp['dc:creator'].length,13);
 const record=await importDocument(file,'publications');
 for(const [key,value]of Object.entries(expected))assert.equal(record[key],value,key);
 assert.equal(record.sourceHash.length,64);assert.equal(networkCalls,0,'Complete publisher metadata must import offline');
 const records=[];assert.equal(upsertImported(records,{id:'paper-1',...record},'publications').action,'added');assert.equal(upsertImported(records,{id:'paper-2',...record},'publications').action,'duplicate');assert.equal(records.length,1);
 const withoutXMP=paperFromText(extracted.firstText,extracted.info);
 for(const [key,value]of Object.entries(expected))assert.equal(withoutXMP[key],value,'PDF Info/text fallback: '+key);
 const textOnly=paperFromText(extracted.firstText);
 for(const key of ['title','authors','year','doi','issn','details'])assert.equal(textOnly[key],expected[key],'Text-only fallback: '+key);
 assert.equal(textOnly.venue,'Nano-Micro Lett.','Keep the printed abbreviation when the full journal name is unavailable');
 console.log('PASS: original attached PDF → exact title, 13 authors, journal, 2026, DOI, ISSN, volume/article and keywords; zero network requests; duplicate prevention; Info/text and text-only fallbacks.');
 console.log(JSON.stringify(record,null,2));
}finally{globalThis.fetch=originalFetch;}
