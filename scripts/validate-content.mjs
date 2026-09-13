import {readFile,access} from 'node:fs/promises';
import {validateContent,singleSections,logoDesigns,guideLogoAssets} from '../dist/schema.js';
const base=new URL('../dist/',import.meta.url);
const data=validateContent(JSON.parse(await readFile(new URL('data/content.json',base),'utf8')));
for(const file of ['index.html','editor.html','styles.css','schema.js','app.js','hero-carousel.js','editor.js','pagination.js','live-preview.js','publication-data.js','document-import.js','vendor/pdf.mjs','vendor/pdf.worker.mjs','vendor/tesseract.min.js','vendor/tesseract.worker.min.js','data/journal-if-template.csv','favicon.svg'])await access(new URL(file,base));
const localImages=[...Object.values(logoDesigns),...Object.values(guideLogoAssets),data.site.logoImage,...data.homeSlides.map(s=>s.image),data.professor.photo,...data.people.map(p=>p.photo),...data.covers.map(c=>c.image)].filter(v=>v?.startsWith('assets/'));
for(const image of new Set(localImages))await access(new URL(image,base));
console.log('Content and required assets verified:',Object.fromEntries(Object.entries(data).filter(([key])=>!singleSections.includes(key)&&key!=='schemaVersion').map(([key,value])=>[key,value.length])));
