export interface WeaponItem {
  id: string;
  name: string;
  atk: string;
  dmg: string;
  notes: string;
}

export interface SpellItem {
  id: string;
  name: string;
  levelTag: string; // e.g. "Cantrip", "Level 1"
  schoolTag?: string;
  classesTag?: string;
  casting_time: string;
  range: string;
  duration: string;
  desc: string;
}

export interface TraitItem {
  id: string;
  name: string;
  type: string; // e.g. "Class Feature", "Racial Trait", "Feat"
  desc: string;
  classes?: string[];
  races?: string[];
  isExpanded?: boolean;
}

export interface CharacterSheetData {
  id: string;
  name: string;
  charClass: string;
  race: string;
  background: string;
  alignment: string;
  level: number;
  exp: string;
  inspiration: string;
  speed: number;
  hitDiceCur: number;
  hitDiceMax: number;
  hitDiceType: string;

  // Vitals
  ac: number;
  curHp: number;
  maxHp: number;
  tempHp: number;
  deathSucc: number;
  deathFail: number;
  classPtsCur: number;
  classPtsMax: number;

  // Attributes
  attr_str: number;
  attr_dex: number;
  attr_con: number;
  attr_int: number;
  attr_wis: number;
  attr_cha: number;

  // Saves proficiency
  save_str: boolean;
  save_dex: boolean;
  save_con: boolean;
  save_int: boolean;
  save_wis: boolean;
  save_cha: boolean;

  // Skills
  skills: {
    [skillId: string]: {
      prof: boolean;
      exp: boolean;
    };
  };

  // Currency
  cp: number;
  sp: number;
  gp: number;
  pp: number;

  // Exhaustion & Conditions
  exhaustion: number;
  conditions: string[];

  // Combat lists
  weapons: WeaponItem[];
  otherProfs: string;
  inventory: string;

  // Spellcasting
  spellAbility: string;
  spellDcOverride?: string;
  spellAtkOverride?: string;
  preparedCur: number;
  preparedMax: number;
  concentration: string;
  slots: {
    [level: number]: {
      cur: number;
      max: number;
    };
  };
  spells: SpellItem[];

  // Traits
  traits: TraitItem[];

  // Lore & Notes
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  campaignNotes: string;
  npcList: string;

  // Meta
  avatar?: string;
  blurredPills: string[];
  updatedAt: number;
}

export interface RollLogEntry {
  id: string;
  desc: string;
  total: number;
  time: string;
}

export type StatKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
