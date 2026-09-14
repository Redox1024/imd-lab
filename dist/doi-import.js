import {paperFromCrossref,doiValue} from './publication-data.js?v=20260914-paper5';
import {safeURL} from './schema.js?v=20260914-paper5';
import {normalizeAuthorRoles} from './author-roles.js?v=20260914-paper5';

// Only a DOI or a DOI resolver URL is accepted; other text stays editable.
export function normalizeDOI(value){
 let input=String(value||'').trim().replace(/^doi\s*:\s*/i,'').replace(/^<(.+)>$/,'$1');
 try{
  if(/^https?:\/\//i.test(input)){
   const url=new URL(input);
   if(!['doi.org','dx.doi.org','www.doi.org'].includes(url.hostname.toLowerCase()))return '';
   input=decodeURIComponent(url.pathname.slice(1));
  }else input=decodeURIComponent(input);
 }catch{return '';}
 if(!/^10\.\d{4,9}\/[^\s<>"?#]+$/i.test(input))return '';
 return doiValue(input);
}

export function paperArticleURL(paper){
 const doi=normalizeDOI(paper?.doi);
 return safeURL(paper?.articleUrl)||(doi?'https://doi.org/'+doi:'');
}

export async function lookupDOI(value,{signal,request=globalThis.fetch,timeoutMs=12000}={}){
 const doi=normalizeDOI(value);
 if(!doi)throw new Error('Enter a DOI such as 10.1002/smll.202407882 or its https://doi.org/ URL. You can also enter the paper details manually.');
 if(signal?.aborted)throw new DOMException('DOI lookup cancelled.','AbortError');
 const controller=new AbortController();let timedOut=false;
 const abort=()=>controller.abort(),timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 signal?.addEventListener('abort',abort,{once:true});
 try{
  const response=await request('https://api.crossref.org/works/'+encodeURIComponent(doi),{
   signal:controller.signal,headers:{Accept:'application/json'},credentials:'omit',referrerPolicy:'no-referrer'
  });
  if(response.status===404)throw new Error('No record was found for this DOI. Check the DOI or enter the paper details manually.');
  if(response.status===429)throw new Error('DOI lookup is temporarily busy. Try again later or enter the paper details manually.');
  if(!response.ok)throw new Error('DOI lookup is unavailable ('+response.status+'). Your entries are unchanged; you can continue manually.');
  let message;try{message=(await response.json()).message;}catch{throw new Error('The DOI service returned an unreadable response. Your entries are unchanged; please enter the details manually.');}
  if(!message||doiValue(message.DOI)!==doi)throw new Error('The returned record does not match this DOI. Your entries are unchanged; please enter the details manually.');
  const paper=paperFromCrossref(message);
  if(!paper.title&&!paper.authors&&!paper.venue)throw new Error('No usable paper details were returned. Please enter the details manually.');
  if(signal?.aborted)throw new DOMException('DOI lookup cancelled.','AbortError');
  return paper;
 }catch(error){
  if(signal?.aborted)throw new DOMException('DOI lookup cancelled.','AbortError');
  if(timedOut)throw new Error('DOI lookup timed out. Your entries are unchanged; try again or enter the details manually.');
  if(error instanceof TypeError)throw new Error('Could not connect to the DOI service. Your entries are unchanged; check your connection or enter the details manually.');
  throw error;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}

// Refresh only supplied bibliographic values. Identity, IF, PI selection and
// custom links/notes must survive refreshes, including incomplete metadata.
export function mergeDOIFields(current,incoming){
 const next={...current};
 for(const key of ['title','authors','venue','year','type','doi','articleUrl','issn','details']){
  const value=incoming[key];if(value!==''&&value!==undefined&&value!==null)next[key]=value;
 }
 // Keep manual roles only when their exact author identity remains present.
 next.authorRoles=normalizeAuthorRoles(current.authorRoles,next.authors);
 if(!String(current.keywords||'').trim())next.keywords=incoming.keywords||'';
 next.isExample=false;
 const note=incoming.importNote||'Bibliographic fields filled from DOI.';
 if(!String(current.importNote||'').trim()||current.isExample)next.importNote=note;
 return next;
}
