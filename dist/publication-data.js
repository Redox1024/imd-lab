import {safeURL} from './schema.js';
export const normalizeTitle = value => String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const issns = value => [...new Set((String(value||'').toUpperCase().match(/\d{4}-?\d{3}[\dX]/g)||[]).map(x=>x.replace('-','')).map(x=>x.slice(0,4)+'-'+x.slice(4)))];
export function doiValue(value){
 let source=String(value||'').trim();
 // Crossmark links carry the DOI in a query parameter, followed by &domain=pdf.
 // Reading the entire URL as a DOI made that first, invalid lookup stop the import.
 try{const url=new URL(source);source=url.searchParams.get('doi')||decodeURIComponent(url.pathname);}catch{}
 const match=source.match(/10\.\d{4,9}\/[^\s<>"?#]+/i);if(!match)return '';
 let d=match[0].replace(/&(?:amp;)?[a-z][\w-]*=.*$/i,'').replace(/[.,;:]+$/,'');
 for(const [open,close]of [['(',')'],['[',']'],['{','}']])while(d.endsWith(close)&&d.split(close).length>d.split(open).length)d=d.slice(0,-1);
 return d.toLowerCase();
}
export function findJournal(paper,journals=[]){const codes=issns(paper.issn),name=normalizeTitle(paper.venue);const matches=journals.filter(j=>codes.length&&issns(j.issn).some(x=>codes.includes(x)));if(matches.length===1)return matches[0];if(matches.length>1)return matches.sort((a,b)=>(b.metricYear||0)-(a.metricYear||0))[0];const named=journals.filter(j=>normalizeTitle(j.name)===name);return named.length===1?named[0]:null;}
export function ensureJournal(paper,journals){if(!paper.venue)return null;let journal=findJournal(paper,journals);if(journal){journal.issn=issns(journal.issn+';'+paper.issn).join('; ');return journal;}journal={id:'journal-'+crypto.randomUUID(),name:paper.venue,issn:issns(paper.issn).join('; '),impactFactor:'',metricYear:'',metricSource:'',metricUpdated:'',metricStatus:'미연동',clarivateId:''};journals.push(journal);return journal;}
export function journalMetric(paper){
 const value=String(paper?.impactFactor??'').trim();
 if(!/^<?\d+(?:\.\d+)?$/.test(value))return {label:'IF —',source:'',updated:'',status:'unavailable',verified:false};
 const year=/^(18|19|20|21)\d{2}$/.test(String(paper?.metricYear??''))?paper.metricYear:'';
 return {label:`IF ${value}${year?' · '+year:''}`,source:safeURL(paper?.metricSource),updated:'',status:'manual',verified:false};
}
export const publicationSpecialNote=paper=>paper?.showSpecialNote===true?String(paper.specialNote??'').trim():'';
export const keywordList=value=>[...new Set(String(value||'').split(/[;；\n]+/).map(x=>x.trim()).filter(Boolean))].slice(0,3);
export function extractKeywords(text,metadata=[]){
 const explicit=String(text||'').match(/(?:key\s*words?|키워드|주제어)\s*[:：]?\s*([^\n]{8,240}(?:\n[^\n]{5,100})?)/i);
 if(explicit){const line=explicit[1].split(/\n|\b(?:introduction|abstract)\b|서론/i)[0];const parts=line.split(/[;,•·]/).map(x=>x.trim()).filter(x=>x.length>2&&x.length<65);if(parts.length>=2)return {keywords:parts.slice(0,3),origin:'PDF keywords'};}
 const terms=[['Solid-state batteries',/solid.state|전고체/gi],['Lithium metal',/lithium.metal|리튬.?금속/gi],['Sodium-ion batteries',/sodium.ion|나트륨/gi],['Lithium-ion batteries',/lithium.ion|리튬.?이온/gi],['Electrolytes',/electrolyte|전해질/gi],['Electrode materials',/electrode|cathode|anode|전극|양극|음극/gi],['Interfacial chemistry',/interface|interphase|계면/gi],['Electrochemical kinetics',/kinetics|charge.transfer|반응.?속도/gi],['Battery degradation',/degradation|aging|열화/gi],['Energy storage',/energy.storage|battery|batteries|전지|배터리/gi],['Electrocatalysis',/electrocatal|촉매/gi],['Materials characterization',/spectroscop|microscop|characterization|분광|현미경/gi]];
 const scored=terms.map(([name,re])=>[name,(text.match(re)||[]).length]).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).map(([name])=>name);
 return {keywords:[...new Set([...scored,...metadata.filter(x=>typeof x==='string')])].slice(0,3),origin:'Suggested from content — review required'};
}
export function paperFromCrossref(message,text=''){
 const m=message||{},year=(m['published-print']?.['date-parts']||m['published-online']?.['date-parts']||m.published?.['date-parts']||m.issued?.['date-parts'])?.[0]?.[0]||'';
 const key=extractKeywords(text+'\n'+(m.title?.[0]||'')+'\n'+String(m.abstract||'').replace(/<[^>]*>/g,' '),m.subject||[]),doi=doiValue(m.DOI);
 return {title:String(m.title?.[0]||'').replace(/<[^>]*>/g,''),authors:(m.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')||a.name||'').filter(Boolean).join(', '),venue:m['container-title']?.[0]||'',year,type:m.type==='proceedings-article'?'학회':m.type==='posted-content'?'프리프린트':'저널',doi:doi?'https://doi.org/'+doi:'',articleUrl:safeURL(m.resource?.primary?.URL)|| (doi?'https://doi.org/'+doi:safeURL(m.URL)),issn:issns((m.ISSN||[]).join(';')).join('; '),keywords:key.keywords.join('; '),details:[m.volume,m.issue?'('+m.issue+')':'',m.page||m['article-number']].filter(Boolean).join(' '),importNote:'Crossref metadata · '+key.origin,isExample:false};
}
export function looksLikeSamePaper(title,text){const words=normalizeTitle(title).split(' ').filter(w=>w.length>2),body=normalizeTitle(text);return words.length>=3&&words.filter(w=>body.includes(w)).length/words.length>=.65;}
function fieldValue(text,labels){const lines=text.split('\n').map(l=>l.trim()).filter(Boolean),stop=/^(?:\(?\d{2}\)?\s*)?(?:발명|출원|등록|특허권자|성명|주소|대리인|국제|우선|명칭|Inventor|Applicant|Application|Registration|Date|Title|Patent)/i;for(let i=0;i<lines.length;i++){for(const label of labels){const re=new RegExp('^(?:\\(?\\d{2}\\)?\\s*)?'+label+'\\s*[:：]?\\s*(.*)$','i'),m=lines[i].match(re);if(m){let parts=m[1]?[m[1]]:[];for(let k=i+1;k<Math.min(lines.length,i+5)&&!stop.test(lines[k]);k++)parts.push(lines[k]);return parts.join(' ').trim();}}}return '';}
const isoDate=value=>{const m=String(value||'').match(/((?:19|20)\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/);if(!m)return '';const d=m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');const date=new Date(d+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===d?d:'';};
export function patentFromText(text){
 const t=String(text||'').normalize('NFKC').replace(/발\s*명\s*의\s*명\s*칭/g,'발명의 명칭').replace(/출\s*원\s*번\s*호/g,'출원번호').replace(/등\s*록\s*번\s*호/g,'등록번호').replace(/등\s*록\s*일/g,'등록일').replace(/출\s*원\s*일/g,'출원일').replace(/발\s*명\s*자/g,'발명자');
 const app=fieldValue(t,['출원번호','Application (?:No\\.?|Number)']).match(/(?:10|20)-?\d{4}-?\d{7}|[A-Z]{0,3}\s?\d[\d,\/-]{5,}/i)?.[0]||'';
 const reg=fieldValue(t,['등록번호','특허번호','Patent (?:No\\.?|Number)','Registration (?:No\\.?|Number)']).match(/(?:10|20)-?\d{7}(?:-?\d{4})?|[A-Z]{0,3}\s?\d[\d,\/-]{5,}/i)?.[0]||'';
 const appDate=isoDate(fieldValue(t,['출원일(?:자)?','Application Date','Filing Date'])),regDate=isoDate(fieldValue(t,['등록일(?:자)?','Registration Date','Issue Date']));
 const status=reg&&/특허증|등록|patent number|patent no|registration|issue date/i.test(t)?'등록':app&&/출원|application|filing/i.test(t)?'출원':'';
 return {title:fieldValue(t,['발명의 명칭','고안의 명칭','Title(?: of (?:the )?Invention)?']),inventors:fieldValue(t,['발명자','Inventors?']),number:status==='등록'?reg:app,applicationNumber:app,registrationNumber:reg,applicationDate:appDate,registrationDate:regDate,date:status==='등록'?regDate:appDate,status,country:/대한민국|특허청|지식재산처|\bKIPO\b|\bKR\b/.test(t)?'Republic of Korea':/United States|USPTO/.test(t)?'United States':'',link:'',importNote:'Extracted from certificate. Review the title, inventors, numbers, dates and filing/grant status. Use English titles and inventor names for the public site.',isExample:false};
}
const cleanPDFText=value=>String(value||'').normalize('NFKC').replace(/[\u2010\u2011]/g,'-').replace(/\s+/g,' ').trim();
const validPDFTitle=value=>{const t=cleanPDFText(value);return t.length>=12&&t.length<=600&&!/^(?:untitled(?: document)?|(?:microsoft (?:word|powerpoint)\s*[-:]?.*|document\d*|(?:article|manuscript|journal|paper)\s+template|template))$/i.test(t)&&!/^https?:|^(?:received|accepted|published(?: online)?|copyright)\s*[:©]/i.test(t);};
function authorNames(value){
 const cleaned=cleanPDFText(value).replace(/\s*-\s*/g,'-').replace(/\d+(?:\s*,\s*\d+)*/g,'').replace(/[*†‡§¶⁎]/g,'').replace(/\s+,/g,',').replace(/\band\b/g,',');
 const names=cleaned.split(/[,;]+/).map(n=>n.trim()).filter(Boolean);
 return names.length&&names.every(n=>n.length<90&&n.split(/\s+/).length>=2&&/^[\p{L}\p{M}\s.'’-]+$/u.test(n)&&!/(?:university|institute|department|laboratory|research|abstract|keywords|contributed|published|copyright|received|accepted)/i.test(n))?names:[];
}
function titleAndAuthorsFromPage(text,metadataTitle){
 const lines=text.split('\n').map(cleanPDFText).filter(Boolean),limit=lines.findIndex(l=>/^(?:abstract|highlights|key\s*words?|introduction)\b/i.test(l)),front=lines.slice(0,limit<0?80:limit);
 let title=metadataTitle,titleEnd=-1;
 if(title){const normalized=normalizeTitle(title);for(let start=0;start<front.length;start++){let joined='';for(let end=start;end<Math.min(front.length,start+10);end++){joined=cleanPDFText(joined+' '+front[end]);if(normalizeTitle(joined)===normalized){titleEnd=end;break;}if(joined.length>title.length+30)break;}if(titleEnd>=0)break;}}
 if(!title){
  // Require a plausible author block immediately after a title. Headers and dates
  // alone are not sufficient evidence for guessing a paper title.
  for(let start=0;start<front.length&&titleEnd<0;start++){
   if(front[start].length<25||!validPDFTitle(front[start])||/https?:|\bdoi\b|\bissn\b|^cite as$|^\(?\d{4}\)?|^\d|^©/i.test(front[start]))continue;
   let joined=front[start];for(let end=start;end<Math.min(front.length,start+7);end++){
    if(end>start)joined=cleanPDFText(joined+' '+front[end]);
    const next=front[end+1]||'';if(authorNames(next).length&&(next.includes(',')||/^[\d,*†‡\s]+$/.test(front[end+2]||''))){title=joined;titleEnd=end;break;}
   }
  }
 }
 let names=[];
 if(titleEnd>=0){const parts=[];for(let i=titleEnd+1;i<front.length&&i<titleEnd+40;i++){const line=front[i];if(/^(?:\d+\s+)?(?:department|school|faculty|university|institute|centre|center)\b|@|^https?:/i.test(line))break;const candidate=authorNames(parts.concat(line).join(' '));if(candidate.length)names=candidate;else if(/[\p{L}]/u.test(line))break;parts.push(line);}}
 return {title,authors:names.join(', ')};
}
export function paperFromText(text,info={},xmp={}){
 const t=String(text||''),first=t.split(/\n\s*(?:References|Bibliography)\s*\n/i)[0];
 const embeddedTitle=[xmp['dc:title'],info.Title].map(cleanPDFText).find(validPDFTitle)||'',front=titleAndAuthorsFromPage(first,embeddedTitle);
 const creator=xmp['dc:creator'],embeddedAuthors=Array.isArray(creator)?creator.map(cleanPDFText).filter(Boolean).join(', '):cleanPDFText(creator);
 const authors=embeddedAuthors||front.authors||cleanPDFText(info.Author);
 const subject=cleanPDFText(xmp['dc:description']||info.Subject),subjectJournal=subject.match(/^([^,;]{3,160})[,;]\s*(?:https?:\/\/(?:dx\.)?doi\.org\/|doi\s*:)/i)?.[1]||'';
 const citation=first.match(/(?:Cite as\s*\n\s*)?([^\n]{3,120})\s*\n\s*\(((?:19|20)\d{2})\)\s*(\d+)\s*:\s*(\d+)/i);
 const venue=cleanPDFText(xmp['prism:publicationname']||subjectJournal||citation?.[1]);
 // PDF creation/modification dates and the DOI's digits are not publication years.
 const date=cleanPDFText(xmp['prism:publicationdate']||xmp['prism:coverdate']);
 const yearMatch=date.match(/\b((?:19|20)\d{2})\b/)||first.match(/\bPublished(?:\s+online)?\s*:\s*[^\n]{0,50}?\b((?:19|20)\d{2})\b/i);
 const year=yearMatch?Number(yearMatch[1]):citation?Number(citation[2]):'';
 const embeddedDOI=[xmp['prism:doi'],xmp['crossmark:doi'],xmp['pdfx:doi'],xmp['dc:identifier'],info.Subject].map(doiValue).find(Boolean)||'';
 const printedDOIs=[...new Set((first.match(/10\.\d{4,9}\/[^\s<>"]+/gi)||[]).map(doiValue).filter(Boolean))],doi=embeddedDOI||(printedDOIs.length===1?printedDOIs[0]:'');
 const key=extractKeywords((xmp['pdf:keywords']||info.Keywords?'Keywords: '+(xmp['pdf:keywords']||info.Keywords)+'\n':'')+t);
 const volume=cleanPDFText(xmp['prism:volume']),issue=cleanPDFText(xmp['prism:number']),start=cleanPDFText(xmp['prism:startingpage']),end=cleanPDFText(xmp['prism:endingpage']);
 const details=citation?citation[3]+':'+citation[4]:[volume,issue?'('+issue+')':'',start?(end&&end!==start?start+'–'+end:start):''].filter(Boolean).join(' ');
 return {title:front.title,authors,venue,year,type:'저널',doi:doi?'https://doi.org/'+doi:'',articleUrl:doi?'https://doi.org/'+doi:'',issn:issns(xmp['prism:issn']||first.match(/(?:e-)?ISSN\s*[:：]?\s*(\d{4}-?\d{3}[\dX])/i)?.[1]||'').join('; '),keywords:key.keywords.join('; '),details,importNote:(embeddedTitle&&embeddedAuthors?'PDF embedded metadata':'PDF text draft')+' · '+key.origin+'. Review bibliographic fields against the PDF before publishing.',isExample:false};
}
export function upsertImported(records,incoming,kind){
 const compact=v=>String(v||'').replace(/[^a-z\d]/gi,'').toLowerCase();
 const index=records.findIndex(r=>(incoming.sourceHash&&r.sourceHash===incoming.sourceHash)||(kind==='publications'&&doiValue(incoming.doi)&&doiValue(r.doi)===doiValue(incoming.doi))||(kind==='patents'&&((incoming.applicationNumber&&compact(r.applicationNumber||r.number)===compact(incoming.applicationNumber))||(incoming.registrationNumber&&compact(r.registrationNumber||r.number)===compact(incoming.registrationNumber)))));
 if(index<0){records.push(incoming);return {index:records.length-1,action:'added'};}
 if(kind==='patents'&&incoming.status==='등록'&&records[index].status!=='등록'){for(const key of ['status','number','registrationNumber','registrationDate','date','sourceHash','importNote'])if(incoming[key])records[index][key]=incoming[key];return {index,action:'updated'};}
 return {index,action:'duplicate'};
}
export function parseMetricCSV(csv){
 const rows=[];let row=[],field='',quoted=false;for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';}else field+=c;}row.push(field);if(row.some(x=>x.trim()))rows.push(row);if(quoted)throw new Error('An opening quote in the CSV has no closing quote.');
 const header=rows.shift()?.map(x=>x.replace(/^\uFEFF/,'').trim().toLowerCase())||[];
 const required=['name','issn','impactfactor','metricyear','metricsource','metricupdated'];if(required.some(x=>!header.includes(x)))throw new Error('Required CSV columns: name,issn,impactFactor,metricYear,metricSource,metricUpdated.');
 if(rows.length>5000)throw new Error('You can import up to 5,000 journals.');
 return rows.map(values=>{const get=k=>values[header.indexOf(k)]?.trim()||'';return {id:'journal-'+crypto.randomUUID(),name:get('name'),issn:get('issn'),impactFactor:get('impactfactor'),metricYear:get('metricyear'),metricSource:get('metricsource'),metricUpdated:get('metricupdated'),metricStatus:'확인됨',clarivateId:get('clarivateid')};});
}
