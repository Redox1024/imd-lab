import {escapeHTML as e,safeImage,destinationOptions,enumLabel} from './schema.js';
import {journalMetric,publicationSpecialNote} from './publication-data.js';
import {renderAuthors,authorLegend} from './author-roles.js';
import {textPages} from './pagination.js';
import {orderRecords} from './list-order.js';
export function liveCardData(section,record,site,content){
 const r=record||{},title=r.question||r.label||r.title||r.name||r.headline||'Untitled draft';
 const sections={site:'LAB SETTINGS',home:'HOME INTRO',homeSlides:'HOME IMAGES',homeNotes:'HOME NOTES',navigation:'NAVIGATION',pages:'EXTRA PAGES',professor:'MEET PI',research:'RESEARCH LENS',people:'MEMBERS',covers:'COVER GALLERY',publications:'PAPERS',patents:'PATENTS',news:'LAB NOTES',events:'ARCHIVED EVENTS',join:'JOIN US',positions:'OPEN POSITIONS',contact:'CONTACT'};
 let text='',subtitle='',image='';
 if(section==='site'){text=[r.nameEn,r.affiliation,r.introduction,r.aboutTitle,r.aboutSubtitle,r.institution,r.institutionUrl].filter(Boolean).join('\n\n');subtitle=r.shortName;}
 else if(section==='home'){text=[r.headline,r.description,[r.primaryLabel,r.secondaryLabel,r.tertiaryLabel].filter(Boolean).join(' · ')].filter(Boolean).join('\n\n');subtitle=r.eyebrow;image=r.imageStyle==='소재 이미지'?safeImage(content?.homeSlides?.find(slide=>slide.visible)?.image):'';}
 else if(section==='homeSlides'){text=[r.caption,r.imageAlt,r.visible?'Visible in rotation':'Hidden from rotation'].filter(Boolean).join('\n\n');subtitle='Home image';image=safeImage(r.image);}
 else if(section==='navigation'){text='Destination: '+(destinationOptions(content||{}).find(([v])=>v===r.target)?.[1]||'Choose a page');subtitle=r.visible?'Visible in menu':'Hidden from menu';}
 else if(section==='homeNotes'||section==='pages'){text=r.body;subtitle=r.subtitle||(section==='homeNotes'?'Archived home note':'');} else if(section==='professor'){const selected=orderRecords(content?.publications||[],'publications',content?.listOrder?.publications).filter(p=>p.selectedForPI);text=[r.bio,r.email,r.phone,r.scholar,r.career?'Research Experience\n'+r.career:'',r.education?'Education\n'+r.education:'',r.awards?'Honors & Awards\n'+r.awards:'',selected.length?'Selected Publications\n'+selected.map(p=>p.title).join('\n'):''].filter(Boolean).join('\n\n');subtitle=r.position;image=safeImage(r.photo);}
 else if(section==='research'){text=[r.title,r.goal,r.methods?'Approach\n'+r.methods:'',r.description].filter(Boolean).join('\n\n');subtitle=r.lensLabel||r.subtitle;}
 else if(section==='people'){text=[r.research,r.period,r.email].filter(Boolean).join('\n\n');subtitle=[r.membership,enumLabel(r.role),r.nameEn].filter(Boolean).join(' · ');image=safeImage(r.photo);}
 else if(section==='covers'){text=[r.title,r.articleUrl,r.visible?'Visible in gallery':'Hidden from gallery',r.isExample?'Fictional concept cover':''].filter(Boolean).join('\n\n');subtitle=[r.venue,r.year].filter(Boolean).join(' · ');image=safeImage(r.image);}
 else if(section==='publications'){text=[r.venue,[journalMetric(r).label,publicationSpecialNote(r)].filter(Boolean).join(' · '),r.keywords,r.details,r.selectedForPI?'Selected for PI profile':'',r.articleUrl||r.doi,r.pdf,r.code].filter(Boolean).join('\n\n');subtitle=[r.year,enumLabel(r.type)].filter(Boolean).join(' · ');}
 else if(section==='patents'){text=[r.inventors,enumLabel(r.country),r.number,r.link].filter(Boolean).join('\n\n');subtitle=[r.date,enumLabel(r.status)].filter(Boolean).join(' · ');}
 else if(section==='news'){text=r.body||'';subtitle=[r.date,enumLabel(r.category)].filter(Boolean).join(' · ');}
 else if(section==='events'){text=[r.time,r.location,r.description,r.link].filter(Boolean).join('\n\n');subtitle=[r.date,r.endDate,enumLabel(r.category)].filter(Boolean).join(' · ');}
 else if(section==='join'){text=[r.introduction,r.application,r.email||content?.contact?.email].filter(Boolean).join('\n\n');subtitle='Open positions and application information';}
 else if(section==='positions'){text=[r.description,r.requirements,r.visible?'Visible on Join Us':'Hidden from Join Us'].filter(Boolean).join('\n\n');subtitle=[r.type,r.status].filter(Boolean).join(' · ');}
 else if(section==='contact'){text=[r.email,r.phone,r.address,r.room,r.transport,r.visiting,r.inquiry,r.mapUrl].filter(Boolean).join('\n\n');subtitle=site?.name||'';}
 return {title:section==='contact'?'Get in touch':title,kicker:sections[section]||section,subtitle,text:text||'Your content will appear here as you type.',authorsHTML:section==='publications'?renderAuthors(r):'',authorsLegend:section==='publications'?authorLegend(r):'',image,artPanel:section==='covers'&&r.image==='assets/cover-artworks.webp'&&/^(?:[1-9]|10)$/.test(r.artPanel)?Number(r.artPanel)-1:-1,isExample:!!r.isExample};
}
export function renderLiveCard(root,section,record,site,content){
 if(!root)return;
 const c=liveCardData(section,record,site,content);
 root.innerHTML=`<div class="live-card" data-kind="${e(section)}"><div class="live-card-head"><span>${e(c.kicker)}</span><span>${c.isExample?'EXAMPLE':'DRAFT'}</span></div>${c.image?c.artPanel>=0?`<div class="live-cover-window"><img src="${e(c.image)}" alt="Cover preview" style="left:-${c.artPanel%5*100}%;top:-${Math.floor(c.artPanel/5)*100}%"></div>`:`<img class="live-card-image" src="${e(c.image)}" alt="Preview image">`:''}<h3>${e(c.title)}</h3><p class="live-card-subtitle">${e(c.subtitle)}</p>${c.authorsHTML?`<div class="live-card-authors"><p class="publication-authors">${c.authorsHTML}</p>${c.authorsLegend?`<p class="author-legend">${e(c.authorsLegend)}</p>`:''}</div>`:''}<div class="live-card-text" id="live-card-text"></div><div class="live-card-pager"><button data-live-step="-1" aria-label="Previous preview page">←</button><span id="live-card-page"></span><button data-live-step="1" aria-label="Next preview page">→</button></div></div>`;
 const body=root.querySelector('#live-card-text');
 const pager=textPages(body,c.text,(page,count)=>{root.querySelector('#live-card-page').textContent=`${page+1} / ${count}`;root.querySelectorAll('[data-live-step]').forEach(b=>b.disabled=count<=1||(Number(b.dataset.liveStep)<0?page===0:page===count-1));});
 root.onclick=event=>{const b=event.target.closest('[data-live-step]');if(b&&!b.disabled)pager.show(pager.page+Number(b.dataset.liveStep));};
}
