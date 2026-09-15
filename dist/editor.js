import {sections,fields,singleSections,escapeHTML as e,validateContent,newRecord,destinationOptions,enumLabel} from './schema.js?v=20260915-pi1';
import {elementPages} from './pagination.js?v=20260915-pi1';
import {renderLiveCard} from './live-preview.js?v=20260915-pi1';
import {upsertImported,doiValue} from './publication-data.js?v=20260915-pi1';
import {lookupDOI,normalizeDOI,mergeDOIFields} from './doi-import.js?v=20260915-pi1';
import {orderRecords} from './list-order.js?v=20260915-pi1';
import {authorEntries,normalizeAuthorRoles,updateAuthorRole,renderAuthors,authorLegend} from './author-roles.js?v=20260915-pi1';
let liveTimer,documentController;
const doiFeedback=new Map();
let draft,active='site',recordIndex=0,dirty=false,previewWindow,fieldPager,fieldPage=0,deletedEntry;
const datedLists=['publications','patents','news'];
const managedLists=[...datedLists,'people'];
const entryNames={publications:'paper',patents:'patent',news:'news item',people:'member'};
const main=document.querySelector('#editor-main'),status=document.querySelector('#status'),tabs=document.querySelector('#editor-tabs'),sectionSelect=document.querySelector('#editor-section-select'),dialog=document.querySelector('#confirm-dialog');
function report(message,error=false){status.textContent=message;status.dataset.error=String(error);}
function markDirty(value=true){dirty=value;document.querySelector('#unsaved').textContent=value?'Unsaved changes':'';}
function currentRecords(){return singleSections.includes(active)?[draft[active]]:orderRecords([...draft[active]],active,draft.listOrder?.[active]);}
function recordLabel(record){return record.label||record.title||record.name||'New entry';}
function recordControls(records){
 const name=entryNames[active]||'entry',manual=draft.listOrder?.[active]==='manual';
 return `<div class="record-add-tools">${active==='patents'?'<button class="mini-button import-document" data-action="document">Upload certificate</button>':''}<button class="mini-button add-entry" data-action="add">+ Add ${e(name)}${active==='patents'?' manually':''}</button>${deletedEntry?.section===active?'<button class="mini-button undo-entry" data-action="undo-delete">Undo delete</button>':''}</div>${datedLists.includes(active)?`<div class="record-order-mode"><label for="record-order-mode">Display order</label><select id="record-order-mode"><option value="date" ${!manual?'selected':''}>Newest first</option><option value="manual" ${manual?'selected':''}>Manual order</option></select></div>`:''}${records.length?`<div class="record-picker"><label for="record-select">Choose ${e(name)} <span>${recordIndex+1} of ${records.length}</span></label><select id="record-select" class="record-select">${records.map((record,index)=>`<option value="${index}" ${index===recordIndex?'selected':''}>${index+1}. ${e(recordLabel(record))}</option>`).join('')}</select></div><div class="record-order-tools" role="group" aria-label="Change list order"><span class="record-order-title">List order</span><button class="mini-button" data-action="up" ${recordIndex===0?'disabled':''}>↑ Move up</button><button class="mini-button" data-action="down" ${recordIndex===records.length-1?'disabled':''}>↓ Move down</button><div class="record-position"><label for="record-position">Move to</label><input id="record-position" type="number" min="1" max="${records.length}" step="1" value="${recordIndex+1}" aria-label="Destination position"><button class="mini-button" data-action="move">Move</button></div><button class="mini-button delete-entry" data-action="delete">Delete ${e(name)}</button></div><p class="record-order-help">${active==='people'?'Members keep this order within Current members and Alumni.':datedLists.includes(active)?manual?'This order is used on the website.':'Moving an entry switches to Manual order.':active==='covers'?'Cover entries are displayed newest year first.':'Use Move up, Move down or a position number to arrange entries.'} Preview, then download JSON to keep your changes.</p>`:'<p class="record-order-help">Add your first entry using the buttons above.</p>'}`;
}
function refreshRecordControls(record){
 if(singleSections.includes(active))return;
 const records=currentRecords(),index=records.indexOf(record);if(index>=0)recordIndex=index;
 const controls=document.querySelector('#record-tools');if(controls)controls.innerHTML=recordControls(records);
}
function moveRecord(to){
 const records=currentRecords();
 if(!Number.isInteger(to)||to<0||to>=records.length){report(`Choose a position from 1 to ${records.length}.`,true);return;}
 if(to===recordIndex){report('This entry is already at that position.');return;}
 const [item]=records.splice(recordIndex,1);records.splice(to,0,item);draft[active]=records;
 if(datedLists.includes(active)){draft.listOrder??={};draft.listOrder[active]='manual';}
 recordIndex=to;render();markDirty();report(`Moved to position ${to+1}. Review in Preview, then download JSON to keep the new order.`);
}
function fieldMarkup(spec,record){
 const [key,label,type,required,extra]=spec,id=`field-${active}-${key}`,value=record[key]??'';
 const attrs=`id="${id}" data-field="${key}" ${required?'required':''} ${typeof extra==='string'?`aria-describedby="${id}-help"`:''}`;
 let input;
 if(active==='publications'&&key==='doi'){
  const feedback=doiFeedback.get(record.id);
  input=`<input ${attrs} type="text" value="${e(value)}" placeholder="https://doi.org/10.1002/smll.202407882" autocomplete="off" spellcheck="false"><div class="doi-actions"><button class="mini-button doi-fill" type="button" data-action="doi">Fill from DOI</button><button class="mini-button" type="button" data-action="manual">Enter manually</button></div><p class="doi-feedback" id="doi-feedback" role="status" data-error="${!!feedback?.error}">${e(feedback?.message||'Fill the fields below from a DOI, or enter the details manually. IF is entered manually for each paper.')}</p>`;
 }
 else if(active==='publications'&&key==='impactFactor')input=`<input ${attrs} type="text" value="${e(value)}" placeholder="e.g. 12.1 or &lt;0.1" autocomplete="off" spellcheck="false">`;
 else if(type==='textarea')input=`<textarea ${attrs} rows="3">${e(value)}</textarea>`;
 else if(type==='select')input=`<select ${attrs}>${!required?'<option value="">None</option>':''}${extra.map(v=>`<option value="${e(v)}" ${value===v?'selected':''}>${e(enumLabel(v))}</option>`).join('')}</select>`;
 else if(type==='destination'){const choices=destinationOptions(draft);input=`<select ${attrs}><option value="">No link</option>${value&&!choices.some(([v])=>v===value)?`<option value="${e(value)}" selected>Missing page — choose again</option>`:''}${choices.map(([v,label])=>`<option value="${e(v)}" ${value===v?'selected':''}>${e(label)}</option>`).join('')}</select>`;}
 else if(type==='checkbox')input=`<input ${attrs} type="checkbox" ${value?'checked':''}>`;
 else input=`<input ${attrs} type="${type==='image'?'text':type}" value="${e(value)}" ${type==='number'?'min="1800" max="2199" step="1"':''}>${type==='image'?`<label class="image-upload-label" for="${id}-upload">Choose image <span>PNG, JPEG, WebP, AVIF or GIF · up to 1 MB</span></label><input id="${id}-upload" class="image-picker" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" data-image-field="${key}">`:''}`;
 if(active==='publications'&&key==='authors')input+='<small>Enter full names separated by commas, or put one author on each line. Select roles, bold text and underlines below; multiple authors can share a role.</small><div id="author-role-controls">'+authorRoleControls(record)+'</div>';
 return `<div class="field ${['textarea','checkbox'].includes(type)||(active==='publications'&&key==='doi')?'full':''}"><label for="${id}">${e(label)}${required?' *':''}</label>${input}${typeof extra==='string'?`<small id="${id}-help">${e(extra)}</small>`:''}</div>`;
}

