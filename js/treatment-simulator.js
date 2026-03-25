/**
 * @fileoverview Treatment Simulator — evidence-based animated interventions.
 *
 * Animates slider values toward clinically-derived treatment targets using
 * ease-out cubic interpolation. Records before/after snapshots on the
 * timeline to visualize the treatment effect.
 *
 * EID mapping: Knowledge-Based Behavior (KBB) — users explore causal
 * treatment effects on the model outcome through interactive simulation.
 *
 * Evidence sources documented in CONFIG.SIMULATION_EFFECTS and the
 * accompanying Designdokumentation_V3.7_Treatment_Simulation.docx.
 *
 * @module TreatmentSimulator
 * @memberof DRC
 */

'use strict';

DRC.TreatmentSimulator = (() => {
    const CFG = DRC.CONFIG;
    let _animating = false;
    const _simulated = new Set();  // Track already-simulated factors
    let _animationTimeoutId = null;  // Track active animation timeout

    /**
     * Get the unit-appropriate treatment delta for a factor.
     * Supports sex-dependent effects (e.g. sbp with siMale/siFemale keys).
     * @param {string} factor — Risk factor key.
     * @returns {number} Expected change in current unit system.
     */
    const getEffectDelta = (factor) => {
        const fx = DRC.CONFIG.SIMULATION_EFFECTS[factor];
        if (!fx) return 0;
        const isMetric = DRC.UIController.getUnitToggleState();
        // Sex-dependent effect (e.g. sbp): check for siMale/siFemale or usMale/usFemale
        if (fx.siMale !== undefined) {
            const isMale = DRC.UIController.readInputs().sex === 1;
            if (isMetric) return isMale ? fx.siMale : fx.siFemale;
            return isMale ? fx.usMale : fx.usFemale;
        }
        return isMetric ? fx.si : fx.us;
    };

    /**
     * Compute the target slider value after treatment, clamped to range.
     * @param {string} factor — Risk factor key.
     * @returns {{ currentVal: number, targetVal: number, step: number, decimals: number }|null}
     */
    const computeTarget = (factor) => {
        const { input, slider } = DRC.UIController.getSliderElements(factor);
        if (!input || !slider) return null;

        const current = parseFloat(input.value);
        const raw     = current + getEffectDelta(factor);
        const min     = parseFloat(slider.min);
        const max     = parseFloat(slider.max);
        const step    = parseFloat(slider.step) || 1;
        const clamped = DRC.UIHelpers.clampAndRound(raw, min, max, step);
        const decimals = step >= 1 ? 0 : Math.max(0, -Math.floor(Math.log10(step)));

        return { currentVal: current, targetVal: clamped, step, decimals };
    };

    /** Ease-out cubic interpolation: t in [0,1] → decelerated output. */
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    /**
     * Run treatment simulation for one factor.
     * @param {string} factor — Risk factor key (e.g. 'fastGlu', 'sbp').
     */
    const simulate = (factor) => {
        if (_animating) return;
        if (_simulated.has(factor)) return;  // Already simulated
        const info = computeTarget(factor);
        if (!info || info.currentVal === info.targetVal) return;

        const { currentVal, targetVal, step, decimals } = info;
        const label = DRC.CONFIG.SIMULATION_EFFECTS[factor]?.label || factor;
        _animating = true;

        // Disable all simulate buttons during animation
        document.querySelectorAll('.btn-simulate-treatment').forEach(b => b.disabled = true);

        // Auto-set baseline on first simulation
        if (_simulated.size === 0) {
            const raw = DRC.UIController.readInputs();
            const isMetric = DRC.UIController.getUnitToggleState();
            const si  = DRC.RiskModel.toSI(raw, isMetric);
            const risk = DRC.RiskModel.computeProbability(si) * 100;

            // Activate comparison mode via UIController (centralized UI updates)
            DRC.UIController.setComparisonMode(true, risk);

            // Add baseline line + unlabelled baseline snapshot — only if not already set manually
            if (!DRC.TimelineChart.hasBaseline()) {
                DRC.TimelineChart.setBaseline(risk);
            }
            if (DRC.TimelineChart.getLastSnapshot() === null) {
                DRC.TimelineChart.addSnapshot(risk, si, null);
            }
        }

        // Animate
        let frame = 0;
        const tick = () => {
            frame++;
            const progress     = easeOutCubic(frame / CFG.ANIMATION_STEPS);
            const interpolated = currentVal + (targetVal - currentVal) * progress;
            const val = parseFloat(interpolated.toFixed(decimals));

            const { input, slider } = DRC.UIController.getSliderElements(factor);
            if (input)  input.value  = val;
            if (slider) slider.value = val;
            DRC.UIController.updateSliderFill(factor);
            DRC.App.trigger('risk:recalculate');

            if (frame < CFG.ANIMATION_STEPS) {
                _animationTimeoutId = setTimeout(tick, CFG.ANIMATION_DURATION / CFG.ANIMATION_STEPS);
            } else {
                _animationTimeoutId = null;
                onComplete(factor, label);
            }
        };
        tick();
    };

    /** Cancel any running animation and cleanup. */
    const cancel = () => {
        if (_animationTimeoutId) {
            clearTimeout(_animationTimeoutId);
            _animationTimeoutId = null;
        }
        _animating = false;
        document.querySelectorAll('.btn-simulate-treatment').forEach(b => b.disabled = false);
    };

    /** Finalize simulation: take snapshot, flash row, re-enable buttons. */
    const onComplete = (factor, label) => {
        const isMetric = DRC.UIController.getUnitToggleState();
        const raw  = DRC.UIController.readInputs();
        const si   = DRC.RiskModel.toSI(raw, isMetric);
        const risk = DRC.RiskModel.computeProbability(si) * 100;
        DRC.TimelineChart.addSnapshot(risk, si, label);

        // Flash completion animation (1200ms for visual feedback)
        const row = document.querySelector(`.treatment-overview-row[data-field="${factor}"]`);
        if (row) {
            row.classList.add('sim-complete');
            setTimeout(() => row.classList.remove('sim-complete'), CFG.ANIMATION_FLASH_MS);
        }

        _animating = false;
        _simulated.add(factor);

        // Re-enable indicated simulate buttons and update already-simulated ones
        document.querySelectorAll('.btn-simulate-treatment').forEach(b => {
            const simFactor = b.getAttribute('data-sim-factor');
            if (_simulated.has(simFactor)) {
                b.disabled = true;
                b.innerHTML = '<i data-lucide="check-circle" class="lucide-icon"></i> Already Simulated';
                b.classList.add('simulated');
            } else {
                const rowEl = b.closest('.treatment-overview-row');
                b.disabled = !(rowEl?.classList.contains('indicated'));
            }
        });

        // Initialize Lucide icons for updated buttons
        DRC.UIHelpers.refreshIcons();

        // Auto-open timeline if hidden
        const area = document.getElementById('timeline-expandable');
        if (area && !area.classList.contains('open')) {
            area.classList.add('open');
            document.getElementById('timelineToggleBtn')?.classList.add('active');
        }
    };

    return {
        simulate,
        resetSimulated: () => { cancel(); _simulated.clear(); },
        cancel
    };
})();
