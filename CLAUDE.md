# Project Instructions

## Memory & Context

**Vor jeglicher Arbeit in diesem Projekt müssen ALLE Dokumente im `memory/` Ordner gelesen werden.**

Dies ist Pflicht - nicht optional. Die Memory-Dokumente enthalten kritische Kontextinformationen:

- `memory/CODEBASE_MEMORY.md` — Architektur, Script-Ladereihenfolge, APIs, Fallstricke
- `memory/agent-db/*.md` — Agent-Sessions, Entscheidungen, Kontext aus vorherigen Arbeiten

## Warum das wichtig ist

- **Script-Ladereihenfolge**: Die Reihenfolge in `index.html` ist kritisch und darf nicht geändert werden
- **ARIC-Studie Koeffizienten**: `CONFIG.BETAS` und `CONFIG.MEANS` sind publizierte Werte
- **EID-Kommentare**: SRK-Taxonomie Kommentare sind beabsichtigt (Masterarbeit)
- **Test-Infrastruktur**: 481 Tests müssen weiterhin grün bleiben

## Learnings dokumentieren (Pflicht!)

**Nach jeder Agent-Session müssen Learnings in der Agent-Datenbank gespeichert werden.**

### Dateiname-Format
```
YYYY-MM-DD_<kurze-beschreibung>.md
```

### Inhalt pro Eintrag
```markdown
# Aktion: <was wurde gemacht>
## Dateien: <geaenderte Dateien>
## Learnings: <was man wissen muss>
## Risiken: <was koennte kaputt gehen>
```

Beispiele siehe `memory/agent-db/`

## Checkliste vor jeder Änderung

1. [ ] `memory/CODEBASE_MEMORY.md` gelesen
2. [ ] Alle `.md` Dateien in `memory/agent-db/` gelesen
3. [ ] Verstanden, was NICHT geändert werden darf
4. [ ] Tests laufen lassen vor dem Commit
5. [ ] Learnings in `memory/agent-db/` dokumentiert

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
