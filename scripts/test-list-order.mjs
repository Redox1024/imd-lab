import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent} from '../dist/schema.js';
import {orderRecords} from '../dist/list-order.js';
import {liveCardData} from '../dist/live-preview.js';

const legacy=JSON.parse(await readFile(new URL('../dist/data/content.json',import.meta.url),'utf8'));
delete legacy.listOrder;
const base=validateContent(legacy);
assert.deepEqual(base.listOrder,{publications:'date',patents:'date',news:'date',people:'manual'});
assert.deepEqual(validateContent({...legacy,listOrder:{news:'manual'}}).listOrder,{publications:'date',patents:'date',news:'manual',people:'manual'});
assert.throws(()=>validateContent({...legacy,listOrder:{people:'date'}}),/List order/);

const ids=records=>records.map(record=>record.id);
const papers=Object.freeze([
  Object.freeze({id:'older',title:'Older selected paper',year:2023,selectedForPI:true}),
  Object.freeze({id:'newer',title:'Newer selected paper',year:2025,selectedForPI:true}),
  Object.freeze({id:'unselected',title:'Unselected newest paper',year:2026,selectedForPI:false}),
  Object.freeze({id:'same-year-later',title:'Later added selected paper',year:2025,selectedForPI:true}),
]);
const dates=Object.freeze([
  Object.freeze({id:'old',date:'2024-12-31'}),
  Object.freeze({id:'new',date:'2026-01-01'}),
  Object.freeze({id:'middle',date:'2025-09-13'}),
]);
assert.deepEqual(ids(orderRecords(papers,'publications')),['unselected','same-year-later','newer','older']);
assert.deepEqual(ids(orderRecords(papers,'publications','manual')),['older','newer','unselected','same-year-later']);
for(const section of ['patents','news']){
  assert.deepEqual(ids(orderRecords(dates,section)),['new','middle','old']);
  assert.deepEqual(ids(orderRecords(dates,section,'manual')),['old','new','middle']);
}
assert.deepEqual(ids(orderRecords(dates,'people')),['old','new','middle']);
assert.deepEqual(ids(papers),['older','newer','unselected','same-year-later']);
assert.deepEqual(ids(dates),['old','new','middle']);
assert.notStrictEqual(orderRecords(papers,'publications','manual'),papers);
assert.strictEqual(orderRecords(papers,'publications')[0],papers[2]);
assert.deepEqual(orderRecords([],'publications'),[]);

// A downloaded manual order must survive validation and the next editor import.
for(const section of ['publications','patents','news','people']){
  const draft=structuredClone(base),template=draft[section][0];
  assert.ok(template,`Missing ${section} schema fixture`);
  draft[section]=[
    {...template,id:'first',...(section==='publications'?{year:2023}:{date:'2023-01-01'})},
    {...template,id:'second',...(section==='publications'?{year:2026}:{date:'2026-01-01'})},
    {...template,id:'third',...(section==='publications'?{year:2025}:{date:'2025-01-01'})},
  ];
  draft.listOrder[section]='manual';
  const imported=validateContent(JSON.parse(JSON.stringify(validateContent(draft))));
  assert.equal(imported.listOrder[section],'manual');
  assert.deepEqual(ids(orderRecords(imported[section],section,imported.listOrder[section])),['first','second','third']);
  if(section!=='people')assert.deepEqual(ids(orderRecords(imported[section],section,'date')),['second','third','first']);
}

const previewContent={publications:papers,listOrder:{publications:'date'}};
assert.equal(liveCardData('professor',{}, {},previewContent).text,'Selected Publications\nLater added selected paper\nNewer selected paper\nOlder selected paper');
assert.equal(liveCardData('professor',{}, {},{...previewContent,listOrder:{publications:'manual'}}).text,'Selected Publications\nOlder selected paper\nNewer selected paper\nLater added selected paper');
assert.equal(liveCardData('professor',{}, {},{publications:papers}).text,liveCardData('professor',{}, {},previewContent).text);
assert.doesNotMatch(liveCardData('professor',{}, {},{publications:[]}).text,/Selected Publications/);
console.log('PASS: legacy defaults, date/manual order, immutable sorting, JSON persistence for four lists, and PI selected-publication preview order.');