function authorRoleControls(record){
 const entries=authorEntries(record);
 const options=[['first','First / co-first †'],['corresponding','Corresponding *'],['bold','Bold'],['underline','Underline']];
 return `<fieldset class="author-role-picker"><legend>Author roles / 저자 표시</legend>${entries.length?entries.map((author,index)=>`<div class="author-role-row"><span class="author-role-name">${index+1}. ${e(author.name)}</span><div class="author-role-options">${options.map(([role,label])=>`<label><input type="checkbox" data-author-index="${index}" data-author-role="${role}" ${author[role]?'checked':''} aria-label="${e(author.name+' · '+label)}"><span>${e(label)}</span></label>`).join('')}</div></div>`).join(''):'<p class="author-role-empty">Enter authors above to choose their roles.</p>'}<div class="author-role-result"><span>Author display preview</span><p id="author-role-preview" aria-live="polite">${renderAuthors(record)}</p><small id="author-role-legend">${e(authorLegend(record))}</small></div></fieldset>`;
}
function refreshAuthorRoles(record){
 const controls=main.querySelector('#author-role-controls');if(controls)controls.innerHTML=authorRoleControls(record);
}
function refreshAuthorDisplay(record){
 const preview=main.querySelector('#author-role-preview'),legend=main.querySelector('#author-role-legend');
 if(preview)preview.innerHTML=renderAuthors(record);if(legend)legend.textContent=authorLegend(record);
}

