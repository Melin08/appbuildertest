import React, { useState } from 'react';
import { Plus, Trash2, Wand2, Search, X } from 'lucide-react';
import { CharacterSheetData, SpellItem } from '../types';
import { searchAllSpells, fetchSpellDetails } from '../services/dndApi';
import { getModifier, getProfBonus } from '../constants';

interface SpellsSectionProps {
  char: CharacterSheetData;
  onChange: (fields: Partial<CharacterSheetData>) => void;
}

export const SpellsSection: React.FC<SpellsSectionProps> = ({ char, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [compendiumList, setCompendiumList] = useState<SpellItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpellbook, setFilterSpellbook] = useState('');
  const [loading, setLoading] = useState(false);

  const profBonus = getProfBonus(char.level);
  const abilityKey = (char.spellAbility || 'INT').toLowerCase();
  const abilityScore = (char[`attr_${abilityKey}` as keyof CharacterSheetData] as number) || 10;
  const abilityMod = getModifier(abilityScore);

  const autoSaveDc = 8 + profBonus + abilityMod;
  const autoAtkBonus = profBonus + abilityMod;

  const handleOpenModal = async () => {
    setModalOpen(true);
    setLoading(true);
    const data = await searchAllSpells();
    setCompendiumList(data);
    setLoading(false);
  };

  const handleAddCustom = () => {
    const newSpell: SpellItem = {
      id: 'spell_' + Date.now(),
      name: 'New Spell',
      levelTag: 'Level 1',
      schoolTag: 'Evocation',
      casting_time: '1 Action',
      range: '60 ft',
      duration: 'Instantaneous',
      desc: 'Spell rules, dice damage, components, and spell effects...'
    };
    onChange({ spells: [...char.spells, newSpell] });
    setModalOpen(false);
  };

  const handleSelectSpell = async (s: SpellItem) => {
    let detail = s;
    if (s.desc === 'Loading details...') {
      const fetched = await fetchSpellDetails(s.name);
      if (fetched) {
        detail = { ...s, ...fetched };
      }
    }

    const newSpell: SpellItem = {
      id: 'spell_' + Date.now(),
      name: detail.name,
      levelTag: detail.levelTag || 'Spell',
      schoolTag: detail.schoolTag || 'Magic',
      casting_time: detail.casting_time || '1 Action',
      range: detail.range || '30 ft',
      duration: detail.duration || 'Instantaneous',
      desc: detail.desc || ''
    };

    onChange({ spells: [...char.spells, newSpell] });
    setModalOpen(false);
  };

  const handleTogglePip = (level: number, pipIdx: number) => {
    const slot = char.slots[level] || { cur: 0, max: 0 };
    let newCur = slot.cur;
    if (pipIdx < slot.cur) {
      newCur = pipIdx; // Spend
    } else {
      newCur = pipIdx + 1; // Restore
    }

    onChange({
      slots: {
        ...char.slots,
        [level]: { ...slot, cur: newCur }
      }
    });
  };

  const handleUpdateSlotMax = (level: number, maxVal: number) => {
    const slot = char.slots[level] || { cur: 0, max: 0 };
    onChange({
      slots: {
        ...char.slots,
        [level]: { cur: Math.min(slot.cur, maxVal), max: maxVal }
      }
    });
  };

  const handleUpdateSpell = (id: string, prop: keyof SpellItem, val: string) => {
    const updated = char.spells.map(s => s.id === id ? { ...s, [prop]: val } : s);
    onChange({ spells: updated });
  };

  const handleDeleteSpell = (id: string) => {
    onChange({ spells: char.spells.filter(s => s.id !== id) });
  };

  const suffixes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  const filteredSpells = char.spells.filter(s =>
    s.name.toLowerCase().includes(filterSpellbook.toLowerCase()) ||
    s.levelTag.toLowerCase().includes(filterSpellbook.toLowerCase())
  );

  return (
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
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Spell
        </button>
      </div>

      {/* Spellcasting Basics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-dnd-card p-4 rounded-xl border border-dnd-border">
        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Ability</span>
          <input
            type="text"
            value={char.spellAbility}
            onChange={(e) => onChange({ spellAbility: e.target.value.toUpperCase() })}
            className="w-16 mx-auto text-center font-black text-sm bg-dnd-input border border-dnd-border rounded py-1 text-white outline-none"
          />
        </div>

        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Save DC</span>
          <div className="font-mono font-black text-base text-red-400 py-1">
            {char.spellDcOverride ? char.spellDcOverride : autoSaveDc}
          </div>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Attack Bonus</span>
          <div className="font-mono font-black text-base text-sky-400 py-1">
            {char.spellAtkOverride ? char.spellAtkOverride : `+${autoAtkBonus}`}
          </div>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Prepared</span>
          <div className="flex items-center justify-center gap-1 bg-dnd-input py-1 px-2 rounded border border-dnd-border">
            <input
              type="number"
              value={char.preparedCur}
              onChange={(e) => onChange({ preparedCur: parseInt(e.target.value, 10) || 0 })}
              className="w-7 text-center font-bold text-xs bg-transparent outline-none text-white"
            />
            <span className="text-slate-500 font-bold">/</span>
            <input
              type="number"
              value={char.preparedMax}
              onChange={(e) => onChange({ preparedMax: parseInt(e.target.value, 10) || 0 })}
              className="w-7 text-center font-bold text-xs bg-transparent outline-none text-slate-400"
            />
          </div>
        </div>

        <div className="text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Concentration</span>
          <input
            type="text"
            value={char.concentration}
            onChange={(e) => onChange({ concentration: e.target.value })}
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
            const slot = char.slots[lvl] || { cur: 0, max: 0 };
            return (
              <div
                key={lvl}
                className="flex flex-col items-center justify-between p-2 rounded-xl bg-dnd-card border border-dnd-border min-h-[110px]"
              >
                <span className="text-[11px] font-black uppercase text-slate-400">{suffixes[lvl - 1]}</span>

                {/* Pips */}
                <div className="flex flex-wrap items-center justify-center gap-1 my-2">
                  {slot.max === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No Slots</span>
                  ) : (
                    Array.from({ length: slot.max }).map((_, idx) => {
                      const isActive = idx < slot.cur;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleTogglePip(lvl, idx)}
                          className={`h-3 w-3 rounded-full border transition transform active:scale-90 ${
                            isActive
                              ? 'bg-sky-400 border-sky-300 shadow-sm shadow-sky-400/60'
                              : 'bg-slate-900 border-slate-700'
                          }`}
                          title={isActive ? 'Click to Cast' : 'Click to Recover'}
                        />
                      );
                    })
                  )}
                </div>

                {/* Counter Input */}
                <div className="flex items-center justify-center gap-1 bg-dnd-input px-1.5 py-0.5 rounded border border-dnd-border text-xs">
                  <span className="font-bold text-sky-400">{slot.cur}</span>
                  <span className="text-slate-600">/</span>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={slot.max}
                    onChange={(e) => handleUpdateSlotMax(lvl, parseInt(e.target.value, 10) || 0)}
                    className="w-4 text-center font-bold text-slate-300 bg-transparent outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spellbook Filter & Cards */}
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
          <span className="text-xs font-bold text-slate-400">
            {filteredSpells.length} {filteredSpells.length === 1 ? 'Spell' : 'Spells'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpells.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3 hover:border-slate-600 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => handleUpdateSpell(s.id, 'name', e.target.value)}
                  className="font-black text-base text-white bg-transparent outline-none flex-1 focus:text-red-400"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSpell(s.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                  title="Delete Spell"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Spell Meta Tags */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  value={s.levelTag}
                  onChange={(e) => handleUpdateSpell(s.id, 'levelTag', e.target.value)}
                  className="text-center font-bold text-sky-400 bg-sky-950/40 border border-sky-800/40 py-1 rounded"
                />
                <input
                  type="text"
                  value={s.casting_time}
                  onChange={(e) => handleUpdateSpell(s.id, 'casting_time', e.target.value)}
                  className="text-center font-bold text-slate-300 bg-dnd-input border border-dnd-border py-1 rounded"
                />
                <input
                  type="text"
                  value={s.range}
                  onChange={(e) => handleUpdateSpell(s.id, 'range', e.target.value)}
                  className="text-center font-bold text-slate-300 bg-dnd-input border border-dnd-border py-1 rounded"
                />
                <input
                  type="text"
                  value={s.duration}
                  onChange={(e) => handleUpdateSpell(s.id, 'duration', e.target.value)}
                  className="text-center font-bold text-slate-300 bg-dnd-input border border-dnd-border py-1 rounded"
                />
              </div>

              <textarea
                rows={3}
                value={s.desc}
                onChange={(e) => handleUpdateSpell(s.id, 'desc', e.target.value)}
                placeholder="Spell description and scaling effects..."
                className="w-full text-xs text-slate-300 bg-dnd-input p-3 rounded-lg border border-dnd-border outline-none focus:border-red-500 resize-y leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Compendium Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-dnd-surface border border-dnd-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-dnd-border bg-dnd-card">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-red-400" />
                5e Spells Compendium
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-dnd-border bg-dnd-input flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search spells (e.g. Fireball, Cure Wounds)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-dnd-card rounded-lg border border-dnd-border text-white outline-none focus:border-red-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs whitespace-nowrap"
              >
                + Custom
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <p className="text-xs text-slate-400 text-center py-8">Loading spells catalog...</p>
              ) : compendiumList
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 40)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-dnd-card border border-dnd-border hover:border-red-500/50 transition"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white">{s.name}</h4>
                        <div className="flex gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
                          <span className="text-sky-400 uppercase">{s.levelTag}</span>
                          {s.schoolTag && <span>• {s.schoolTag}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectSpell(s)}
                        className="px-3 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold border border-red-500/40 transition"
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
};
