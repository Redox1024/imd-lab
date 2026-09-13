import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newRecord,validateContent} from '../dist/schema.js';
import {publicationSpecialNote} from '../dist/publication-data.js';
import {liveCardData} from '../dist/live-preview.js';
import {mergeDOIFields} from '../dist/doi-import.js';

const source=JSON.parse(await readFile(new URL('../dist/data/content.json',import.meta.url),'utf8'));
const base=validateContent(source);
const roundtrip=paper=>validateContent(JSON.parse(JSON.stringify({...base,publications:[paper]}))).publications[0];
const legacy={...base.publications[0]};
delete legacy.showSpecialNote;
delete legacy.specialNote;
for(const paper of [newRecord('publications'),roundtrip(legacy)]){
  assert.equal(paper.showSpecialNote,false);
  assert.equal(paper.specialNote,'');
  assert.equal(publicationSpecialNote(paper),'');
}

const paper=roundtrip({...legacy,impactFactor:'12.5',metricYear:'',showSpecialNote:true,specialNote:'  Front cover image; Highly cited paper  '});
assert.equal(publicationSpecialNote(paper),'Front cover image; Highly cited paper');
assert.match(liveCardData('publications',paper,base.site,base).text,/IF 12\.5 · Front cover image; Highly cited paper/);
assert.deepEqual(roundtrip(paper),paper,'Download/import preserves both fields');

const hidden=roundtrip({...paper,showSpecialNote:false});
assert.equal(hidden.specialNote,paper.specialNote,'Turning off preserves the manually entered text');
assert.equal(publicationSpecialNote(hidden),'');
assert.doesNotMatch(liveCardData('publications',hidden,base.site,base).text,/Front cover|Highly cited/);
assert.equal(publicationSpecialNote({...hidden,showSpecialNote:true}),paper.specialNote);
for(const specialNote of ['', ' \t\n ']){
  const blank={...paper,specialNote};
  assert.equal(publicationSpecialNote(blank),'');
  assert.equal(liveCardData('publications',blank,base.site,base).text,liveCardData('publications',hidden,base.site,base).text,'Blank notes leave no extra separator');
}

for(const current of [paper,hidden]){
  const refreshed=roundtrip(mergeDOIFields(current,{title:'Updated title',authors:'Updated author',venue:'Small',year:2025,showSpecialNote:false,specialNote:'Untrusted imported text'}));
  assert.equal(refreshed.showSpecialNote,current.showSpecialNote);
  assert.equal(refreshed.specialNote,current.specialNote,'DOI lookup never replaces manual special notes');
}
const manualText='<img src=x onerror="alert(1)"> & Featured paper';
assert.equal(publicationSpecialNote(roundtrip({...paper,specialNote:manualText})),manualText,'Manual text remains data, without interpreting HTML');
assert.deepEqual(validateContent(JSON.parse(JSON.stringify(base))),base,'Existing website content remains compatible');
console.log('PASS: new/legacy defaults, optional display, trim/blank, hide/restore, JSON persistence, live preview, manual text, and DOI refresh preservation.');
