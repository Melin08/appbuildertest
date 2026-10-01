import React, { useState, useRef, useEffect } from 'react';
import {
  Shield, Moon, Sun, Download, Upload, Plus, FolderOpen,
  Camera, Eye, EyeOff, Dices, Trash2, Heart, Flame,
  Search, X, Sparkles, Wand2, ChevronDown, ExternalLink
} from 'lucide-react';
import { CharacterSheetData, RollLogEntry, WeaponItem, SpellItem, TraitItem, StatKey } from './types';
import {
  createDefaultCharacter,
  getModifier,
  getProfBonus,
  DND_CLASSES,
  DND_RACES_CATALOG,
  SKILL_DEFINITIONS,
  CONDITIONS_LIST,
  BUILTIN_SPELLS,
  BUILTIN_TRAITS
} from './constants';

const STORAGE_KEY = 'badman_char_roster_v2';
const ACTIVE_ID_KEY = 'badman_active_char_id_v2';

export default function App() {
  const [roster, setRoster] = useState<Record<string, CharacterSheetData>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    const def = createDefaultCharacter();
    return { [def.id]: def };
  });

  const [activeCharId, setActiveCharId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_ID_KEY);
      if (stored && roster[stored]) return stored;
    } catch {}
    return Object.keys(roster)[0] || 'default';
  });

  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'personality' | 'npcs'>('notes');
  const [hpModalOpen, setHpModalOpen] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [spellModalOpen, setSpellModalOpen] = useState(false);
  const [traitModalOpen, setTraitModalOpen] = useState(false);

  const [hpAmount, setHpAmount] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
  const [traitSearch, setTraitSearch] = useState('');
  const [filterSpellbook, setFilterSpellbook] = useState('');

  const [saveStatus, setSaveStatus] = useState('');
  const [rollHistory, setRollHistory] = useState<RollLogEntry[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const [apiSpells, setApiSpells] = useState<SpellItem[]>(BUILTIN_SPELLS);
  const [apiTraits, setApiTraits] = useState<TraitItem[]>(BUILTIN_TRAITS);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const char = roster[activeCharId] || Object.values(roster)[0] || createDefaultCharacter();

  const showToast = (text: string) => {
    setSaveStatus(text);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setSaveStatus(''), 2000);
  };

  const updateCharacter = (fields: Partial<CharacterSheetData>) => {
    setRoster(prev => {
      const current = prev[activeCharId] || createDefaultCharacter();
      const updated = { ...current, ...fields, updatedAt: Date.now() };
      const nextRoster = { ...prev, [activeCharId]: updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRoster));
      } catch {}
      return nextRoster;
    });
  };

  // Background fetch of D&D 5e SRD catalog
  useEffect(() => {
    fetch('https://www.dnd5eapi.co/api/spells')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.results) {
          const list: SpellItem[] = [...BUILTIN_SPELLS];
          data.results.forEach((s: any) => {
            if (!list.some(b => b.name.toLowerCase() === s.name.toLowerCase())) {
              list.push({
                id: s.index || s.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                name: s.name,
                levelTag: s.level === 0 ? 'Cantrip' : (s.level ? `Level ${s.level}` : 'Spell'),
                casting_time: '1 Action',
                range: '30 ft',
                duration: 'Instantaneous',
                desc: 'Click add to load SRD rules.'
              });
            }
          });
          setApiSpells(list);
        }
      })
      .catch(() => {});

    fetch('https://www.dnd5eapi.co/api/features')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.results) {
          const list: TraitItem[] = [...BUILTIN_TRAITS];
          data.results.forEach((f: any) => {
            if (!list.some(b => b.name.toLowerCase() === f.name.toLowerCase())) {
              list.push({
                id: f.index || f.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                name: f.name,
                type: 'Class Feature',
                desc: 'Official 5e SRD feature.'
              });
            }
          });
          setApiTraits(list);
        }
      })
      .catch(() => {});
  }, []);

  const profBonus = getProfBonus(char.level);
  const wisMod = getModifier(char.attr_wis);
  const percSkill = char.skills['perc'] || { prof: false, exp: false };
  const insSkill = char.skills['ins'] || { prof: false, exp: false };

  let percBonus = wisMod;
  if (percSkill.prof) percBonus += profBonus;
  if (percSkill.exp) percBonus += profBonus;

  let insBonus = wisMod;
  if (insSkill.prof) insBonus += profBonus;
  if (insSkill.exp) insBonus += profBonus;

  const abilityKey = (char.spellAbility || 'INT').toLowerCase();
  const spellAbilityScore = (char[`attr_${abilityKey}` as keyof CharacterSheetData] as number) || 10;
  const spellAbilityMod = getModifier(spellAbilityScore);
  const autoSaveDc = 8 + profBonus + spellAbilityMod;
  const autoAtkBonus = profBonus + spellAbilityMod;

  // Rest engines
  const handleShortRest = () => {
    if (char.hitDiceCur <= 0) {
      alert('You have no Hit Dice left to spend during a Short Rest!');
      return;
    }
    const conMod = getModifier(char.attr_con);
    const diceSides = char.hitDiceType === 'd12' ? 12 : char.hitDiceType === 'd10' ? 10 : char.hitDiceType === 'd6' ? 6 : 8;
    const roll = Math.floor(Math.random() * diceSides) + 1;
    const healed = Math.max(1, roll + conMod);
    const newHp = Math.min(char.maxHp, char.curHp + healed);

    updateCharacter({
      curHp: newHp,
      hitDiceCur: Math.max(0, char.hitDiceCur - 1)
    });

    const entry: RollLogEntry = {
      id: 'roll_' + Date.now(),
      desc: `Short Rest Hit Die (1${char.hitDiceType} + ${conMod})`,
      total: healed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setRollHistory(prev => [entry, ...prev.slice(0, 24)]);
    setLastRoll(healed);
    showToast(`Short Rest: Regained ${healed} HP!`);
  };

  const handleLongRest = () => {
    if (!confirm('Take a Long Rest? HP restores to maximum, spell slots refill, class points reset, and half total hit dice are recovered.')) return;
    const maxHd = char.hitDiceMax || 1;
    const regainedHd = Math.max(1, Math.floor(maxHd / 2));
    const newHd = Math.min(maxHd, char.hitDiceCur + regainedHd);

    const newSlots = { ...char.slots };
    Object.keys(newSlots).forEach(k => {
      const lvl = parseInt(k, 10);
      newSlots[lvl] = { ...newSlots[lvl], cur: newSlots[lvl].max };
    });

    updateCharacter({
      curHp: char.maxHp,
      tempHp: 0,
      deathSucc: 0,
      deathFail: 0,
      classPtsCur: char.classPtsMax,
      hitDiceCur: newHd,
      slots: newSlots
    });
    showToast('Long Rest Complete: Fully Restored!');
  };

  // Roll helper
  const handleRoll = (desc: string, bonus: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonus;
    const entry: RollLogEntry = {
      id: 'roll_' + Date.now(),
      desc: `${desc} (${d20} ${bonus >= 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`})`,
      total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setRollHistory(prev => [entry, ...prev.slice(0, 24)]);
    setLastRoll(total);
  };

  const handleQuickDice = (sides: number) => {
    const val = Math.floor(Math.random() * sides) + 1;
    const entry: RollLogEntry = {
      id: 'roll_' + Date.now(),
      desc: `1d${sides}`,
      total: val,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setRollHistory(prev => [entry, ...prev.slice(0, 24)]);
    setLastRoll(val);
  };

  // HP Adjustment
  const handleHpAdjustment = (action: 'damage' | 'heal' | 'temp') => {
    const amt = parseInt(hpAmount, 10);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid number greater than 0');

    let cur = char.curHp;
    let temp = char.tempHp;

    if (action === 'damage') {
      let dmgLeft = amt;
      if (temp > 0) {
        if (temp >= dmgLeft) {
          temp -= dmgLeft;
          dmgLeft = 0;
        } else {
          dmgLeft -= temp;
          temp = 0;
        }
      }
      cur = Math.max(0, cur - dmgLeft);
      updateCharacter({ curHp: cur, tempHp: temp });
      showToast(`Took ${amt} damage`);
    } else if (action === 'heal') {
      cur = Math.min(char.maxHp, cur + amt);
      updateCharacter({ curHp: cur });
      showToast(`Healed ${amt} HP`);
    } else if (action === 'temp') {
      temp = Math.max(temp, amt);
      updateCharacter({ tempHp: temp });
      showToast(`Set ${amt} Temp HP`);
    }
    setHpAmount('');
    setHpModalOpen(false);
  };

  // Avatar handler
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      updateCharacter({ avatar: evt.target?.result as string });
      showToast('Avatar updated!');
    };
    reader.readAsDataURL(file);
  };

  // Backup & Restore
  const handleBackup = () => {
    const blob = new Blob([JSON.stringify({ character: char, allRoster: roster }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(char.name || 'character').toLowerCase().replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.allRoster) {
          setRoster(parsed.allRoster);
          const keys = Object.keys(parsed.allRoster);
          if (keys.length > 0) setActiveCharId(keys[0]);
        } else if (parsed.character) {
          setRoster(prev => ({ ...prev, [parsed.character.id]: parsed.character }));
          setActiveCharId(parsed.character.id);
        }
        showToast('Sheet restored!');
      } catch {
        alert('Invalid JSON character sheet file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const stats: { key: StatKey; label: string; abbr: string; color: string; border: string; bg: string }[] = [
    { key: 'str', label: 'Strength', abbr: 'STR', color: 'text-red-400', border: 'border-l-red-500', bg: 'bg-red-500/10' },
    { key: 'dex', label: 'Dexterity', abbr: 'DEX', color: 'text-emerald-400', border: 'border-l-emerald-500', bg: 'bg-emerald-500/10' },
    { key: 'con', label: 'Constitution', abbr: 'CON', color: 'text-amber-400', border: 'border-l-amber-500', bg: 'bg-amber-500/10' },
    { key: 'int', label: 'Intelligence', abbr: 'INT', color: 'text-sky-400', border: 'border-l-sky-500', bg: 'bg-sky-500/10' },
    { key: 'wis', label: 'Wisdom', abbr: 'WIS', color: 'text-purple-400', border: 'border-l-purple-500', bg: 'bg-purple-500/10' },
    { key: 'cha', label: 'Charisma', abbr: 'CHA', color: 'text-yellow-400', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10' }
  ];

  const suffixes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  const allRaceOptions = DND_RACES_CATALOG.flatMap(r => [r.race, ...r.subraces]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* HTML Datalists for native browser autocompletion */}
      <datalist id="class-options">{DND_CLASSES.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="race-options">{allRaceOptions.map(r => <option key={r} value={r} />)}</datalist>

      {/* Top Utility Bar */}
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dnd-subtle pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-950/40">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                D&D 5e Character Sheet
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/40 font-mono font-semibold">
                  SRD 5.1
                </span>
              </h1>
              <p className="text-xs text-slate-400">Live stat tracker, interactive spellbook &amp; compendium</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {saveStatus && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full animate-pulse">
                {saveStatus}
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs bg-dnd-surface border border-dnd-border px-3 py-1.5 rounded-lg text-slate-300">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Compendiums:</span>
              <a href="https://dnd5e.wikidot.com/" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 flex items-center gap-0.5">
                Wikidot <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-600">/</span>
              <a href="https://roll20.net/compendium/dnd5e/Weapons#content" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 flex items-center gap-0.5">
                Weapons <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-dnd-surface/80 p-2.5 rounded-xl border border-dnd-border">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRosterModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-sm font-semibold text-slate-200 transition"
            >
              <FolderOpen className="h-4 w-4 text-red-400" />
              <span className="max-w-[140px] truncate">{char.name || 'Characters'}</span>
              <span className="text-[11px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">
                {Object.keys(roster).length}
              </span>
            </button>

            <button
              onClick={() => {
                const fresh = createDefaultCharacter();
                fresh.name = 'New Adventurer';
                setRoster(prev => ({ ...prev, [fresh.id]: fresh }));
                setActiveCharId(fresh.id);
                showToast('New character sheet created!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-sm font-semibold text-slate-300 transition"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>New</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShortRest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider transition"
            >
              <Sun className="h-4 w-4 text-amber-400" />
              Short Rest
            </button>

            <button
              onClick={handleLongRest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider transition"
            >
              <Moon className="h-4 w-4 text-emerald-400" />
              Long Rest
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackup}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-xs font-semibold text-slate-300 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </button>
            <button
              onClick={() => restoreFileRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-xs font-semibold text-slate-300 transition"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restore</span>
            </button>
            <input ref={restoreFileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </div>
        </div>
      </header>

      {/* Main Character Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-dnd-surface p-4 rounded-2xl border border-dnd-border">
        <div
          onClick={() => avatarInputRef.current?.click()}
          className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-dnd-card border-2 border-dnd-border hover:border-red-500 overflow-hidden cursor-pointer flex-shrink-0 group shadow-md"
          title="Click to change portrait"
        >
          {char.avatar ? (
            <img src={char.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-500 group-hover:text-red-400">
              <Camera className="h-7 w-7" />
            </div>
          )}
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
        </div>

        <div className="flex-1 w-full text-center sm:text-left">
          <input
            type="text"
            value={char.name}
            onChange={(e) => updateCharacter({ name: e.target.value })}
            placeholder="Character Name"
            className="text-2xl sm:text-3xl font-black text-white bg-transparent outline-none w-full border-b border-transparent focus:border-red-500 transition"
          />
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              {char.race || 'Race'} {char.charClass || 'Class'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono font-bold text-slate-400">
              Level {char.level}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dnd-border mb-6 gap-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-black uppercase tracking-wider transition ${
            activeTab === 'stats' ? 'bg-red-600 text-white shadow-md' : 'bg-dnd-surface text-slate-400 hover:text-white'
          }`}
        >
          Stats &amp; Combat
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-black uppercase tracking-wider transition ${
            activeTab === 'journal' ? 'bg-red-600 text-white shadow-md' : 'bg-dnd-surface text-slate-400 hover:text-white'
          }`}
        >
          Notes &amp; Lore
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-6">
          {/* Metadata Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Class */}
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Class</span>
              <input
                type="text"
                list="class-options"
                value={char.charClass}
                onChange={(e) => updateCharacter({ charClass: e.target.value })}
                className="w-full font-bold text-xs text-white bg-transparent outline-none"
              />
            </div>
            {/* Race */}
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Race</span>
              <input
                type="text"
                list="race-options"
                value={char.race}
                onChange={(e) => updateCharacter({ race: e.target.value })}
                className="w-full font-bold text-xs text-white bg-transparent outline-none"
              />
            </div>
            {/* Background */}
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Background</span>
              <input
                type="text"
                value={char.background}
                onChange={(e) => updateCharacter({ background: e.target.value })}
                className="w-full font-bold text-xs text-white bg-transparent outline-none"
              />
            </div>
            {/* Alignment */}
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Alignment</span>
              <input
                type="text"
                value={char.alignment}
                onChange={(e) => updateCharacter({ alignment: e.target.value })}
                className="w-full font-bold text-xs text-white bg-transparent outline-none"
              />
            </div>
            {/* Level */}
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Level (1-20)</span>
              <input
                type="number"
                min="1"
                max="20"
                value={char.level}
                onChange={(e) => updateCharacter({ level: parseInt(e.target.value, 10) || 1 })}
                className="w-full font-black text-sm text-red-400 bg-transparent outline-none text-center sm:text-left"
              />
            </div>
          </div>

          {/* Metadata Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">XP</span>
              <input
                type="text"
                value={char.exp}
                onChange={(e) => updateCharacter({ exp: e.target.value })}
                className="w-full font-bold text-xs text-white bg-transparent outline-none"
              />
            </div>
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Proficiency</span>
              <span className="font-mono font-black text-xs text-sky-400">+{profBonus}</span>
            </div>
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Inspiration</span>
              <input
                type="text"
                value={char.inspiration}
                onChange={(e) => updateCharacter({ inspiration: e.target.value })}
                className="w-full font-bold text-xs text-white bg-transparent outline-none"
              />
            </div>
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Speed</span>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="number"
                  value={char.speed}
                  onChange={(e) => updateCharacter({ speed: parseInt(e.target.value, 10) || 30 })}
                  className="w-8 text-center font-bold text-xs text-white bg-transparent outline-none"
                />
                <span className="text-[10px] text-slate-500">ft</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-dnd-input border border-dnd-border col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Hit Dice</span>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="number"
                  value={char.hitDiceCur}
                  onChange={(e) => updateCharacter({ hitDiceCur: parseInt(e.target.value, 10) || 0 })}
                  className="w-6 text-center font-black text-xs text-white bg-transparent outline-none"
                />
                <span className="text-slate-500">/</span>
                <input
                  type="number"
                  value={char.hitDiceMax}
                  onChange={(e) => updateCharacter({ hitDiceMax: parseInt(e.target.value, 10) || 1 })}
                  className="w-6 text-center font-bold text-xs text-slate-400 bg-transparent outline-none"
                />
                <input
                  type="text"
                  value={char.hitDiceType}
                  onChange={(e) => updateCharacter({ hitDiceType: e.target.value })}
                  placeholder="d8"
                  className="w-7 text-center font-mono font-bold text-[11px] text-red-400 bg-transparent outline-none ml-1"
                />
              </div>
            </div>
          </div>

          {/* Vitals HUD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-sky-500 shadow-md">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Defense</span>
                <h3 className="text-base font-black text-white">Armor Class</h3>
              </div>
              <input
                type="number"
                value={char.ac}
                onChange={(e) => updateCharacter({ ac: parseInt(e.target.value, 10) || 10 })}
                className="w-14 text-center text-2xl font-black text-white bg-dnd-input p-2 rounded-lg border border-dnd-border outline-none focus:text-sky-400"
              />
            </div>

            <div className="relative flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-red-500 shadow-md">
              <button
                onClick={() => setHpModalOpen(true)}
                className="absolute top-2.5 right-2.5 h-6 w-6 rounded bg-red-950/80 hover:bg-red-600 border border-red-700/60 text-red-300 hover:text-white flex items-center justify-center text-xs font-black transition"
                title="Quick Damage & Heal Calculator"
              >
                &plusmn;
              </button>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Health Pool</span>
                <h3 onClick={() => setHpModalOpen(true)} className="text-base font-black text-white cursor-pointer hover:text-red-400">
                  Hit Points
                </h3>
                <p className="text-xs text-slate-400">
                  {char.tempHp > 0 ? <span className="text-sky-400 font-bold">+{char.tempHp} Temp</span> : 'Current / Max'}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-dnd-input px-2.5 py-1.5 rounded-lg border border-dnd-border">
                <input
                  type="number"
                  value={char.curHp}
                  onChange={(e) => updateCharacter({ curHp: parseInt(e.target.value, 10) || 0 })}
                  className="w-10 text-center text-xl font-black text-red-400 bg-transparent outline-none"
                />
                <span className="text-slate-500 font-bold">/</span>
                <input
                  type="number"
                  value={char.maxHp}
                  onChange={(e) => updateCharacter({ maxHp: parseInt(e.target.value, 10) || 1 })}
                  className="w-10 text-center text-xl font-black text-slate-100 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-amber-500 shadow-md">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Mortality</span>
                <h3 className="text-base font-black text-white">Death Saves</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center bg-dnd-input px-2 py-1 rounded border border-dnd-border">
                  <span className="text-[9px] font-black text-emerald-400 uppercase">Succ</span>
                  <div className="flex gap-1 mt-0.5">
                    {[1, 2, 3].map(v => (
                      <button
                        key={v}
                        onClick={() => updateCharacter({ deathSucc: char.deathSucc === v ? v - 1 : v })}
                        className={`h-4 w-4 rounded-full border ${char.deathSucc >= v ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700 bg-slate-900/40'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center bg-dnd-input px-2 py-1 rounded border border-dnd-border">
                  <span className="text-[9px] font-black text-red-400 uppercase">Fail</span>
                  <div className="flex gap-1 mt-0.5">
                    {[1, 2, 3].map(v => (
                      <button
                        key={v}
                        onClick={() => updateCharacter({ deathFail: char.deathFail === v ? v - 1 : v })}
                        className={`h-4 w-4 rounded-full border ${char.deathFail >= v ? 'bg-red-500 border-red-400' : 'border-slate-700 bg-slate-900/40'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-purple-500 shadow-md">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Class Pool</span>
                <h3 className="text-base font-black text-white">Class Points</h3>
              </div>
              <div className="flex items-center gap-1 bg-dnd-input px-2.5 py-1.5 rounded-lg border border-dnd-border">
                <input
                  type="number"
                  value={char.classPtsCur}
                  onChange={(e) => updateCharacter({ classPtsCur: parseInt(e.target.value, 10) || 0 })}
                  className="w-8 text-center text-xl font-black text-purple-400 bg-transparent outline-none"
                />
                <span className="text-slate-500 font-bold">/</span>
                <input
                  type="number"
                  value={char.classPtsMax}
                  onChange={(e) => updateCharacter({ classPtsMax: parseInt(e.target.value, 10) || 0 })}
                  className="w-8 text-center text-xl font-black text-slate-100 bg-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Attributes vs Combat Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Attributes, Senses & Skills */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase mb-3 flex items-center justify-between">
                  <span>Attributes &amp; Saves</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">Prof Bonus: +{profBonus}</span>
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {stats.map(({ key, label, abbr, color, border, bg }) => {
                    const score = char[`attr_${key}` as keyof CharacterSheetData] as number || 10;
                    const mod = getModifier(score);
                    const isSaveChecked = char[`save_${key}` as keyof CharacterSheetData] as boolean;
                    const saveBonus = isSaveChecked ? mod + profBonus : mod;

                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-2.5 rounded-xl bg-dnd-card border border-dnd-border border-l-4 ${border}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16">
                            <span className={`text-sm font-black ${color}`}>{abbr}</span>
                            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">{label}</p>
                          </div>
                          <div className="flex items-center justify-center bg-dnd-input border border-dnd-border rounded-lg px-2 py-1 w-14">
                            <input
                              type="number"
                              value={score}
                              onChange={(e) => updateCharacter({ [`attr_${key}`]: parseInt(e.target.value, 10) || 10 })}
                              className="w-full text-center font-bold text-white bg-transparent outline-none text-base"
                            />
                          </div>
                          <div className={`flex items-center justify-center h-9 w-10 rounded-lg ${bg} border border-slate-700 font-black text-sm ${color}`}>
                            {mod >= 0 ? `+${mod}` : mod}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                            <input
                              type="checkbox"
                              checked={isSaveChecked}
                              onChange={(e) => updateCharacter({ [`save_${key}`]: e.target.checked })}
                              className="rounded accent-red-600 h-3.5 w-3.5"
                            />
                            Save
                          </label>
                          <span className="text-xs font-mono font-bold text-slate-200 w-7 text-right">
                            {saveBonus >= 0 ? `+${saveBonus}` : saveBonus}
                          </span>
                          <button
                            onClick={() => handleRoll(`${abbr} Save`, saveBonus)}
                            className="p-1 rounded bg-dnd-input hover:bg-red-600 hover:text-white text-slate-400 border border-dnd-border transition"
                            title={`Roll ${label} Save`}
                          >
                            <Dices className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Passive Senses */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-dnd-card border border-dnd-border text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Passive Perception</span>
                  <span className="text-2xl font-black text-white mt-0.5">{10 + percBonus}</span>
                  <span className="text-[10px] text-slate-500 font-mono">10 + Perception Mod</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-dnd-card border border-dnd-border text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Passive Insight</span>
                  <span className="text-2xl font-black text-white mt-0.5">{10 + insBonus}</span>
                  <span className="text-[10px] text-slate-500 font-mono">10 + Insight Mod</span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase mb-3 flex items-center justify-between">
                  <span>Skills</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">● Prof / ◆ Exp</span>
                </h2>
                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {SKILL_DEFINITIONS.map(({ id, name, stat }) => {
                    const skillData = char.skills[id] || { prof: false, exp: false };
                    const statScore = char[`attr_${stat}` as keyof CharacterSheetData] as number || 10;
                    const statMod = getModifier(statScore);

                    let totalBonus = statMod;
                    if (skillData.prof) totalBonus += profBonus;
                    if (skillData.exp) totalBonus += profBonus;

                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-dnd-card border border-dnd-border hover:border-slate-600 transition text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newProf = !skillData.prof;
                              updateCharacter({
                                skills: {
                                  ...char.skills,
                                  [id]: { prof: newProf, exp: newProf ? skillData.exp : false }
                                }
                              });
                            }}
                            className={`h-3.5 w-3.5 rounded-full border transition ${
                              skillData.prof ? 'bg-red-500 border-red-400 shadow-sm shadow-red-500/50' : 'border-slate-600 bg-slate-900/40'
                            }`}
                            title="Toggle Proficiency"
                          />
                          <button
                            onClick={() => {
                              const newExp = !skillData.exp;
                              updateCharacter({
                                skills: {
                                  ...char.skills,
                                  [id]: { prof: newExp ? true : skillData.prof, exp: newExp }
                                }
                              });
                            }}
                            className={`h-3.5 w-3.5 rotate-45 border transition ${
                              skillData.exp ? 'bg-purple-500 border-purple-400 shadow-sm shadow-purple-500/50' : 'border-slate-600 bg-slate-900/40'
                            }`}
                            title="Toggle Expertise"
                          />
                          <span className="font-semibold text-slate-200">{name}</span>
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-500">({stat.toUpperCase()})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white w-7 text-right">
                            {totalBonus >= 0 ? `+${totalBonus}` : totalBonus}
                          </span>
                          <button
                            onClick={() => handleRoll(name, totalBonus)}
                            className="p-1 rounded bg-dnd-input hover:bg-red-600 hover:text-white text-slate-400 border border-dnd-border transition"
                            title={`Roll ${name}`}
                          >
                            <Dices className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Dice Roller, Currency, Weapons, Conditions & Gear */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dice Roller */}
              <div className="p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Dice Roller</span>
                  {lastRoll !== null && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-3 py-1 rounded-lg font-black text-sm">
                      <span>Result:</span>
                      <span className="text-lg font-mono">{lastRoll}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[20, 12, 10, 8, 6, 4, 100].map(sides => (
                    <button
                      key={sides}
                      onClick={() => handleQuickDice(sides)}
                      className="flex-1 min-w-[48px] py-2 rounded-lg bg-dnd-input hover:bg-red-600 hover:text-white border border-dnd-border text-xs font-black text-slate-200 transition"
                    >
                      d{sides}
                    </button>
                  ))}
                </div>

                {rollHistory.length > 0 && (
                  <div className="pt-2 border-t border-dnd-subtle">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Rolls</span>
                    <div className="flex gap-2 overflow-x-auto py-1 text-xs">
                      {rollHistory.slice(0, 5).map(r => (
                        <div key={r.id} className="flex-shrink-0 bg-dnd-input px-2.5 py-1 rounded border border-dnd-border text-slate-300">
                          <span className="text-slate-400">{r.desc}:</span>{' '}
                          <span className="font-bold text-red-400">{r.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Currency */}
              <div className="grid grid-cols-4 gap-2 bg-dnd-card p-3 rounded-xl border border-dnd-border">
                {(['cp', 'sp', 'gp', 'pp'] as const).map(coin => (
                  <div key={coin} className="flex items-center gap-1.5 bg-dnd-input p-2 rounded-lg border border-dnd-border">
                    <span className="text-xs font-black uppercase text-amber-400">{coin}</span>
                    <input
                      type="number"
                      value={char[coin]}
                      onChange={(e) => updateCharacter({ [coin]: parseInt(e.target.value, 10) || 0 })}
                      className="w-full text-right font-bold text-sm bg-transparent outline-none text-white"
                    />
                  </div>
                ))}
              </div>

              {/* Weapons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-white tracking-wide uppercase">Weapons &amp; Attacks</h2>
                  <button
                    onClick={() => {
                      const newWpn: WeaponItem = {
                        id: 'w_' + Date.now(),
                        name: 'New Weapon',
                        atk: '+5',
                        dmg: '1d8+3',
                        notes: 'Slashing'
                      };
                      updateCharacter({ weapons: [...char.weapons, newWpn] });
                    }}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Weapon
                  </button>
                </div>

                <div className="space-y-2">
                  {char.weapons.map(wpn => (
                    <div key={wpn.id} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-dnd-card border border-dnd-border items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Weapon name"
                          value={wpn.name}
                          onChange={(e) => {
                            const updated = char.weapons.map(w => w.id === wpn.id ? { ...w, name: e.target.value } : w);
                            updateCharacter({ weapons: updated });
                          }}
                          className="w-full text-xs font-bold text-white bg-dnd-input px-2.5 py-1.5 rounded border border-dnd-border outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Atk"
                          value={wpn.atk}
                          onChange={(e) => {
                            const updated = char.weapons.map(w => w.id === wpn.id ? { ...w, atk: e.target.value } : w);
                            updateCharacter({ weapons: updated });
                          }}
                          className="w-full text-xs text-center font-bold text-sky-400 bg-dnd-input px-2 py-1.5 rounded border border-dnd-border outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Dmg"
                          value={wpn.dmg}
                          onChange={(e) => {
                            const updated = char.weapons.map(w => w.id === wpn.id ? { ...w, dmg: e.target.value } : w);
                            updateCharacter({ weapons: updated });
                          }}
                          className="w-full text-xs text-center font-bold text-red-400 bg-dnd-input px-2 py-1.5 rounded border border-dnd-border outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Notes"
                          value={wpn.notes}
                          onChange={(e) => {
                            const updated = char.weapons.map(w => w.id === wpn.id ? { ...w, notes: e.target.value } : w);
                            updateCharacter({ weapons: updated });
                          }}
                          className="w-full text-xs text-slate-300 bg-dnd-input px-2.5 py-1.5 rounded border border-dnd-border outline-none"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => updateCharacter({ weapons: char.weapons.filter(w => w.id !== wpn.id) })}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div className="p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">Conditions &amp; Exhaustion</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">Exhaustion:</span>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={char.exhaustion}
                      onChange={(e) => updateCharacter({ exhaustion: parseInt(e.target.value, 10) || 0 })}
                      className="w-10 text-center font-black text-sm bg-dnd-input border border-dnd-border rounded text-red-400 py-0.5 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CONDITIONS_LIST.map(c => {
                    const active = char.conditions.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          const next = active ? char.conditions.filter(item => item !== c) : [...char.conditions, c];
                          updateCharacter({ conditions: next });
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                          active ? 'bg-red-600 text-white shadow-sm' : 'bg-dnd-input text-slate-400 border border-dnd-border hover:border-slate-500'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proficiencies & Equipment */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Proficiencies, Languages &amp; Resistances
                  </label>
                  <textarea
                    rows={3}
                    value={char.otherProfs}
                    onChange={(e) => updateCharacter({ otherProfs: e.target.value })}
                    className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Equipment &amp; Inventory
                  </label>
                  <textarea
                    rows={4}
                    value={char.inventory}
                    onChange={(e) => updateCharacter({ inventory: e.target.value })}
                    className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500 resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Abilities & Features Section */}
          <div className="space-y-4 pt-6 border-t border-dnd-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-red-500" />
                  Abilities &amp; Traits
                </h2>
                <p className="text-xs text-slate-400">Class features, racial perks &amp; feats</p>
              </div>
              <button
                onClick={() => setTraitModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                <Plus className="h-4 w-4" />
                Add Ability
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {char.traits.map(t => (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3 ${
                    t.isExpanded ? 'md:col-span-2 border-red-500/60 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const updated = char.traits.map(item => item.id === t.id ? { ...item, name: e.target.value } : item);
                          updateCharacter({ traits: updated });
                        }}
                        className="font-black text-base text-white bg-transparent outline-none w-full"
                      />
                      <input
                        type="text"
                        value={t.type}
                        onChange={(e) => {
                          const updated = char.traits.map(item => item.id === t.id ? { ...item, type: e.target.value } : item);
                          updateCharacter({ traits: updated });
                        }}
                        className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded outline-none w-auto"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const updated = char.traits.map(item => item.id === t.id ? { ...item, isExpanded: !item.isExpanded } : item);
                          updateCharacter({ traits: updated });
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${t.isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => updateCharacter({ traits: char.traits.filter(item => item.id !== t.id) })}
                        className="p-1 rounded text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={t.isExpanded ? 6 : 2}
                    value={t.desc}
                    onChange={(e) => {
                      const updated = char.traits.map(item => item.id === t.id ? { ...item, desc: e.target.value } : item);
                      updateCharacter({ traits: updated });
                    }}
                    className="w-full text-xs text-slate-300 bg-dnd-input p-3 rounded-lg border border-dnd-border outline-none focus:border-red-500 resize-y leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Spellcasting Engine */}
          <div className="space-y-6 pt-6 border-t border-dnd-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-red-500" />
                  Spellcasting
                </h2>
                <p className="text-xs text-slate-400">Manage spell slots, Save DC &amp; spellbook</p>
              </div>
              <button
                onClick={() => setSpellModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                <Plus className="h-4 w-4" />
                Add Spell
              </button>
            </div>

            {/* Spellcasting Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-dnd-card p-4 rounded-xl border border-dnd-border">
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Ability</span>
                <input
                  type="text"
                  value={char.spellAbility}
                  onChange={(e) => updateCharacter({ spellAbility: e.target.value.toUpperCase() })}
                  className="w-16 mx-auto text-center font-black text-sm bg-dnd-input border border-dnd-border rounded py-1 text-white outline-none"
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Save DC</span>
                <div className="font-mono font-black text-base text-red-400 py-1">{autoSaveDc}</div>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Attack Bonus</span>
                <div className="font-mono font-black text-base text-sky-400 py-1">+{autoAtkBonus}</div>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Prepared</span>
                <div className="flex items-center justify-center gap-1 bg-dnd-input py-1 px-2 rounded border border-dnd-border">
                  <input
                    type="number"
                    value={char.preparedCur}
                    onChange={(e) => updateCharacter({ preparedCur: parseInt(e.target.value, 10) || 0 })}
                    className="w-7 text-center font-bold text-xs bg-transparent outline-none text-white"
                  />
                  <span className="text-slate-500 font-bold">/</span>
                  <input
                    type="number"
                    value={char.preparedMax}
                    onChange={(e) => updateCharacter({ preparedMax: parseInt(e.target.value, 10) || 0 })}
                    className="w-7 text-center font-bold text-xs bg-transparent outline-none text-slate-400"
                  />
                </div>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Concentration</span>
                <input
                  type="text"
                  value={char.concentration}
                  onChange={(e) => updateCharacter({ concentration: e.target.value })}
                  placeholder="None"
                  className="w-full text-center font-bold text-xs bg-dnd-input border border-dnd-border rounded py-1 text-emerald-400 outline-none"
                />
              </div>
            </div>

            {/* Interactive Spell Slots Grid */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                Spell Slots (Click pips to cast / recover)
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => {
                  const slot = char.slots[lvl] || { cur: 0, max: 0 };
                  return (
                    <div key={lvl} className="flex flex-col items-center justify-between p-2 rounded-xl bg-dnd-card border border-dnd-border min-h-[110px]">
                      <span className="text-[11px] font-black uppercase text-slate-400">{suffixes[lvl - 1]}</span>
                      <div className="flex flex-wrap items-center justify-center gap-1 my-2">
                        {slot.max === 0 ? (
                          <span className="text-[10px] text-slate-600 italic">No Slots</span>
                        ) : (
                          Array.from({ length: slot.max }).map((_, idx) => {
                            const isActive = idx < slot.cur;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  const newCur = idx < slot.cur ? idx : idx + 1;
                                  updateCharacter({ slots: { ...char.slots, [lvl]: { ...slot, cur: newCur } } });
                                }}
                                className={`h-3 w-3 rounded-full border transition transform active:scale-90 ${
                                  isActive ? 'bg-sky-400 border-sky-300 shadow-sm shadow-sky-400/60' : 'bg-slate-900 border-slate-700'
                                }`}
                                title={isActive ? 'Click to Cast' : 'Click to Recover'}
                              />
                            );
                          })
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 bg-dnd-input px-1.5 py-0.5 rounded border border-dnd-border text-xs">
                        <span className="font-bold text-sky-400">{slot.cur}</span>
                        <span className="text-slate-600">/</span>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={slot.max}
                          onChange={(e) => {
                            const maxVal = parseInt(e.target.value, 10) || 0;
                            updateCharacter({ slots: { ...char.slots, [lvl]: { cur: Math.min(slot.cur, maxVal), max: maxVal } } });
                          }}
                          className="w-4 text-center font-bold text-slate-300 bg-transparent outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spellbook */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter spellbook..."
                    value={filterSpellbook}
                    onChange={(e) => setFilterSpellbook(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-dnd-card rounded-lg border border-dnd-border text-white outline-none focus:border-red-500"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400">{char.spells.length} Spells</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {char.spells
                  .filter(s => s.name.toLowerCase().includes(filterSpellbook.toLowerCase()) || s.levelTag.toLowerCase().includes(filterSpellbook.toLowerCase()))
                  .map(s => (
                    <div key={s.id} className="p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => {
                            const updated = char.spells.map(item => item.id === s.id ? { ...item, name: e.target.value } : item);
                            updateCharacter({ spells: updated });
                          }}
                          className="font-black text-base text-white bg-transparent outline-none flex-1"
                        />
                        <button
                          onClick={() => updateCharacter({ spells: char.spells.filter(item => item.id !== s.id) })}
                          className="p-1 rounded text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <input
                          type="text"
                          value={s.levelTag}
                          onChange={(e) => {
                            const updated = char.spells.map(item => item.id === s.id ? { ...item, levelTag: e.target.value } : item);
                            updateCharacter({ spells: updated });
                          }}
                          className="text-center font-bold text-sky-400 bg-sky-950/40 border border-sky-800/40 py-1 rounded"
                        />
                        <input
                          type="text"
                          value={s.casting_time}
                          onChange={(e) => {
                            const updated = char.spells.map(item => item.id === s.id ? { ...item, casting_time: e.target.value } : item);
                            updateCharacter({ spells: updated });
                          }}
                          className="text-center font-bold text-slate-300 bg-dnd-input border border-dnd-border py-1 rounded"
                        />
                        <input
                          type="text"
                          value={s.range}
                          onChange={(e) => {
                            const updated = char.spells.map(item => item.id === s.id ? { ...item, range: e.target.value } : item);
                            updateCharacter({ spells: updated });
                          }}
                          className="text-center font-bold text-slate-300 bg-dnd-input border border-dnd-border py-1 rounded"
                        />
                        <input
                          type="text"
                          value={s.duration}
                          onChange={(e) => {
                            const updated = char.spells.map(item => item.id === s.id ? { ...item, duration: e.target.value } : item);
                            updateCharacter({ spells: updated });
                          }}
                          className="text-center font-bold text-slate-300 bg-dnd-input border border-dnd-border py-1 rounded"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={s.desc}
                        onChange={(e) => {
                          const updated = char.spells.map(item => item.id === s.id ? { ...item, desc: e.target.value } : item);
                          updateCharacter({ spells: updated });
                        }}
                        className="w-full text-xs text-slate-300 bg-dnd-input p-3 rounded-lg border border-dnd-border outline-none focus:border-red-500 resize-y"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Journal & Lore Tab */
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-dnd-border pb-3">
            {(['notes', 'personality', 'npcs'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeSubTab === tab ? 'bg-red-600 text-white shadow-sm' : 'bg-dnd-card text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'notes' && 'Campaign Log'}
                {tab === 'personality' && 'Personality & Backstory'}
                {tab === 'npcs' && 'NPCs & Factions'}
              </button>
            ))}
          </div>

          {activeSubTab === 'notes' && (
            <textarea
              rows={18}
              value={char.campaignNotes}
              onChange={(e) => updateCharacter({ campaignNotes: e.target.value })}
              placeholder="Session notes, quest objectives, monster weaknesses, loot..."
              className="w-full text-sm text-slate-200 bg-dnd-input p-4 rounded-xl border border-dnd-border outline-none focus:border-red-500 font-mono"
            />
          )}

          {activeSubTab === 'personality' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Personality Traits</label>
                  <textarea
                    rows={4}
                    value={char.personality}
                    onChange={(e) => updateCharacter({ personality: e.target.value })}
                    className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ideals</label>
                  <textarea
                    rows={4}
                    value={char.ideals}
                    onChange={(e) => updateCharacter({ ideals: e.target.value })}
                    className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bonds</label>
                  <textarea
                    rows={4}
                    value={char.bonds}
                    onChange={(e) => updateCharacter({ bonds: e.target.value })}
                    className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Flaws</label>
                  <textarea
                    rows={4}
                    value={char.flaws}
                    onChange={(e) => updateCharacter({ flaws: e.target.value })}
                    className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Character Backstory</label>
                <textarea
                  rows={8}
                  value={char.backstory}
                  onChange={(e) => updateCharacter({ backstory: e.target.value })}
                  placeholder="Origins, allies, family, background lore..."
                  className="w-full text-xs text-slate-200 bg-dnd-input p-4 rounded-xl border border-dnd-border outline-none focus:border-red-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'npcs' && (
            <textarea
              rows={18}
              value={char.npcList}
              onChange={(e) => updateCharacter({ npcList: e.target.value })}
              placeholder="NPC names, affiliations, attitudes, debts..."
              className="w-full text-sm text-slate-200 bg-dnd-input p-4 rounded-xl border border-dnd-border outline-none focus:border-red-500 font-mono"
            />
          )}
        </div>
      )}

      {/* HP Quick Calculator Modal */}
      {hpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-dnd-surface border border-dnd-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-dnd-border pb-3">
              <h3 className="text-lg font-black text-white">Adjust Hit Points</h3>
              <button onClick={() => setHpModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Current Status</span>
              <div className="text-2xl font-black text-white mt-1">
                <span className="text-red-400">{char.curHp}</span> / {char.maxHp}{' '}
                {char.tempHp > 0 && <span className="text-sm font-bold text-sky-400">(+{char.tempHp} Temp)</span>}
              </div>
            </div>
            <input
              type="number"
              min="1"
              placeholder="Amount..."
              value={hpAmount}
              autoFocus
              onChange={(e) => setHpAmount(e.target.value)}
              className="w-full text-center text-3xl font-black py-3 rounded-xl bg-dnd-input border border-dnd-border text-white focus:border-red-500 outline-none"
            />
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleHpAdjustment('damage')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-bold"
              >
                <Flame className="h-4 w-4" /> Apply Damage
              </button>
              <button
                onClick={() => handleHpAdjustment('heal')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-bold"
              >
                <Heart className="h-4 w-4" /> Heal Hit Points
              </button>
              <button
                onClick={() => handleHpAdjustment('temp')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-800 text-white font-bold"
              >
                <Shield className="h-4 w-4" /> Set Temporary HP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {rosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-dnd-surface border border-dnd-border overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-dnd-border bg-dnd-card">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-red-400" /> Character Roster
              </h3>
              <button onClick={() => setRosterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {Object.values(roster).map(c => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    c.id === activeCharId ? 'bg-red-950/40 border-red-500' : 'bg-dnd-card border-dnd-border'
                  }`}
                >
                  <div
                    onClick={() => {
                      setActiveCharId(c.id);
                      localStorage.setItem(ACTIVE_ID_KEY, c.id);
                      setRosterModalOpen(false);
                      showToast(`Loaded ${c.name}`);
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    <h4 className="font-black text-sm text-white">{c.name || 'Unnamed Character'}</h4>
                    <p className="text-xs text-slate-400">{c.charClass || 'No Class'} • Lvl {c.level} ({c.race})</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${c.name}"?`)) {
                        setRoster(prev => {
                          const next = { ...prev };
                          delete next[c.id];
                          const keys = Object.keys(next);
                          if (keys.length === 0) {
                            const fresh = createDefaultCharacter();
                            next[fresh.id] = fresh;
                            setActiveCharId(fresh.id);
                          } else if (activeCharId === c.id) {
                            setActiveCharId(keys[0]);
                          }
                          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
                          return next;
                        });
                      }
                    }}
                    className="p-1.5 rounded-lg bg-dnd-input hover:bg-red-600 text-slate-400 hover:text-white border border-dnd-border"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spell Compendium Modal */}
      {spellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-dnd-surface border border-dnd-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-dnd-border bg-dnd-card">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-red-400" /> 5e Spells Compendium
              </h3>
              <button onClick={() => setSpellModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-dnd-border bg-dnd-input flex gap-2">
              <input
                type="text"
                placeholder="Search spells (e.g. Fireball)..."
                value={spellSearch}
                onChange={(e) => setSpellSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-dnd-card rounded-lg border border-dnd-border text-white outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  const custom: SpellItem = {
                    id: 'sp_' + Date.now(),
                    name: 'New Custom Spell',
                    levelTag: 'Level 1',
                    casting_time: '1 Action',
                    range: '30 ft',
                    duration: 'Instant',
                    desc: 'Spell rules & dice damage...'
                  };
                  updateCharacter({ spells: [...char.spells, custom] });
                  setSpellModalOpen(false);
                }}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs whitespace-nowrap"
              >
                + Custom
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {apiSpells
                .filter(s => s.name.toLowerCase().includes(spellSearch.toLowerCase()))
                .slice(0, 40)
                .map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-dnd-card border border-dnd-border">
                    <div>
                      <h4 className="text-sm font-bold text-white">{s.name}</h4>
                      <span className="text-[10px] font-bold uppercase text-sky-400">{s.levelTag}</span>
                    </div>
                    <button
                      onClick={() => {
                        updateCharacter({ spells: [...char.spells, { ...s, id: 'sp_' + Date.now() }] });
                        setSpellModalOpen(false);
                        showToast(`Added ${s.name}`);
                      }}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Trait Compendium Modal */}
      {traitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-dnd-surface border border-dnd-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-dnd-border bg-dnd-card">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" /> 5e Features &amp; Abilities
              </h3>
              <button onClick={() => setTraitModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-dnd-border bg-dnd-input flex gap-2">
              <input
                type="text"
                placeholder="Search features (e.g. Action Surge)..."
                value={traitSearch}
                onChange={(e) => setTraitSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-dnd-card rounded-lg border border-dnd-border text-white outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  const custom: TraitItem = {
                    id: 'tr_' + Date.now(),
                    name: 'New Custom Ability',
                    type: 'Feature',
                    desc: 'Mechanics and usage details...'
                  };
                  updateCharacter({ traits: [...char.traits, custom] });
                  setTraitModalOpen(false);
                }}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs whitespace-nowrap"
              >
                + Custom
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {apiTraits
                .filter(t => t.name.toLowerCase().includes(traitSearch.toLowerCase()))
                .slice(0, 40)
                .map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-dnd-card border border-dnd-border">
                    <div>
                      <h4 className="text-sm font-bold text-white">{t.name}</h4>
                      <span className="text-[10px] font-bold uppercase text-emerald-400">{t.type}</span>
                    </div>
                    <button
                      onClick={() => {
                        updateCharacter({ traits: [...char.traits, { ...t, id: 'tr_' + Date.now() }] });
                        setTraitModalOpen(false);
                        showToast(`Added ${t.name}`);
                      }}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
