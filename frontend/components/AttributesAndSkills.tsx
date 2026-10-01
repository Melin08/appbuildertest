import React from 'react';
import { Dices } from 'lucide-react';
import { CharacterSheetData, StatKey } from '../types';
import { SKILL_DEFINITIONS, getModifier, getProfBonus } from '../constants';

interface AttributesAndSkillsProps {
  char: CharacterSheetData;
  onChange: (fields: Partial<CharacterSheetData>) => void;
  onRoll: (label: string, bonus: number) => void;
}

export const AttributesAndSkills: React.FC<AttributesAndSkillsProps> = ({
  char,
  onChange,
  onRoll
}) => {
  const profBonus = getProfBonus(char.level);

  const stats: { key: StatKey; label: string; abbr: string; color: string; border: string; bg: string }[] = [
    { key: 'str', label: 'Strength', abbr: 'STR', color: 'text-red-400', border: 'border-l-red-500', bg: 'bg-red-500/10' },
    { key: 'dex', label: 'Dexterity', abbr: 'DEX', color: 'text-emerald-400', border: 'border-l-emerald-500', bg: 'bg-emerald-500/10' },
    { key: 'con', label: 'Constitution', abbr: 'CON', color: 'text-amber-400', border: 'border-l-amber-500', bg: 'bg-amber-500/10' },
    { key: 'int', label: 'Intelligence', abbr: 'INT', color: 'text-sky-400', border: 'border-l-sky-500', bg: 'bg-sky-500/10' },
    { key: 'wis', label: 'Wisdom', abbr: 'WIS', color: 'text-purple-400', border: 'border-l-purple-500', bg: 'bg-purple-500/10' },
    { key: 'cha', label: 'Charisma', abbr: 'CHA', color: 'text-yellow-400', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10' }
  ];

  // Passive perception and insight calculations
  const wisMod = getModifier(char.attr_wis);
  const percSkill = char.skills['perc'] || { prof: false, exp: false };
  const insSkill = char.skills['ins'] || { prof: false, exp: false };

  let percBonus = wisMod;
  if (percSkill.prof) percBonus += profBonus;
  if (percSkill.exp) percBonus += profBonus;

  let insBonus = wisMod;
  if (insSkill.prof) insBonus += profBonus;
  if (insSkill.exp) insBonus += profBonus;

  return (
    <div className="space-y-6">
      {/* Ability Scores */}
      <div>
        <h2 className="text-base font-extrabold text-white tracking-wide uppercase mb-3 flex items-center justify-between">
          <span>Attributes &amp; Saves</span>
          <span className="text-xs font-mono text-slate-400 font-normal">Proficiency Bonus: +{profBonus}</span>
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
                className={`flex items-center justify-between p-2.5 rounded-xl bg-dnd-card border border-dnd-border border-l-4 ${border} shadow-sm hover:border-slate-600 transition`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16">
                    <span className={`text-sm font-black ${color}`}>{abbr}</span>
                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">{label}</p>
                  </div>

                  {/* Score Input */}
                  <div className="flex items-center justify-center bg-dnd-input border border-dnd-border rounded-lg px-2 py-1 w-14">
                    <input
                      type="number"
                      value={score}
                      onChange={(e) =>
                        onChange({ [`attr_${key}`]: parseInt(e.target.value, 10) || 10 })
                      }
                      className="w-full text-center font-bold text-white bg-transparent outline-none text-base"
                    />
                  </div>

                  {/* Calculated Modifier */}
                  <div
                    className={`flex items-center justify-center h-9 w-10 rounded-lg ${bg} border border-slate-700/60 font-black text-sm ${color}`}
                  >
                    {mod >= 0 ? `+${mod}` : mod}
                  </div>
                </div>

                {/* Save Checkbox & Roll */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isSaveChecked}
                      onChange={(e) =>
                        onChange({ [`save_${key}`]: e.target.checked })
                      }
                      className="rounded accent-red-600 h-3.5 w-3.5"
                    />
                    Save
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-200 w-7 text-right">
                    {saveBonus >= 0 ? `+${saveBonus}` : saveBonus}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRoll(`${abbr} Save`, saveBonus)}
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
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Passive Perception
          </span>
          <span className="text-2xl font-black text-white mt-0.5">
            {10 + percBonus}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">10 + Perception Mod</span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-dnd-card border border-dnd-border text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Passive Insight
          </span>
          <span className="text-2xl font-black text-white mt-0.5">
            {10 + insBonus}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">10 + Insight Mod</span>
        </div>
      </div>

      {/* Skills Group */}
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

            const handleToggleProf = () => {
              const newProf = !skillData.prof;
              onChange({
                skills: {
                  ...char.skills,
                  [id]: { prof: newProf, exp: newProf ? skillData.exp : false }
                }
              });
            };

            const handleToggleExp = () => {
              const newExp = !skillData.exp;
              onChange({
                skills: {
                  ...char.skills,
                  [id]: { prof: newExp ? true : skillData.prof, exp: newExp }
                }
              });
            };

            return (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-dnd-card border border-dnd-border hover:border-slate-600 transition text-sm"
              >
                <div className="flex items-center gap-2">
                  {/* Proficiency Bubble */}
                  <button
                    type="button"
                    onClick={handleToggleProf}
                    className={`h-3.5 w-3.5 rounded-full border transition ${
                      skillData.prof
                        ? 'bg-red-500 border-red-400 shadow-sm shadow-red-500/50'
                        : 'border-slate-600 bg-slate-900/40'
                    }`}
                    title="Toggle Proficiency"
                  />

                  {/* Expertise Diamond */}
                  <button
                    type="button"
                    onClick={handleToggleExp}
                    className={`h-3.5 w-3.5 rotate-45 border transition ${
                      skillData.exp
                        ? 'bg-purple-500 border-purple-400 shadow-sm shadow-purple-500/50'
                        : 'border-slate-600 bg-slate-900/40'
                    }`}
                    title="Toggle Expertise"
                  />

                  <span className="font-semibold text-slate-200">{name}</span>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                    ({stat.toUpperCase()})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white w-7 text-right">
                    {totalBonus >= 0 ? `+${totalBonus}` : totalBonus}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRoll(name, totalBonus)}
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
  );
};
