# Aktion: Profil-Umbenennung Feature

## Dateien
- **Modified:** `js/patient-manager.js`
- **Modified:** `style.css`

## Feature
Benutzer können Profile nachträglich umbenennen.

## Änderungen

### 1. Neue Funktion `renamePatient(id, newName)` (js/patient-manager.js)
```javascript
const renamePatient = (id, newName) => {
    if (!newName?.trim()) return false;
    const patient = patients.find(p => p.id === id);
    if (!patient) return false;
    patient.name = newName.trim();
    _persistAndRender();
    updateNavLabel();
    return true;
};
```

### 2. Rename-Button in renderList() hinzugefügt
```javascript
const renameBtn = mkBtn('rename', 'Rename profile', 'rename', 'pencil');
actions.appendChild(renameBtn);
```

### 3. Event Listener für Rename
```javascript
renameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const newName = prompt(`Rename "${p.name}" to:`, p.name);
    if (newName && newName.trim() && newName.trim() !== p.name) {
        renamePatient(p.id, newName.trim());
    }
});
```

### 4. Public API Export
```javascript
return { init, loadPatient, applyValues, captureCurrentValues, updateNavLabel, getActivePatientData, addPatient, renamePatient };
```

### 5. CSS für Rename-Button Hover
```css
.pd-btn-icon.rename:hover .lucide-icon {
    color: var(--primary) !important;
}
```

## UI

### Vorher:
- [Export] [Save] [Delete]

### Nachher:
- [Export] [Rename] [Save] [Delete]

Klick auf Rename öffnet einen nativen `prompt()` Dialog mit dem aktuellen Namen vorausgefüllt.

## Verhalten
- Leerer Name oder gleicher Name → Keine Änderung
- Neuer Name → Profil wird umbenannt, UI aktualisiert
- Aktives Profil umbenannt → Nav-Label wird aktualisiert

## Learnings
- Native `prompt()` ist ausreichend für einfache Umbenennung
- `e.stopPropagation()` verhindert das Laden des Profils beim Klick
- Die bestehende `_persistAndRender()` Funktion macht alles was nötig ist

## Risiken
- **Keine** - Alle Änderungen sind rein additive
- Keine Breaking Changes
- Backwards compatible
