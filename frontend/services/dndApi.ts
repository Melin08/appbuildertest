import { BUILTIN_SPELLS, BUILTIN_TRAITS } from '../constants';
import { SpellItem, TraitItem } from '../types';

const apiCache: Record<string, any> = {};

export async function fetchWithTimeout(url: string, timeout = 3500): Promise<any> {
  if (apiCache[url]) return apiCache[url];
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const data = await res.json();
    apiCache[url] = data;
    return data;
  } catch {
    return null;
  }
}

let cachedSpells: SpellItem[] = [];
let cachedTraits: TraitItem[] = [];

export async function searchAllSpells(): Promise<SpellItem[]> {
  if (cachedSpells.length > 0) return cachedSpells;

  const data = await fetchWithTimeout('https://www.dnd5eapi.co/api/spells');
  if (data && data.results) {
    const list: SpellItem[] = [...BUILTIN_SPELLS];
    data.results.forEach((s: any) => {
      if (!list.some(item => item.name.toLowerCase() === s.name.toLowerCase())) {
        list.push({
          id: s.index || s.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: s.name,
          levelTag: s.level === 0 ? 'Cantrip' : (s.level ? `Level ${s.level}` : 'Spell'),
          casting_time: '1 Action',
          range: '30 ft',
          duration: 'Instantaneous',
          desc: 'Loading details...',
          schoolTag: 'Magic'
        });
      }
    });
    cachedSpells = list;
    return list;
  }

  cachedSpells = [...BUILTIN_SPELLS];
  return cachedSpells;
}

export async function fetchSpellDetails(spellName: string): Promise<Partial<SpellItem> | null> {
  const key = spellName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const data = await fetchWithTimeout(`https://www.dnd5eapi.co/api/spells/${key}`);
  if (!data) return null;

  return {
    name: data.name,
    levelTag: data.level === 0 ? 'Cantrip' : `Level ${data.level}`,
    schoolTag: data.school?.name || '',
    classesTag: (data.classes || []).map((c: any) => c.name).join(', '),
    casting_time: data.casting_time || '1 Action',
    range: data.range || '30 ft',
    duration: data.duration || 'Instantaneous',
    desc: Array.isArray(data.desc) ? data.desc.join('\n\n') : (data.desc || '')
  };
}

export async function searchAllTraits(): Promise<TraitItem[]> {
  if (cachedTraits.length > 0) return cachedTraits;

  const [featData, traitData] = await Promise.all([
    fetchWithTimeout('https://www.dnd5eapi.co/api/features'),
    fetchWithTimeout('https://www.dnd5eapi.co/api/traits')
  ]);

  const list: TraitItem[] = [...BUILTIN_TRAITS];

  if (featData && featData.results) {
    featData.results.forEach((f: any) => {
      if (!list.some(item => item.name.toLowerCase() === f.name.toLowerCase())) {
        list.push({
          id: f.index || f.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: f.name,
          type: 'Class Feature',
          desc: 'Click add to load detailed mechanics.'
        });
      }
    });
  }

  if (traitData && traitData.results) {
    traitData.results.forEach((t: any) => {
      if (!list.some(item => item.name.toLowerCase() === t.name.toLowerCase())) {
        list.push({
          id: t.index || t.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: t.name,
          type: 'Racial Trait',
          desc: 'Click add to load detailed mechanics.'
        });
      }
    });
  }

  cachedTraits = list;
  return list;
}

export async function fetchTraitDetails(traitName: string, type: string): Promise<string | null> {
  const key = traitName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const endpoint = type.includes('Race') ? 'traits' : 'features';
  const data = await fetchWithTimeout(`https://www.dnd5eapi.co/api/${endpoint}/${key}`);
  if (!data) return null;
  return Array.isArray(data.desc) ? data.desc.join('\n\n') : (data.desc || '');
}
