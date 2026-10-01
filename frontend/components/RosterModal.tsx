import React from 'react';
import { X, User, Trash2, Check, Plus } from 'lucide-react';
import { CharacterSheetData } from '../types';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: Record<string, CharacterSheetData>;
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  roster,
  activeId,
  onSelect,
  onDelete,
  onNew
}) => {
  if (!isOpen) return null;

  const characters = Object.values(roster);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-dnd-surface border border-dnd-border overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-dnd-border bg-dnd-card">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <User className="h-4 w-4 text-red-400" />
            Character Roster
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {characters.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isActive
                    ? 'bg-red-950/40 border-red-500 shadow-md'
                    : 'bg-dnd-card border-dnd-border hover:border-slate-600'
                }`}
              >
                <div
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer"
                >
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    {c.name || 'Unnamed Character'}
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {c.charClass || 'No Class'} • Level {c.level} ({c.race || 'Unknown Race'})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c.id);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-dnd-input hover:bg-slate-700 text-slate-200 border border-dnd-border transition"
                    title="Load Character"
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${c.name || 'this character'}"?`)) {
                        onDelete(c.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-dnd-input hover:bg-red-600 text-slate-400 hover:text-white border border-dnd-border transition"
                    title="Delete Character"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {characters.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No saved characters found.</p>
          )}
        </div>

        <div className="p-4 border-t border-dnd-border bg-dnd-card">
          <button
            type="button"
            onClick={() => {
              onNew();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition"
          >
            <Plus className="h-4 w-4" />
            Create Blank Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
