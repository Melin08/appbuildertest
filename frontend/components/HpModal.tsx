import React, { useState } from 'react';
import { X, Flame, Heart, Shield } from 'lucide-react';
import { CharacterSheetData } from '../types';

interface HpModalProps {
  isOpen: boolean;
  onClose: () => void;
  char: CharacterSheetData;
  onApply: (fields: Partial<CharacterSheetData>, msg: string) => void;
}

export const HpModal: React.FC<HpModalProps> = ({ isOpen, onClose, char, onApply }) => {
  const [amt, setAmt] = useState<string>('');

  if (!isOpen) return null;

  const handleApply = (action: 'damage' | 'heal' | 'temp') => {
    const val = parseInt(amt, 10);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a number greater than 0');
      return;
    }

    let cur = char.curHp;
    let temp = char.tempHp;
    let max = char.maxHp;

    if (action === 'damage') {
      let dmgLeft = val;
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
      onApply({ curHp: cur, tempHp: temp }, `Took ${val} damage`);
    } else if (action === 'heal') {
      cur = Math.min(max, cur + val);
      onApply({ curHp: cur }, `Healed for ${val} HP`);
    } else if (action === 'temp') {
      temp = Math.max(temp, val);
      onApply({ tempHp: temp }, `Gained ${val} Temp HP`);
    }

    setAmt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-dnd-surface border border-dnd-border p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-dnd-border pb-3">
          <h3 className="text-lg font-black text-white">Adjust Hit Points</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
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

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Amount
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 8"
            value={amt}
            autoFocus
            onChange={(e) => setAmt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply('damage');
            }}
            className="w-full text-center text-3xl font-black py-3 rounded-xl bg-dnd-input border border-dnd-border text-white focus:border-red-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => handleApply('damage')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-bold hover:brightness-110 transition shadow-lg shadow-red-950/40"
          >
            <Flame className="h-4 w-4" />
            Apply Damage
          </button>

          <button
            type="button"
            onClick={() => handleApply('heal')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-bold hover:brightness-110 transition shadow-lg shadow-emerald-950/40"
          >
            <Heart className="h-4 w-4" />
            Heal Hit Points
          </button>

          <button
            type="button"
            onClick={() => handleApply('temp')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-800 text-white font-bold hover:brightness-110 transition shadow-lg shadow-sky-950/40"
          >
            <Shield className="h-4 w-4" />
            Set Temporary HP
          </button>
        </div>
      </div>
    </div>
  );
};
