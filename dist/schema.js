import {normalizeListOrder} from './list-order.js';
export const sections = {site:'Lab settings',home:'Home intro',homeSlides:'Home images',homeNotes:'Archived home notes',navigation:'Navigation',pages:'Extra pages',professor:'Professor',research:'Research',people:'Members',covers:'Cover gallery',publications:'Papers',patents:'Patents',news:'News',join:'Join Us',positions:'Open positions',events:'Archived events',contact:'Contact'};
export const singleSections = ['site','home','professor','contact','join'];
// key, label, input type, required, help/options
export const fields = {
site:[["logoVariant","Logo design","select",true,["IMD guide","Integrated layers","IMD monogram","Connected pathway","Device core","Custom image","None"]],["logoImage","Custom logo image","image",false,"Choose Custom image above to use this file. The symbol appears to the left of the lab name."],["name","Lab display name","text",true],["nameEn","Full laboratory name","text",true],["shortName","Short name","text"],["affiliation","Affiliation / short description","text"],["introduction","Lab introduction","textarea"],["aboutTitle","About page title","text",false,"For example: Meet PI"],["aboutSubtitle","About introduction","text"],["github","Lab GitHub URL","url"],["repository","Website GitHub repository","url",false,"https://github.com/username/repository"],["branch","Content branch","text",true],["isTemplate","Show example content notice","checkbox"],["institution","Institution name","text"],["institutionUrl","Institution website","url"]],
home:[["eyebrow","Text above the headline","text"],["headline","Home headline","textarea",true,"Two short lines work well."],["description","Description","textarea"],["primaryLabel","First button label","text"],["primaryTarget","First button destination","destination"],["secondaryLabel","Second button label","text"],["secondaryTarget","Second button destination","destination"],["tertiaryLabel","Third button label","text"],["tertiaryTarget","Third button destination","destination"],["imageStyle","Background style","select",false,["소재 이미지","단색"]],["autoplay","Rotate images automatically","checkbox"],["slideDelay","Seconds per image","select",true,["4","6","8","10"]],["showLatestNews","Show news on the home page","checkbox"]],
homeSlides:[["title","Image title","text",true],["image","Image","image",true],["caption","Caption","text"],["imageAlt","Image description","text"],["visible","Visible in rotation","checkbox"]],
homeNotes:[["title","Title","text",true],["body","Body","textarea",true],["visible","Visible","checkbox"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
navigation:[["label","Menu label","text",true,"Use a short label, up to 24 characters."],["target","Destination","destination",true],["visible","Visible","checkbox"]],
pages:[["title","Title","text",true],["subtitle","Short introduction","text"],["body","Body","textarea",true],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
professor:[["name","Name","text"],["nameEn","Full name","text"],["position","Position / affiliation","text"],["bio","Biography","textarea"],["statement","Research philosophy","textarea"],["email","Email","email"],["phone","PI telephone","text",false,"Use an international number, for example +82 42 000 0000. Leave unknown contact details blank."],["photo","Profile image","image",false,"Use assets/filename.webp or a public HTTPS image URL."],["researchInterests","Research interests","textarea",false,"One research area per line."],["education","Education","textarea",false,"One entry per line: 2013–2017 | Ph.D., Materials Science | Example University"],["career","Research experience","textarea",false,"One entry per line: 2022–Present | Professor | Example University"],["awards","Honors & awards","textarea",false,"One entry per line: 2025 | Research Award | Example University"],["cv","CV URL","url",false,"A public CV PDF or web page URL."],["scholar","Google Scholar URL","url"],["orcid","ORCID URL","url"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
research:[["title","Title","text",true],["subtitle","Short introduction","text"],["description","Description","textarea",true],["lensLabel","Short research label","text",false,"For example: Materials / Interfaces / Devices"],["question","Research question","textarea"],["methods","Approach","textarea",false,"For example: materials design, structural analysis and reaction mechanisms."],["goal","Research goal","textarea"],["link","Related URL","url"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."],["updated","Last updated","date",false,"The home page previews the three most recent research updates."]],
people:[["name","Name","text",true],["nameEn","Full name","text"],["membership","Membership","select",true,["Current member","Alumni"]],["role","Role","select",true,["연구원","박사과정","석사과정","석박사통합과정","학부연구생","졸업생"]],["research","Research interests","textarea"],["email","Email","email"],["photo","Profile image","image",false,"Use assets/filename.webp or a public HTTPS image URL."],["link","Related URL","url"],["period","Period / participation","text"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
covers:[["title", "Cover title", "text", true], ["venue", "Journal / collection", "text"], ["year", "Year", "number", true], ["image", "Cover image", "image", true, "Choose an image or enter an assets/ path or HTTPS URL."], ["imageAlt", "Image description", "text"], ["articleUrl", "Article URL", "url"], ["artPanel", "Example artwork", "select", false, ["Full image", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]], ["visible", "Visible in gallery", "checkbox"], ["isExample", "Mark as an example", "checkbox"]],
publications:[["doi","DOI","text",false,"Enter a DOI or DOI URL to fill the paper details. You can also leave this blank and enter the details yourself."],["title","Title","text",true],["authors","Authors (full English list)","textarea",true],["venue","Journal / conference","text",true],["year","Publication year","number",true],["impactFactor","IF (manual entry)","text",false,"Enter an IF value, such as 12.1 or <0.1. Leave blank when unknown. DOI lookup does not change this field."],["metricYear","IF reference year (optional)","number"],["metricSource","IF source URL (optional)","url"],["type","Type","select",true,["저널","학회","프리프린트","기타"]],["keywords","Three keywords","text",false,"Separate up to three keywords with semicolons. Review automatic suggestions."],["issn","ISSN / eISSN","text"],["articleUrl","View article URL","url"],["importNote","Import notes / review","textarea"],["sourceHash","Source file identifier","text"],["details","Volume, issue and pages","text"],["pdf","Public PDF URL","url"],["code","Code URL","url"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."],["selectedForPI","Show in PI selected publications","checkbox",false,"Checked papers appear at the end of the About page."]],
// Retained solely for compatibility with older downloads; there is no IF menu.
journals:[["name","Name","text",true],["issn","ISSN / eISSN","text",false,"Separate multiple ISSNs with semicolons."],["impactFactor","Journal Impact Factor","text",false,"Use an official IF value. Leave unknown values blank."],["metricYear","IF reference year","number"],["metricSource","Official metric source","url"],["metricUpdated","Verified on","date"],["metricStatus","Metric status","select",true,["미연동","확인됨","미제공","보류","제외"]],["clarivateId","Clarivate journal ID","text"]],
patents:[["title","Title","text",true],["inventors","Inventors","text",true],["number","Application / registration number","text",true],["applicationNumber","Application number","text"],["registrationNumber","Registration number","text"],["applicationDate","Filing date","date"],["registrationDate","Grant date","date"],["importNote","Import notes / review","textarea"],["sourceHash","Source file identifier","text"],["country","Country","text",true],["status","Status","select",true,["출원","등록"]],["date","Date","date",true],["link","Related URL","url"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
news:[["title","Title","text",true],["date","Date","date",true],["category","Category","select",true,["연구","논문","수상","구성원","연구실","기타"]],["body","Body","textarea",true],["link","Related URL","url"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
join:[["title", "Page heading", "text", true], ["introduction", "Introduction", "textarea"], ["application", "How to apply", "textarea"], ["email", "Application email", "email", false, "Leave blank to use the Contact email."], ["isExample", "Mark as an example", "checkbox"]],
positions:[["title", "Position title", "text", true], ["type", "Appointment type", "text"], ["description", "Research focus", "textarea", true], ["requirements", "Candidate profile", "textarea"], ["status", "Status", "select", true, ["Open", "Upcoming", "Closed"]], ["visible", "Visible on Join Us", "checkbox"], ["isExample", "Mark as an example", "checkbox"]],
events:[["title","Title","text",true],["date","Date","date",true],["endDate","End date","date"],["time","Time","text",false,"For example: 14:00–16:00 (KST)"],["category","Category","select",true,["세미나","학회","워크숍","연구실 행사","기타"]],["location","Location / online details","text"],["description","Description","textarea"],["link","Related URL","url"],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]],
contact:[["email","Email","email"],["phone","Telephone","text"],["address","Postal address","textarea"],["room","Building / room","text"],["transport","Getting here","textarea"],["visiting","Visit information","textarea"],["inquiry","General inquiries / collaboration","textarea"],["mapUrl","Map URL","url",false,"Use a verified map sharing link for your actual location."],["isExample","Mark as an example","checkbox",false,"Turn this off after replacing the example with real information."]]
};
export const enumLabels = {"소재 이미지":"Image","단색":"Solid color","연구원":"Researcher","박사과정":"PhD student","석사과정":"MS student","석박사통합과정":"MS–PhD student","학부연구생":"Undergraduate researcher","졸업생":"Alumni","저널":"Journal","학회":"Conference","프리프린트":"Preprint","기타":"Other","미연동":"Not connected","확인됨":"Verified","미제공":"Unavailable","보류":"On hold","제외":"Excluded","출원":"Filed","등록":"Granted","연구":"Research","논문":"Publication","수상":"Award","구성원":"People","연구실":"Lab life","세미나":"Seminar","워크숍":"Workshop","연구실 행사":"Lab gathering","대한민국":"Republic of Korea","미국":"United States"};
export const enumLabel = value => enumLabels[value] || String(value||'');
export const defaultNavigation = () => Object.entries({home:'Home',about:'About',research:'Research',people:'Members',publications:'Publications',news:'News',join:'Join Us',contact:'Contact'}).map(([route,label])=>({id:'nav-'+route,label,target:'#'+route,visible:true}));
export function destinationOptions(data){return [...defaultNavigation().map(n=>[n.target,n.label]),...(data.pages||[]).map(p=>['#page/'+p.id,p.title||'New page'])];}
export function safeDestination(value,data){return destinationOptions(data).some(([target])=>target===value)?value:'';}
export const escapeHTML = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(v){try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function safeImage(v){
  if(typeof v!=='string')return '';
  if(v.length<=1400000&&/^data:image\/(?:png|jpeg|webp|avif|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(v))return v;
  // Local assets only; reject traversal and executable URL schemes.
  if(/^assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(v))return v;
  return safeURL(v);
}
export function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
export function hasExamples(data){return data.site.isTemplate||Object.entries(data).some(([key,value])=>key!=='site'&&(Array.isArray(value)?value.some(item=>item.isExample):value?.isExample));}
function legacyJournalForPaper(paper,journals){
  const codes=value=>(String(value||'').toUpperCase().match(/\d{4}-?\d{3}[\dX]/g)||[]).map(x=>x.replace('-',''));
  const name=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const wanted=codes(paper.issn),matched=journals.filter(j=>wanted.length&&codes(j.issn).some(code=>wanted.includes(code)));
  if(matched.length)return matched.sort((a,b)=>(b.metricYear||0)-(a.metricYear||0))[0];
  const named=journals.filter(j=>name(j.name)===name(paper.venue));
  return named.length===1?named[0]:null;
}
export function validateContent(data){
  if(!data||typeof data!=='object'||data.schemaVersion!==1)throw new Error('Unsupported content format. Use a schemaVersion 1 content file.');
  // Preserve contact details from earlier content.json downloads.
  const previous=data.site||{};
  const source={...data,site:{logoVariant:"Integrated layers",logoImage:"",...previous},homeSlides:data.homeSlides??[],join:data.join??{title:'Open Positions',introduction:'Explore research opportunities with '+(previous.shortName||'the lab')+'.',application:data.contact?.inquiry||'',email:'',isExample:!!data.contact?.isExample},positions:data.positions??[],covers:data.covers??[],people:(data.people||[]).map(p=>({...p,membership:p.membership||(p.role==='졸업생'?'Alumni':'Current member')})),contact:data.contact??{email:previous.email,phone:previous.phone,address:previous.address},journals:data.journals??[],navigation:data.navigation??defaultNavigation(),pages:data.pages??[],homeNotes:data.homeNotes??[],home:data.home??{eyebrow:previous.affiliation||'MATERIALS ENGINEERING AND OPTIMIZATION',headline:previous.tagline||'Small interfaces.\nLasting energy.',description:previous.description||'',primaryLabel:'Explore Research',primaryTarget:'#research',secondaryLabel:'Meet PI',secondaryTarget:'#about',imageStyle:previous.backgroundStyle||'소재 이미지',image:previous.backgroundImage||'',imageAlt:previous.backgroundAlt||'',caption:'Energy materials, imagined.',showLatestNews:true}};
  source.navigation=source.navigation.filter(n=>!String(n.target||'').startsWith('#events'));
  if(!data.join&&!source.navigation.some(n=>n.target==='#join')){source.navigation=[...source.navigation];let id='nav-join';while(source.navigation.some(n=>n.id===id))id+='-new';const after=source.navigation.findIndex(n=>n.target==='#news');source.navigation.splice(after>=0?after+1:source.navigation.length,0,{id,label:'Join Us',target:'#join',visible:true});}
  source.home={autoplay:true,slideDelay:'6',tertiaryLabel:'Publication',tertiaryTarget:'#publications',...source.home};
  // Older downloads stored the first photo in Home intro. Move it once into the shared list.
  if(Array.isArray(source.homeSlides)&&typeof source.home.image==='string'&&source.home.image.trim()){
    let id='home-image-first';while(source.homeSlides.some(slide=>slide?.id===id))id+='-old';
    source.homeSlides=[{id,title:'Materials research',image:source.home.image,imageAlt:source.home.imageAlt||'',caption:source.home.caption||'',visible:true},...source.homeSlides];
  }
  for(const key of ['primaryTarget','secondaryTarget','tertiaryTarget'])if(String(source.home[key]||'').startsWith('#events'))source.home[key]='#news';
  const clean={schemaVersion:1,listOrder:normalizeListOrder(data.listOrder)};
  for(const [section,spec] of Object.entries(fields)){
    const singular=singleSections.includes(section),raw=source[section],sectionLabel=sections[section]||(section==='journals'?'Legacy journals':section);
    if(singular?(!raw||typeof raw!=='object'||Array.isArray(raw)):!Array.isArray(raw))throw new Error(sectionLabel+': Invalid data format.');
    const records=singular?[raw]:raw;
    if(records.length>5000)throw new Error(sectionLabel+': A maximum of 5,000 records is supported.');
    const ids=new Set();
    const normalized=records.map((record,index)=>{
      if(!record||typeof record!=='object'||Array.isArray(record))throw new Error(sectionLabel+': Invalid record format.');
      const result={};
      if(!singular){const id=record.id??`${section}-${index+1}`;if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||ids.has(id))throw new Error(sectionLabel+': A record ID is invalid or duplicated.');ids.add(id);result.id=id;}
      for(const [key,label,type,required,extra] of spec){
        let value=record[key]??(type==='checkbox'?false:'');
        if(type==='checkbox'){if(typeof value!=='boolean')throw new Error(label+': A boolean value is required.');result[key]=value;continue;}
        if((type==='number'||key==='impactFactor')&&typeof value==='number')value=String(value);
        if(typeof value!=='string'||value.length>(type==='image'?1400000:30000))throw new Error(label+': Enter valid text.');
        value=value.trim();
        // Older PDF imports may have stored a local filename. This hidden,
        // optional legacy field must not block manual or DOI-based editing.
        if(section==='publications'&&key==='pdf')value=safeURL(value);
        if(required&&!value)throw new Error(`${sectionLabel} ${singular?'':index+1+' '}${label}: This field is required.`);
        if(value&&type==='url'&&!safeURL(value))throw new Error(label+': Enter an HTTP or HTTPS URL.');
        if(value&&type==='image'&&!safeImage(value))throw new Error(label+': Choose a PNG, JPEG, WebP, AVIF or GIF image, or enter an assets/ path or HTTP/HTTPS URL.');
        if(value&&type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error(label+': Enter a valid email address.');
        if(value&&type==='date'&&!validDate(value))throw new Error(label+': Enter a valid date.');
        if(value&&type==='select'&&!extra.includes(value))throw new Error(label+': Choose a value from the list.');
        if(value&&type==='number'&&!/^(18|19|20|21)\d{2}$/.test(value))throw new Error(label+': Enter a year between 1800 and 2199.');
        result[key]=type==='number'&&value!==''?Number(value):value;
      }
      if(['publications','journals'].includes(section)&&result.impactFactor&&!/^<?\d+(?:\.\d+)?$/.test(result.impactFactor))throw new Error('IF must be a number or a value such as <0.1.');
      if(section==='journals'&&result.metricStatus==='확인됨'&&(!result.impactFactor||!result.metricYear||!result.metricSource||!result.metricUpdated))throw new Error('Verified IF requires a value, reference year, source URL and verification date.');
      if(section==='events'&&result.endDate&&result.endDate<result.date)throw new Error('The end date must not be earlier than the start date.');
      if(section==='site'&&result.repository&&!/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/.test(result.repository))throw new Error('GitHub repository format: https://github.com/username/repository');
      if(section==='home'&&!result.imageStyle)result.imageStyle=source.homeSlides.some(slide=>slide?.image)?'소재 이미지':'단색';
      if(section==='navigation'&&result.label.length>24)throw new Error('Menu labels must be 24 characters or fewer.');
      return result;
    });
    clean[section]=singular?normalized[0]:normalized;
  }
  // Carry forward existing verified values once. An explicit empty paper IF
  // records the user's choice and must never fall back to the legacy journal.
  for(const [index,paper] of clean.publications.entries()){
    if(Object.hasOwn(source.publications[index],'impactFactor'))continue;
    const journal=legacyJournalForPaper(paper,clean.journals);
    if(journal?.metricStatus==='확인됨'){
      paper.impactFactor=journal.impactFactor;
      paper.metricYear=journal.metricYear;
      paper.metricSource=journal.metricSource;
    }
  }
  for(const entry of clean.navigation){if(entry.target&&!safeDestination(entry.target,clean))throw new Error('Navigation: The destination no longer exists. Choose another page.');}
  for(const key of ['primaryTarget','secondaryTarget','tertiaryTarget']){if(clean.home[key]&&!safeDestination(clean.home[key],clean))throw new Error('Home intro: Choose a valid button destination.');}
  return clean;
}
export function newRecord(section){
  const record={id:section+'-'+crypto.randomUUID()};
  for(const [key,,type,,extra] of fields[section])record[key]=type==='checkbox'?(key==='visible'):type==='select'?extra[0]:type==='number'&&key!=='metricYear'&&section!=='publications'?new Date().getFullYear():type==='date'&&['date','updated'].includes(key)?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date()):'';
  return record;
}

export const guideLogoAssets={mark:"assets/logos/imd-lab-mark.png",horizontal:"assets/logos/imd-lab-horizontal.png",full:"assets/logos/imd-lab-horizontal-full.png"};
export const logoDesigns={"IMD guide":guideLogoAssets.mark,"Integrated layers":"assets/logos/01-integrated-layers.webp","IMD monogram":"assets/logos/02-imd-monogram.webp","Connected pathway":"assets/logos/03-connected-pathway.webp","Device core":"assets/logos/04-device-core.webp"};
