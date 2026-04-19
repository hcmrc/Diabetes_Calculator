# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

---

# Project Instructions

## Memory & Context

**Pflichtlektüre vor jeder Arbeit:**

| Datei | Wann lesen? |
|-------|-------------|
| `memory/CODEBASE_MEMORY.md` | **IMMER** — Architektur, APIs, Fallstricke |
| `memory/AGENT_GUIDELINES.md` | **IMMER** — Arbeitsweise, Speicherregeln |
| `memory/features/<topic>.md` | Nur wenn Feature betroffen |
| `memory/active/` | Nur bei aktueller Bug-Suche |

## Neue Memory-Struktur

```
memory/
├── CODEBASE_MEMORY.md     # Architektur (IMMER lesen)
├── AGENT_GUIDELINES.md    # Arbeitsweise (IMMER lesen)
├── features/              # Konsolidierte Feature-Docs
│   ├── tutorial.md
│   ├── ocr.md
│   ├── i18n.md
│   ├── landing-page.md
│   └── model-switcher.md
├── active/                # Aktuelle Sessions (letzte 14 Tage)
└── archive/               # Archivierte Sessions (gezippt)
```

## Warum das wichtig ist

- **Script-Ladereihenfolge**: Die Reihenfolge in `index.html` ist kritisch
- **ARIC-Studie Koeffizienten**: `CONFIG.BETAS` und `CONFIG.MEANS` sind publizierte Werte
- **EID-Kommentare**: SRK-Taxonomie Kommentare sind beabsichtigt (Masterarbeit)
- **Test-Infrastruktur**: 556+ Tests müssen grün bleiben

## Learnings dokumentieren (Pflicht!)

**Nach jeder Agent-Session:** Eintrag in `memory/active/` erstellen

**Format:**
```markdown
# Aktion: <kurze Beschreibung>
## Dateien: <geänderte Dateien>
## Learnings: <was man wissen muss>
## Risiken: <was kaputt gehen könnte>
```

**Bei Feature-Abschluss:** Konsolidierung in `memory/features/<feature>.md`

## Checkliste vor jeder Änderung

1. [ ] `memory/CODEBASE_MEMORY.md` gelesen
2. [ ] `memory/AGENT_GUIDELINES.md` gelesen
3. [ ] Relevante Feature-Docs gelesen (falls betroffen)
4. [ ] Verstanden, was NICHT geändert werden darf
5. [ ] Tests laufen lassen vor dem Commit
6. [ ] Learnings in `memory/active/` dokumentiert

---

## Design Context

### Users
**Primary users:** Medical laypersons (patients) who want to understand their personal risk of developing type 2 diabetes.

**Context:** Users may be anxious about their health. They need clear, trustworthy information without overwhelming medical jargon. The interface should help them understand their risk factors and potential interventions in an accessible way.

**Job to be done:** Understand current diabetes risk, see which factors contribute most, and explore how lifestyle changes could affect their risk.

### Brand Personality
**Three words:** Nüchtern (sober/matter-of-fact), Modern, Medical

**Voice & Tone:** Clinical and trustworthy, not cold or sterile. Authoritative but accessible. Precise without being intimidating.

**Emotional goals:**
- Build trust through transparency (EID model disclosure)
- Reduce anxiety through clarity and control
- Empower users with actionable insights
- Feel like a premium health tool, not hospital software

### Aesthetic Direction
**Visual tone:** Apple-inspired minimalism. Clean, uncluttered, intentional spacing. Neutral color palette with purposeful accent colors.

**Reference:** https://www.apple.com - clean layouts, generous whitespace, subtle depth through shadows, frosted glass effects.

**Anti-reference:** Cold hospital/clinical interfaces - avoid sterile white/green aesthetics, overwhelming data density, generic medical software look.

**Theme:** Light mode default with dark mode support. Both modes should feel premium and intentional.

### Design Principles

1. **Constraint Compliance**
   - Traffic light system (red/orange/green) for overall risk MUST stay
   - Slider status colors MUST stay but can be softened
   - Barchart and therapy option colors MUST stay and remain synchronized
   - Plus Jakarta Sans typography MUST stay and be consistently applied

2. **Restrained Color Palette**
   - Not overloaded with colors
   - Neutral grays as primary (#3a3a3c already established)
   - Semantic colors (safe, alert, warning, danger) for status indication
   - All existing colors can be softened/tuned but not replaced

3. **Ecological Interface Design**
   - Abstraction Hierarchy representation (already designed into the app)
   - Skills-Rules-Knowledge taxonomy support
   - Direct perception through visual mappings

4. **Typography Consistency**
   - Plus Jakarta Sans throughout
   - Clear hierarchy with the existing simplified 5-size system
   - Unified application across all dashboard elements

5. **Premium Feel**
   - Apple-inspired subtle shadows and depth
   - Frosted glass effects where appropriate
   - Smooth animations and transitions
   - Medical-grade trustworthiness without the coldness

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
