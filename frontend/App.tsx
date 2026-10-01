import React, { useState, useRef } from 'react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { CharacterSheetData, RollLogEntry } from './types';
import {
  createDefaultCharacter,
  getModifier,
  getProfBonus,
  DND_CLASSES,
  DND_RACES_CATALOG
} from './constants';
import { Header } from './components/Header';
import { VitalsHUD } from './components/VitalsHUD';
import { HpModal } from './components/HpModal';
import { AttributesAndSkills } from './components/AttributesAndSkills';
import { CombatAndWeapons } from './components/CombatAndWeapons';
import { AbilitiesSection } from './components/AbilitiesSection';
import { SpellsSection } from './components/SpellsSection';
import { JournalTab } from './components/JournalTab';
import { RosterModal } from './components/RosterModal';

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
  const [hpModalOpen, setHpModalOpen] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [rollHistory, setRollHistory] = useState<RollLogEntry[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const char = roster[activeCharId] || Object.values(roster)[0] || createDefaultCharacter();

  const showToast = (text: string) => {
    setSaveStatus(text);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setSaveStatus(''), 2200);
  };

  // Sync updates to state and localStorage
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

  const handleSelectCharacter = (id: string) => {
    if (roster[id]) {
      setActiveCharId(id);
      localStorage.setItem(ACTIVE_ID_KEY, id);
      showToast(`Loaded ${roster[id].name || 'Character'}`);
    }
  };

  const handleNewCharacter = () => {
    const fresh = createDefaultCharacter();
    fresh.id = 'char_' + Date.now();
    fresh.name = 'New Adventurer';
    setRoster(prev => {
      const next = { ...prev, [fresh.id]: fresh };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(ACTIVE_ID_KEY, fresh.id);
      } catch {}
      return next;
    });
    setActiveCharId(fresh.id);
    showToast('New Sheet Created!');
  };

  const handleDeleteCharacter = (id: string) => {
    setRoster(prev => {
      const next = { ...prev };
      delete next[id];
      const remainingKeys = Object.keys(next);
      if (remainingKeys.length === 0) {
        const fresh = createDefaultCharacter();
        next[fresh.id] = fresh;
        setActiveCharId(fresh.id);
      } else if (activeCharId === id) {
        setActiveCharId(remainingKeys[0]);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast('Character Deleted');
  };

  // Rest Handlers
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
    if (!confirm('Take a Long Rest? This will restore HP to max, refill all spell slots, reset death saves, and restore up to half your total Hit Dice.')) return;

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

  // Roll Handler
  const handleRoll = (desc: string, bonus: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonus;
    const formula = `${desc} (${d20} ${bonus >= 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`})`;
    const entry: RollLogEntry = {
      id: 'roll_' + Date.now(),
      desc: formula,
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

  // Avatar upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      updateCharacter({ avatar: res });
      showToast('Avatar updated!');
    };
    reader.readAsDataURL(file);
  };

  // Backup & Restore
  const handleBackup = () => {
    const blob = new Blob([JSON.stringify({ character: char, allRoster: roster }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(char.name || 'character').toLowerCase().replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  };

  const handleRestore = (parsed: any) => {
    if (parsed.allRoster) {
      setRoster(parsed.allRoster);
      const keys = Object.keys(parsed.allRoster);
      if (keys.length > 0) setActiveCharId(keys[0]);
    } else if (parsed.character) {
      setRoster(prev => ({ ...prev, [parsed.character.id]: parsed.character }));
      setActiveCharId(parsed.character.id);
    }
    showToast('Character restored from file!');
  };

  const handleToggleBlur = (fieldId: string) => {
    const blurred = char.blurredPills || [];
    const next = blurred.includes(fieldId)
      ? blurred.filter(f => f !== fieldId)
      : [...blurred, fieldId];
    updateCharacter({ blurredPills: next });
  };

  const profBonus = getProfBonus(char.level);

  // Flatten races for datalist
  const allRaceOptions = DND_RACES_CATALOG.flatMap(r => [r.race, ...r.subraces]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* HTML Datalists for instant auto-complete suggestions */}
      <datalist id="class-options">
        {DND_CLASSES.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="race-options">
        {allRaceOptions.map(r => <option key={r} value={r} />)}
      </datalist>

      <Header
        char={char}
        roster={roster}
        onSelectCharacter={handleSelectCharacter}
        onNewCharacter={handleNewCharacter}
        onShortRest={handleShortRest}
        onLongRest={handleLongRest}
        onBackup={handleBackup}
        onRestore={handleRestore}
        onOpenRoster={() => setRosterModalOpen(true)}
        saveStatusText={saveStatus}
      />

      {/* Main Character Info Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-dnd-surface p-4 rounded-2xl border border-dnd-border">
        {/* Avatar Frame */}
        <div
          onClick={() => avatarInputRef.current?.click()}
          className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-dnd-card border-2 border-dnd-border hover:border-red-500 overflow-hidden cursor-pointer flex-shrink-0 group shadow-md"
          title="Click to upload character portrait"
        >
          {char.avatar ? (
            <img src={char.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-500 group-hover:text-red-400">
              <Camera className="h-7 w-7" />
            </div>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFile}
          />
        </div>

        {/* Name & Title */}
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

      {/* Tab Switcher */}
      <div className="flex border-b border-dnd-border mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-black uppercase tracking-wider transition ${
            activeTab === 'stats'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-dnd-surface text-slate-400 hover:text-white'
          }`}
        >
          Stats &amp; Combat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-black uppercase tracking-wider transition ${
            activeTab === 'journal'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-dnd-surface text-slate-400 hover:text-white'
          }`}
        >
          Notes &amp; Lore
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div>
          {/* Metadata Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
            {/* Class */}
            <div className="relative flex items-center justify-between p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <div className="w-full">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Class</span>
                <input
                  type="text"
                  list="class-options"
                  value={char.charClass}
                  onChange={(e) => updateCharacter({ charClass: e.target.value })}
                  placeholder="e.g. Wizard"
                  className={`w-full font-bold text-xs text-white bg-transparent outline-none ${
                    char.blurredPills?.includes('class') ? 'blur-sm select-none' : ''
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleToggleBlur('class')}
                className="text-slate-600 hover:text-red-400 ml-1"
                title="Toggle privacy blur"
              >
                {char.blurredPills?.includes('class') ? <EyeOff className="h-3.5 w-3.5 text-red-500" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Race */}
            <div className="relative flex items-center justify-between p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <div className="w-full">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Race</span>
                <input
                  type="text"
                  list="race-options"
                  value={char.race}
                  onChange={(e) => updateCharacter({ race: e.target.value })}
                  placeholder="e.g. Elf"
                  className={`w-full font-bold text-xs text-white bg-transparent outline-none ${
                    char.blurredPills?.includes('race') ? 'blur-sm select-none' : ''
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleToggleBlur('race')}
                className="text-slate-600 hover:text-red-400 ml-1"
              >
                {char.blurredPills?.includes('race') ? <EyeOff className="h-3.5 w-3.5 text-red-500" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Background */}
            <div className="relative flex items-center justify-between p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <div className="w-full">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Background</span>
                <input
                  type="text"
                  value={char.background}
                  onChange={(e) => updateCharacter({ background: e.target.value })}
                  placeholder="e.g. Sage"
                  className={`w-full font-bold text-xs text-white bg-transparent outline-none ${
                    char.blurredPills?.includes('bg') ? 'blur-sm select-none' : ''
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleToggleBlur('bg')}
                className="text-slate-600 hover:text-red-400 ml-1"
              >
                {char.blurredPills?.includes('bg') ? <EyeOff className="h-3.5 w-3.5 text-red-500" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Alignment */}
            <div className="relative flex items-center justify-between p-2 rounded-xl bg-dnd-input border border-dnd-border">
              <div className="w-full">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-tight">Alignment</span>
                <input
                  type="text"
                  value={char.alignment}
                  onChange={(e) => updateCharacter({ alignment: e.target.value })}
                  placeholder="e.g. Chaotic Good"
                  className={`w-full font-bold text-xs text-white bg-transparent outline-none ${
                    char.blurredPills?.includes('align') ? 'blur-sm select-none' : ''
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleToggleBlur('align')}
                className="text-slate-600 hover:text-red-400 ml-1"
              >
                {char.blurredPills?.includes('align') ? <EyeOff className="h-3.5 w-3.5 text-red-500" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Level */}
            <div className="relative flex items-center justify-between p-2 rounded-xl bg-dnd-input border border-dnd-border col-span-2 sm:col-span-1">
              <div className="w-full">
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
          </div>

          {/* Metadata Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
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
          <VitalsHUD
            char={char}
            onChange={updateCharacter}
            onOpenHpModal={() => setHpModalOpen(true)}
          />

          {/* Attributes vs Combat split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <AttributesAndSkills
                char={char}
                onChange={updateCharacter}
                onRoll={handleRoll}
              />
            </div>

            <div className="lg:col-span-7">
              <CombatAndWeapons
                char={char}
                onChange={updateCharacter}
                rollHistory={rollHistory}
                onQuickDice={handleQuickDice}
                lastRoll={lastRoll}
              />
            </div>
          </div>

          {/* Abilities & Features */}
          <AbilitiesSection
            char={char}
            onChange={updateCharacter}
          />

          {/* Spellcasting Engine */}
          <SpellsSection
            char={char}
            onChange={updateCharacter}
          />
        </div>
      ) : (
        <JournalTab
          char={char}
          onChange={updateCharacter}
        />
      )}

      {/* HP Math Modal */}
      <HpModal
        isOpen={hpModalOpen}
        onClose={() => setHpModalOpen(false)}
        char={char}
        onApply={(fields, msg) => {
          updateCharacter(fields);
          showToast(msg);
        }}
      />

      {/* Character Roster Switcher Modal */}
      <RosterModal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        roster={roster}
        activeId={activeCharId}
        onSelect={handleSelectCharacter}
        onDelete={handleDeleteCharacter}
        onNew={handleNewCharacter}
      />
    </div>
  );
}
