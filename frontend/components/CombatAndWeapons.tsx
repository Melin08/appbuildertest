import React from 'react';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';
import { CharacterSheetData, RollLogEntry, WeaponItem } from '../types';
import { CONDITIONS_LIST } from '../constants';

interface CombatAndWeaponsProps {
  char: CharacterSheetData;
  onChange: (fields: Partial<CharacterSheetData>) => void;
  rollHistory: RollLogEntry[];
  onQuickDice: (sides: number) => void;
  lastRoll: number | null;
}

export const CombatAndWeapons: React.FC<CombatAndWeaponsProps> = ({
  char,
  onChange,
  rollHistory,
  onQuickDice,
  lastRoll
}) => {
  const handleAddWeapon = () => {
    const newWpn: WeaponItem = {
      id: 'wpn_' + Date.now(),
      name: 'New Weapon',
      atk: '+5',
      dmg: '1d8+3',
      notes: 'Slashing'
    };
    onChange({ weapons: [...char.weapons, newWpn] });
  };

  const handleUpdateWeapon = (id: string, prop: keyof WeaponItem, val: string) => {
    const updated = char.weapons.map(w => w.id === id ? { ...w, [prop]: val } : w);
    onChange({ weapons: updated });
  };

  const handleDeleteWeapon = (id: string) => {
    onChange({ weapons: char.weapons.filter(w => w.id !== id) });
  };

  const handleToggleCondition = (cond: string) => {
    if (char.conditions.includes(cond)) {
      onChange({ conditions: char.conditions.filter(c => c !== cond) });
    } else {
      onChange({ conditions: [...char.conditions, cond] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Dice Roller Panel */}
      <div className="p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Dice Roller</span>
          {lastRoll !== null && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-3 py-1 rounded-lg shadow-sm font-black text-sm">
              <span>Result:</span>
              <span className="text-lg font-mono">{lastRoll}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {[20, 12, 10, 8, 6, 4, 100].map((sides) => (
            <button
              key={sides}
              type="button"
              onClick={() => onQuickDice(sides)}
              className="flex-1 min-w-[50px] py-2 rounded-lg bg-dnd-input hover:bg-red-600 hover:text-white border border-dnd-border text-xs font-black text-slate-200 transition shadow-sm"
            >
              d{sides}
            </button>
          ))}
        </div>

        {/* Mini Roll History */}
        {rollHistory.length > 0 && (
          <div className="pt-2 border-t border-dnd-subtle">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Rolls</span>
            <div className="flex gap-2 overflow-x-auto py-1 max-w-full text-xs">
              {rollHistory.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex-shrink-0 bg-dnd-input px-2.5 py-1 rounded border border-dnd-border text-slate-300"
                >
                  <span className="text-slate-400 font-semibold">{r.desc}:</span>{' '}
                  <span className="font-bold text-red-400">{r.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Currency Bar */}
      <div className="grid grid-cols-4 gap-2 bg-dnd-card p-3 rounded-xl border border-dnd-border">
        {(['cp', 'sp', 'gp', 'pp'] as const).map((coin) => (
          <div key={coin} className="flex items-center gap-1.5 bg-dnd-input p-2 rounded-lg border border-dnd-border">
            <span className="text-xs font-black uppercase text-amber-400">{coin}</span>
            <input
              type="number"
              value={char[coin]}
              onChange={(e) => onChange({ [coin]: parseInt(e.target.value, 10) || 0 })}
              className="w-full text-right font-bold text-sm bg-transparent outline-none text-white"
            />
          </div>
        ))}
      </div>

      {/* Weapons & Attacks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
            Weapons &amp; Attacks
          </h2>
          <button
            type="button"
            onClick={handleAddWeapon}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Weapon
          </button>
        </div>

        <div className="space-y-2">
          {char.weapons.map((wpn) => (
            <div
              key={wpn.id}
              className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-dnd-card border border-dnd-border items-center hover:border-slate-600 transition"
            >
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="Weapon name"
                  value={wpn.name}
                  onChange={(e) => handleUpdateWeapon(wpn.id, 'name', e.target.value)}
                  className="w-full text-xs font-bold text-white bg-dnd-input px-2.5 py-1.5 rounded border border-dnd-border outline-none focus:border-red-500"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Atk (+5)"
                  value={wpn.atk}
                  onChange={(e) => handleUpdateWeapon(wpn.id, 'atk', e.target.value)}
                  className="w-full text-xs text-center font-bold text-sky-400 bg-dnd-input px-2 py-1.5 rounded border border-dnd-border outline-none focus:border-red-500"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Dmg (1d8)"
                  value={wpn.dmg}
                  onChange={(e) => handleUpdateWeapon(wpn.id, 'dmg', e.target.value)}
                  className="w-full text-xs text-center font-bold text-red-400 bg-dnd-input px-2 py-1.5 rounded border border-dnd-border outline-none focus:border-red-500"
                />
              </div>

              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Range / Notes"
                  value={wpn.notes}
                  onChange={(e) => handleUpdateWeapon(wpn.id, 'notes', e.target.value)}
                  className="w-full text-xs text-slate-300 bg-dnd-input px-2.5 py-1.5 rounded border border-dnd-border outline-none focus:border-red-500"
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleDeleteWeapon(wpn.id)}
                  className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                  title="Remove weapon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {char.weapons.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-3 bg-dnd-card/50 rounded-lg">
              No weapons added. Click "+ Add Weapon" to create attack options.
            </p>
          )}
        </div>
      </div>

      {/* Conditions & Exhaustion */}
      <div className="p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Conditions &amp; Exhaustion
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">Exhaustion:</span>
            <input
              type="number"
              min="0"
              max="6"
              value={char.exhaustion}
              onChange={(e) => onChange({ exhaustion: parseInt(e.target.value, 10) || 0 })}
              className="w-10 text-center font-black text-sm bg-dnd-input border border-dnd-border rounded text-red-400 py-0.5 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS_LIST.map((c) => {
            const active = char.conditions.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleToggleCondition(c)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  active
                    ? 'bg-red-600 text-white shadow-sm shadow-red-950/50'
                    : 'bg-dnd-input text-slate-400 border border-dnd-border hover:border-slate-500'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Proficiencies & Equipment Textareas */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Proficiencies, Languages &amp; Resistances
          </label>
          <textarea
            rows={3}
            value={char.otherProfs}
            onChange={(e) => onChange({ otherProfs: e.target.value })}
            placeholder="Armor proficiencies, tools, languages, damage resistances..."
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
            onChange={(e) => onChange({ inventory: e.target.value })}
            placeholder="Carried gear, magic items, potions, backpacks..."
            className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500 resize-y"
          />
        </div>
      </div>
    </div>
  );
};
