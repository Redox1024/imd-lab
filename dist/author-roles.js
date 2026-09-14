// Roles are attached to a name and its zero-based occurrence, never its position.
// Enter full names separated by commas, or use semicolons / one name per line
// when an individual name contains a comma. All annotations are optional.
const roleKeys=['first','corresponding','bold'];
const normalizeName=value=>value.normalize('NFKC').replace(/\s+/gu,' ').trim();
const identity=entry=>JSON.stringify([entry.name,entry.occurrence]);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function namesFromText(authors){
 if(authors===undefined||authors===null||authors==='')return [];
 if(typeof authors!=='string')throw new TypeError('Authors: Enter the full author list as text.');
 const counts=new Map(),separator=/[;\r\n]/.test(authors)?/[;\r\n]+/:/,/;
 return authors.split(separator).map(normalizeName).filter(Boolean).map(name=>{
  const occurrence=counts.get(name)||0;counts.set(name,occurrence+1);
  return {name,occurrence};
 });
}

export function normalizeAuthorRoles(value,authors){
 if(value===undefined||value===null||value==='')return [];
 if(!Array.isArray(value)||value.length>5000)throw new TypeError('Author roles: Use an array with no more than 5,000 entries.');
 const names=namesFromText(authors),available=new Set(names.map(identity)),selected=new Map();
 for(const role of value){
  if(!role||typeof role!=='object'||Array.isArray(role))throw new TypeError('Author roles: Each entry must be an object.');
  if(typeof role.name!=='string'||role.name.length>30000||!normalizeName(role.name))throw new TypeError('Author roles: Each entry needs a valid author name.');
  if(!Number.isSafeInteger(role.occurrence)||role.occurrence<0||role.occurrence>4999)throw new TypeError('Author roles: The author occurrence must be a non-negative integer below 5,000.');
  const clean={name:normalizeName(role.name),occurrence:role.occurrence};
  for(const key of roleKeys){
   if(role[key]!==undefined&&typeof role[key]!=='boolean')throw new TypeError('Author roles: '+key+' must be true or false.');
   clean[key]=role[key]??false;
  }
  const key=identity(clean);
  if(!available.has(key)||!roleKeys.some(roleKey=>clean[roleKey]))continue;
  if(selected.has(key))throw new TypeError('Author roles: The same author occurrence is listed more than once.');
  selected.set(key,clean);
 }
 return names.map(name=>selected.get(identity(name))).filter(Boolean);
}

export function authorEntries(paper){
 const roles=new Map(normalizeAuthorRoles(paper?.authorRoles,paper?.authors).map(role=>[identity(role),role]));
 return namesFromText(paper?.authors).map(entry=>({...entry,first:false,corresponding:false,bold:false,...roles.get(identity(entry))}));
}

export function updateAuthorRole(paper,index,role,checked){
 if(!roleKeys.includes(role))throw new TypeError('Author roles: Choose first, corresponding or bold.');
 if(typeof checked!=='boolean')throw new TypeError('Author roles: A checkbox value is required.');
 const entries=authorEntries(paper);
 if(!Number.isInteger(index)||index<0||index>=entries.length)throw new RangeError('Author roles: Choose an author from the current list.');
 entries[index]={...entries[index],[role]:checked};
 return normalizeAuthorRoles(entries,paper.authors);
}

export function renderAuthors(paper){
 return authorEntries(paper).map(author=>{
  let name=escapeHTML(author.name);
  if(author.bold)name='<strong>'+name+'</strong>';
  const markers=(author.first?'†':'')+(author.corresponding?'*':'');
  const labels=[author.first?'First / co-first author':'',author.corresponding?'Corresponding author':''].filter(Boolean).join('; ');
  return '<span class="paper-author">'+name+(markers?'<sup aria-label="'+labels+'">'+markers+'</sup>':'')+'</span>';
 }).join(', ');
}

export function authorLegend(paper){
 const entries=authorEntries(paper),labels=[];
 if(entries.some(author=>author.first))labels.push('† First / co-first author');
 if(entries.some(author=>author.corresponding))labels.push('* Corresponding author');
 return labels.join(' · ');
}
