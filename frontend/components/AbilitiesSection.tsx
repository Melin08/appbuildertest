import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, Sparkles, BookOpen, Search, X } from 'lucide-react';
import { CharacterSheetData, TraitItem } from '../types';
import { searchAllTraits, fetchTraitDetails } from '../services/dndApi';

interface AbilitiesSectionProps {
  char: CharacterSheetData;
  onChange: (fields: Partial<CharacterSheetData>) => void;
}

export const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({ char, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [compendiumList, setCompendiumList] = useState<TraitItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenModal = async () => {
    setModalOpen(true);
    setLoading(true);
    const data = await searchAllTraits();
    setCompendiumList(data);
    setLoading(false);
  };

  const handleAddCustom = () => {
    const newTrait: TraitItem = {
      id: 'trait_' + Date.now(),
      name: 'New Ability',
      type: 'Feature',
      desc: 'Describe ability mechanics, actions, and limits here...',
      isExpanded: true
    };
    onChange({ traits: [...char.traits, newTrait] });
    setModalOpen(false);
  };

  const handleSelectFromCompendium = async (t: TraitItem) => {
    let desc = t.desc;
    if (desc.includes('Click add to load')) {
      const fetched = await fetchTraitDetails(t.name, t.type);
      if (fetched) desc = fetched;
    }

    const newTrait: TraitItem = {
      id: 'trait_' + Date.now(),
      name: t.name,
      type: t.type || 'Feature',
      desc: desc || '',
      isExpanded: false
    };
    onChange({ traits: [...char.traits, newTrait] });
    setModalOpen(false);
  };

  const handleToggleExpand = (id: string) => {
    const updated = char.traits.map(t =>
      t.id === id ? { ...t, isExpanded: !t.isExpanded } : t
    );
    onChange({ traits: updated });
  };

  const handleUpdateTrait = (id: string, prop: keyof TraitItem, val: string) => {
    const updated = char.traits.map(t =>
      t.id === id ? { ...t, [prop]: val } : t
    );
    onChange({ traits: updated });
  };

  const handleDeleteTrait = (id: string) => {
    onChange({ traits: char.traits.filter(t => t.id !== id) });
  };

  const filteredCompendium = compendiumList.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Ability
        </button>
      </div>

      {/* Traits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {char.traits.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl bg-dnd-card border border-dnd-border space-y-3 transition ${
              t.isExpanded ? 'md:col-span-2 border-red-500/60 shadow-lg' : 'hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => handleUpdateTrait(t.id, 'name', e.target.value)}
                  className="font-black text-base text-white bg-transparent outline-none w-full focus:text-red-400"
                />
                <input
                  type="text"
                  value={t.type}
                  onChange={(e) => handleUpdateTrait(t.id, 'type', e.target.value)}
                  className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded outline-none w-auto max-w-[200px]"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleExpand(t.id)}
                  className="p-1 rounded text-slate-400 hover:text-white transition"
                  title={t.isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${t.isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrait(t.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                  title="Delete Ability"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <textarea
              rows={t.isExpanded ? 6 : 2}
              value={t.desc}
              onChange={(e) => handleUpdateTrait(t.id, 'desc', e.target.value)}
              placeholder="Ability mechanics, rules, and conditions..."
              className="w-full text-xs text-slate-300 bg-dnd-input p-3 rounded-lg border border-dnd-border outline-none focus:border-red-500 resize-y leading-relaxed"
            />
          </div>
        ))}
      </div>

      {char.traits.length === 0 && (
        <div className="p-8 text-center bg-dnd-card/40 border border-dnd-border rounded-xl">
          <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">No abilities or traits added yet.</p>
          <p className="text-xs text-slate-500 mt-1">Click "+ Add Ability" above to browse the compendium or build custom powers.</p>
        </div>
      )}

      {/* Compendium Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-dnd-surface border border-dnd-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-dnd-border bg-dnd-card">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" />
                5e Features &amp; Abilities Compendium
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
                  placeholder="Search abilities by name or class..."
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
                <p className="text-xs text-slate-400 text-center py-8">Loading compendium...</p>
              ) : filteredCompendium.slice(0, 40).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dnd-card border border-dnd-border hover:border-red-500/50 transition"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                    <span className="text-[10px] font-bold uppercase text-emerald-400">
                      {t.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectFromCompendium(t)}
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
