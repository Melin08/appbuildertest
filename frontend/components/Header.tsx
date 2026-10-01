import React, { useRef } from 'react';
import { Shield, Moon, Sun, Download, Upload, Plus, FolderOpen, ExternalLink } from 'lucide-react';
import { CharacterSheetData } from '../types';

interface HeaderProps {
  char: CharacterSheetData;
  roster: Record<string, CharacterSheetData>;
  onSelectCharacter: (id: string) => void;
  onNewCharacter: () => void;
  onShortRest: () => void;
  onLongRest: () => void;
  onBackup: () => void;
  onRestore: (data: any) => void;
  onOpenRoster: () => void;
  saveStatusText: string;
}

export const Header: React.FC<HeaderProps> = ({
  char,
  roster,
  onNewCharacter,
  onShortRest,
  onLongRest,
  onBackup,
  onRestore,
  onOpenRoster,
  saveStatusText
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        onRestore(parsed);
      } catch {
        alert('Invalid JSON character sheet backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="mb-6 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dnd-subtle pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-950/40">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              D&D 5e Character Sheet
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/40 font-mono font-semibold">
                SRD 5.1
              </span>
            </h1>
            <p className="text-xs text-slate-400">Interactive live stat tracker, spellbook &amp; compendium</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saveStatusText && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full animate-pulse">
              {saveStatusText}
            </span>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs bg-dnd-surface border border-dnd-border px-3 py-1.5 rounded-lg text-slate-300">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Compendiums:</span>
            <a
              href="https://dnd5e.wikidot.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-400 flex items-center gap-0.5"
            >
              Wikidot <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-slate-600">/</span>
            <a
              href="https://roll20.net/compendium/dnd5e/Weapons#content"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-400 flex items-center gap-0.5"
            >
              Weapons <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-dnd-surface/80 p-2.5 rounded-xl border border-dnd-border">
        {/* Character Switcher & Creation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenRoster}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-sm font-semibold text-slate-200 transition"
          >
            <FolderOpen className="h-4 w-4 text-red-400" />
            <span className="max-w-[140px] truncate">{char.name || 'Characters'}</span>
            <span className="text-[11px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {Object.keys(roster).length}
            </span>
          </button>

          <button
            onClick={onNewCharacter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-sm font-semibold text-slate-300 transition"
            title="Create fresh character"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>New</span>
          </button>
        </div>

        {/* Rest Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShortRest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            title="Spend Hit Dice to recover HP"
          >
            <Sun className="h-4 w-4 text-amber-400" />
            Short Rest
          </button>

          <button
            onClick={onLongRest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider transition shadow-sm"
            title="Restore HP, class points, spell slots & half hit dice"
          >
            <Moon className="h-4 w-4 text-emerald-400" />
            Long Rest
          </button>
        </div>

        {/* Backup / Export / Import */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBackup}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-xs font-semibold text-slate-300 transition"
            title="Download JSON sheet backup"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dnd-card hover:bg-dnd-hover border border-dnd-border text-xs font-semibold text-slate-300 transition"
            title="Restore JSON sheet backup"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restore</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </header>
  );
};
