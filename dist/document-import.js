import {doiValue,paperFromText,paperFromCrossref,patentFromText,looksLikeSamePaper} from './publication-data.js?v=20260915-pi3';
const PDF_CDN='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/';
let pdfLibraryPromise,ocrScriptPromise;
const metadataCache=new Map();
const xmpKeys=['dc:title','dc:creator','dc:description','dc:identifier','pdf:keywords','prism:publicationname','prism:publicationdate','prism:coverdate','prism:doi','crossmark:doi','pdfx:doi','prism:issn','prism:volume','prism:number','prism:startingpage','prism:endingpage'];
function cancelled(signal){if(signal?.aborted)throw new DOMException('Import cancelled.','AbortError');}
async function pdfLibrary(){if(!pdfLibraryPromise)pdfLibraryPromise=import('./vendor/pdf.mjs').then(lib=>{lib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;return lib;}).catch(error=>{pdfLibraryPromise=null;throw error;});return pdfLibraryPromise;}
async function ocrLibrary(){if(globalThis.Tesseract)return globalThis.Tesseract;if(!ocrScriptPromise)ocrScriptPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('./vendor/tesseract.min.js',import.meta.url).href;script.onload=()=>resolve(globalThis.Tesseract);script.onerror=()=>{ocrScriptPromise=null;reject(new Error('Unable to load text recognition.'));};document.head.append(script);});return ocrScriptPromise;}
export function textFromItems(items){let text='',lastY=null;for(const item of items){if(!('str' in item))continue;const y=item.transform?.[5];if(lastY!==null&&Math.abs(y-lastY)>3&&!text.endsWith('\n'))text+='\n';text+=item.str+(item.hasEOL?'\n':' ');lastY=y;}return text.replace(/[ \t]+\n/g,'\n').trim();}
async function recognize(image,kind,progress,signal){cancelled(signal);const lib=await ocrLibrary();let worker;const abort=()=>worker?.terminate();try{worker=await lib.createWorker(kind==='patents'?'kor+eng':'eng',1,{workerPath:new URL('./vendor/tesseract.worker.min.js',import.meta.url).href,corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0',logger:m=>{if(m.status==='recognizing text')progress('Recognizing scanned text '+Math.round(m.progress*100)+'%');}});cancelled(signal);signal?.addEventListener('abort',abort,{once:true});const result=await worker.recognize(image);cancelled(signal);return result.data.text;}finally{signal?.removeEventListener('abort',abort);await worker?.terminate();}}
export async function extractDocument(file,kind,progress=()=>{},signal){
 if(file.size>30*1024*1024)throw new Error('Choose a file no larger than 30 MB.');cancelled(signal);
 const bytes=new Uint8Array(await file.arrayBuffer()),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
 if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-')){
  if(kind!=='patents'||!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('Use PDF for papers, or PDF, PNG, JPG or WEBP for patent certificates.');
  const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.ceil(bitmap.width*scale);canvas.height=Math.ceil(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return {text:await recognize(canvas,kind,progress,signal),firstText:'',info:{},links:[],hash,ocr:true};}finally{bitmap.close();}
 }
 const lib=await pdfLibrary(),task=lib.getDocument({data:bytes,isEvalSupported:false,enableXfa:false,cMapUrl:PDF_CDN+'cmaps/',cMapPacked:true,standardFontDataUrl:PDF_CDN+'standard_fonts/',wasmUrl:PDF_CDN+'wasm/',useSystemFonts:true});
 const abort=()=>task.destroy();signal?.addEventListener('abort',abort,{once:true});let pdf;
 try{pdf=await task.promise;const metadata=await pdf.getMetadata().catch(()=>({info:{}})),maxPages=Math.min(pdf.numPages,kind==='patents'?5:3),texts=[],links=[];let ocr=false;
  for(let index=1;index<=maxPages;index++){cancelled(signal);progress(`PDF ${index} / ${maxPages} pages`);const page=await pdf.getPage(index),content=await page.getTextContent();let text=textFromItems(content.items);
   if(index===1){for(const item of await page.getAnnotations())if(item.url)links.push(item.url);}
   if(text.replace(/\s/g,'').length<55){const viewport=page.getViewport({scale:Math.min(2.2,2200/Math.max(page.view[2],page.view[3]))}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,viewport}).promise;text=await recognize(canvas,kind,progress,signal);canvas.width=canvas.height=0;ocr=true;}
   texts.push(text);page.cleanup();
  }
  const xmp={};for(const key of xmpKeys){const value=metadata.metadata?.get(key);if(typeof value==='string'||Array.isArray(value))xmp[key]=value;}
  return {text:texts.join('\n\n'),firstText:texts[0]||'',info:metadata.info||{},xmp,links,hash,ocr};
 }catch(error){if(signal?.aborted)throw new DOMException('Import cancelled.','AbortError');if(error.name==='PasswordException')throw new Error('Choose a PDF without password protection.');throw error;}finally{signal?.removeEventListener('abort',abort);await task.destroy();}
}
export async function crossrefMetadata(doi,signal){
 doi=doiValue(doi);if(!doi)throw new Error('A valid DOI is required.');if(metadataCache.has(doi))return metadataCache.get(doi);cancelled(signal);
 const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(()=>controller.abort(),8000);signal?.addEventListener('abort',abort,{once:true});
 try{const response=await fetch('https://api.crossref.org/works/'+encodeURIComponent(doi),{signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok){const error=new Error('Crossref request failed ('+response.status+').');error.status=response.status;throw error;}const result=(await response.json()).message;if(!result||doiValue(result.DOI)!==doi)throw new Error('The DOI does not match.');metadataCache.set(doi,result);return result;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function importDocument(file,kind,progress=()=>{},signal){
 const extracted=await extractDocument(file,kind,progress,signal);cancelled(signal);if(extracted.text.replace(/\s/g,'').length<30)throw new Error('Not enough text could be read. Choose a clearer scan or a text-based PDF.');
 if(kind==='patents'){const record=patentFromText(extracted.text);record.sourceHash=extracted.hash;if(extracted.ocr)record.importNote+=' Scanned text recognized with OCR.';return record;}
 const first=(extracted.firstText||extracted.text).split(/\n\s*(?:References|Bibliography)\s*\n/i)[0],record=paperFromText(first,extracted.info,extracted.xmp);
 record.sourceHash=extracted.hash;if(extracted.ocr)record.importNote+=' OCR used.';
 // Publisher-supplied XMP can contain the entire author list even when PDF Info
 // contains only the first author. Complete embedded records work offline.
 if(extracted.xmp?.['dc:creator']&&extracted.xmp?.['prism:publicationname']&&record.title&&record.authors&&record.venue&&record.year&&record.doi)return record;
 const candidates=[...new Set([doiValue(record.doi),...((first.match(/10\.\d{4,9}\/[^\s<>"]+/gi)||[]).map(doiValue)),...extracted.links.map(doiValue)].filter(Boolean))].slice(0,4);
 let lookupFailed=false;
 for(const doi of candidates){cancelled(signal);progress('Looking up journal and author metadata by DOI');try{const metadata=await crossrefMetadata(doi,signal),candidate=paperFromCrossref(metadata,first);if(!looksLikeSamePaper(candidate.title,record.title||first))continue;const nonempty=Object.fromEntries(Object.entries(candidate).filter(([,value])=>value!==''&&value!==undefined&&value!==null));return {...record,...nonempty,sourceHash:extracted.hash,importNote:candidate.importNote+(extracted.ocr?' · OCR used':'')};}catch(error){cancelled(signal);lookupFailed=true;if(!error.status||error.status===429||error.status>=500)break;}}
 if(!record.doi&&candidates.length===1){record.doi='https://doi.org/'+candidates[0];record.articleUrl=record.doi;record.importNote+=' Check the suggested DOI against the original paper.';}
 if(lookupFailed)record.importNote+=' Online metadata unavailable; PDF fields retained.';
 return record;
}
