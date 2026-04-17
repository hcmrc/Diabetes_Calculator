/**
 * @fileoverview Treatment Simulator — evidence-based animated interventions.
 *
 * Animates slider values toward clinically-derived treatment targets using
 * ease-out cubic interpolation. Supports reversing a simulation via
 * `unsimulate(factor)`, which restores the original (pre-simulation)
 * slider value.
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
    /** @type {Map<string, number>} factor → original pre-simulation slider value */
    const _simulated = new Map();
    let _animationTimeoutId = null;

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
     * Animate a slider from its current value to a target value.
     * @param {string} factor — Risk factor key
     * @param {number} currentVal — Starting value
     * @param {number} targetVal — End value
     * @param {number} decimals — Number of decimal places
     * @param {Function} onFinish — Callback when animation completes
     */
    const animateTo = (factor, currentVal, targetVal, decimals, onFinish) => {
        if (currentVal === targetVal) {
            onFinish();
            return;
        }
        _animating = true;
        document.querySelectorAll('.btn-simulate-treatment, .btn-undo-treatment').forEach(b => b.disabled = true);

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
                const timeoutId = setTimeout(tick, CFG.ANIMATION_DURATION / CFG.ANIMATION_STEPS);
                _animationTimeoutId = timeoutId;
            } else {
                _animationTimeoutId = null;
                _animating = false;
                onFinish();
            }
        };
        tick();
    };

    /**
     * Run treatment simulation for one factor.
     * @param {string} factor — Risk factor key (e.g. 'fastGlu', 'sbp').
     */
    const simulate = (factor) => {
        if (_animating) return;
        if (_simulated.has(factor)) return;
        const info = computeTarget(factor);
        if (!info || info.currentVal === info.targetVal) return;

        const { currentVal, targetVal, decimals } = info;
        const origVal = currentVal;

        // Store BEFORE animation so getOriginalValues() can return the pre-simulation
        // value during animation — this keeps renderRisk() (main risk) stable while
        // renderChosenRisk() shows the animated reduction in real-time.
        _simulated.set(factor, origVal);

        animateTo(factor, currentVal, targetVal, decimals, () => {
            onSimulationComplete(factor);
        });
    };

    /**
     * Compute the isolated risk reduction attributable to a single simulated factor.
     * Computes: risk_without_this_treatment - risk_with_all_treatments.
     * Positive result = this treatment reduced the risk.
     * @param {string} factor — Simulated factor key.
     * @returns {number} Risk reduction in percentage points.
     */
    const getIndividualReduction = (factor) => {
        if (!_simulated.has(factor)) return 0;
        const origVal = _simulated.get(factor);
        const isMetric = DRC.UIController.getUnitToggleState();
        const currentInputs = DRC.UIController.readInputs();
        const activeModel = DRC.App?.getActiveModel?.();

        const siWith = DRC.RiskModel.toSI(currentInputs, isMetric);
        const _riskWith = DRC.RiskModel.computeProbability(siWith, activeModel);
        const riskWith = (_riskWith != null && isFinite(_riskWith)) ? _riskWith * 100 : NaN;

        const inputsWithout = { ...currentInputs, [factor]: origVal };
        const siWithout = DRC.RiskModel.toSI(inputsWithout, isMetric);
        const _riskWithout = DRC.RiskModel.computeProbability(siWithout, activeModel);
        const riskWithout = (_riskWithout != null && isFinite(_riskWithout)) ? _riskWithout * 100 : NaN;

        return riskWithout - riskWith;
    };

    /**
     * Reverse a previously-simulated treatment: animate the slider back
     * to its pre-simulation value and remove the factor from the
     * simulated set.
     * @param {string} factor — Risk factor key
     */
    const unsimulate = (factor) => {
        if (_animating) return;
        if (!_simulated.has(factor)) return;

        const origVal = _simulated.get(factor);
        const { input, slider } = DRC.UIController.getSliderElements(factor);
        if (!input || !slider) return;

        const currentVal = parseFloat(input.value);
        const step = parseFloat(slider.step) || 1;
        const decimals = step >= 1 ? 0 : Math.max(0, -Math.floor(Math.log10(step)));

        animateTo(factor, currentVal, origVal, decimals, () => {
            _simulated.delete(factor);
            onSimulationComplete(factor);
        });
    };

    /** Cancel any running animation and snap sliders back to original values. */
    const cancel = () => {
        if (_animationTimeoutId) {
            clearTimeout(_animationTimeoutId);
            _animationTimeoutId = null;
        }
        // Snap any animating sliders to their pre-simulation values
        _simulated.forEach((origVal, factor) => {
            const { input, slider } = DRC.UIController.getSliderElements(factor);
            if (input)  input.value  = origVal;
            if (slider) slider.value = origVal;
            DRC.UIController.updateSliderFill(factor);
        });
        _simulated.clear();
        _animating = false;
        document.querySelectorAll('.btn-simulate-treatment, .btn-undo-treatment').forEach(b => b.disabled = false);
    };

    /**
     * Re-run a simulation: instantly restores the slider to its pre-simulation
     * value, then re-animates to the treatment target. Useful when the user
     * wants to refresh the effect against a changed baseline.
     * @param {string} factor — Risk factor key
     */
    const resimulate = (factor) => {
        if (_animating) return;
        if (!_simulated.has(factor)) return;

        const origVal = _simulated.get(factor);
        const { input, slider } = DRC.UIController.getSliderElements(factor);
        if (!input || !slider) return;

        const step = parseFloat(slider.step) || 1;

        // Instantly restore to pre-simulation value and clear the simulated state
        input.value = origVal;
        slider.value = origVal;
        DRC.UIController.updateSliderFill(factor);
        _simulated.delete(factor);
        DRC.App.trigger('risk:recalculate');

        // Re-run simulation from the restored baseline
        simulate(factor);
    };

    /**
     * Post-simulation/unsimulation UI updates: flash row, recompute risk.
     * Card states (reduction pill, button) are handled by renderTreatmentOverview
     * which is triggered via risk:recalculate.
     * @param {string} factor
     */
    const onSimulationComplete = (factor) => {
        // Flash completion animation for feedback
        const row = document.querySelector(`.treatment-overview-row[data-field="${factor}"]`);
        if (row) {
            row.classList.add('sim-complete');
            setTimeout(() => row.classList.remove('sim-complete'), CFG.ANIMATION_FLASH_MS);
        }

        // Trigger recalculation — renderTreatmentOverview re-renders all card states
        DRC.App.trigger('risk:recalculate');
        DRC.UIHelpers.refreshIcons();
    };

    return {
        simulate,
        unsimulate,
        resimulate,
        resetSimulated: () => { cancel(); _simulated.clear(); },
        cancel,
        /**
         * Whether an animation is currently in progress.
         * Used by App to skip heavy DOM rebuilds during animation ticks.
         */
        isAnimating: () => _animating,
        /**
         * Return a plain object of {factor: originalValue} for factors
         * that have been simulated (used by App to compute the
         * pre-simulation "Your Risk" value).
         */
        getOriginalValues: () => {
            const obj = {};
            _simulated.forEach((val, key) => { obj[key] = val; });
            return obj;
        },
        /**
         * Return an array of factor keys that are currently simulated.
         * Used by the UI to render the "Chosen Treatments" list.
         */
        getSimulatedFactors: () => Array.from(_simulated.keys()),
        /**
         * Compute isolated risk reduction for a single simulated factor.
         * @param {string} factor — Simulated factor key.
         * @returns {number} Risk reduction in percentage points (positive = reduced).
         */
        getIndividualReduction,
        /**
         * Get the unit-appropriate treatment delta for a factor.
         * Supports sex-dependent effects (e.g. sbp with siMale/siFemale keys).
         * @param {string} factor — Risk factor key.
         * @returns {number} Expected change in current unit system.
         */
        getEffectDelta
    };
})();
