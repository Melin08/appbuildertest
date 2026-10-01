import React, { useState } from 'react';
import { CharacterSheetData } from '../types';

interface JournalTabProps {
  char: CharacterSheetData;
  onChange: (fields: Partial<CharacterSheetData>) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({ char, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'personality' | 'npcs'>('notes');

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center gap-2 border-b border-dnd-border pb-3">
        {(['notes', 'personality', 'npcs'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSubTab === tab
                ? 'bg-red-600 text-white shadow-sm shadow-red-950/40'
                : 'bg-dnd-card text-slate-400 hover:text-white hover:bg-dnd-hover'
            }`}
          >
            {tab === 'notes' && 'Campaign Log'}
            {tab === 'personality' && 'Personality & Backstory'}
            {tab === 'npcs' && 'NPCs & Factions'}
          </button>
        ))}
      </div>

      {activeSubTab === 'notes' && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Session Notes, Quest Tracker &amp; Discoveries
          </label>
          <textarea
            rows={18}
            value={char.campaignNotes}
            onChange={(e) => onChange({ campaignNotes: e.target.value })}
            placeholder="Record dungeon maps, clues, monster weaknesses, quest objectives, and session logs..."
            className="w-full text-sm text-slate-200 bg-dnd-input p-4 rounded-xl border border-dnd-border outline-none focus:border-red-500 resize-y leading-relaxed font-mono"
          />
        </div>
      )}

      {activeSubTab === 'personality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Personality Traits
              </label>
              <textarea
                rows={4}
                value={char.personality}
                onChange={(e) => onChange({ personality: e.target.value })}
                className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Ideals
              </label>
              <textarea
                rows={4}
                value={char.ideals}
                onChange={(e) => onChange({ ideals: e.target.value })}
                className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Bonds
              </label>
              <textarea
                rows={4}
                value={char.bonds}
                onChange={(e) => onChange({ bonds: e.target.value })}
                className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Flaws
              </label>
              <textarea
                rows={4}
                value={char.flaws}
                onChange={(e) => onChange({ flaws: e.target.value })}
                className="w-full text-xs text-slate-200 bg-dnd-input p-3 rounded-xl border border-dnd-border outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Character Backstory &amp; Origins
            </label>
            <textarea
              rows={8}
              value={char.backstory}
              onChange={(e) => onChange({ backstory: e.target.value })}
              placeholder="Where was your hero born? What drove them to take up the adventurer's calling? Who are their rivals?"
              className="w-full text-xs text-slate-200 bg-dnd-input p-4 rounded-xl border border-dnd-border outline-none focus:border-red-500 resize-y leading-relaxed"
            />
          </div>
        </div>
      )}

      {activeSubTab === 'npcs' && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            NPCs, Allies, Patrons &amp; Guild Affiliations
          </label>
          <textarea
            rows={18}
            value={char.npcList}
            onChange={(e) => onChange({ npcList: e.target.value })}
            placeholder="Record NPC names, disposition, locations, faction allegiances, and outstanding debts..."
            className="w-full text-sm text-slate-200 bg-dnd-input p-4 rounded-xl border border-dnd-border outline-none focus:border-red-500 resize-y leading-relaxed font-mono"
          />
        </div>
      )}
    </div>
  );
};
