import { CharacterSheetData, SpellItem, TraitItem, StatKey } from './types';

export const DND_CLASSES: string[] = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard", "Artificer", "Blood Hunter"
];

export interface RaceCategory {
  race: string;
  subraces: string[];
}

export const DND_RACES_CATALOG: RaceCategory[] = [
  { race: "Dragonborn", subraces: ["Black Dragonborn", "Blue Dragonborn", "Brass Dragonborn", "Bronze Dragonborn", "Copper Dragonborn", "Gold Dragonborn", "Green Dragonborn", "Red Dragonborn", "Silver Dragonborn", "White Dragonborn"] },
  { race: "Dwarf", subraces: ["Hill Dwarf", "Mountain Dwarf", "Duergar"] },
  { race: "Elf", subraces: ["High Elf", "Wood Elf", "Dark Elf (Drow)", "Eladrin", "Sea Elf", "Shadar-kai"] },
  { race: "Gnome", subraces: ["Forest Gnome", "Rock Gnome", "Deep Gnome (Svirfneblin)"] },
  { race: "Half-Elf", subraces: ["Half-Elf (Standard)", "Half-Elf (Aquatic)", "Half-Elf (Drow)", "Half-Elf (Wood Elf)"] },
  { race: "Half-Orc", subraces: ["Half-Orc"] },
  { race: "Halfling", subraces: ["Lightfoot Halfling", "Stout Halfling", "Ghostwise Halfling"] },
  { race: "Human", subraces: ["Standard Human", "Variant Human"] },
  { race: "Tiefling", subraces: ["Tiefling (Bloodline of Asmodeus)", "Tiefling (Bloodline of Mephistopheles)", "Tiefling (Bloodline of Zariel)", "Feral Tiefling"] },
  { race: "Aasimar", subraces: ["Protector Aasimar", "Scourge Aasimar", "Fallen Aasimar"] },
  { race: "Genasi", subraces: ["Air Genasi", "Earth Genasi", "Fire Genasi", "Water Genasi"] },
  { race: "Goliath", subraces: ["Goliath"] },
  { race: "Tabaxi", subraces: ["Tabaxi"] },
  { race: "Tortle", subraces: ["Tortle"] },
  { race: "Kenku", subraces: ["Kenku"] },
  { race: "Changeling", subraces: ["Changeling"] },
  { race: "Warforged", subraces: ["Warforged"] }
];

export interface SkillDefinition {
  id: string;
  name: string;
  stat: StatKey;
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  { id: 'acro', name: 'Acrobatics', stat: 'dex' },
  { id: 'anim', name: 'Animal Handling', stat: 'wis' },
  { id: 'arca', name: 'Arcana', stat: 'int' },
  { id: 'athl', name: 'Athletics', stat: 'str' },
  { id: 'dec', name: 'Deception', stat: 'cha' },
  { id: 'hist', name: 'History', stat: 'int' },
  { id: 'ins', name: 'Insight', stat: 'wis' },
  { id: 'intm', name: 'Intimidation', stat: 'cha' },
  { id: 'inv', name: 'Investigation', stat: 'int' },
  { id: 'med', name: 'Medicine', stat: 'wis' },
  { id: 'nat', name: 'Nature', stat: 'int' },
  { id: 'perc', name: 'Perception', stat: 'wis' },
  { id: 'perf', name: 'Performance', stat: 'cha' },
  { id: 'pers', name: 'Persuasion', stat: 'cha' },
  { id: 'rel', name: 'Religion', stat: 'int' },
  { id: 'slt', name: 'Sleight of Hand', stat: 'dex' },
  { id: 'ste', name: 'Stealth', stat: 'dex' },
  { id: 'surv', name: 'Survival', stat: 'wis' }
];

export const CONDITIONS_LIST = [
  "Blinded", "Charmed", "Deafened", "Frightened", "Grappled",
  "Incapacitated", "Invisible", "Paralyzed", "Petrified",
  "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"
];

export const BUILTIN_SPELLS: SpellItem[] = [
  {
    id: "sp_hm",
    name: "Hunter's Mark",
    levelTag: "Level 1",
    schoolTag: "Divination",
    classesTag: "Ranger",
    casting_time: "1 Bonus Action",
    range: "90 ft",
    duration: "Concentration, up to 1 hr",
    desc: "You choose a creature you can see within range and mystically mark it as your quarry. Deal an extra 1d6 damage whenever you hit it with a weapon attack, and gain advantage on Wisdom (Perception or Survival) checks to find it."
  },
  {
    id: "sp_sh",
    name: "Shield",
    levelTag: "Level 1",
    schoolTag: "Abjuration",
    classesTag: "Sorcerer, Wizard",
    casting_time: "1 Reaction",
    range: "Self",
    duration: "1 round",
    desc: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile."
  },
  {
    id: "sp_fb",
    name: "Fireball",
    levelTag: "Level 3",
    schoolTag: "Evocation",
    classesTag: "Sorcerer, Wizard",
    casting_time: "1 Action",
    range: "150 ft",
    duration: "Instantaneous",
    desc: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere must make a Dex save, taking 8d6 fire damage on a failure, or half on a success."
  },
  {
    id: "sp_cw",
    name: "Cure Wounds",
    levelTag: "Level 1",
    schoolTag: "Evocation",
    classesTag: "Bard, Cleric, Druid, Paladin, Ranger",
    casting_time: "1 Action",
    range: "Touch",
    duration: "Instantaneous",
    desc: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier."
  },
  {
    id: "sp_ms",
    name: "Misty Step",
    levelTag: "Level 2",
    schoolTag: "Conjuration",
    classesTag: "Sorcerer, Warlock, Wizard",
    casting_time: "1 Bonus Action",
    range: "Self",
    duration: "Instantaneous",
    desc: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see."
  }
];