function setDOIFeedback(record,message,error=false){
 if(record)doiFeedback.set(record.id,{message,error});
 const node=document.querySelector('#doi-feedback');if(node){node.textContent=message;node.dataset.error=String(error);}report(message,error);
}
async function fillCurrentPaperFromDOI(){
 if(active!=='publications'||documentController)return;
 const owner=draft,record=currentRecords()[recordIndex];if(!record)return;
 const entered=record.doi,wanted=normalizeDOI(entered);
 if(!wanted){setDOIFeedback(record,'Enter a DOI such as 10.1002/smll.202407882 or its DOI URL. You can also choose Enter manually.',true);return;}
 const duplicate=draft.publications.find(p=>p!==record&&doiValue(p.doi)===wanted);
 if(duplicate){setDOIFeedback(record,'This DOI already belongs to “'+recordLabel(duplicate)+'”. Choose that paper in the list to edit it, or correct this DOI.',true);return;}
 const controller=new AbortController();documentController=controller;setImportBusy(true,'Cancel lookup');setDOIFeedback(record,'Looking up paper details…');
 try{
  const incoming=await lookupDOI(entered,{signal:controller.signal});
  if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
  if(draft!==owner||!draft.publications.includes(record)||record.doi!==entered){report('The draft changed during lookup. No lookup results were applied.');return;}
  Object.assign(record,mergeDOIFields(record,incoming));recordIndex=currentRecords().indexOf(record);fieldPage=0;markDirty();
  const missing=[['title','title'],['authors','authors'],['venue','journal'],['year','year']].filter(([key])=>!incoming[key]).map(([,label])=>label);
  const message=missing.length?'DOI found; '+missing.join(', ')+' not supplied. Complete or check those fields manually.':'Paper details filled from DOI. Review the fields and enter IF manually.';
  doiFeedback.set(record.id,{message,error:false});render();report(message);
 }catch(error){if(draft===owner&&draft.publications.includes(record))setDOIFeedback(record,error.name==='AbortError'?'Lookup cancelled. You can enter the paper details manually.':error.message,error.name!=='AbortError');}
 finally{setImportBusy(false);if(documentController===controller)documentController=null;}
}

