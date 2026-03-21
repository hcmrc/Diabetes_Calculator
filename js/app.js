/**
 * @fileoverview Application controller — state management & event wiring.
 *
 * Orchestrates the interaction between the RiskModel, UIController,
 * RadarChart, and TimelineChart modules. Handles slider events, unit
 * toggling, reset, snapshot, and scenario comparison logic.
 *
 * @module App
 * @memberof DRC
 */

'use strict';

DRC.App = (() => {
    const UI    = () => DRC.UIController;
    const Model = () => DRC.RiskModel;
    const Radar = () => DRC.RadarChart;
    const Timeline = () => DRC.TimelineChart;
    const CFG   = DRC.CONFIG;

    /** Application state (mutable). */
    const state = {
        isMetric: false,
        prevRiskPct: null,
        activeField: null,
        baselineRisk: null,
        isComparingScenario: false,
        /**
         * Precise SI-unit values, updated on every calculation.
         * Used as the "source of truth" during unit switches to prevent
         * cumulative rounding drift from repeated conversions.
         */
        preciseSI: null
    };

    let _highlightedField = null;

    // Cache for field elements (performance optimization)
    const fieldElementCache = new Map();

    /** Populate cache with all field elements. */
    const populateFieldCache = () => {
        fieldElementCache.clear();
        document.querySelectorAll('[data-field]').forEach(el => {
            const field = el.getAttribute('data-field');
            if (!fieldElementCache.has(field)) {
                fieldElementCache.set(field, []);
            }
            fieldElementCache.get(field).push(el);
        });
    };

    /** Re-apply cross-panel highlight after DOM re-renders. */
    const reapplyHighlight = () => {
        if (!_highlightedField) return;
        const elements = fieldElementCache.get(_highlightedField);
        if (elements) {
            elements.forEach(n => n.classList.add('factor-highlight'));
        }
    };

    // ─── Core calculation pipeline ──────────────────────────────────────

    /**
     * Full recalculation: reads inputs, runs the model, updates all UI.
     * @returns {number} Current risk percentage.
     */
    const calculate = () => {
        const rawInputs     = UI().readInputs();
        const siVals        = Model().toSI(rawInputs, state.isMetric);
        state.preciseSI     = { ...siVals };   // Preserve full-precision SI values
        const riskPct       = Model().computeProbability(siVals) * 100;
        const contributions = Model().computeContributions(siVals);
        const treatStatus   = Model().getElevatedFactors(siVals);

        // Render all views with the calculated data
        _renderAllViews(riskPct, contributions, treatStatus, siVals);
        return riskPct;
    };

    /**
     * Render all views with calculated data.
     * Extracted to eliminate DRY violation between calculate() and onToggleUnits().
     * @param {number} riskPct - Current risk percentage
     * @param {Object} contributions - Factor contributions
     * @param {Object} treatStatus - Treatment status with elevated factors
     * @param {Object} siVals - SI-unit values
     */
    const _renderAllViews = (riskPct, contributions, treatStatus, siVals) => {
        UI().renderRisk(riskPct);
        UI().updateNonModSummary();
        UI().updateModSummary();
        UI().renderIconArray(riskPct);
        UI().renderContributionChart(contributions);
        UI().renderHeatmapPointer(contributions);
        UI().renderTreatmentOverview(treatStatus, contributions);
        UI().renderTreatmentRecommendations(treatStatus, contributions);
        UI().renderCausalityChains(siVals, treatStatus.elevatedFactors);
        Radar().render(siVals, treatStatus.elevatedFactors);

        if (state.isComparingScenario && state.baselineRisk !== null) {
            UI().renderScenarioComparison(state.baselineRisk, riskPct);
        }

        if (state.activeField && state.prevRiskPct !== null) {
            UI().renderWhatIfBadge(state.activeField, riskPct - state.prevRiskPct);
        }

        // Refresh cache after DOM updates (for performance optimization)
        populateFieldCache();
        reapplyHighlight();
    };

    // ─── Slider event handlers ──────────────────────────────────────────

    const onSliderInput = (field) => {
        const slider = document.getElementById(`${field}-slider`);
        const input  = document.getElementById(`${field}-value`);
        if (slider && input) input.value = slider.value;
        UI().updateSliderFill(field);
        state.activeField = field;
        calculate();
    };

    const onSliderStart = (field) => {
        state.activeField = field;
        const raw = UI().readInputs();
        state.prevRiskPct = Model().computeProbability(Model().toSI(raw, state.isMetric)) * 100;
    };

    const onSliderEnd = (field) => {
        setTimeout(() => {
            const badge = document.getElementById(`what-if-${field}`);
            if (badge) badge.className = 'what-if-badge';
        }, 2000);
        state.prevRiskPct = null;
        state.activeField = null;
    };

    const onValueChange = (field) => {
        const slider = document.getElementById(`${field}-slider`);
        const input  = document.getElementById(`${field}-value`);
        if (!slider || !input) return;

        let val = parseFloat(input.value);
        val = Math.min(Math.max(val, parseFloat(slider.min)), parseFloat(slider.max));
        input.value  = val;
        slider.value = val;

        UI().updateSliderFill(field);
        calculate();
    };

    // ─── Unit toggle ────────────────────────────────────────────────────

    const onToggleUnits = () => {
        const prev = state.isMetric;
        state.isMetric = document.getElementById('unit-toggle').checked;
        if (prev === state.isMetric) return;

        // ── Rounding-drift prevention ──────────────────────────────────
        // Convert slider values FROM the stored precise SI values rather
        // than from the (rounded) DOM values. This eliminates cumulative
        // rounding errors that occur when converting back and forth:
        //   US 100 mg/dL → SI 5.6 (rounded) → US 100.8 (drift!)
        // By always starting from precise SI, the conversion is:
        //   preciseSI 5.5556 → US: 5.5556 / (1/18) = 100.0 (exact)
        //   preciseSI 5.5556 → SI: 5.5556 → display 5.6 (only display rounds)

        UI().updateUnitLabels(state.isMetric);
        UI().updateSliderRanges(state.isMetric ? 'si' : 'us');

        // Convert each convertible field from precise SI to target unit
        if (state.preciseSI) {
            const mode = state.isMetric ? 'si' : 'us';
            CFG.CONVERTIBLE_FIELDS.forEach(f => {
                const siVal = state.preciseSI[f];
                if (siVal == null) return;
                // Convert from SI to target display unit
                // When in SI mode: use siVal directly (just clamp/round)
                // When in US mode: convert from SI to US
                const converted = state.isMetric
                    ? siVal  // Already in SI, just need rounding
                    : DRC.ConversionService.convertField(f, siVal, false); // SI to US
                const [min, max, step] = CFG.RANGES[f][mode];
                const display = DRC.UIHelpers.clampAndRound(converted, min, max, step);
                const input  = document.getElementById(`${f}-value`);
                const slider = document.getElementById(`${f}-slider`);
                if (input)  input.value  = display;
                if (slider) slider.value = display;
            });
        }

        UI().updateAllSliderFills();

        // Render with precise SI values (no rounding in the model path)
        const preciseSI     = state.preciseSI || Model().toSI(UI().readInputs(), state.isMetric);
        const riskPct       = Model().computeProbability(preciseSI) * 100;
        const contributions = Model().computeContributions(preciseSI);
        const treatStatus   = Model().getElevatedFactors(preciseSI);

        _renderAllViews(riskPct, contributions, treatStatus, preciseSI);
    };

    // ─── Reset ──────────────────────────────────────────────────────────

    /**
     * Reset all inputs to the active patient's saved values, or to
     * CONFIG.DEFAULTS if no patient is loaded. This allows patients to
     * undo exploratory what-if changes and return to their saved baseline.
     *
     * Design rationale: Resetting to the active patient's values (rather
     * than fixed defaults) supports the EID principle of situation-specific
     * reference points (Vicente, 1999), enabling meaningful before/after
     * comparisons within a patient's clinical context.
     */
    const onReset = () => {
        const patientData = DRC.PatientManager?.getActivePatientData?.();
        const D = CFG.DEFAULTS;

        const setField = (field, val) => {
            const slider = document.getElementById(`${field}-slider`);
            const input  = document.getElementById(`${field}-value`);
            if (slider) slider.value = val;
            if (input)  input.value  = val;
        };

        if (patientData) {
            // Reset to active patient's saved values — applyValues handles unit conversion
            DRC.PatientManager.applyValues(patientData);
        } else {
            // No active patient: fall back to CONFIG defaults (US units)
            document.getElementById('unit-toggle').checked = false;
            state.isMetric = false;
            UI().updateUnitLabels(false);
            UI().updateSliderRanges('us');

            setField('age', D.age);
            setField('sbp', D.sbp);
            setField('height',  D.height.us);
            setField('waist',   D.waist.us);
            setField('fastGlu', D.fastGlu.us);
            setField('cholHDL', D.cholHDL.us);
            setField('cholTri', D.cholTri.us);

            document.getElementById('race-toggle').checked      = D.race;
            document.getElementById('parentHist-toggle').checked = D.parentHist;
        }

        CFG.SLIDER_FIELDS.forEach(f => {
            const badge = document.getElementById(`what-if-${f}`);
            if (badge) badge.className = 'what-if-badge';
        });

        UI().updateAllSliderFills();
        Timeline().clear();
        if (DRC.TreatmentSimulator?.resetSimulated) DRC.TreatmentSimulator.resetSimulated();
        calculate();
    };

    // ─── Snapshot & scenario comparison ─────────────────────────────────

    const onSnapshot = () => {
        const raw   = UI().readInputs();
        const si    = Model().toSI(raw, state.isMetric);
        const risk  = Model().computeProbability(si) * 100;
        Timeline().addSnapshot(risk, si);
    };

    const onCompareScenario = () => {
        const raw  = UI().readInputs();
        const si   = Model().toSI(raw, state.isMetric);
        const risk = Model().computeProbability(si) * 100;

        state.isComparingScenario = !state.isComparingScenario;
        const btn   = document.getElementById('compareScenarioBtn');
        const panel = document.getElementById('scenario-comparison');

        if (state.isComparingScenario) {
            state.baselineRisk = risk;
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i data-lucide="flag" class="lucide-icon"></i> Reset Baseline';
            }
            if (panel) panel.style.display = 'flex';
            UI().renderScenarioComparison(state.baselineRisk, risk);
            Timeline().setBaseline(risk); // render() handles lucide.createIcons() internally
        } else {
            state.baselineRisk = null;
            Timeline().clearBaseline();
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i data-lucide="flag" class="lucide-icon"></i> Set Baseline';
            }
            if (panel) panel.style.display = 'none';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    // ─── Initialization ─────────────────────────────────────────────────

    const init = () => {
        // Slider event binding
        CFG.SLIDER_FIELDS.forEach(field => {
            const slider = document.getElementById(`${field}-slider`);
            if (!slider) return;
            slider.addEventListener('input',      () => onSliderInput(field));
            slider.addEventListener('mousedown',  () => onSliderStart(field));
            slider.addEventListener('touchstart', () => onSliderStart(field), { passive: true });
            slider.addEventListener('mouseup',    () => onSliderEnd(field));
            slider.addEventListener('touchend',   () => onSliderEnd(field));
        });

        // Value input change binding
        CFG.SLIDER_FIELDS.forEach(field => {
            const input = document.getElementById(`${field}-value`);
            if (input) input.addEventListener('change', () => onValueChange(field));
        });

        // Toggle inputs
        ['race-toggle', 'parentHist-toggle'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', calculate);
        });

        // Unit toggle
        document.getElementById('unit-toggle')?.addEventListener('change', onToggleUnits);

        // Action buttons
        document.getElementById('resetBtn')?.addEventListener('click', onReset);
        document.getElementById('snapshotBtn')?.addEventListener('click', onSnapshot);
        document.getElementById('compareScenarioBtn')?.addEventListener('click', onCompareScenario);

        // Timeline expandable toggle
        document.getElementById('timelineToggleBtn')?.addEventListener('click', () => {
            const area = document.getElementById('timeline-expandable');
            if (!area) return;
            const isOpen = area.classList.toggle('open');
            document.getElementById('timelineToggleBtn')?.classList.toggle('active', isOpen);
        });

        // Hero expandable toggle
        const expandHeroBtn = document.getElementById('expandHeroBtn');
        const heroExpandable = document.getElementById('hero-expandable');
        if (expandHeroBtn && heroExpandable) {
            expandHeroBtn.addEventListener('click', () => {
                const isOpen = heroExpandable.classList.toggle('open');
                expandHeroBtn.classList.toggle('open', isOpen);
                expandHeroBtn.setAttribute('aria-expanded', isOpen);
            });
        }

        // Cross-panel factor highlight on hover (with caching for performance)
        // Initial population
        populateFieldCache();

        document.addEventListener('mouseover', (e) => {
            const fieldEl = e.target.closest('[data-field]');
            const field = fieldEl?.getAttribute('data-field') || null;
            if (field === _highlightedField) return;

            // Remove highlight from previously highlighted elements using cache
            if (_highlightedField) {
                const prevElements = fieldElementCache.get(_highlightedField);
                if (prevElements) {
                    prevElements.forEach(n => n.classList.remove('factor-highlight'));
                }
            }

            _highlightedField = field;

            // Add highlight to new field using cache
            if (field) {
                let elements = fieldElementCache.get(field);
                // If not in cache, query and cache (for dynamically added elements)
                if (!elements) {
                    elements = Array.from(document.querySelectorAll(`[data-field="${field}"]`));
                    fieldElementCache.set(field, elements);
                }
                elements.forEach(n => n.classList.add('factor-highlight'));
            }
        });

        // Tab navigation — scoped per panel so Model and Treatment tabs
        // operate independently and don't interfere with each other.
        document.querySelectorAll('.model-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const panelBody = tab.closest('.panel-body');
                if (!panelBody) return;
                panelBody.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
                panelBody.querySelectorAll('.model-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById('tab-' + tab.getAttribute('data-tab'));
                if (target) target.classList.add('active');
            });
        });

        // Collapsible sections
        document.querySelectorAll('.section-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const target = document.getElementById(targetId);
                if (!target) return;
                const collapsed = target.classList.toggle('collapsed');
                btn.classList.toggle('collapsed', collapsed);
                if (targetId === 'non-mod-section') {
                    document.getElementById('non-mod-summary')?.classList.toggle('visible', collapsed);
                }
                if (targetId === 'mod-section') {
                    document.getElementById('mod-summary')?.classList.toggle('visible', collapsed);
                }
            });
        });

        // Panel-level collapse buttons
        document.querySelectorAll('.panel-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const panelId = btn.getAttribute('data-panel');
                const panel = document.getElementById(panelId);
                if (!panel) return;
                const body = panel.querySelector('.panel-body');
                const subtitle = panel.querySelector('.panel-subtitle');
                const isCollapsed = btn.classList.toggle('collapsed');
                btn.setAttribute('aria-expanded', String(!isCollapsed));
                if (body) body.classList.toggle('panel-hidden', isCollapsed);
                if (subtitle) subtitle.classList.toggle('panel-hidden', isCollapsed);
            });
        });

        // Initialize sub-modules and run first calculation
        UI().renderBetaVectors();
        Radar().init();
        UI().updateAllSliderFills();
        calculate();
    };

    /** Activate scenario-comparison mode (called by TreatmentSimulator). */
    const setCompareScenario = (baselineRisk) => {
        state.isComparingScenario = true;
        state.baselineRisk = baselineRisk;
    };

    return { init, _calculate: calculate, _getState: () => ({ ...state }), _setCompareScenario: setCompareScenario };
})();
