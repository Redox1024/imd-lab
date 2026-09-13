import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fields,newRecord,sections,validateContent} from '../dist/schema.js';
import {journalMetric} from '../dist/publication-data.js';

const contentFile=new URL('../dist/data/content.json',import.meta.url);
const original=await readFile(contentFile,'utf8');
const base=validateContent(JSON.parse(original));
const template={...base.publications[0],id:'manual-paper',title:'Manual paper',authors:'Alex Lee',venue:'Example Journal',year:2025,type:'저널',issn:'1234-567X',impactFactor:'',metricYear:'',metricSource:''};
const verified={id:'legacy-journal',name:'Example Journal',issn:'1234-567X',impactFactor:'7.2',metricYear:2024,metricSource:'https://example.org/metrics',metricUpdated:'2025-09-01',metricStatus:'확인됨',clarivateId:''};
const content=(paper, journals=[])=>({...structuredClone(base),publications:[{...template,...paper}],journals:structuredClone(journals)});
const roundtrip=value=>validateContent(JSON.parse(JSON.stringify(validateContent(value))));

assert.equal(Object.hasOwn(sections,'journals'),false);
assert.ok(fields.journals,'Legacy journal data remains readable');
assert.deepEqual(fields.publications[0].slice(0,4),['doi','DOI','text',false]);
const draft=newRecord('publications');
assert.equal(draft.year,'');
assert.equal(draft.metricYear,'');
assert.equal(draft.impactFactor,'');

for(const [value,expected] of [['12.5','12.5'],['0','0'],[0,'0'],['<0.1','<0.1']]){
  const result=roundtrip(content({impactFactor:value})).publications[0];
  assert.equal(result.impactFactor,expected);
  assert.equal(result.metricYear,'');
  assert.equal(result.metricSource,'');
  assert.deepEqual(journalMetric(result),{label:'IF '+expected,source:'',updated:'',status:'manual',verified:false});
}
const withSource=roundtrip(content({impactFactor:'12.5',metricYear:2025,metricSource:'https://example.org/if'}));
assert.equal(journalMetric(withSource.publications[0]).label,'IF 12.5 · 2025');
assert.equal(journalMetric(withSource.publications[0]).source,'https://example.org/if');
assert.equal(journalMetric(withSource.publications[0]).verified,false);
for(const value of ['-1','unknown','NaN','Infinity','1.2.3'])assert.throws(()=>validateContent(content({impactFactor:value})),/IF must be/);

const legacy=content({venue:'Example J. Abbreviation'},[verified]);
delete legacy.publications[0].impactFactor;
const before=structuredClone(legacy);
const migrated=validateContent(legacy);
assert.deepEqual(legacy,before,'Migration must not mutate the uploaded content');
assert.equal(migrated.publications[0].impactFactor,'7.2','ISSN matching preserves existing verified IF');
assert.equal(migrated.publications[0].metricYear,2024);
assert.equal(migrated.publications[0].metricSource,verified.metricSource);
assert.equal(journalMetric(migrated.publications[0]).status,'manual');
migrated.journals[0].impactFactor='99';
assert.equal(roundtrip(migrated).publications[0].impactFactor,'7.2','Legacy changes never overwrite an existing paper IF');
migrated.publications[0].impactFactor='';
const cleared=roundtrip(migrated);
assert.equal(cleared.publications[0].impactFactor,'');
assert.equal(journalMetric(cleared.publications[0],cleared.journals).label,'IF —','Clearing must not fall back to the legacy IF');
assert.deepEqual(roundtrip(cleared),cleared,'Repeated downloads preserve an explicit empty IF');
assert.equal(roundtrip(content({impactFactor:null},[verified])).publications[0].impactFactor,'');

const byName=content({issn:'',venue:'EXAMPLE JOURNAL'},[verified]);
delete byName.publications[0].impactFactor;
assert.equal(validateContent(byName).publications[0].impactFactor,'7.2');
for(const status of ['미연동','미제공','보류','제외']){
  const unknown=content({},[{...verified,metricStatus:status}]);
  delete unknown.publications[0].impactFactor;
  const result=roundtrip(unknown).publications[0];
  assert.equal(result.impactFactor,'');
  assert.equal(journalMetric(result).label,'IF —','Unverified legacy values stay unknown');
}
const separate=content({impactFactor:'4.1'},[verified]);
separate.publications.push({...template,id:'second-paper',impactFactor:'8.2'});
assert.deepEqual(roundtrip(separate).publications.map(p=>p.impactFactor),['4.1','8.2'],'Each paper owns its IF');

for(const doi of ['10.1002/smll.202407882','https://doi.org/10.1002/smll.202407882','incorrect DOI','']){
  assert.equal(roundtrip(content({doi})).publications[0].doi,doi,'Lookup failure does not block manual bibliography entry');
}
for(const pdf of ['paper.pdf','/Users/person/Downloads/paper.pdf','file:///tmp/paper.pdf','javascript:alert(1)','']){
  assert.equal(roundtrip(content({pdf})).publications[0].pdf,'','Obsolete local PDF values must not block editing');
}
assert.equal(roundtrip(content({pdf:'https://example.org/paper.pdf'})).publications[0].pdf,'https://example.org/paper.pdf');

const output=execFileSync(process.execPath,[fileURLToPath(new URL('refresh-jif.mjs',import.meta.url))],{encoding:'utf8',timeout:5000,env:{...process.env,CLARIVATE_API_KEY:'test-key-must-not-be-used',JCR_PUBLIC_DISPLAY_AUTHORIZED:'true'}});
assert.match(output,/Automatic IF refresh is disabled/);
assert.equal(await readFile(contentFile,'utf8'),original,'Even configured scheduled refresh must not change content.json');
console.log('PASS: manual IF, zero/<0.1, optional provenance, one-time verified migration, clearing, per-paper persistence, DOI/manual entry, legacy PDF compatibility, blank new years, and disabled automatic refresh.');
