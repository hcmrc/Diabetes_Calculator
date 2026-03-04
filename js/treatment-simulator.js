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
    const DURATION = 1500;   // Animation duration in ms
    const STEPS    = 30;     // Number of animation frames
    let _animating = false;

    /**
     * Get the unit-appropriate treatment delta for a factor.
     * @param {string} factor — Risk factor key.
     * @returns {number} Expected change in current unit system.
     */
    const getEffectDelta = (factor) => {
        const fx = DRC.CONFIG.SIMULATION_EFFECTS[factor];
        if (!fx) return 0;
        const isMetric = document.getElementById('unit-toggle')?.checked || false;
        return isMetric ? fx.si : fx.us;
    };

    /**
     * Compute the target slider value after treatment, clamped to range.
     * @param {string} factor — Risk factor key.
     * @returns {{ currentVal: number, targetVal: number, step: number }|null}
     */
    const computeTarget = (factor) => {
        const input  = document.getElementById(`${factor}-value`);
        const slider = document.getElementById(`${factor}-slider`);
        if (!input || !slider) return null;

        const current = parseFloat(input.value);
        const raw     = current + getEffectDelta(factor);
        const min     = parseFloat(slider.min);
        const max     = parseFloat(slider.max);
        const step    = parseFloat(slider.step) || 1;
        const clamped = DRC.UIHelpers.clampAndRound(raw, min, max, step);

        return { currentVal: current, targetVal: clamped, step };
    };

    /** Ease-out cubic interpolation: t in [0,1] → decelerated output. */
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    /**
     * Run treatment simulation for one factor.
     * @param {string} factor — Risk factor key (e.g. 'fastGlu', 'sbp').
     */
    const simulate = (factor) => {
        if (_animating) return;
        const info = computeTarget(factor);
        if (!info || info.currentVal === info.targetVal) return;

        const { currentVal, targetVal, step } = info;
        const label = DRC.CONFIG.SIMULATION_EFFECTS[factor]?.label || factor;
        _animating = true;

        // Disable all simulate buttons during animation
        document.querySelectorAll('.btn-simulate-treatment').forEach(b => b.disabled = true);

        // "Before" snapshot if in compare mode — skip if last snapshot was already a treatment
        const state = DRC.App._getState?.();
        if (state?.isComparingScenario) {
            const last = DRC.TimelineChart.getLastSnapshot?.();
            if (!last || !last.treatmentLabel) {
                const raw = DRC.UIController.readInputs();
                const si  = DRC.RiskModel.toSI(raw, state.isMetric);
                DRC.TimelineChart.addSnapshot(DRC.RiskModel.computeProbability(si) * 100, si, null);
            }
        }

        // Animate
        let frame = 0;
        const tick = () => {
            frame++;
            const progress     = easeOutCubic(frame / STEPS);
            const interpolated = currentVal + (targetVal - currentVal) * progress;
            const val = step < 1 ? parseFloat(interpolated.toFixed(1)) : Math.round(interpolated);

            const input  = document.getElementById(`${factor}-value`);
            const slider = document.getElementById(`${factor}-slider`);
            if (input)  input.value  = val;
            if (slider) slider.value = val;
            DRC.UIController.updateSliderFill(factor);
            DRC.App._calculate();

            if (frame < STEPS) {
                setTimeout(tick, DURATION / STEPS);
            } else {
                onComplete(factor, label);
            }
        };
        tick();
    };

    /** Finalize simulation: take snapshot, flash row, re-enable buttons. */
    const onComplete = (factor, label) => {
        const isMetric = document.getElementById('unit-toggle')?.checked || false;
        const raw  = DRC.UIController.readInputs();
        const si   = DRC.RiskModel.toSI(raw, isMetric);
        const risk = DRC.RiskModel.computeProbability(si) * 100;
        DRC.TimelineChart.addSnapshot(risk, si, label);

        // Flash completion animation
        const row = document.querySelector(`.treatment-overview-row[data-field="${factor}"]`);
        if (row) {
            row.classList.add('sim-complete');
            setTimeout(() => row.classList.remove('sim-complete'), 1200);
        }

        _animating = false;

        // Re-enable indicated simulate buttons
        document.querySelectorAll('.btn-simulate-treatment').forEach(b => {
            const rowEl = b.closest('.treatment-overview-row');
            b.disabled = !(rowEl?.classList.contains('indicated'));
        });

        // Auto-open timeline if hidden
        const area = document.getElementById('timeline-expandable');
        if (area && !area.classList.contains('open')) {
            area.classList.add('open');
            document.getElementById('timelineToggleBtn')?.classList.add('active');
        }
    };

    return { simulate };
})();
