/**
 * @fileoverview UI Controller — all DOM reads/writes, zero business logic.
 *
 * Responsible for reading user inputs, rendering risk results, contribution
 * charts, treatment overviews, icon arrays, causality chains, and managing
 * slider fills, ranges, and unit labels.
 *
 * Design principles:
 *   - EID SBB: Preattentive risk glow on hero section (Rasmussen, 1983)
 *   - EID KBB: Beta-vector arrows and what-if badges (Vicente, 1999)
 *   - Progressive Disclosure (Shneiderman, 1996)
 *   - Traffic-light color coding (Liu et al., 2025)
 *
 * @module UIController
 * @memberof DRC
 */

'use strict';

DRC.UIController = (() => {
    const { el, setText, clampAndRound, formatAxisValue, escapeHtml } = DRC.UIHelpers;
    const CFG = DRC.CONFIG;

    // Module-scope guards: delegated listeners registered at most once
    let _filterHandlerAttached = false;
    let _rowClickHandlerAttached = false;
    let _treatmentDelegationAttached = false;

    // ─── Risk-level color mapping ───────────────────────────────────────
    // High-risk threshold (26%) aligns with Schmidt et al. (2005) published cutoff:
    // Pr(DM) ≥ 0.26 → sensitivity 52%, specificity 86% (see CONFIG.HIGH_RISK_CUTOFF)
    const RISK_COLORS = [
        { min: 50, color: '#ff3b30', level: 'danger' },
        { min: 26, color: '#ff6723', level: 'warning' },
        { min: 10, color: '#ff9f0a', level: 'alert' },
        { min: 0,  color: '#34c759', level: 'safe' }
    ];

    /**
     * Determine color and level string for a risk percentage.
     * @param {number} pct — Risk percentage.
     * @returns {{ color: string, level: string }}
     */
    const getRiskLevel = (pct) =>
        RISK_COLORS.find(r => pct >= r.min) || RISK_COLORS[RISK_COLORS.length - 1];

    // ─── Slider management ──────────────────────────────────────────────

    /** Update the colored fill width of a single slider track. */
    const updateSliderFill = (field) => {
        const slider = el(`${field}-slider`);
        const fill   = el(`${field}-fill`);
        if (!slider || !fill) return;
        const range = parseFloat(slider.max) - parseFloat(slider.min);
        const pct = range > 0
            ? ((parseFloat(slider.value) - parseFloat(slider.min)) / range) * 100
            : 0;
        fill.style.width = `${pct}%`;
    };

    /** Update all slider fills at once. */
    const updateAllSliderFills = () => CFG.SLIDER_FIELDS.forEach(updateSliderFill);

    /** Apply min/max/step from CONFIG.RANGES to a field's slider + input. */
    const applyRangeToField = (field, mode) => {
        const range = CFG.RANGES[field]?.[mode];
        const slider = el(`${field}-slider`);
        const input  = el(`${field}-value`);
        if (!range || !slider || !input) return;
        const [min, max, step] = range;
        [slider, input].forEach(n => { n.min = min; n.max = max; n.step = step; });
    };

    /** Update all slider ranges for the given unit mode ('us'|'si'). */
    const updateSliderRanges = (mode) =>
        Object.keys(CFG.RANGES).forEach(f => applyRangeToField(f, mode));

    // ─── Unit labels & axis labels ──────────────────────────────────────

    /** Update all unit-related labels throughout the interface. */
    const updateUnitLabels = (isMetric) => {
        const u = isMetric
            ? { h: 'cm', w: 'cm', g: 'mmol/L', c: 'mmol/L' }
            : { h: 'in', w: 'in', g: 'mg/dL',  c: 'mg/dL' };

        const wrap = (s) => s.includes('mmol') ? s : `(${s})`;

        // Parenthetical labels on sliders
        setText('height-unit',  wrap(u.h));
        setText('waist-unit',   wrap(u.w));
        setText('fastGlu-unit', wrap(u.g));
        setText('cholHDL-unit', wrap(u.c));
        setText('cholTri-unit', wrap(u.c));

        // Value-row unit labels
        setText('height-value-unit',  u.h);
        setText('waist-value-unit',   u.w);
        setText('fastGlu-value-unit', u.g);
        setText('cholHDL-value-unit', u.c);
        setText('cholTri-value-unit', u.c);

        updateSliderAxisLabels(isMetric);

        // Toggle label emphasis
        const usLabel = el('unit-label-us');
        const siLabel = el('unit-label-si');
        if (usLabel) { usLabel.style.fontWeight = isMetric ? '400' : '600'; usLabel.style.color = isMetric ? '' : 'var(--text-primary)'; }
        if (siLabel) { siLabel.style.fontWeight = isMetric ? '600' : '400'; siLabel.style.color = isMetric ? 'var(--text-primary)' : ''; }
    };

    /** Update min/mid/max numeric labels beneath sliders that change with units. */
    const updateSliderAxisLabels = (isMetric) => {
        const mode = isMetric ? 'si' : 'us';
        ['height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'].forEach(field => {
            const [min, max] = CFG.RANGES[field][mode];
            const isFloat = isMetric && CFG.RANGES[field].si[2] < 1;
            const mid = isFloat ? (min + max) / 2 : Math.round((min + max) / 2);
            setText(`${field}-min`, formatAxisValue(min, isFloat));
            setText(`${field}-mid`, formatAxisValue(mid, isFloat));
            setText(`${field}-max`, formatAxisValue(max, isFloat));
        });
    };

    // ─── Value conversion (US ↔ SI) ─────────────────────────────────────

    /** Convert and apply saved values when switching units.
     *  Delegates to ConversionService for DRY compliance.
     */
    const applyConvertedValues = (savedValues, isMetric) => {
        DRC.ConversionService.applyConvertedValues(savedValues, isMetric, {
            onValue: (field, val) => {
                const input  = el(`${field}-value`);
                const slider = el(`${field}-slider`);
                if (input)  input.value  = val;
                if (slider) slider.value = val;
            }
        });
    };

    // ─── Reading inputs ─────────────────────────────────────────────────

    /** Read all current input values from the DOM (null-safe). */
    const readInputs = () => ({
        age:        parseFloat(el('age-value')?.value)      || 0,
        sex:        el('sex-toggle')?.checked  ? 1 : 0,
        race:       el('race-toggle')?.checked  ? 1 : 0,
        parentHist: el('parentHist-toggle')?.checked ? 1 : 0,
        sbp:        parseFloat(el('sbp-value')?.value)      || 0,
        height:     parseFloat(el('height-value')?.value)   || 0,
        waist:      parseFloat(el('waist-value')?.value)    || 0,
        fastGlu:    parseFloat(el('fastGlu-value')?.value)  || 0,
        cholHDL:    parseFloat(el('cholHDL-value')?.value)  || 0,
        cholTri:    parseFloat(el('cholTri-value')?.value)  || 0
    });

    // ─── Rendering: Risk score (EID SBB) ────────────────────────────────

    /** Display the risk percentage with preattentive color glow. */
    const renderRisk = (pct) => {
        setText('risk-percentage', pct.toFixed(1));
        const { color, level } = getRiskLevel(pct);

        // Color the percentage text
        const riskEl = el('risk-percentage');
        const pctEl  = el('risk-unit-percent') || document.querySelector('.risk-unit');
        if (riskEl) riskEl.style.color = color;
        if (pctEl)  pctEl.style.color  = color;

        // Set data-risk-level on hero, input, and treatment panels
        ['risk-score-card', 'panel-input', 'panel-treatment'].forEach(id => {
            const node = el(id);
            if (node) node.setAttribute('data-risk-level', level);
        });

        // Update risk bar marker
        const marker = el('risk-bar-marker');
        if (marker) {
            marker.style.left = `${Math.min(pct, 100)}%`;
            marker.style.borderColor = color;
        }
    };

    // ─── Rendering: Contribution chart ──────────────────────────────────

    /**
     * Render the diverging bar (tornado) chart of factor contributions.
     *
     * Renders marginal probability contributions (Robnik-Šikonja & Kononenko, 2008)
     * computed via RiskModel.computeMarginalContributions (Linear SHAP decomposition
     * in log-odds space per Lundberg & Lee, 2017, transformed to probability space).
     * Bar width scaled relative to the largest absolute contribution in the visible set.
     */
    const renderContributionChart = (summaryData) => {
        const container = el('contribution-chart');
        if (!container) return;
        container.innerHTML = '';

        const contributions = summaryData.contributions;
        const pFull = summaryData.pFull;
        const pBaseline = summaryData.pBaseline;
        const netDeviation = summaryData.netDeviation;

        // Default: show all factors (false = no filter active)
        const filterState = container.getAttribute('data-filter-risk') === 'true';

        if (!_filterHandlerAttached) {
            container.addEventListener('change', (e) => {
                if (e.target.id === 'risk-filter-toggle') {
                    container.setAttribute('data-filter-risk', e.target.checked);
                    DRC.App.trigger('risk:recalculate');
                }
            });
            _filterHandlerAttached = true;
        }

        if (!_rowClickHandlerAttached) {
            container.addEventListener('click', (e) => {
                const row = e.target.closest('.contrib-row[data-field]');
                if (!row) return;
                const wasOpen = row.classList.contains('expanded');
                container.querySelectorAll('.contrib-row.expanded').forEach(r => r.classList.remove('expanded'));
                if (!wasOpen) row.classList.add('expanded');
            });
            _rowClickHandlerAttached = true;
        }

        // Summary card — prominent comparison at top
        const pFullPct = (pFull * 100).toFixed(1);
        const pBaselinePct = (pBaseline * 100).toFixed(1);
        const netDeviationPct = Math.abs(netDeviation * 100).toFixed(1);
        const isLower = netDeviation < 0;
        const comparisonWord = isLower ? 'lower' : 'higher';

        const { level: riskLevel } = getRiskLevel(pFull * 100);

        const summaryBanner = document.createElement('div');
        summaryBanner.className = 'contrib-summary-card';
        summaryBanner.setAttribute('data-direction', isLower ? 'lower' : 'higher');
        summaryBanner.setAttribute('data-risk-level', riskLevel);
        summaryBanner.innerHTML = `
            <div class="contrib-summary-main">
                <span class="contrib-summary-your-risk">${pFullPct}%</span>
                <span class="contrib-summary-label">your risk</span>
            </div>
            <div class="contrib-summary-divider"></div>
            <div class="contrib-summary-comparison">
                <div class="contrib-summary-sentence">
                    <span class="contrib-summary-delta ${isLower ? 'is-lower' : 'is-higher'}">${netDeviationPct}% ${comparisonWord}</span>
                    than the average of <strong>${pBaselinePct}%</strong>
                </div>
            </div>
        `;
        container.appendChild(summaryBanner);

        // Filter toggle — above column headers
        const filterToggle = document.createElement('div');
        filterToggle.className = 'contrib-filter-toggle';
        filterToggle.innerHTML = `
            <span class="contrib-filter-label">Show above average risk factors only</span>
            <label class="toggle-switch" style="transform:scale(0.75);">
                <input type="checkbox" id="risk-filter-toggle" ${filterState ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        `;
        container.appendChild(filterToggle);

        // Header row with column labels
        const headerRow = document.createElement('div');
        headerRow.className = 'contrib-header';
        headerRow.innerHTML = `
            <div class="contrib-header-left"></div>
            <div class="contrib-header-center">
                <div class="contrib-header-left-side">Better than average</div>
                <div class="contrib-header-center-label">Average</div>
                <div class="contrib-header-right-side">Worse than average</div>
            </div>
            <div class="contrib-header-right"></div>
        `;
        container.appendChild(headerRow);

        const items = Object.entries(contributions)
            .map(([key, deltaI]) => ({
                key, deltaI,
                abs: Math.abs(deltaI)
            }))
            .sort((a, b) => b.abs - a.abs);

        const filteredItems = filterState ? items.filter(i => i.deltaI > 0) : items;
        const maxAbs = filteredItems.reduce((max, i) => i.abs > max ? i.abs : max, 0.001);

        filteredItems.forEach(({ key, deltaI }) => {
            const barWidth = (Math.abs(deltaI) / maxAbs) * 100;
            const isPositive = deltaI >= 0;
            const absDeltaPct = Math.abs(deltaI) * 100;
            const pctDisplay = absDeltaPct < 0.1 ? '<0.1%' : (absDeltaPct.toFixed(1) + '%');
            const signedDisplay = isPositive ? '+' + pctDisplay : '−' + pctDisplay;

            // Protective factors have negative beta coefficients (height, cholHDL)
            // Binary factors (race, parentHist) don't have "above/below average" values
            const isProtectiveFactor = CFG.BETAS[key] < 0;
            const isBinaryFactor = ['race', 'parentHist'].includes(key);
            const isAboveAverage = isProtectiveFactor ? !isPositive : isPositive;
            const label = CFG.LABELS[key];

            const actionVerb = isProtectiveFactor ? 'Increasing' : 'Lowering';
            let infoText;
            if (isBinaryFactor) {
                infoText = isPositive
                    ? `Your ${label.toLowerCase()} increases your overall diabetes risk by ${pctDisplay}. <strong>Check the treatment section on the right.</strong>`
                    : `Your ${label.toLowerCase()} decreases your overall diabetes risk by ${pctDisplay} compared to an average person.`;
            } else {
                infoText = isPositive
                    ? `Your ${label.toLowerCase()} is ${isAboveAverage ? 'above' : 'below'} average and increases your overall diabetes risk by ${pctDisplay} compared to an average value. <strong>${actionVerb} it would help to decrease your overall risk. Check the treatment section on the right.</strong>`
                    : `Your ${label.toLowerCase()} is ${isAboveAverage ? 'above' : 'below'} average and decreases your overall diabetes risk by ${pctDisplay} compared to an average value.`;
            }

            const row = document.createElement('div');
            row.className = 'contrib-row';
            row.setAttribute('data-field', key);

            row.innerHTML = `
                <div class="contrib-row-inner">
                    <div class="contrib-row-label-cell">
                        <span class="contrib-row-label">${label}</span>
                    </div>
                    <div class="contrib-bar">
                        <div class="contrib-bar-half contrib-bar-left">
                            ${!isPositive ? `<div class="contrib-bar-fill bar-negative" style="width:${barWidth}%"></div>` : ''}
                        </div>
                        <div class="contrib-bar-center"></div>
                        <div class="contrib-bar-half contrib-bar-right">
                            ${isPositive ? `<div class="contrib-bar-fill bar-positive" style="width:${barWidth}%"></div>` : ''}
                        </div>
                    </div>
                    <div class="contrib-row-value ${isPositive ? 'value-positive' : 'value-negative'}">
                        <span class="contrib-value-pct">${signedDisplay}</span>
                        <span class="contrib-value-hint">Click for info</span>
                    </div>
                </div>
                <div class="contrib-row-detail">
                    <p class="contrib-detail-text">${infoText}</p>
                </div>
            `;
            container.appendChild(row);
        });
    };

    // ─── Rendering: Treatment overview ──────────────────────────────────

    /**
     * Unified treatment overview with expandable detail rows.
     *
     * Three-tier status system:
     * - Indicated (red, expanded): Clinical threshold reached AND above average
     * - Elevated (orange, collapsed): Above average but below clinical threshold
     * - Normal (green, collapsed): Below average (protective)
     *
     * Surgical options for waist use clinical threshold (waistIsHigh).
     */
    const renderTreatmentOverview = ({ elevatedFactors, waistIsHigh }, contributions = {}, marginalContributions = {}) => {
        const container = el('treatment-overview');
        if (!container) return;
        container.innerHTML = '';

        // Check if risk-factors-only filter is active
        const contribContainer = el('contribution-chart');
        const filterRiskOnly = contribContainer?.getAttribute('data-filter-risk') !== 'false';

        const totalAbs = Object.values(contributions)
            .reduce((sum, v) => sum + Math.abs(v), 0);

        const items = Object.keys(CFG.TREATMENTS).map(factor => {
            const marginalDelta = marginalContributions[factor] || 0;
            const isAboveAverage = marginalDelta >= 0;
            const isClinicallyElevated = elevatedFactors.includes(factor);
            // Indicated = clinically elevated AND above average
            const isIndicated = isClinicallyElevated && isAboveAverage;
            // Elevated = above average but NOT clinically elevated
            const isElevated = isAboveAverage && !isClinicallyElevated;
            return {
                factor,
                treatment: CFG.TREATMENTS[factor],
                absContrib: Math.abs(contributions[factor] || 0),
                pct: totalAbs > 0 ? (Math.abs(contributions[factor] || 0) / totalAbs) * 100 : 0,
                marginalDelta,
                isIndicated,
                isElevated,
                isAboveAverage
            };
        }).sort((a, b) => b.absContrib - a.absContrib);

        // When risk-filter active: show only treatments for above-average factors
        const displayItems = filterRiskOnly ? items.filter(i => i.isAboveAverage) : items;

        const maxPct = displayItems.reduce((max, i) => i.pct > max ? i.pct : max, 1);

        displayItems.forEach(({ factor, treatment, pct, marginalDelta, isIndicated, isElevated, isAboveAverage }) => {
            const barWidth = (pct / maxPct) * 100;

            // Compute risk contribution text
            const v = Math.abs(marginalDelta) * 100;
            const sign = marginalDelta >= 0 ? '+' : '−';
            const disp = v < 0.1 ? '<0.1' : v.toFixed(1);
            const riskContribText = `${sign}${disp}`;

            // Build therapy HTML
            let therapies = [...treatment.therapies];
            if (factor === 'waist' && waistIsHigh && treatment.surgicalOption) {
                therapies.push(treatment.surgicalOption);
            }
            const therapiesHTML = therapies.map(t =>
                `<div class="therapy-mini"><div><strong>${escapeHtml(t.name)}:</strong> ${escapeHtml(t.desc)}</div></div>`
            ).join('');

            // Three-tier status: Indicated (red) > Elevated (orange) > Normal (green)
            let statusIcon, statusLabel, statusClass;
            if (isIndicated) {
                statusIcon = 'alert-triangle';
                statusLabel = 'Indicated';
                statusClass = 'status-indicated';
            } else if (isElevated) {
                statusIcon = 'alert-circle';
                statusLabel = 'Elevated';
                statusClass = 'status-elevated';
            } else {
                statusIcon = 'check-circle';
                statusLabel = 'Normal';
                statusClass = 'status-normal';
            }

            const row = document.createElement('div');
            row.className = `treatment-overview-row ${isIndicated ? 'indicated' : (isElevated ? 'elevated' : 'normal')}`;
            row.style.borderLeftColor = isAboveAverage ? '#ff3b30' : '#34c759';
            row.style.background = isAboveAverage ? 'rgba(255, 59, 48, 0.03)' : 'rgba(52, 199, 89, 0.03)';
            row.setAttribute('data-field', factor);
            row.id = treatment.id;

            row.innerHTML = `
                <div class="tov-icon-col">
                    <i data-lucide="${treatment.icon}" class="lucide-icon tov-factor-icon"></i>
                </div>
                <div class="tov-main-col">
                    <div class="tov-label-row tov-clickable" data-toggle-factor="${factor}">
                        <span class="tov-title">${treatment.title}</span>
                        <span class="tov-status ${statusClass}">
                            <i data-lucide="${statusIcon}" class="lucide-icon"></i>
                            ${statusLabel}
                        </span>
                        <i data-lucide="chevron-down" class="lucide-icon tov-chevron ${isIndicated ? '' : 'collapsed'}"></i>
                    </div>
                    <div class="tov-bar-container">
                        <div class="tov-bar ${isAboveAverage ? 'bar-indicated' : 'bar-normal'}" style="width:${barWidth}%;"></div>
                    </div>
                    <div class="tov-pct">${riskContribText}% risk contribution compared to average</div>
                    <div class="tov-details ${isIndicated ? 'expanded' : ''}">
                        <div class="tov-details-inner">
                            ${therapiesHTML}
                            ${isIndicated ? `<button class="btn-simulate-treatment" data-sim-factor="${factor}">
                                <i data-lucide="play-circle" class="lucide-icon"></i>
                                Simulate Treatment
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Apply marginal-delta colour to icon col + icon (overrides CSS !important)
            const iconCol = row.querySelector('.tov-icon-col');
            const iconEl  = row.querySelector('.tov-factor-icon');
            const mColor  = isAboveAverage ? '#ff3b30' : '#34c759';
            const mBg     = isAboveAverage ? 'rgba(255, 59, 48, 0.20)' : 'rgba(52, 199, 89, 0.20)';
            if (iconCol) iconCol.style.background = mBg;
            if (iconEl)  iconEl.style.setProperty('color', mColor, 'important');

            container.appendChild(row);
        });

        // Event delegation: attach once on the container, handles all dynamic rows
        if (!_treatmentDelegationAttached) {
            container.addEventListener('click', (e) => {
                // Expand/collapse handler
                const clickable = e.target.closest('.tov-clickable');
                if (clickable) {
                    const row = clickable.closest('.treatment-overview-row');
                    if (row) {
                        row.querySelector('.tov-details')?.classList.toggle('expanded');
                        row.querySelector('.tov-chevron')?.classList.toggle('collapsed');
                    }
                    return;
                }
                // Simulate treatment handler
                const simBtn = e.target.closest('.btn-simulate-treatment');
                if (simBtn) {
                    e.stopPropagation();
                    const simFactor = simBtn.getAttribute('data-sim-factor');
                    if (simFactor && DRC.TreatmentSimulator) {
                        // Expand treatment panel if collapsed
                        const panel = el('panel-treatment');
                        if (panel) {
                            const body = panel.querySelector('.panel-body');
                            const subtitle = panel.querySelector('.panel-subtitle');
                            const collapseBtn = panel.querySelector('.panel-collapse-btn');
                            if (body?.classList.contains('panel-hidden')) {
                                body.classList.remove('panel-hidden');
                                if (subtitle) subtitle.classList.remove('panel-hidden');
                                if (collapseBtn) {
                                    collapseBtn.classList.remove('collapsed');
                                    collapseBtn.setAttribute('aria-expanded', 'true');
                                }
                            }
                        }
                        // Expand timeline section if collapsed
                        const timelineExpandable = el('timeline-expandable');
                        const timelineToggleBtn = el('timelineToggleBtn');
                        if (timelineExpandable && !timelineExpandable.classList.contains('open')) {
                            timelineExpandable.classList.add('open');
                            if (timelineToggleBtn) timelineToggleBtn.classList.add('active');
                        }
                        DRC.TreatmentSimulator.simulate(simFactor);
                    }
                }
            });
            _treatmentDelegationAttached = true;
        }

        // Re-initialize Lucide icons for dynamically added content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    /** Legacy no-op kept for API compatibility. */
    const renderTreatmentRecommendations = () => {
        const c = el('dynamic-treatments');
        if (c) c.innerHTML = '';
    };

    // ─── Rendering: What-if badges ──────────────────────────────────────

    /** Update a single what-if delta badge. */
    const renderWhatIfBadge = (field, delta) => {
        const badge = el(`what-if-${field}`);
        if (!badge) return;
        if (Math.abs(delta) < 0.01) {
            badge.className = 'what-if-badge';
            badge.textContent = '';
            return;
        }
        const sign = delta > 0 ? '+' : '';
        const cls  = delta > 0 ? 'delta-up' : 'delta-down';
        badge.textContent = `${sign}${delta.toFixed(2)}%`;
        badge.className   = `what-if-badge visible ${cls}`;
    };

    // ─── Rendering: Icon array (pictograph) ─────────────────────────────

    /** Render 100-person pictograph illustrating the risk frequency. */
    const renderIconArray = (riskPct) => {
        const container = el('icon-array');
        const label     = el('icon-array-label');
        if (!container) return;

        const affected = Math.round(riskPct);
        container.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const icon = document.createElement('div');
            icon.className = `icon-array-item${i < affected ? ' affected' : ''}`;
            container.appendChild(icon);
        }
        if (label) {
            label.textContent = `${affected} out of 100 people with your profile may develop diabetes within 9 years`;
        }
    };

    // ─── Rendering: Causality chains ────────────────────────────────────

    const CAUSALITY_CHAINS = [
        { factors: ['waist'],   nodes: ['Waist', 'Insulin Resistance \u2191', 'Blood Sugar \u2191', 'Diabetes Risk \u2191'] },
        { factors: ['cholHDL'], nodes: ['HDL Cholesterol \u2193', 'Lipid Metabolism \u2193', 'Vascular Health \u2193', 'Diabetes Risk \u2191'] },
        { factors: ['fastGlu'], nodes: ['Fasting Glucose \u2191', 'Pancreatic Beta Cell Stress', 'Insulin Secretion \u2193', 'Diabetes Risk \u2191'] },
        { factors: ['sbp'],     nodes: ['Blood Pressure \u2191', 'Vascular Dysfunction', 'Endothelial Damage', 'Diabetes Risk \u2191'] }
    ];

    /** Render causal pathway chains, highlighting those with elevated factors. */
    const renderCausalityChains = (siVals, elevatedFactors) => {
        const container = el('causality-chain');
        if (!container) return;
        container.innerHTML = '';

        CAUSALITY_CHAINS.forEach(chain => {
            const highlighted = chain.factors.some(f => elevatedFactors.includes(f));
            const chainEl = document.createElement('div');
            chainEl.className = `causality-chain ${highlighted ? 'highlighted' : ''}`;

            chain.nodes.forEach((node, idx) => {
                const nodeEl = document.createElement('div');
                nodeEl.className = 'chain-node';
                nodeEl.textContent = node;
                chainEl.appendChild(nodeEl);
                if (idx < chain.nodes.length - 1) {
                    const arrow = document.createElement('div');
                    arrow.className = 'chain-arrow';
                    arrow.textContent = '\u2192';
                    chainEl.appendChild(arrow);
                }
            });
            container.appendChild(chainEl);
        });
    };

    // ─── Rendering: Scenario comparison ─────────────────────────────────

    /** Render inline baseline-vs-current comparison panel. */
    const renderScenarioComparison = (baselineRisk, currentRisk) => {
        const panel = el('scenario-comparison');
        if (!panel) return;

        const delta = currentRisk - baselineRisk;
        const cls   = delta < 0 ? 'improved' : delta > 0 ? 'worsened' : 'unchanged';
        const icon  = delta < 0 ? 'trending_down' : delta > 0 ? 'trending_up' : 'minus';

        panel.innerHTML = `
            <div class="scenario-inline-row">
                <div class="scenario-inline-item">
                    <i data-lucide="flag" class="lucide-icon scenario-inline-icon"></i>
                    <span class="scenario-inline-label">Baseline</span>
                    <span class="scenario-inline-value">${baselineRisk.toFixed(1)}%</span>
                </div>
                <i data-lucide="arrow-right" class="lucide-icon scenario-inline-arrow"></i>
                <div class="scenario-inline-item">
                    <i data-lucide="user" class="lucide-icon scenario-inline-icon current-icon"></i>
                    <span class="scenario-inline-label">Current</span>
                    <span class="scenario-inline-value current-value">${currentRisk.toFixed(1)}%</span>
                </div>
                <div class="scenario-inline-delta ${cls}">
                    <i data-lucide="${icon.replace(/_/g, '-')}" class="lucide-icon"></i>
                    <span>${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%</span>
                </div>
            </div>
        `;

        // Initialize Lucide icons for the new content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // ─── Non-modifiable summary ─────────────────────────────────────────

    /** Update the collapsed summary line for non-modifiable factors. */
    const updateNonModSummary = () => {
        const age    = el('age-value')?.value || '50';
        const sex    = el('sex-toggle')?.checked ? 'Male' : 'Female';
        const race   = el('race-toggle')?.checked ? 'Black' : 'Other';
        const parent = el('parentHist-toggle')?.checked ? 'History of diabetes in family' : 'No history of diabetes in family';
        const hVal   = el('height-value')?.value || '66';
        const hUnit  = el('height-value-unit')?.textContent || 'in';

        setText('summary-age',    'Age: ' + age);
        setText('summary-sex',    sex);
        setText('summary-race',   race);
        setText('summary-parent', parent);
        setText('summary-height', hVal + ' ' + hUnit);
    };

    /**
     * Update waist slider segments and labels based on selected sex.
     * Male threshold: >102 cm / >40 in. Female threshold: >88 cm / >35 in.
     * @param {boolean} isMale — true if male is selected
     * @param {boolean} isMetric — true if SI units
     */
    const updateWaistSegments = (isMale, isMetric) => {
        const track  = el('waist-track');
        const labels = el('waist-labels');
        if (!track || !labels) return;

        // Threshold in display units
        const threshold = isMale
            ? (isMetric ? 102 : 40)
            : (isMetric ?  88 : 35);
        const range = CFG.RANGES.waist[isMetric ? 'si' : 'us'];
        const min = range[0], max = range[1];

        // 2-zone layout: safe (green) | danger (red) — hard cutoff at threshold
        const safeFlex   = Math.max(1, threshold - min);
        const dangerFlex = Math.max(1, max - threshold);

        track.innerHTML =
            '<div class="slider-segment safe" style="flex:' + safeFlex + '"></div>' +
            '<div class="slider-segment danger" style="flex:' + dangerFlex + '"></div>';

        labels.innerHTML =
            '<span style="flex:' + safeFlex + ';text-align:left">' + min + '</span>' +
            '<span style="flex:0;white-space:nowrap">' + threshold + '</span>' +
            '<span style="flex:' + dangerFlex + ';text-align:right">' + max + '</span>';
    };

    /** Update the collapsed summary line for modifiable factors. */
    const updateModSummary = () => {
        const gVal  = el('fastGlu-value')?.value || '95';
        const gUnit = el('fastGlu-value-unit')?.textContent || 'mg/dL';
        const wVal  = el('waist-value')?.value || '36';
        const wUnit = el('waist-value-unit')?.textContent || 'in';
        const bp    = el('sbp-value')?.value || '120';
        const hdlVal  = el('cholHDL-value')?.value || '50';
        const hdlUnit = el('cholHDL-value-unit')?.textContent || 'mg/dL';
        const tVal    = el('cholTri-value')?.value || '150';
        const tUnit   = el('cholTri-value-unit')?.textContent || 'mg/dL';

        setText('summary-fastGlu', 'Glucose: ' + gVal + ' ' + gUnit);
        setText('summary-waist',   'Waist: ' + wVal + ' ' + wUnit);
        setText('summary-sbp',     'Blood Pressure: ' + bp + ' mmHg');
        setText('summary-hdl',     'HDL: ' + hdlVal + ' ' + hdlUnit);
        setText('summary-tri',     'TG: ' + tVal + ' ' + tUnit);
    };

    // ─── Helpers for TreatmentSimulator ─────────────────────────────────

    /**
     * Return the input + slider DOM elements for a given factor.
     * @param {string} factor — Risk factor key (e.g. 'fastGlu').
     * @returns {{ input: HTMLElement|null, slider: HTMLElement|null }}
     */
    const getSliderElements = (factor) => ({
        input:  document.getElementById(`${factor}-value`),
        slider: document.getElementById(`${factor}-slider`)
    });

    /**
     * Return current unit toggle state.
     * @returns {boolean} true if metric (SI), false if US.
     */
    const getUnitToggleState = () =>
        document.getElementById('unit-toggle')?.checked ?? false;

    /**
     * Activate or deactivate scenario-comparison mode from external callers.
     * @param {boolean} active — Whether comparison mode should be on.
     * @param {number} baselineRisk — Baseline risk percentage.
     */
    const setComparisonMode = (active, baselineRisk) => {
        const btn   = el('compareScenarioBtn');
        const panel = el('scenario-comparison');

        if (active) {
            DRC.App._setCompareScenario(baselineRisk);
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i data-lucide="flag" class="lucide-icon"></i> Reset Baseline';
            }
            if (panel) panel.style.display = 'flex';
            renderScenarioComparison(baselineRisk, baselineRisk);
        } else {
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i data-lucide="flag" class="lucide-icon"></i> Set Baseline';
            }
            if (panel) panel.style.display = 'none';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // ─── Public API ─────────────────────────────────────────────────────

    return {
        readInputs, updateUnitLabels, updateSliderRanges,
        applyConvertedValues, updateSliderFill, updateAllSliderFills,
        renderRisk, renderContributionChart,
        renderTreatmentOverview, renderTreatmentRecommendations,
        renderWhatIfBadge, renderIconArray,
        renderCausalityChains, renderScenarioComparison,
        updateNonModSummary, updateModSummary, updateWaistSegments,
        getSliderElements, getUnitToggleState, setComparisonMode
    };
})();
