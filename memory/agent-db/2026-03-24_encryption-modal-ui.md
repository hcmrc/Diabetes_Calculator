# Aktion: Create Encryption Modal UI

## Dateien
- Modified: `index.html` - Added encryption modal markup before `</body>`
  - `encryptionModal` - Export encryption options dialog
  - `passwordPromptModal` - Import password prompt dialog
- Modified: `style.css` - Added comprehensive modal styles
  - Modal overlay with backdrop blur
  - Slide-in animations
  - Radio and checkbox styling
  - Password input with toggle button
  - Quick options buttons
  - Dark mode support

## Learnings
- **Modal Pattern**: Used `display:flex` + `opacity` + `pointer-events` pattern for show/hide (like patient-overlay)
- **Safe DOM**: All HTML is static markup with IDs for JS access - no innerHTML with user content
- **CSS Animation**: `transform: translateY(20px) scale(0.98)` -> `translateY(0) scale(1)` for smooth entry
- **CSS :has()**: Used for radio/checkbox styling without JS: `.radio-option:has(input:checked)`
- **Icon Handling**: Lucide icons use `data-lucide` attributes, will be auto-initialized on page load

## Structure
```
encryptionModal (fixed overlay, z-index: 300)
├── modal-content (max-width: 420px)
│   ├── modal-header (title + close button)
│   ├── modal-body (description + options + password section)
│   └── modal-footer (cancel + download buttons)

passwordPromptModal (same structure)
└── Simpler: just password input + decrypt button
```

## Element IDs for JS Access

### Export Modal
- `encryptionModal` - Container (use `classList.add('open')` to show)
- `encOptionNone`, `encOptionPassword` - Radio buttons
- `encPasswordSection` - Password section (toggle visibility)
- `encPasswordInput` - Password input field
- `encPasswordToggle` - Visibility toggle button
- `encPasswordError` - Error message
- `encQuickOptions` - Quick options container
- `encUseLastPassword`, `encUseDefaultPassword` - Quick option buttons
- `encRememberSession`, `encSetDefault` - Checkboxes
- `encCancelBtn`, `encDownloadBtn` - Action buttons

### Import Modal
- `passwordPromptModal` - Container
- `pwdPromptInput` - Password input
- `pwdPromptToggle` - Visibility toggle
- `pwdPromptError`, `pwdPromptErrorText` - Error display
- `pwdPromptCancelBtn`, `pwdPromptDecryptBtn` - Action buttons

## Risiken
- **Low Risk**: Pure UI changes, no existing functionality modified
- `crypto-service.js` already added to index.html (loaded before patient-manager.js)
- Tests not affected (modals are hidden by default with `display:none`)
- Responsive design handles mobile screens (480px breakpoint)
- Dark mode variables use existing CSS custom properties