function updateLive(){if(draft)renderLiveCard(document.querySelector('#live-card-root'),active,currentRecords()[recordIndex],draft.site,draft);}
function queueLive(){clearTimeout(liveTimer);liveTimer=setTimeout(updateLive,180);}
function fitFields(){
 const container=document.querySelector('#field-pages');if(!container)return;
 if(active==='homeSlides'||managedLists.includes(active)){fieldPager=null;fieldPage=0;return;}
 fieldPager=elementPages(container,(page,count)=>{fieldPage=page;document.querySelector('#field-page-count').textContent=`${page+1} / ${count}`;main.querySelectorAll('[data-field-step]').forEach(b=>b.disabled=count<=1||(Number(b.dataset.fieldStep)<0?page===0:page===count-1));},fieldPage);
}
function render(){
 const singular=singleSections.includes(active),records=currentRecords();recordIndex=Math.max(0,Math.min(recordIndex,records.length-1));
 tabs.innerHTML=Object.entries(sections).map(([key,label])=>`<button data-section="${key}" aria-pressed="${active===key}">${e(label)}</button>`).join('');
 sectionSelect.innerHTML=Object.entries(sections).map(([key,label])=>`<option value="${key}" ${active===key?'selected':''}>${e(label)}</option>`).join('');
 const controls=singular?'':`<div class="record-tools" id="record-tools">${recordControls(records)}</div>`;
 main.classList.toggle('editor-list-section',managedLists.includes(active));
 const paginated=records.length&&active!=='homeSlides'&&!managedLists.includes(active);
 main.innerHTML=`<div class="editor-record-head"><h2>${e(sections[active])}${!singular?` <span class="record-total">${records.length} ${records.length===1?'entry':'entries'}</span>`:''}</h2>${controls}</div>${records.length?`<div class="field-pages ${active==='homeSlides'?'image-fields':''}" id="field-pages">${fields[active].filter(spec=>!(active==='publications'&&['pdf','sourceHash','metricSource','authorRoles'].includes(spec[0]))).map(spec=>fieldMarkup(spec,records[recordIndex])).join('')}</div>`:'<div class="empty">Choose Add to create the first entry.</div>'}<div class="pager"><div>${paginated?'Entry fields':''}</div><div class="pager-controls">${paginated?'<button data-field-step="-1">Previous</button><span class="page-count" id="field-page-count"></span><button data-field-step="1">Next</button>':''}</div></div>`;
 fitFields();updateLive();
}
function changeSection(section){active=section;recordIndex=0;fieldPage=0;render();main.scrollTop=0;const hints={join:'Edit the Join Us introduction, application guidance and email. Manage individual opportunities under Open positions.',positions:'Add or edit positions, their status and visibility. All visible listings appear together on the Join Us page.',contact:'Contact details, address, directions, visiting notes and collaboration guidance appear on one page without tabs.',covers:'Add covers, images, captions and article links. The gallery shows ten covers per page, newest year first. Use Full image for your own cover.',people:'Add, delete or arrange members with the controls above. The Members page keeps this order within Current members and Alumni.',professor:'Choose a PI photo under Profile image. The profile places the photo on the left and the position, affiliations, biography, contacts, Work Experience, Education, Research Interests and Honors & Awards on the right. Selected Publications appear below. Select papers under Papers.',events:'Archived event records are retained for compatibility. Add new announcements under News.',publications:'Add a paper or choose an existing paper, enter its DOI, then choose Fill from DOI. You can always enter the details and IF manually. Under Authors, select first / co-first authors, corresponding authors, bold text and underlines.',patents:'Upload a certificate or add a patent manually. Review the extracted text, and use the list controls to delete or arrange patents.',news:'Add, delete and arrange news with the list controls. Choose Newest first or set your own Manual order.',site:'IMD guide uses the supplied symbol next to the editable lab name. Edit Short name to change the wordmark text.',home:'Edit intro text, rotation speed and autoplay. Manage every photo and caption together under Home images.',homeSlides:'Edit every home image and its caption here, including the first. Use Move up / down to set the rotation order.',homeNotes:'Home notes are archived in this layout. The home page shows only Research, News and Publications previews.',navigation:'Edit menu labels, destinations and visibility. Use Move up / down to reorder.',pages:'Add a page, then link to it from Navigation.'};report(hints[section]||'Review your changes in Preview, then choose Download JSON.');}
function check(){try{const content=validateContent(draft);if(new Blob([JSON.stringify(content,null,2)+'\n']).size>20*1024*1024)throw new Error('Content exceeds 20 MB. Use hosted image URLs or smaller images before downloading.');return content;}catch(err){report(err.message,true);return null;}}
function confirmAction(title,message){if(dialog.open)return Promise.resolve(false);document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-message').textContent=message;dialog.returnValue='cancel';dialog.showModal();return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));}
function download(){const content=check();if(!content)return;const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='content.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);markDirty(false);report('Your content.json download is ready. Replace dist/data/content.json on GitHub to publish the changes.');}
tabs.addEventListener('click',event=>{const button=event.target.closest('[data-section]');if(button)changeSection(button.dataset.section);});
sectionSelect.addEventListener('change',event=>changeSection(event.target.value));
main.addEventListener('keydown',event=>{if(active==='publications'&&event.target.dataset.field==='doi'&&event.key==='Enter'){event.preventDefault();fillCurrentPaperFromDOI();}});
main.addEventListener('input',event=>{const input=event.target,key=input.dataset.field;if(!key)return;const record=currentRecords()[recordIndex];record[key]=input.type==='checkbox'?input.checked:input.type==='number'?(input.value===''?'':Number(input.value)):input.value;if(active==='publications'&&key==='authors')refreshAuthorRoles(record);refreshRecordControls(record);markDirty();queueLive();});
main.addEventListener('change',event=>{
 if(active==='publications'&&event.target.dataset.authorRole){
  const record=currentRecords()[recordIndex];if(!record)return;
  record.authorRoles=updateAuthorRole(record,Number(event.target.dataset.authorIndex),event.target.dataset.authorRole,event.target.checked);
  refreshAuthorDisplay(record);markDirty();queueLive();return;
 }
 if(active==='publications'&&event.target.dataset.field==='authors'){
  const record=currentRecords()[recordIndex];record.authorRoles=normalizeAuthorRoles(record.authorRoles,record.authors);
 }
 if(event.target.id==='record-select'){recordIndex=Number(event.target.value);fieldPage=0;render();}
 if(event.target.id==='record-order-mode'){
  const records=currentRecords(),record=records[recordIndex],mode=event.target.value;
  if(mode==='manual')draft[active]=records;
  draft.listOrder??={};draft.listOrder[active]=mode;recordIndex=Math.max(0,currentRecords().indexOf(record));render();markDirty();
  report(mode==='manual'?'Manual order selected. Use the list order controls to arrange entries.':'Newest first selected. The website will sort these entries by date.');
 }
});
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
 if(action==='doi'){await fillCurrentPaperFromDOI();return;}
 if(action==='manual'){setDOIFeedback(currentRecords()[recordIndex],'Enter the paper details and IF below. DOI lookup is optional.');main.querySelector('[data-field="title"]')?.focus();return;}
 if(action==='document'){if(active!=='patents')return;const input=document.querySelector('#document-file');input.accept='application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp';input.dataset.kind='patents';input.click();return;}
 if(action==='add'){const item=newRecord(section);records.push(item);recordIndex=currentRecords().indexOf(item);fieldPage=0;render();main.scrollTop=0;markDirty();if(active==='publications')main.querySelector('[data-field="doi"]')?.focus();report(active==='publications'?'Paper added. Enter a DOI and choose Fill from DOI, or enter the details manually.':managedLists.includes(active)?'Entry added. Fill in the fields below, then choose Preview / Download JSON.':'Entry added. Use Previous / Next to review all fields.');}
 else if(action==='delete'){
  const item=currentRecords()[recordIndex];if(!item)return;
  if(await confirmAction(`Delete ${entryNames[section]||'entry'}`,`Delete “${recordLabel(item)}” from this draft? You can restore it with Undo delete.`)){
   const index=draft[section].indexOf(item);if(index<0)return;
   deletedEntry={section,item,index};draft[section].splice(index,1);recordIndex=Math.max(0,recordIndex-1);fieldPage=0;render();markDirty();report('Entry deleted from the draft. Choose Undo delete to restore it.');
  }
 }else if(action==='undo-delete'){
  if(!deletedEntry||deletedEntry.section!==section)return;
  const {item,index}=deletedEntry;records.splice(Math.min(index,records.length),0,item);deletedEntry=null;recordIndex=currentRecords().indexOf(item);fieldPage=0;render();markDirty();report('Deleted entry restored.');
 }else if(action==='up'||action==='down'||action==='move'){
  const to=action==='move'?Number(document.querySelector('#record-position').value)-1:recordIndex+(action==='up'?-1:1);moveRecord(to);
 }
});
document.querySelector('#live-toggle').addEventListener('click',event=>{const workspace=document.querySelector('#editor-workspace'),pressed=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(pressed));workspace.classList.toggle('show-live',pressed);fitFields();updateLive();});
document.querySelector('#download').addEventListener('click',download);
document.querySelector('#import-button').addEventListener('click',()=>document.querySelector('#import-file').click());
document.querySelector('#import-file').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>20*1024*1024)throw new Error('Choose a file no larger than 20 MB.');const content=validateContent(JSON.parse(await file.text()));if(dirty&&!await confirmAction('Import content','Replace the current draft with the imported file?'))return;draft=content;deletedEntry=null;doiFeedback.clear();recordIndex=0;fieldPage=0;markDirty(false);render();report('File imported into the local editor draft.');}catch(err){report(err.message,true);}});
function setImportBusy(value,label='Cancel import'){document.querySelector('#cancel-document').textContent=label;main.inert=value;tabs.inert=value;sectionSelect.disabled=value;document.querySelectorAll('.toolbar button').forEach(b=>b.disabled=value&&b.id!=='cancel-document');document.querySelector('#cancel-document').hidden=!value;}
document.querySelector('#cancel-document').addEventListener('click',()=>documentController?.abort());
document.querySelector('#document-file').addEventListener('change',async event=>{
 const files=Array.from(event.target.files||[]),kind=event.target.dataset.kind;event.target.value='';if(!files.length||kind!=='patents')return;if(files.length>5){report('Select up to five files at a time.',true);return;}
 documentController=new AbortController();setImportBusy(true);const summary=[];
 try{const {importDocument}=await import('./document-import.js?v=20260915-pi1');for(const [index,file] of files.entries()){
  if(documentController.signal.aborted)break;report(`${index+1}/${files.length} · ${file.name} · Reading`);
  try{const imported=await importDocument(file,kind,msg=>report(`${index+1}/${files.length} · ${msg}`),documentController.signal),record={...newRecord(kind),...imported};const result=upsertImported(draft[kind],record,kind),item=draft[kind][result.index];active=kind;recordIndex=currentRecords().indexOf(item);fieldPage=0;markDirty();render();main.scrollTop=0;summary.push(file.name+': '+({added:'Added',updated:'Grant status updated',duplicate:'Existing entry found'}[result.action]));}
  catch(error){if(error.name==='AbortError')break;summary.push(file.name+': '+error.message);}
 }
 report((documentController.signal.aborted?'Import cancelled. ':'')+summary.join(' / ')+' · Review the extracted content, then choose Preview / Download JSON.');
 }catch(error){report(error.message,true);}finally{setImportBusy(false);documentController=null;}
});

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
  {name:'stage_lab_content_draft',title:'Stage lab content draft',description:'Replace the local editor draft. Does not save or publish the website.',inputSchema:{type:'object',properties:{content:{type:'object'}},required:['content'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:input=>{draft=validateContent(input.content);deletedEntry=null;doiFeedback.clear();recordIndex=0;fieldPage=0;markDirty();render();return {status:'draft_staged',published:false};}}
 ]){try{Promise.resolve(context.registerTool(spec,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
async function start(){try{const response=await fetch('data/content.json',{cache:'no-cache'});if(!response.ok)throw new Error('Unable to read the content file.');draft=validateContent(await response.json());render();document.querySelectorAll('.toolbar button').forEach(button=>button.disabled=false);report('Changes are not saved automatically. Choose Download JSON to keep your draft.');registerTools();}catch(err){report(err.message,true);}}
start();

