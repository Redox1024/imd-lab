import {escapeHTML as e,safeURL,safeImage,hasExamples,validateContent,safeDestination,enumLabel,logoDesigns} from './schema.js?v=20260914-paper5';
import {mountHeroCarousel} from './hero-carousel.js?v=20260914-paper5';
import {orderRecords} from './list-order.js?v=20260914-paper5';
import {paperArticleURL} from './doi-import.js?v=20260914-paper5';
import {journalMetric,keywordList,publicationSpecialNote} from './publication-data.js?v=20260914-paper5';
import {renderAuthors,authorLegend} from './author-roles.js?v=20260914-paper5';
let destroyHeroCarousel=null;
let data,navPage=0,readingText='',routeKey='home',coverPage=0;
const main=document.querySelector('#main');
const labels={home:'Home',about:'About',research:'Research',people:'Members',publications:'Publications',patents:'Patents',news:'News',events:'News',join:'Join Us',contact:'Contact'};
const badge=record=>record?.isExample?'<span class="example-badge">Example</span>':'';
const specialNoteMarkup=paper=>{const note=publicationSpecialNote(paper);return note?`<span class="paper-special-note">${e(note)}</span>`:'';};
const short=(value,max=160)=>String(value||'').length>max?String(value).slice(0,max).trimEnd()+'…':String(value||'');
const dateText=value=>{const d=new Date(String(value)+'T00:00:00Z');return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(d):String(value||'');};
const external=(url,label)=>safeURL(url)?`<a href="${e(safeURL(url))}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`:'';
const emailLink=email=>email?`<a href="mailto:${e(email)}">${e(email)}</a>`:'';
const avatar=p=>safeImage(p.photo)?`<span class="avatar"><img src="${e(safeImage(p.photo))}" alt="${e(p.name)}" loading="lazy"></span>`:`<span class="avatar" aria-hidden="true">${e((p.name||'IMD').split(/\s+/).map(n=>n[0]).slice(0,2).join(''))}</span>`;
const tabs=(items,selected)=>`<div class="view-tabs">${items.map(([route,label])=>`<a href="#${route}" ${route===selected?'aria-current="page"':''}>${e(label)}</a>`).join('')}</div>`;
const menuLabel=route=>data.navigation.find(n=>n.target==='#'+route)?.label||labels[route]||route;
const newsSorted=()=>orderRecords(data.news,'news',data.listOrder.news);
const papersSorted=()=>orderRecords(data.publications,'publications',data.listOrder.publications);
const head=(title,description='',controls='')=>`<div class="screen-head"><div><p class="eyebrow">${e(data.site.shortName||'IMD Lab')}</p><h1>${e(title)}</h1>${description?`<p class="screen-description">${e(description)}</p>`:''}</div>${controls}</div>`;
function collection(title,description,items,renderer,controls='',list=false){
 return `<section class="screen collection-screen">${head(title,description,controls)}<div class="content-viewport">${items.length?`<div class="items ${list?'list':''}">${items.map(renderer).join('')}</div>`:'<p class="empty">New updates are on the way.</p>'}</div>${items.some(x=>x.isExample)?'<p class="page-example">Example entries for this website template.</p>':''}</section>`;
}
function readScreen(title,description,text,side='',links='',controls='',paper=null){
 readingText=text;
 const legend=paper?authorLegend(paper):'';
 const paperHeading=paper?`<p class="publication-detail-title">${e(paper.title)}</p><p class="publication-detail-authors">${renderAuthors(paper)}</p>${legend?`<p class="author-legend">${e(legend)}</p>`:''}`:'';
 return `<section class="screen detail-screen">${head(title,description,controls)}<div class="content-viewport"><div class="reading"><aside class="reading-side">${side}</aside><div class="reading-main"><div class="reading-text">${paperHeading}${e(text)}</div><div class="record-links">${links}</div></div></div></div></section>`;
}
function navigationMarkup(){
 const entries=data.navigation.filter(n=>n.visible),count=Math.ceil(entries.length/8);navPage=Math.max(0,Math.min(navPage,count-1));
 return `<div class="nav-links">${entries.slice(navPage*8,navPage*8+8).map(n=>`<a href="${e(n.target)}" aria-label="${e(n.label)}">${e(n.label)}</a>`).join('')}</div>${count>1?`<div class="nav-pages"><button data-nav-step="-1" aria-label="Previous menus" ${navPage===0?'disabled':''}>←</button><button data-nav-step="1" aria-label="More menus" ${navPage===count-1?'disabled':''}>→</button></div>`:''}`;
}
function markNavigation(){document.querySelectorAll('#navigation a').forEach(a=>{const current=location.hash||'#home';if(a.hash===current||(!a.hash.startsWith('#page/')&&current.startsWith(a.hash+'/'))||(a.hash==='#publications'&&current.startsWith('#patents')))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
const sectionLink=(route,label)=>`<a class="section-link" href="#${route}">${e(label||'View all')} <span aria-hidden="true">↗</span></a>`;
const sectionHeading=(route,subtitle)=>`<div class="home-section-heading"><div><p class="eyebrow">${e(subtitle)}</p><h2>${e(menuLabel(route))}</h2></div>${sectionLink(route)}</div>`;
function homeImages(){return data.home.imageStyle==='소재 이미지'?data.homeSlides.filter(s=>s.visible&&safeImage(s.image)):[];}
function heroArtwork(){const slides=homeImages();return `<figure class="intro-art" data-hero-carousel aria-roledescription="carousel" aria-label="Lab research images"><div class="intro-image">${slides.map((s,i)=>`<div class="hero-slide ${i===0?'is-active':''}" data-hero-slide data-title="${e(s.title)}" data-caption="${e(s.caption)}" role="group" aria-roledescription="slide" aria-label="${i+1} of ${slides.length}" aria-hidden="${i!==0}"><img src="${e(safeImage(s.image))}" alt="${e(s.imageAlt)}" decoding="async" ${i===0?'fetchpriority="high"':''}></div>`).join('')}</div><figcaption class="hero-meta"><span data-hero-caption>${e(slides[0]?.caption||'')}</span>${slides.length>1?`<div class="hero-controls" aria-label="Image controls">${slides.map((s,i)=>`<button class="hero-dot" data-hero-choice aria-label="Show image ${i+1}: ${e(s.title)}" aria-current="${i===0}"><span aria-hidden="true"></span></button>`).join('')}<button class="hero-toggle" data-hero-toggle>Pause</button></div>`:''}<span class="visually-hidden" data-hero-status aria-live="polite"></span></figcaption></figure>`;}
function startHeroCarousel(){destroyHeroCarousel?.();destroyHeroCarousel=mountHeroCarousel(main.querySelector('[data-hero-carousel]'),{autoplay:data.home.autoplay,delay:Number(data.home.slideDelay)*1000});}
function updateBrandLogo(){
 const mark=document.querySelector('#brand-mark'),source=data.site.logoVariant==='Custom image'?data.site.logoImage:logoDesigns[data.site.logoVariant];
 if(mark){const image=safeImage(source);mark.innerHTML=image?`<img src="${e(image)}" alt="" width="44" height="44">`:'';mark.hidden=!image;}
}

function home(){
 const h=data.home;
 const action=(label,target,kind)=>label&&safeDestination(target,data)?`<a class="${kind}" href="${e(target)}"><span class="shortcut-label">${e(label)}</span><span class="shortcut-arrow" aria-hidden="true">↗</span></a>`:'';
 const research=data.research.map((item,index)=>({item,index})).sort((a,b)=>(b.item.updated||'').localeCompare(a.item.updated||'')||b.index-a.index).slice(0,3).map(({item})=>item);
 return `<section class="home-page home-refined"><div class="meo-intro"><div class="intro-main"><div class="intro-copy">${h.eyebrow?`<p class="intro-eyebrow">${e(h.eyebrow)}</p>`:''}<h1>${e(h.headline)}</h1><p class="intro-description">${e(h.description)}</p><div class="intro-actions">${action(h.primaryLabel,h.primaryTarget,'intro-primary')}${action(h.secondaryLabel,h.secondaryTarget,'intro-secondary')}${action(h.tertiaryLabel,h.tertiaryTarget,'intro-secondary')}</div></div>${heroArtwork()}</div></div>
 <div class="home-updates" id="home-updates">
 <section class="home-research-section">${sectionHeading('research','Recent directions')}<div class="research-grid">${research.map(r=>`<a class="research-tile" href="#research"><p class="research-tag">${e(r.lensLabel||r.subtitle)}</p><h3>${e(r.title)}</h3><p>${e(short(r.goal||r.description,155))}</p><span class="tile-link">Explore research ↗</span></a>`).join('')||'<p class="empty">Research updates will appear here.</p>'}</div></section>
 ${h.showLatestNews?`<section class="home-news-section">${sectionHeading('news','Latest notes')}<div class="news-grid">${newsSorted().slice(0,3).map(n=>`<a class="news-tile" href="#news"><div class="tile-meta"><time>${e(dateText(n.date))}</time><span>${e(enumLabel(n.category))}</span></div><h3>${e(n.title)}</h3><p>${e(short(n.body,145))}</p><div class="tile-bottom">${badge(n)}<span>View news ↗</span></div></a>`).join('')||'<p class="empty">News will appear here.</p>'}</div></section>`:''}
 <section class="home-papers-section">${sectionHeading('publications','Recent work')}<div class="home-paper-list">${papersSorted().slice(0,3).map(p=>`<a class="home-paper" href="#publications"><span>${e(p.year)}</span><div><p class="home-journal">${e(p.venue)} <span>${e(journalMetric(p).label)}</span>${specialNoteMarkup(p)}</p><h3>${e(p.title)}</h3><p class="home-authors">${renderAuthors(p)}</p>${keywordList(p.keywords).length?`<div class="publication-keywords">${keywordList(p.keywords).map(k=>`<span>${e(k)}</span>`).join('')}</div>`:''}${badge(p)}</div></a>`).join('')||'<p class="empty">Publications will appear here.</p>'}</div></section>
 </div></section>`;
}
function academicRows(text){return `<ul class="pi-timeline">${text.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const parts=line.split('|').map(part=>part.trim());return parts.length>1?`<li><span class="pi-period">${e(parts[0])}</span><div><strong>${e(parts[1])}</strong>${parts.slice(2).some(Boolean)?`<span class="pi-institution">${e(parts.slice(2).filter(Boolean).join(' · '))}</span>`:''}</div></li>`:`<li><div><span class="pi-institution">${e(line)}</span></div></li>`;}).join('')}</ul>`;}
function phoneLink(value){const number=String(value||'').replace(/[\s().-]/g,'');return /^\+?\d{5,20}$/.test(number)?`<a href="tel:${e(number)}">${e(value)}</a>`:`<span>${e(value||'To be added')}</span>`;}
function about(){
 const p=data.professor,selected=papersSorted().filter(p=>p.selectedForPI),blocks=[['Research Experience',p.career],['Education',p.education],['Honors & Awards',p.awards]];
 return `<section class="screen about-page about-stacked">${head(data.site.aboutTitle||'Meet the PI',data.site.aboutSubtitle)}<section class="pi-summary"><div class="pi-summary-heading"><div><p class="eyebrow">Principal investigator</p><h2>${e(p.name||p.nameEn||'PI name to be added')}</h2><p class="pi-current-position">${e(p.position||'Current position to be added')}</p></div><figure class="pi-portrait">${safeImage(p.photo)?`<img src="${e(safeImage(p.photo))}" alt="${e(p.name||'Principal investigator')}">`:'<div class="pi-portrait-empty"><span>PI</span><span>Portrait</span></div>'}<figcaption>${safeImage(p.photo)?'Principal investigator':'Photo to be added'}</figcaption></figure></div>${p.bio?`<p class="pi-summary-bio">${e(p.bio)}</p>`:''}<div class="pi-contact-row"><div><span>Email</span>${p.email?emailLink(p.email):'<span>To be added</span>'}</div><div><span>Phone</span>${phoneLink(p.phone)}</div><div><span>Research profile</span>${safeURL(p.scholar)?external(p.scholar,'Google Scholar'):'<span class="contact-pending">Google Scholar · Link to be added</span>'}</div></div>${p.isExample?'<p class="pi-example-note">Example profile · Replace the name, position and biography with verified PI information.</p>':''}</section><div class="pi-history-stack">${blocks.map(([title,text])=>`<section class="pi-history-section"><h2>${e(title)}</h2>${text?academicRows(text):'<p class="empty">Details will be added.</p>'}</section>`).join('')}<section class="pi-selected-section"><div class="home-section-heading"><h2>Selected Publications</h2>${sectionLink('publications','All publications')}</div><div class="items list">${selected.length?selected.map(paperCard).join(''):'<p class="empty">Selected publications will be added.</p>'}</div></section></div>${p.isExample?'<p class="page-example">The profile, career history, education, awards and marked publications are fictional examples.</p>':''}</section>`;
}
function footerMarkup(){
 const c=data.contact,s=data.site;
 return `<div class="footer-inner"><div class="footer-simple-top"><div class="footer-lab"><strong>${e(s.shortName||'IMD Lab')}</strong><span>${e(s.nameEn)}</span></div><address>${[c.room,c.address].filter(Boolean).map(line=>`<span>${e(line)}</span>`).join('')}</address><div class="footer-simple-contact">${c.email?emailLink(c.email):'<span>Email to be added</span>'}${c.phone?phoneLink(c.phone):''}${external(s.institutionUrl,'ETRI')}</div></div><div class="footer-bottom"><p><span id="copyright">© ${new Date().getFullYear()}</span> <span id="footer-name">${e(s.shortName||s.nameEn)}</span><span class="footer-rights">All rights reserved.</span></p><a class="footer-edit" href="editor.html">Edit content</a></div><p class="example-notice" id="example-notice">${hasExamples(data)?'Example content · Replace marked entries with verified information.':''}</p></div>`;
}
function members(){
 const groups=[['Current Members',data.people.filter(p=>p.membership!=='Alumni')],['Alumni',data.people.filter(p=>p.membership==='Alumni')]];
 return `<section class="screen members-page">${head(menuLabel('people'),'Researchers, students and alumni.')}<div class="member-groups">${groups.map(([label,records])=>`<section class="member-group"><div class="member-group-heading"><h2>${label}</h2><span>${records.length} ${records.length===1?'member':'members'}</span></div><div class="items">${records.length?records.map(personCard).join(''):'<p class="empty">Members will be added.</p>'}</div></section>`).join('')}</div></section>`;
}
function coverGallery(){
 const covers=data.covers.filter(c=>c.visible).map((c,index)=>({c,index})).sort((a,b)=>b.c.year-a.c.year||a.index-b.index).map(({c})=>c),count=Math.ceil(covers.length/10);
 if(!covers.length)return '';
 coverPage=Math.max(0,Math.min(coverPage,count-1));
 return `<section class="cover-gallery" aria-labelledby="cover-gallery-title"><div class="cover-gallery-heading"><h2 id="cover-gallery-title">Cover Articles</h2>${count>1?`<div class="cover-pagination"><button data-cover-step="-1" aria-label="Previous covers" ${coverPage===0?'disabled':''}>←</button><span aria-live="polite">${coverPage+1} / ${count}</span><button data-cover-step="1" aria-label="Next covers" ${coverPage===count-1?'disabled':''}>→</button></div>`:''}</div><div class="cover-grid">${covers.slice(coverPage*10,coverPage*10+10).map(c=>{const image=safeImage(c.image),panel=image&&c.image==='assets/cover-artworks.webp'&&/^(?:[1-9]|10)$/.test(c.artPanel)?Number(c.artPanel)-1:-1;const art=`<div class="cover-window ${panel>=0?'is-sheet':''}">${image?`<img src="${e(image)}" alt="${e(c.imageAlt||c.title)}" loading="lazy" ${panel>=0?`style="left:-${panel%5*100}%;top:-${Math.floor(panel/5)*100}%"`:''}>`:'<span>Cover image</span>'}${c.isExample?`<div class="cover-masthead"><span>${e(c.venue||'IMD Research')}</span><small>${e(c.year)}</small></div>`:''}${c.isExample?'<span class="cover-example">Concept cover</span>':''}</div>`;return `<figure class="cover-item">${safeURL(c.articleUrl)?`<a href="${e(safeURL(c.articleUrl))}" target="_blank" rel="noopener noreferrer" aria-label="${e(c.title)} — View article">${art}</a>`:art}<figcaption>${e(c.title)}</figcaption></figure>`;}).join('')}</div></section>`;
}
function researchCard(r,index){return `<article class="entry question-entry"><div class="question-kicker"><span>${String(index+1).padStart(2,'0')}</span>${e(r.lensLabel||r.subtitle||'Research')}</div><h2 class="entry-title">${e(r.question||r.title)}</h2><p class="entry-subtitle">${e(r.title)}</p><p class="entry-description">${e(r.goal||r.description)}</p><a class="text-link" href="#research/${e(r.id)}">Explore research <span aria-hidden="true">→</span></a>${badge(r)}</article>`;}
function personCard(p){return `<article class="entry person-entry"><div class="person-head">${avatar(p)}<div><h2 class="entry-title">${e(p.name)} ${badge(p)}</h2></div></div><p class="entry-subtitle">${e(enumLabel(p.role))}</p><p class="entry-description">${e(p.research)}</p><a class="text-link" href="#people/${e(p.id)}">View profile <span aria-hidden="true">→</span></a></article>`;}
function paperCard(p){
 const metric=journalMetric(p),article=paperArticleURL(p),keywords=keywordList(p.keywords),note=specialNoteMarkup(p),separator='<span class="publication-separator" aria-hidden="true">|</span>';
 const metricMarkup=metric.source?`<a class="if-value" href="${e(metric.source)}" target="_blank" rel="noopener noreferrer" aria-label="${e(metric.label+' · source')}">${e(metric.label)}</a>`:`<span class="if-value ${metric.label==='IF —'?'unavailable':''}" aria-label="${e(metric.label)}">${e(metric.label)}</span>`;
 return `<article class="entry record publication-record"><div class="record-meta">${e(p.year)}</div><div class="publication-body"><div class="journal-line publication-meta-heading"><span class="publication-venue">${e(p.venue)}</span> ${separator} ${metricMarkup}${note?` ${separator} ${note}`:''} ${badge(p)}</div><h2 class="entry-title">${e(p.title)}</h2><p class="publication-authors">${renderAuthors(p)}</p><div class="publication-footer">${keywords.length?`<div class="publication-keywords">${keywords.map(k=>`<span>${e(k)}</span>`).join('')}</div>`:''}<div class="article-actions">${article?`<a href="${e(article)}" target="_blank" rel="noopener noreferrer">View article ↗</a>`:'<span class="unavailable" aria-disabled="true" aria-label="Article link not provided">View article ↗</span>'}</div></div></div></article>`;
}
function recordCard(p,index,kind){const patent=kind==='patents';return `<article class="entry record"><div class="record-meta">${e(dateText(p.date))}<span class="type-tag">${e(enumLabel(patent?p.status:p.category))}</span></div><div><h2 class="entry-title">${e(p.title)} ${badge(p)}</h2><p class="entry-description">${e(patent?p.inventors:short(p.body,180))}</p>${patent?`<p class="entry-description">${e(p.number)}</p>`:''}</div><a class="record-open" href="#${kind}/${e(p.id)}">Read more ↗</a></article>`;}
function publications(isPatent=false){
 const items=isPatent?orderRecords(data.patents,'patents',data.listOrder.patents):papersSorted();
 return `<section class="screen collection-screen publications-page">${head(menuLabel('publications'),'Research articles and intellectual property.',tabs([['publications','Papers'],['patents','Patents']],isPatent?'patents':'publications'))}${isPatent?'':coverGallery()}<div class="publication-list-heading"><h2>${isPatent?'Patents':'Publications'}</h2></div><div class="items list">${items.length?items.map(p=>isPatent?recordCard(p,0,'patents'):paperCard(p)).join(''):'<p class="empty">New records will appear here.</p>'}</div>${items.some(p=>p.isExample)?'<p class="page-example">Marked records and concept covers are fictional examples.</p>':''}</section>`;
}
function joinUs(){
 const j=data.join,positions=data.positions.filter(p=>p.visible),email=j.email||data.contact.email;
 return `<section class="screen join-page">${head(menuLabel('join'),j.introduction)}<div class="join-intro"><h2>${e(j.title||'Open Positions')}</h2>${j.isExample?'<p class="page-example">Example opportunities · These listings illustrate the format and are not active recruitment announcements.</p>':''}</div><div class="position-list">${positions.length?positions.map(p=>`<article class="position-entry"><div class="position-heading"><div>${p.type?`<p class="eyebrow">${e(p.type)}</p>`:''}<h3>${e(p.title)}</h3></div><div class="position-status">${badge(p)}<span>${e(p.status)}</span></div></div><p>${e(p.description)}</p>${p.requirements?`<div class="position-requirements"><h4>Candidate profile</h4><p>${e(p.requirements)}</p></div>`:''}</article>`).join(''):'<p class="empty">There are no positions listed at the moment. Please check back for future opportunities.</p>'}</div><section class="join-apply"><h2>How to Apply</h2><p>${e(j.application||'Please contact the lab with a brief introduction and your research interests.')}</p>${email?`<div class="join-email">${emailLink(email)}</div>`:''}</section></section>`;
}
function contact(){
 const c=data.contact;
 return `<section class="screen contact-page">${head(menuLabel('contact'),'Contact details, location and visiting information.')}<div class="contact-overview"><section><h2>Get in Touch</h2><dl class="contact-details"><div><dt>Email</dt><dd>${c.email?emailLink(c.email):'To be added'}</dd></div><div><dt>Phone</dt><dd>${phoneLink(c.phone)}</dd></div></dl></section><section><h2>Address</h2><address>${[c.room,c.address].filter(Boolean).map(line=>`<span>${e(line)}</span>`).join('')||'Address to be added'}</address><div class="contact-links">${external(c.mapUrl,'Open map')}${external(data.site.institutionUrl,'ETRI website')}${external(data.site.github,'GitHub')}</div></section></div><div class="contact-information">${[['Getting Here',c.transport],['Visiting the Lab',c.visiting],['Research & Collaboration',c.inquiry]].filter(([,text])=>text).map(([title,text])=>`<section><h2>${title}</h2><p>${e(text)}</p></section>`).join('')}</div>${c.isExample?'<p class="page-example">Example contact details · Replace the email and confirm the lab building and room before arranging a visit.</p>':''}</section>`;
}
function detail(kind,id){
 const item=data[kind]?.find(p=>p.id===id);if(!item)return missing();let text='',links='',meta='',side='';
 if(kind==='people'){text=[item.research,item.period,item.email].filter(Boolean).join('\n\n');links=emailLink(item.email)+' '+external(item.link,'Website');side=avatar(item)+`<h2>${e(item.name)}</h2>${badge(item)}<p>${e(enumLabel(item.role))}</p>`;}
 else{meta=kind==='research'?item.subtitle:kind==='publications'?String(item.year):dateText(item.date);const warning=item.isExample?'[Example] This is fictional content for the website template.\n\n':'';
 const body=kind==='research'?[item.question,item.description,item.methods?'Approach\n'+item.methods:'',item.goal?'Direction\n'+item.goal:''].filter(Boolean).join('\n\n'):kind==='publications'?[item.venue,[journalMetric(item).label,publicationSpecialNote(item)].filter(Boolean).join(' · '),item.keywords?'Keywords: '+item.keywords:'',item.details].filter(Boolean).join('\n'):kind==='patents'?[item.inventors,enumLabel(item.country)+' · '+enumLabel(item.status),item.number,dateText(item.date),item.applicationNumber?'Application number: '+item.applicationNumber:'',item.registrationNumber?'Registration number: '+item.registrationNumber:'',item.applicationDate?'Filed: '+item.applicationDate:'',item.registrationDate?'Granted: '+item.registrationDate:''].filter(Boolean).join('\n'):item.body||item.description;
 text=warning+(kind==='publications'?'':item.title+'\n\n')+body;links=kind==='publications'?external(paperArticleURL(item),'View article')+' '+external(item.pdf,'PDF')+' '+external(item.code,'Code'):external(item.link,kind==='patents'?'Patent record':'Related link');side=`<h2>${e(labels[kind])}</h2>${badge(item)}<p>${e(meta)}</p><p>${e(enumLabel(item.type||item.category||item.status||''))}</p>`;}
 return readScreen(kind==='people'?'Profile':kind==='research'?'Research':'Details',short(item.title||item.name,100),text,side,links,`<a class="back-link" href="#${kind}">← Back to ${e(labels[kind])}</a>`,kind==='publications'?item:null);
}
function missing(){return `<section class="screen">${head('Page not found')}<p class="empty">The requested page could not be found.</p><a class="text-link" href="#home">Back to Home →</a></section>`;}
function fitContent(){} // Public pages use document flow; the content editor keeps its own field pagination.
function render(){
 destroyHeroCarousel?.();destroyHeroCarousel=null;
 const [route='home',id]=location.hash.slice(1).split('/');routeKey=location.hash||'#home';let body;
 if(route==='home'||!route)body=home();
 else if(route==='about')body=about();
 else if(route==='intro')body=readScreen(data.home.headline,'',data.home.description,`<h2>${e(data.site.shortName)}</h2>`,'','<a class="back-link" href="#home">← Home</a>');
 else if(route==='page'||route==='home-note'){const item=(route==='page'?data.pages:data.homeNotes).find(p=>p.id===id);body=item?readScreen(item.title,item.subtitle||'',(item.isExample?'[Example content]\n\n':'')+item.body,`<h2>${e(data.site.shortName)}</h2>`,'','<a class="back-link" href="#home">← Home</a>'):missing();}
 else if(route==='join')body=joinUs();
 else if(route==='contact')body=contact();
 else if(route==='events')body=collection(menuLabel('news'),'Lab notes, milestones, seminars and gatherings.',newsSorted(),(p,i)=>recordCard(p,i,'news'),'',true);
 else if(id&&['research','people','patents','news'].includes(route))body=detail(route,id);
 else if(route==='research')body=collection(menuLabel('research'),'Materials design, electrochemistry and integrated devices.',data.research,researchCard);
 else if(route==='people')body=members();
 else if(route==='publications'||route==='patents')body=publications(route==='patents');
 else if(route==='news')body=collection(menuLabel('news'),'Lab notes, milestones, seminars and gatherings.',newsSorted(),(p,i)=>recordCard(p,i,'news'),'',true);
 else body=missing();main.innerHTML=body;
 const entries=data.navigation.filter(n=>n.visible),index=entries.findIndex(n=>n.target===(location.hash||'#home'));if(index>=0)navPage=Math.floor(index/8);
 document.querySelector('#navigation').innerHTML=navigationMarkup();markNavigation();document.title=(menuLabel(route)||'IMD Lab')+' | '+data.site.nameEn;startHeroCarousel();
}
function applyData(content){
 data=validateContent(content);updateBrandLogo();
 document.querySelector('#brand-symbol').textContent=data.site.shortName||'IMD Lab';
 document.querySelector('.brand').setAttribute('aria-label',(data.site.shortName||'IMD Lab')+' home');
 document.querySelector('#brand-name').textContent=data.site.nameEn;
 document.querySelector('#site-footer').innerHTML=footerMarkup();
 const meta=document.querySelector('meta[name=description]');if(meta)meta.content=data.home.description;
 render();
}
main.addEventListener('click',event=>{const step=event.target.closest('[data-cover-step]');if(step&&!step.disabled){coverPage+=Number(step.dataset.coverStep);render();return;}if(event.target.closest('[data-scroll-updates]'))document.querySelector('#home-updates')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
document.querySelector('#navigation').addEventListener('click',event=>{const b=event.target.closest('[data-nav-step]');if(b&&!b.disabled){navPage+=Number(b.dataset.navStep);document.querySelector('#navigation').innerHTML=navigationMarkup();markNavigation();}});
window.addEventListener('hashchange',()=>{if(data){render();window.scrollTo({top:0,left:0,behavior:'instant'});}});
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();});
const isPreview=new URLSearchParams(location.search).has('preview');
if(isPreview&&window.opener){let received=false;window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==window.opener||event.data?.type!=='lab-preview')return;try{applyData(event.data.content);received=true;document.querySelector('#example-notice').textContent='PREVIEW · These changes have not been published.';}catch(err){main.textContent=err.message;}});window.opener.postMessage({type:'lab-preview-ready'},location.origin);setTimeout(()=>{if(!received)main.innerHTML='<p class="empty">Please reopen Preview from the content editor.</p>';},8000);}else{fetch('data/content.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('Unable to load the content file.');return response.json();}).then(applyData).catch(error=>{main.innerHTML=`<section class="error-screen"><h1>Content unavailable</h1><p>${e(error.message)}</p><button class="button" id="reload">Try again</button></section>`;document.querySelector('#reload').onclick=()=>location.reload();});}

window.addEventListener('pagehide',()=>{destroyHeroCarousel?.();destroyHeroCarousel=null;});
window.addEventListener('pageshow',event=>{if(event.persisted&&data)startHeroCarousel();});
