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
    const _simulated = new Set();  // Track already-simulated factors

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
        if (_simulated.has(factor)) return;  // Already simulated
        const info = computeTarget(factor);
        if (!info || info.currentVal === info.targetVal) return;

        const { currentVal, targetVal, step } = info;
        const label = DRC.CONFIG.SIMULATION_EFFECTS[factor]?.label || factor;
        _animating = true;

        // Disable all simulate buttons during animation
        document.querySelectorAll('.btn-simulate-treatment').forEach(b => b.disabled = true);

        // Auto-set baseline on first simulation
        if (_simulated.size === 0) {
            const raw = DRC.UIController.readInputs();
            const isMetric = document.getElementById('unit-toggle')?.checked || false;
            const si  = DRC.RiskModel.toSI(raw, isMetric);
            const risk = DRC.RiskModel.computeProbability(si) * 100;

            // Activate comparison mode via explicit setter (avoids mutating the state copy)
            DRC.App._setCompareScenario?.(risk);

            // Update Set Baseline button UI
            const baseBtn = document.getElementById('compareScenarioBtn');
            if (baseBtn) {
                baseBtn.classList.add('active');
                baseBtn.innerHTML = '<i data-lucide="flag" class="lucide-icon"></i> Reset Baseline';
            }
            const panel = document.getElementById('scenario-comparison');
            if (panel) panel.style.display = 'flex';
            DRC.UIController.renderScenarioComparison(risk, risk);

            // Add baseline line + unlabelled baseline snapshot — only if not already set manually
            if (!DRC.TimelineChart.hasBaseline()) {
                DRC.TimelineChart.setBaseline(risk);
            }
            if (DRC.TimelineChart.getLastSnapshot() === null) {
                DRC.TimelineChart.addSnapshot(risk, si, null);
            }

            // Auto-open timeline
            const area = document.getElementById('timeline-expandable');
            if (area && !area.classList.contains('open')) {
                area.classList.add('open');
                document.getElementById('timelineToggleBtn')?.classList.add('active');
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
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Auto-open timeline if hidden
        const area = document.getElementById('timeline-expandable');
        if (area && !area.classList.contains('open')) {
            area.classList.add('open');
            document.getElementById('timelineToggleBtn')?.classList.add('active');
        }
    };

    return { simulate, resetSimulated: () => { _simulated.clear(); _animating = false; } };
})();
