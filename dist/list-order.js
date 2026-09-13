// Shared by the public website and content editor. Never mutate the source list.
export const defaultListOrder = {publications:'date',patents:'date',news:'date',people:'manual'};

export function normalizeListOrder(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('List order: Invalid settings.');
  return Object.fromEntries(Object.entries(defaultListOrder).map(([section, fallback]) => {
    const mode = value[section] ?? fallback;
    if (!['date','manual'].includes(mode) || (section === 'people' && mode !== 'manual')) throw new Error('List order: Choose newest first or manual order.');
    return [section, mode];
  }));
}

export function orderRecords(records, section, mode = defaultListOrder[section]) {
  const copy = [...records];
  if (mode !== 'date') return copy;
  if (section === 'publications') return copy.map((record,index)=>({record,index})).sort((a,b)=>Number(b.record.year)-Number(a.record.year)||b.index-a.index).map(({record})=>record);
  if (section === 'patents' || section === 'news') return copy.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  return copy;
}
