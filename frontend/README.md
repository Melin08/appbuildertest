# ⚔️ D&D 5e Character Sheet & Compendium

An interactive, responsive, and feature-rich **Dungeons & Dragons 5th Edition** Character Sheet and Compendium web application.

---

## 🚀 Yes, this project is 100% importable to GitHub!

You can upload or push this entire repository straight to GitHub and run it locally with standard Node/npm tools, or deploy it instantly to **GitHub Pages**, **Vercel**, or **Netlify**.

### 🛠️ Quick Local Setup

1. **Clone or Download** the repository:
   ```bash
   git clone https://github.com/your-username/dnd-5e-character-sheet.git
   cd dnd-5e-character-sheet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```
   Static output will be written to the `dist/` directory, ready for deployment!

---

## 🌟 Key Features

- **Dynamic Stats & Modifiers**: Automatically computes attribute modifiers, proficiency bonus (+2 to +6 based on level 1–20), passive perception, passive insight, and skill totals.
- **Proficiency & Expertise Toggles**: Toggle proficiency (`●`) and expertise (`◆`) on all 18 D&D 5e skills.
- **Rest Engine**:
  - **Short Rest**: Roll and spend available Hit Dice to recover HP.
  - **Long Rest**: Full reset of HP, temporary HP, death saves, spell slots, class resource points, and recovers half total Hit Dice.
- **Interactive Spell Slot Pips**: Click individual slot bubbles across levels 1 through 9 to mark spent or recovered slots.
- **Integrated Dice Roller**: 1-click rolling for `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100` and skill/save checks with roll history.
- **Damage & Heal Quick Calculator**: `±` modal with support for damage calculations, healing, and temporary HP buffers.
- **5e SRD Compendium Integration**: Search through hundreds of official 5e spells and class features or create custom homebrew abilities.
- **Multi-Character Roster**: Create, manage, switch between, and delete multiple character sheets saved automatically in `localStorage`.
- **JSON Backup & Restore**: Export full JSON backups of single characters or your entire roster, and import them anytime on any device.
- **Privacy Mode (Blur Toggles)**: Eye toggle icon to blur secret stats/identities when streaming or playing in public.
- **Notes & Lore Suite**: Dedicated sub-tabs for campaign session logs, personality traits/flaws/bonds/ideals, and NPC faction relations.

---

## 📁 Repository Structure

```
├── App.tsx                     # Main layout & character state manager
├── index.html                  # HTML entry point with Tailwind & importmap
├── index.tsx                   # React 19 root mount
├── types.ts                    # TypeScript interfaces & definitions
├── constants.ts                # 5e SRD catalogs, races, classes & formulas
├── services/
│   └── dndApi.ts               # Open 5e SRD API integration & cache
├── components/
│   ├── Header.tsx              # Action bar, character switcher & rest buttons
│   ├── VitalsHUD.tsx           # AC, HP, Death Saves & Class points
│   ├── HpModal.tsx             # Quick math calculator dialog
│   ├── AttributesAndSkills.tsx # Ability scores & skill proficiencies
│   ├── CombatAndWeapons.tsx    # Dice roller, weapons table & conditions
│   ├── AbilitiesSection.tsx    # Features, traits & compendium search
│   ├── SpellsSection.tsx       # Spellbook & interactive slot pips
│   ├── JournalTab.tsx          # Lore, campaign logs & NPC roster
│   └── RosterModal.tsx         # Saved character switcher modal
├── package.json                # npm scripts & dependencies
├── tsconfig.json               # TypeScript compiler config
└── vite.config.ts              # Vite dev server configuration
```

---

## 📜 License & Credits

- Uses the official Open Game License (OGL) System Reference Document (SRD 5.1).
- Designed for tabletop roleplayers, dungeon masters, and homebrewers.
