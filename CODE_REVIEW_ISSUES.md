# Code Review Report: Lossless Unit Toggle & Related Changes

**Date:** 2026-04-18  
**Scope:** ~2,000 lines across 14 files  
**Last Commit:** `3d85e4d`  
**Reviewer:** Automated code review (3 parallel agents: Security, Correctness/Logic, Accessibility/UX)

---

## Critical / High

| # | File | Line | Issue |
|---|------|------|-------|
| H1 | `js/treatment-simulator.js` | 166 | **`getIndividualReduction` uses legacy Map without unit conversion** — After unit toggle, `_simulated.get(factor)` (old display units) is mixed with current display-unit inputs, producing a completely wrong SI value. The reduction pill shows incorrect data after unit toggle. **Fix:** Replace `_simulated.get(factor)` with `_resolveSnapshotValue(factor)`. |
| H2 | `js/app.js` | 605–619 | **Section collapse buttons never update `aria-expanded`** — Attribute stays `true` even when section is collapsed. WCAG 4.1.2 violation. **Fix:** Add `btn.setAttribute('aria-expanded', String(!collapsed))` after toggle. |
| H3 | `js/patient-manager.js` | 41–135 | **`showConfirm`/`showPrompt` lacks focus trap** — Keyboard users can Tab out of the dialog into page content behind it. WCAG 2.4.3 violation. **Fix:** Use `DRC.Utils.createFocusTrap(overlay)` like the static modals do. |
| H4 | `js/ui-controller.js` | 984 | **Undo `aria-label` announces raw factor key ("fastGlu")** — Screen reader reads "Undo treatment for fastGlu" instead of a translated name. **Fix:** Use `t('factors.' + factor, ...)` for display name, add `buttons.undoTreatment` key with `{factor}` placeholder to all 4 translation JSONs. |

## Medium

| # | File | Line | Issue |
|---|------|------|-------|
| M1 | `js/treatment-simulator.js` | 230–231, 248–250 | **Non-step-aligned values after unit toggle on unsimulate/cancel** — Converted snapshot value may have ugly decimals (e.g. 5.2778 mmol/L when step=0.1). Risk calculation is correct (uses `state.preciseSI`) but visual display is wrong. **Fix:** Align to step before setting on DOM. |
| M2 | `js/patient-manager.js` | 771–773 | **Save-guard "Cancel" saves simulated values instead of aborting** — Confirm dialog means "Cancel" = proceed with simulated values. User clicking Cancel to abort the save instead saves wrong data. **Fix:** Replace with three-option dialog (Save Original / Save Simulated / Cancel Save). |
| M3 | `js/app.js` | 159–184 | **`_mergePreciseSI` silently absorbs user-typed non-step values within tolerance** — If user types 100.5 (step=1), and delta ≤ half-step, merge keeps old value. Risk calculation doesn't reflect the user's input. **Fix:** Round `onValueChange` to step before calling `calculate()`. |
| M4 | `js/patient-manager.js` | 37 | **Toast `display:none` breaks `aria-live` re-announcement** — Some screen readers ignore content added to a `display:none` element. **Fix:** Use `visibility:hidden` or `opacity:0` instead of `display:none`. |
| M5 | `js/app.js` | 1094–1107 | **Redundant keydown handler on `tov-clickable` `<button>`** — Native buttons self-activate on Enter/Space. The handler causes double-toggle, making expand/collapse non-functional for keyboard users. **Fix:** Remove the keydown handler. Ensure `.tov-label-row` CSS resets button (`background:none; border:none; padding:0; font:inherit; color:inherit;`). |
| M6 | `js/treatment-simulator.js` | 146–150 | **Simulated slider has no screen-reader indication** — Screen reader user doesn't know the value is hypothetical. Clinically risky. **Fix:** Add `aria-label`/`aria-describedby` with translated "(simulated)" string. |
| M7 | `index.html` | 899 | **Cancel button: borderless + `--text-secondary` may fail contrast** — Looks like plain text rather than a clickable control. **Fix:** Keep a subtle border or verify contrast ratio. |

## Low

| # | File | Line | Issue |
|---|------|------|-------|
| L1 | `js/patient-manager.js` | 68, 116 | `showConfirm`/`showPrompt` doesn't restore focus on close — keyboard users lose position. |
| L2 | `js/app.js` | 381 | Fallback `toSI` uses updated `isMetric` on stale DOM values if `preciseSI` is null. Dead path after `init()`, but defensively wrong. |
| L3 | `js/treatment-simulator.js` | 308–312 | `resetSimulated` does redundant cleanup already performed by `cancel()`. |
| L4 | `js/patient-manager.js` | 770 | Local translator shadows module-level translator — confusing, not incorrect. |
| L5 | `js/treatment-simulator.js` | 317 | Shallow copy of snapshot shares nested object references — callers could corrupt internal state if they mutate. |
| L6 | `js/ui-controller.js` | 53–96 | `createSafeElement attrs` accepts arbitrary attribute names — architectural note: keys should always be developer-controlled. |

## Positive Findings

- Flag SVGs safely migrated to `createElementNS` — eliminates `innerHTML` XSS vector
- `buildTherapiesHTML` → `buildTherapyElements` — safe DOM construction replaces HTML strings
- `appendTherapiesToDetails` (DOMParser) removed — reduces attack surface
- `tov-label-row` to native `<button>` — proper semantics + built-in keyboard activation
- `aria-controls` added to collapse buttons — links button to controlled section
- `aria-valuetext` with clinical zones (Normal/Elevated/High) — excellent for screen readers
- `X-Frame-Options` meta correctly removed — `frame-ancestors 'none'` CSP is the effective control
- Focus trap updated to handle nested modal overlays

---

## Priority Recommendations

1. **H1** is the most impactful one-line fix: `_simulated.get(factor)` → `_resolveSnapshotValue(factor)`
2. **H2–H4** are WCAG violations affecting keyboard/screen-reader users
3. **M2** is a UX concern that could cause unintended data being saved
4. **M5** makes expand/collapse non-functional for keyboard users (double-toggle)