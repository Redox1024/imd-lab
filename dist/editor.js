import {sections,fields,singleSections,escapeHTML as e,validateContent,newRecord,destinationOptions,enumLabel} from './schema.js';
import {elementPages} from './pagination.js';
import {renderLiveCard} from './live-preview.js';
import {ensureJournal,upsertImported,parseMetricCSV,findJournal} from './publication-data.js';
let liveTimer,documentController;
let draft,active='site',recordIndex=0,dirty=false,previewWindow,fieldPager,fieldPage=0;
const main=document.querySelector('#editor-main'),status=document.querySelector('#status'),tabs=document.querySelector('#editor-tabs'),sectionSelect=document.querySelector('#editor-section-select'),dialog=document.querySelector('#confirm-dialog');
function report(message,error=false){status.textContent=message;status.dataset.error=String(error);}
function markDirty(value=true){dirty=value;document.querySelector('#unsaved').textContent=value?'Unsaved changes':'';}
function currentRecords(){return singleSections.includes(active)?[draft[active]]:draft[active];}
function fieldMarkup(spec,record){
 const [key,label,type,required,extra]=spec,id=`field-${active}-${key}`,value=record[key]??'';
 const attrs=`id="${id}" data-field="${key}" ${required?'required':''} ${typeof extra==='string'?`aria-describedby="${id}-help"`:''}`;
 let input;
 if(type==='textarea')input=`<textarea ${attrs} rows="3">${e(value)}</textarea>`;
 else if(type==='select')input=`<select ${attrs}>${!required?'<option value="">None</option>':''}${extra.map(v=>`<option value="${e(v)}" ${value===v?'selected':''}>${e(enumLabel(v))}</option>`).join('')}</select>`;
 else if(type==='destination'){const choices=destinationOptions(draft);input=`<select ${attrs}><option value="">No link</option>${value&&!choices.some(([v])=>v===value)?`<option value="${e(value)}" selected>Missing page — choose again</option>`:''}${choices.map(([v,label])=>`<option value="${e(v)}" ${value===v?'selected':''}>${e(label)}</option>`).join('')}</select>`;}
 else if(type==='checkbox')input=`<input ${attrs} type="checkbox" ${value?'checked':''}>`;
 else input=`<input ${attrs} type="${type==='image'?'text':type}" value="${e(value)}" ${type==='number'?'min="1800" max="2199" step="1"':''}>${type==='image'?`<label class="image-upload-label" for="${id}-upload">Choose image <span>PNG, JPEG, WebP, AVIF or GIF · up to 1 MB</span></label><input id="${id}-upload" class="image-picker" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" data-image-field="${key}">`:''}`;
 return `<div class="field ${['textarea','checkbox'].includes(type)?'full':''}"><label for="${id}">${e(label)}${required?' *':''}</label>${input}${typeof extra==='string'?`<small id="${id}-help">${e(extra)}</small>`:''}</div>`;
}
function updateLive(){if(draft)renderLiveCard(document.querySelector('#live-card-root'),active,currentRecords()[recordIndex],draft.site,draft);}
function queueLive(){clearTimeout(liveTimer);liveTimer=setTimeout(updateLive,180);}
function fitFields(){
 const container=document.querySelector('#field-pages');if(!container)return;
 if(active==='homeSlides'){fieldPager=null;fieldPage=0;return;}
 fieldPager=elementPages(container,(page,count)=>{fieldPage=page;document.querySelector('#field-page-count').textContent=`${page+1} / ${count}`;main.querySelectorAll('[data-field-step]').forEach(b=>b.disabled=count<=1||(Number(b.dataset.fieldStep)<0?page===0:page===count-1));},fieldPage);
}
function render(){
 const singular=singleSections.includes(active),records=currentRecords();recordIndex=Math.max(0,Math.min(recordIndex,records.length-1));
 tabs.innerHTML=Object.entries(sections).map(([key,label])=>`<button data-section="${key}" aria-pressed="${active===key}">${e(label)}</button>`).join('');
 sectionSelect.innerHTML=Object.entries(sections).map(([key,label])=>`<option value="${key}" ${active===key?'selected':''}>${e(label)}</option>`).join('');
 const controls=singular?'':`<div class="record-tools">${records.length?`<select id="record-select" class="record-select" aria-label="Select record">${records.map((r,i)=>`<option value="${i}" ${i===recordIndex?'selected':''}>${i+1}. ${e(r.label||r.title||r.name||'New entry')}</option>`).join('')}</select>`:''}${['publications','patents'].includes(active)?`<button class="mini-button import-document" data-action="document">${active==='publications'?'Upload paper PDF':'Upload certificate'}</button>`:''}${active==='journals'?'<button class="mini-button" data-action="metrics">Import IF CSV</button><button class="mini-button" data-action="metric-template">CSV template</button>':''}<button class="mini-button" data-action="add">${['publications','patents'].includes(active)?'+ Direct entry':'+ Add'}</button>${records.length?'<button class="mini-button" data-action="delete">Delete</button>':''}</div>`;
 main.innerHTML=`<div class="editor-record-head"><h2>${e(sections[active])}</h2>${controls}</div>${records.length?`<div class="field-pages ${active==='homeSlides'?'image-fields':''}" id="field-pages">${fields[active].map(spec=>fieldMarkup(spec,records[recordIndex])).join('')}</div>`:'<div class="empty">Choose Add to create the first entry.</div>'}<div class="pager"><div>${!singular&&records.length?`<button data-action="up" ${recordIndex===0?'disabled':''}>Move up</button> <button data-action="down" ${recordIndex===records.length-1?'disabled':''}>Move down</button>`:''}</div><div class="pager-controls">${records.length&&active!=='homeSlides'?'<button data-field-step="-1">Previous</button><span class="page-count" id="field-page-count"></span><button data-field-step="1">Next</button>':''}</div></div>`;
 fitFields();updateLive();
}
function changeSection(section){active=section;recordIndex=0;fieldPage=0;render();const hints={join:'Edit the Join Us introduction, application guidance and email. Manage individual opportunities under Open positions.',positions:'Add or edit positions, their status and visibility. All visible listings appear together on the Join Us page.',contact:'Contact details, address, directions, visiting notes and collaboration guidance appear on one page without tabs.',covers:'Add covers, images, captions and article links. The gallery shows ten covers per page, newest year first. Use Full image for your own cover.',people:'Choose Current member or Alumni for each person. The Members page groups entries automatically.',professor:'Choose a PI photo under Profile image. The profile shows current position, biography and contacts above Research Experience, Education, Honors & Awards and Selected Publications. Select papers under Papers.',events:'Archived event records are retained for compatibility. Add new announcements under News.',publications:'Choose Upload paper PDF or Direct entry. PDFs are processed in your browser; DOI metadata comes from public records.',patents:'Choose Upload certificate or Direct entry. Review the text extracted from scanned certificates.',journals:'IF is shared by papers with the same ISSN. Enter the reference year and official source, or import an IF CSV.',site:'IMD guide uses the supplied symbol next to the editable lab name. Edit Short name to change the wordmark text.',home:'Edit intro text, rotation speed and autoplay. Manage every photo and caption together under Home images.',homeSlides:'Edit every home image and its caption here, including the first. Use Move up / down to set the rotation order.',homeNotes:'Home notes are archived in this layout. The home page shows only Research, News and Publications previews.',navigation:'Edit menu labels, destinations and visibility. Use Move up / down to reorder.',pages:'Add a page, then link to it from Navigation.'};report(hints[section]||'Review your changes in Preview, then choose Download JSON.');}
function check(){try{for(const p of draft.publications)ensureJournal(p,draft.journals);const content=validateContent(draft);if(new Blob([JSON.stringify(content,null,2)+'\n']).size>20*1024*1024)throw new Error('Content exceeds 20 MB. Use hosted image URLs or smaller images before downloading.');return content;}catch(err){report(err.message,true);return null;}}
function confirmAction(title,message){if(dialog.open)return Promise.resolve(false);document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-message').textContent=message;dialog.returnValue='cancel';dialog.showModal();return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));}
function download(){const content=check();if(!content)return;const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='content.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);markDirty(false);report('Your content.json download is ready. Replace dist/data/content.json on GitHub to publish the changes.');}
tabs.addEventListener('click',event=>{const button=event.target.closest('[data-section]');if(button)changeSection(button.dataset.section);});
sectionSelect.addEventListener('change',event=>changeSection(event.target.value));
main.addEventListener('input',event=>{const input=event.target,key=input.dataset.field;if(!key)return;const record=currentRecords()[recordIndex];record[key]=input.type==='checkbox'?input.checked:input.type==='number'?(input.value===''?'':Number(input.value)):input.value;markDirty();queueLive();});
main.addEventListener('change',event=>{if(event.target.id==='record-select'){recordIndex=Number(event.target.value);fieldPage=0;render();}});
main.addEventListener('change',async event=>{
 const key=event.target.dataset.imageField;if(!key)return;
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 const record=currentRecords()[recordIndex],imageSection=active;
 try{
  if(!['image/png','image/jpeg','image/webp','image/avif','image/gif'].includes(file.type))throw new Error('Choose a PNG, JPEG, WebP, AVIF or GIF image.');
  if(file.size>1024*1024)throw new Error('Choose an image no larger than 1 MB, or enter a hosted image URL.');
  const value=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read this image.'));reader.readAsDataURL(file);});
  const replacement={...record,[key]:value,...(imageSection==='covers'?{artPanel:'Full image'}:{})};
  const candidate={...draft,[imageSection]:singleSections.includes(imageSection)?replacement:draft[imageSection].map(item=>item===record?replacement:item)};
  if(new Blob([JSON.stringify(candidate,null,2)+'\n']).size>20*1024*1024)throw new Error('This image would make your content exceed 20 MB. Use a hosted image URL or a smaller image.');
  record[key]=value;if(imageSection==='covers')record.artPanel='Full image';
  const input=main.querySelector(`[data-field="${key}"]`);if(input&&currentRecords()[recordIndex]===record)input.value=value;
  markDirty();updateLive();report('Image added to your draft. Download JSON to keep the image with your content.');
 }catch(error){report(error.message,true);}
});
main.addEventListener('click',async event=>{
 const step=event.target.closest('[data-field-step]');if(step&&fieldPager&&!step.disabled){fieldPager.show(fieldPager.page+Number(step.dataset.fieldStep));return;}
 const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,section=active,records=draft[section];
 if(action==='document'){const input=document.querySelector('#document-file');input.accept=active==='publications'?'application/pdf,.pdf':'application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp';input.dataset.kind=active;input.click();return;}
 if(action==='metric-template'){const blob=new Blob(['name,issn,impactFactor,metricYear,metricSource,metricUpdated\n'],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='journal-if-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);return;}
 if(action==='metrics'){document.querySelector('#metrics-file').click();return;}
 if(action==='add'){records.push(newRecord(section));recordIndex=records.length-1;fieldPage=0;render();markDirty();report('Entry added. Use Previous / Next to review all fields.');}
 else if(action==='delete'){
  const item=records[recordIndex];
  if(await confirmAction('Delete entry','Delete this entry from the current draft?')){const index=records.indexOf(item);if(index>=0)records.splice(index,1);recordIndex=Math.max(0,recordIndex-1);fieldPage=0;render();markDirty();report('Entry deleted.');}
 }else{const to=action==='up'?recordIndex-1:recordIndex+1;if(to<0||to>=records.length)return;[records[recordIndex],records[to]]=[records[to],records[recordIndex]];recordIndex=to;render();markDirty();report('Order updated. Publications and news are displayed by date.');}
});
document.querySelector('#live-toggle').addEventListener('click',event=>{const workspace=document.querySelector('#editor-workspace'),pressed=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(pressed));workspace.classList.toggle('show-live',pressed);fitFields();updateLive();});
document.querySelector('#download').addEventListener('click',download);
document.querySelector('#import-button').addEventListener('click',()=>document.querySelector('#import-file').click());
document.querySelector('#import-file').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>20*1024*1024)throw new Error('Choose a file no larger than 20 MB.');const content=validateContent(JSON.parse(await file.text()));if(dirty&&!await confirmAction('Import content','Replace the current draft with the imported file?'))return;draft=content;recordIndex=0;fieldPage=0;markDirty(false);render();report('File imported into the local editor draft.');}catch(err){report(err.message,true);}});
function setImportBusy(value){main.inert=value;tabs.inert=value;sectionSelect.disabled=value;document.querySelectorAll('.toolbar button').forEach(b=>b.disabled=value&&b.id!=='cancel-document');document.querySelector('#cancel-document').hidden=!value;}
document.querySelector('#cancel-document').addEventListener('click',()=>documentController?.abort());
document.querySelector('#document-file').addEventListener('change',async event=>{
 const files=Array.from(event.target.files||[]),kind=event.target.dataset.kind;event.target.value='';if(!files.length)return;if(files.length>5){report('Select up to five files at a time.',true);return;}
 documentController=new AbortController();setImportBusy(true);const summary=[];
 try{const {importDocument}=await import('./document-import.js');for(const [index,file] of files.entries()){
  if(documentController.signal.aborted)break;report(`${index+1}/${files.length} · ${file.name} · Reading`);
  try{const imported=await importDocument(file,kind,msg=>report(`${index+1}/${files.length} · ${msg}`),documentController.signal),record={...newRecord(kind),...imported};const result=upsertImported(draft[kind],record,kind);if(kind==='publications')ensureJournal(draft[kind][result.index],draft.journals);active=kind;recordIndex=result.index;fieldPage=0;markDirty();render();summary.push(file.name+': '+({added:'Added',updated:'Grant status updated',duplicate:'Existing entry found'}[result.action]));}
  catch(error){if(error.name==='AbortError')break;summary.push(file.name+': '+error.message);}
 }
 report((documentController.signal.aborted?'Import cancelled. ':'')+summary.join(' / ')+' · Review the extracted content, then choose Preview / Download JSON.');
 }catch(error){report(error.message,true);}finally{setImportBusy(false);documentController=null;}
});
document.querySelector('#metrics-file').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Choose a CSV no larger than 5 MB.');const incoming=parseMetricCSV(await file.text()),next=structuredClone(draft);for(const j of incoming){const existing=findJournal({venue:j.name,issn:j.issn},next.journals);if(existing){if(Number(j.metricYear)<Number(existing.metricYear))continue;Object.assign(existing,j,{id:existing.id});}else next.journals.push(j);}draft=validateContent(next);active='journals';recordIndex=0;fieldPage=0;markDirty();render();report('Journal IF imported. Matching papers show the value and reference year.');}catch(error){report(error.message,true);}});
document.querySelector('#preview').addEventListener('click',()=>{if(!check())return;previewWindow=window.open('./?preview=1#home','imd-preview');if(!previewWindow){report('The preview window was blocked. Allow pop-ups for this site.',true);return;}report('Preview opened with your draft. These changes have not been published.');});
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==previewWindow||event.data?.type!=='lab-preview-ready')return;const content=check();if(content)previewWindow.postMessage({type:'lab-preview',content},location.origin);});
document.querySelector('#github-button').addEventListener('click',()=>{const content=check();if(!content)return;if(!content.site.repository){changeSection('site');report('Enter the website repository URL in Lab settings. Download the content file, then upload it to GitHub.',true);return;}window.open(content.site.repository.replace(/\/$/,'')+'/upload/'+encodeURIComponent(content.site.branch)+'/dist/data','_blank','noopener,noreferrer');report('Upload content.json on GitHub, then choose Commit changes.');});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(draft){if(!document.activeElement?.closest('#editor-main'))fitFields();updateLive();}},100);});
document.fonts?.ready.then(()=>{if(draft){fitFields();updateLive();}});
function registerTools(){
 const context=document.modelContext;if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 for(const spec of [
  {name:'read_lab_content_draft',title:'Read lab content draft',description:'Read the current local draft; it may differ from the published site.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({content:structuredClone(draft),hasUndownloadedChanges:dirty})},
  {name:'stage_lab_content_draft',title:'Stage lab content draft',description:'Replace the local editor draft. Does not save or publish the website.',inputSchema:{type:'object',properties:{content:{type:'object'}},required:['content'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:input=>{draft=validateContent(input.content);recordIndex=0;fieldPage=0;markDirty();render();return {status:'draft_staged',published:false};}}
 ]){try{Promise.resolve(context.registerTool(spec,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
async function start(){try{const response=await fetch('data/content.json',{cache:'no-cache'});if(!response.ok)throw new Error('Unable to read the content file.');draft=validateContent(await response.json());render();document.querySelectorAll('.toolbar button').forEach(button=>button.disabled=false);report('Changes are not saved automatically. Choose Download JSON to keep your draft.');registerTools();}catch(err){report(err.message,true);}}
start();