export const BUILTIN_TRAITS: TraitItem[] = [
  {
    id: "tr_as",
    name: "Action Surge",
    type: "Class Feature",
    classes: ["Fighter"],
    desc: "On your turn, you can take one additional action on top of your regular action and a possible bonus action. Once you use this feature, you must finish a short or long rest before you can use it again."
  },
  {
    id: "tr_sa",
    name: "Sneak Attack",
    type: "Class Feature",
    classes: ["Rogue"],
    desc: "Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it."
  },
  {
    id: "tr_rg",
    name: "Rage",
    type: "Class Feature",
    classes: ["Barbarian"],
    desc: "In combat, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action, gaining advantage on Strength checks/saves, bonus melee damage, and resistance to bludgeoning, piercing, and slashing damage."
  }
];

export const createDefaultCharacter = (): CharacterSheetData => {
  const defaultSlots: CharacterSheetData['slots'] = {};
  for (let i = 1; i <= 9; i++) {
    defaultSlots[i] = { cur: i === 1 ? 2 : 0, max: i === 1 ? 2 : 0 };
  }

  const defaultSkills: CharacterSheetData['skills'] = {};
  SKILL_DEFINITIONS.forEach(s => {
    defaultSkills[s.id] = { prof: false, exp: false };
  });

  return {
    id: 'char_' + Date.now(),
    name: 'Valerius Flameheart',
    charClass: 'Wizard',
    race: 'High Elf',
    background: 'Sage',
    alignment: 'Chaotic Good',
    level: 3,
    exp: '900 XP',
    inspiration: '1',
    speed: 30,
    hitDiceCur: 3,
    hitDiceMax: 3,
    hitDiceType: 'd6',

    ac: 12,
    curHp: 22,
    maxHp: 22,
    tempHp: 0,
    deathSucc: 0,
    deathFail: 0,
    classPtsCur: 3,
    classPtsMax: 3,

    attr_str: 8,
    attr_dex: 14,
    attr_con: 14,
    attr_int: 16,
    attr_wis: 12,
    attr_cha: 10,

    save_str: false,
    save_dex: false,
    save_con: false,
    save_int: true,
    save_wis: true,
    save_cha: false,

    skills: {
      ...defaultSkills,
      arca: { prof: true, exp: false },
      hist: { prof: true, exp: false },
      inv: { prof: true, exp: false },
      perc: { prof: true, exp: false }
    },

    cp: 24,
    sp: 15,
    gp: 85,
    pp: 0,

    exhaustion: 0,
    conditions: [],

    weapons: [
      { id: 'w1', name: 'Quarterstaff', atk: '+1', dmg: '1d6-1 bludgeoning', notes: 'Versatile (1d8)' },
      { id: 'w2', name: 'Dagger', atk: '+4', dmg: '1d4+2 piercing', notes: 'Finesse, light, thrown (20/60)' }
    ],
    otherProfs: 'Languages: Common, Elvish, Draconic, Celestial.\nArmor: None.\nWeapons: Daggers, darts, slings, quarterstaffs, light crossbows.',
    inventory: 'Spellbook, Component Pouch, Scholar\'s Pack, Ink & Quill, Ancient Tome from Candlekeep, 5 Torches, Waterskin.',

    spellAbility: 'INT',
    preparedCur: 6,
    preparedMax: 6,
    concentration: 'None',
    slots: {
      ...defaultSlots,
      1: { cur: 4, max: 4 },
      2: { cur: 2, max: 2 }
    },
    spells: [BUILTIN_SPELLS[1], BUILTIN_SPELLS[4]],
    traits: [
      {
        id: 't_darkvision',
        name: 'Darkvision',
        type: 'Racial Trait',
        desc: 'Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.'
      },
      {
        id: 't_arcane_recovery',
        name: 'Arcane Recovery',
        type: 'Class Feature',
        desc: 'Once per day when you finish a short rest, you can choose expended spell slots to recover with a combined level equal to or less than half your wizard level (rounded up).'
      }
    ],

    personality: 'I use polysyllabic words that convey the impression of great erudition. There\'s nothing I like more than a good mystery.',
    ideals: 'Knowledge. The path to power and self-improvement is through knowledge.',
    bonds: 'I have an ancient scroll that contains clues to an impending arcane disaster.',
    flaws: 'I speak without really thinking through my words, invariably insulting others.',
    backstory: 'Apprenticed in the grand library of Highfall, Valerius sought forgotten arcane arts before embarking on a wandering quest to chronicle the world.',
    campaignNotes: 'Met an eccentric goblin merchant near the Sunken Tower who offered a mysterious stone for 50gp.',
    npcList: 'Archmage Elowen (Mentor, Friendly)\nGarith (Rival wizard in the Academy)\nThrum (Goblin informant)',

    blurredPills: [],
    updatedAt: Date.now()
  };
};

export const getModifier = (score: number): number => Math.floor((score - 10) / 2);
export const getProfBonus = (level: number): number => Math.ceil(1 + level / 4);
