import React from 'react';
import { Shield, Heart, Skull, Zap, PlusMinus } from 'lucide-react';
import { CharacterSheetData } from '../types';

interface VitalsHUDProps {
  char: CharacterSheetData;
  onChange: (fields: Partial<CharacterSheetData>) => void;
  onOpenHpModal: () => void;
}

export const VitalsHUD: React.FC<VitalsHUDProps> = ({ char, onChange, onOpenHpModal }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Armor Class Card */}
      <div className="relative flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-sky-500 shadow-md">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Defense</span>
          <h3 className="text-base font-black text-white">Armor Class</h3>
          <p className="text-xs text-slate-400">Total Shield &amp; Armor</p>
        </div>
        <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-dnd-input border border-dnd-border">
          <input
            type="number"
            value={char.ac}
            onChange={(e) => onChange({ ac: parseInt(e.target.value, 10) || 10 })}
            className="w-full text-center text-2xl font-black text-white bg-transparent outline-none focus:text-sky-400"
          />
        </div>
      </div>

      {/* Hit Points Card */}
      <div className="relative flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-red-500 shadow-md group">
        <button
          onClick={onOpenHpModal}
          type="button"
          className="absolute top-2.5 right-2.5 h-6 w-6 rounded bg-red-950/80 hover:bg-red-600 border border-red-700/60 text-red-300 hover:text-white flex items-center justify-center text-xs font-black transition"
          title="Quick Damage & Heal Calculator"
        >
          &plusmn;
        </button>

        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Health Pool</span>
          <h3
            onClick={onOpenHpModal}
            className="text-base font-black text-white cursor-pointer hover:text-red-400 transition"
          >
            Hit Points
          </h3>
          <p className="text-xs text-slate-400">
            {char.tempHp > 0 ? (
              <span className="text-sky-400 font-bold">+{char.tempHp} Temp HP</span>
            ) : (
              'Current vs Maximum'
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-dnd-input px-2.5 py-1.5 rounded-lg border border-dnd-border">
          <input
            type="number"
            value={char.curHp}
            onChange={(e) => onChange({ curHp: parseInt(e.target.value, 10) || 0 })}
            className="w-10 text-center text-xl font-black text-red-400 bg-transparent outline-none"
            title="Current HP"
          />
          <span className="text-slate-500 font-bold">/</span>
          <input
            type="number"
            value={char.maxHp}
            onChange={(e) => onChange({ maxHp: parseInt(e.target.value, 10) || 1 })}
            className="w-10 text-center text-xl font-black text-slate-100 bg-transparent outline-none"
            title="Max HP"
          />
        </div>
      </div>

      {/* Death Saves Card */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-amber-500 shadow-md">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Mortality</span>
          <h3 className="text-base font-black text-white">Death Saves</h3>
          <p className="text-xs text-slate-400">3 marks to settle fate</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Successes */}
          <div className="flex flex-col items-center bg-dnd-input px-2 py-1 rounded border border-dnd-border">
            <span className="text-[9px] font-black text-emerald-400 uppercase">Succ</span>
            <div className="flex gap-1 mt-0.5">
              {[1, 2, 3].map((val) => (
                <button
                  key={`succ_${val}`}
                  type="button"
                  onClick={() => onChange({ deathSucc: char.deathSucc === val ? val - 1 : val })}
                  className={`h-4 w-4 rounded-full border transition ${
                    char.deathSucc >= val
                      ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50'
                      : 'border-slate-700 bg-slate-900/40'
                  }`}
                  title={`Success ${val}`}
                />
              ))}
            </div>
          </div>

          {/* Failures */}
          <div className="flex flex-col items-center bg-dnd-input px-2 py-1 rounded border border-dnd-border">
            <span className="text-[9px] font-black text-red-400 uppercase">Fail</span>
            <div className="flex gap-1 mt-0.5">
              {[1, 2, 3].map((val) => (
                <button
                  key={`fail_${val}`}
                  type="button"
                  onClick={() => onChange({ deathFail: char.deathFail === val ? val - 1 : val })}
                  className={`h-4 w-4 rounded-full border transition ${
                    char.deathFail >= val
                      ? 'bg-red-500 border-red-400 shadow-sm shadow-red-500/50'
                      : 'border-slate-700 bg-slate-900/40'
                  }`}
                  title={`Failure ${val}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Class Resources Card */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-dnd-card border border-dnd-border border-l-4 border-l-purple-500 shadow-md">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Class Pool</span>
          <h3 className="text-base font-black text-white">Class Points</h3>
          <p className="text-xs text-slate-400">Ki, Sorcery, Rages</p>
        </div>

        <div className="flex items-center gap-1 bg-dnd-input px-2.5 py-1.5 rounded-lg border border-dnd-border">
          <input
            type="number"
            value={char.classPtsCur}
            onChange={(e) => onChange({ classPtsCur: parseInt(e.target.value, 10) || 0 })}
            className="w-8 text-center text-xl font-black text-purple-400 bg-transparent outline-none"
            title="Available Class Points"
          />
          <span className="text-slate-500 font-bold">/</span>
          <input
            type="number"
            value={char.classPtsMax}
            onChange={(e) => onChange({ classPtsMax: parseInt(e.target.value, 10) || 0 })}
            className="w-8 text-center text-xl font-black text-slate-100 bg-transparent outline-none"
            title="Max Class Points"
          />
        </div>
      </div>
    </div>
  );
};
