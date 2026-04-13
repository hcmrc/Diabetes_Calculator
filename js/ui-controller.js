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

    // Translation helper
    const t = DRC.Utils.createTranslator();

    // Module-scope guards: delegated listeners registered at most once
    let _filterHandlerAttached = false;
    let _rowClickHandlerAttached = false;
    let _treatmentDelegationAttached = false;

    // ─── XSS-safe DOM element creation helper ─────────────────────────────

    /**
     * Safely create a DOM element with attributes, classes, and children.
     * Prevents XSS by using textContent instead of innerHTML for all content.
     *
     * @param {string} tag - HTML tag name
     * @param {Object} options - Configuration object
     * @param {string|string[]} [options.className] - CSS class(es)
     * @param {Object} [options.attrs] - Attributes to set (key-value pairs)
     * @param {string} [options.text] - Text content (safely set via textContent)
     * @param {HTMLElement[]} [options.children] - Child elements to append
     * @param {Object} [options.style] - Inline styles (key-value pairs)
     * @returns {HTMLElement} The created element
     */
    const createSafeElement = (tag, options = {}) => {
        const element = document.createElement(tag);

        // Set classes
        if (options.className) {
            if (Array.isArray(options.className)) {
                element.className = options.className.join(' ');
            } else {
                element.className = options.className;
            }
        }

        // Set attributes
        if (options.attrs) {
            Object.entries(options.attrs).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        // Set text content (XSS-safe)
        if (options.text !== undefined && options.text !== null) {
            element.textContent = options.text;
        }

        // Set inline styles (CSS custom properties use setProperty)
        if (options.style) {
            Object.entries(options.style).forEach(([key, value]) => {
                if (key.startsWith('--')) {
                    element.style.setProperty(key, value);
                } else {
                    element.style[key] = value;
                }
            });
        }

        // Append children
        if (options.children) {
            options.children.forEach(child => {
                if (child) element.appendChild(child);
            });
        }

        return element;
    };

    // ─── Risk-level color mapping ───────────────────────────────────────
    // High-risk threshold (26%) aligns with Schmidt et al. (2005) published cutoff:
    // Pr(DM) ≥ 0.26 → sensitivity 52%, specificity 86% (see CONFIG.HIGH_RISK_CUTOFF)
    const RISK_COLORS = [
        { min: 50, color: '#c43d35', level: 'danger' },
        { min: 26, color: '#d4653a', level: 'warning' },
        { min: 10, color: '#d4942c', level: 'alert' },
        { min: 0,  color: '#30a14e', level: 'safe' }
    ];

    /**
     * Determine color and level string for a risk percentage.
     * @param {number} pct — Risk percentage.
     * @returns {{ color: string, level: string }}
     */
    const getRiskLevel = (pct) =>
        RISK_COLORS.find(r => pct >= r.min) || RISK_COLORS[RISK_COLORS.length - 1];

    // ─── Slider management ──────────────────────────────────────────────

    /** Update the colored fill (via scaleX transform) of a single slider track. */
    const updateSliderFill = (field) => {
        const slider = el(`${field}-slider`);
        const fill   = el(`${field}-fill`);
        if (!slider || !fill) return;
        const range = parseFloat(slider.max) - parseFloat(slider.min);
        const pct = range > 0
            ? ((parseFloat(slider.value) - parseFloat(slider.min)) / range) * 100
            : 0;
        fill.style.transform = `scaleX(${pct / 100})`;
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
        // Handle edge cases: NaN, Infinity, negative values
        if (!isFinite(pct) || pct < 0) {
            console.warn('UIController: Invalid risk percentage:', pct);
            setText('risk-percentage', '---');
            return;
        }
        // Clamp to valid range [0, 100]
        const safePct = Math.min(Math.max(pct, 0), 100);
        setText('risk-percentage', safePct.toFixed(1));
        const { color, level } = getRiskLevel(safePct);

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
            marker.style.left = `${Math.min(safePct, 100)}%`;
            marker.style.borderColor = color;
        }
    };

    // ─── Rendering: Contribution chart ──────────────────────────────────

    /**
     * Setup delegated event handlers for the contribution chart.
     * Guards ensure handlers are attached at most once.
     * @param {HTMLElement} container
     */
    const setupContributionEvents = (container) => {
        if (!_filterHandlerAttached) {
            container.addEventListener('change', (e) => {
                if (e.target.id === 'risk-filter-toggle') {
                    container.setAttribute('data-show-protective', e.target.checked);
                    DRC.App.trigger('risk:recalculate');
                }
            });
            _filterHandlerAttached = true;
        }

        if (!_rowClickHandlerAttached) {
            const toggleContribRow = (row) => {
                const wasOpen = row.classList.contains('expanded');
                container.querySelectorAll('.contrib-row.expanded').forEach(r => {
                    r.classList.remove('expanded');
                    r.setAttribute('aria-expanded', 'false');
                });
                if (!wasOpen) {
                    row.classList.add('expanded');
                    row.setAttribute('aria-expanded', 'true');
                }
            };

            container.addEventListener('click', (e) => {
                const row = e.target.closest('.contrib-row[data-field]');
                if (!row) return;
                toggleContribRow(row);
            });

            container.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const row = e.target.closest('.contrib-row[data-field]');
                if (!row) return;
                e.preventDefault();
                toggleContribRow(row);
            });

            _rowClickHandlerAttached = true;
        }
    };

    /**
     * Filter contributions to only include factors in the active model.
     * Mutates the contributions object in place.
     * @param {Object} contributions
     * @param {Object} model
     * @returns {Object} filtered contributions
     */
    const filterByModel = (contributions, model) => {
        const modelBetaKeys = model ? Object.keys(model.betas) : null;
        if (modelBetaKeys) {
            Object.keys(contributions).forEach(key => {
                if (!modelBetaKeys.includes(key)) delete contributions[key];
            });
        }
        return contributions;
    };

    /**
     * Render the filter toggle checkbox.
     * @param {HTMLElement} container
     * @param {boolean} isActive
     */
    const renderFilterToggle = (container, isActive) => {
        const filterToggle = createSafeElement('div', { className: 'contrib-filter-toggle' });

        const filterLabel = createSafeElement('span', {
            className: 'contrib-filter-label',
            text: t('chart.filterLabel', 'Show Protective Factors in addition to Risk Factors')
        });

        const toggleLabel = createSafeElement('label', {
            className: 'toggle-switch',
            style: { transform: 'scale(0.75)' }
        });
        const checkbox = createSafeElement('input', {
            attrs: {
                type: 'checkbox',
                id: 'risk-filter-toggle',
                ...(isActive ? { checked: 'checked' } : {})
            }
        });
        const toggleSlider = createSafeElement('span', { className: 'toggle-slider' });

        toggleLabel.appendChild(checkbox);
        toggleLabel.appendChild(toggleSlider);
        filterToggle.appendChild(filterLabel);
        filterToggle.appendChild(toggleLabel);
        container.appendChild(filterToggle);
    };

    /**
     * Render the column header row for the contribution chart.
     * @param {HTMLElement} container
     */
    const renderContributionHeader = (container) => {
        const headerRow = createSafeElement('div', { className: 'contrib-header' });
        const headerLeft = createSafeElement('div', { className: 'contrib-header-left' });
        const headerCenter = createSafeElement('div', { className: 'contrib-header-center' });

        const leftSide = createSafeElement('div', { className: 'contrib-header-left-side' });
        const protectiveLabel = createSafeElement('span', {
            className: 'contrib-label-full',
            text: t('chart.protectiveFactors', 'Protective Factors')
        });
        leftSide.appendChild(protectiveLabel);

        // Unlabeled neutral gray stripe in the center
        const centerLabel = createSafeElement('div', { className: 'contrib-header-center-label' });

        const rightSide = createSafeElement('div', { className: 'contrib-header-right-side' });
        const riskLabel = createSafeElement('span', {
            className: 'contrib-label-full',
            text: t('chart.riskFactors', 'Risk Factors')
        });
        rightSide.appendChild(riskLabel);

        headerCenter.appendChild(leftSide);
        headerCenter.appendChild(centerLabel);
        headerCenter.appendChild(rightSide);

        const headerRight = createSafeElement('div', { className: 'contrib-header-right' });

        headerRow.appendChild(headerLeft);
        headerRow.appendChild(headerCenter);
        headerRow.appendChild(headerRight);
        container.appendChild(headerRow);
    };

    /**
     * Build info text for a contribution row based on factor type.
     * @param {Object} params - { key, isPositive, isAboveAverage, pctDisplay }
     * @returns {string} info text
     */
    const buildContributionInfoText = ({ key, isPositive, isAboveAverage, pctDisplay }) => {
        const isProtectiveFactor = CFG.BETAS[key] < 0;
        const isBinaryFactor = ['race', 'parentHist'].includes(key);
        const label = t(`factors.${key}`, CFG.LABELS[key]);
        const actionVerb = isProtectiveFactor
            ? t('chart.verb.increasing', 'Increasing')
            : t('chart.verb.lowering', 'Lowering');

        if (isBinaryFactor) {
            const tmpl = isPositive
                ? t('chart.info.binaryIncrease', 'Your {factor} increases your overall diabetes risk by {pct}. Check the treatment section on the right.')
                : t('chart.info.binaryDecrease', 'Your {factor} decreases your overall diabetes risk by {pct} compared to an average person.');
            return tmpl.replace('{factor}', label.toLowerCase()).replace('{pct}', pctDisplay);
        }

        const infoKey = isPositive
            ? (isAboveAverage ? 'aboveIncrease' : 'belowIncrease')
            : (isAboveAverage ? 'aboveDecrease' : 'belowDecrease');

        const fallbacks = {
            aboveIncrease: 'Your {factor} is above average and increases your overall diabetes risk by {pct} compared to an average value. {verb} it would help to decrease your overall risk. Check the treatment section on the right.',
            belowIncrease: 'Your {factor} is below average and increases your overall diabetes risk by {pct} compared to an average value. {verb} it would help to decrease your overall risk. Check the treatment section on the right.',
            aboveDecrease: 'Your {factor} is above average and decreases your overall diabetes risk by {pct} compared to an average value.',
            belowDecrease: 'Your {factor} is below average and decreases your overall diabetes risk by {pct} compared to an average value.'
        };

        return t(`chart.info.${infoKey}`, fallbacks[infoKey])
            .replace('{factor}', label.toLowerCase())
            .replace('{pct}', pctDisplay)
            .replace('{verb}', actionVerb);
    };

    /**
     * Build a single contribution row element.
     * @param {Object} params - { key, deltaI, maxAbs }
     * @returns {HTMLElement} row element
     */
    const buildContributionRow = ({ key, deltaI, maxAbs }) => {
        const barWidth = (Math.abs(deltaI) / maxAbs) * 100;
        const isPositive = deltaI >= 0;
        const absDeltaPct = Math.abs(deltaI) * 100;
        const pctDisplay = absDeltaPct < 0.1 ? '<0.1%' : (absDeltaPct.toFixed(1) + '%');
        const signedDisplay = isPositive ? '+' + pctDisplay : '−' + pctDisplay;

        const isProtectiveFactor = CFG.BETAS[key] < 0;
        const isAboveAverage = isProtectiveFactor ? !isPositive : isPositive;
        const label = t(`factors.${key}`, CFG.LABELS[key]);

        const infoText = buildContributionInfoText({ key, isPositive, isAboveAverage, pctDisplay });

        const row = createSafeElement('div', {
            className: 'contrib-row',
            attrs: {
                'data-field': key,
                tabindex: '0',
                role: 'button',
                'aria-expanded': 'false'
            }
        });

        // Build inner row
        const rowInner = createSafeElement('div', { className: 'contrib-row-inner' });

        // Label cell
        const labelCell = createSafeElement('div', { className: 'contrib-row-label-cell' });
        const labelSpan = createSafeElement('span', { className: 'contrib-row-label', text: label });
        labelCell.appendChild(labelSpan);

        // Bar container
        const barContainer = createSafeElement('div', { className: 'contrib-bar' });
        const barLeft = createSafeElement('div', { className: 'contrib-bar-half contrib-bar-left' });
        if (!isPositive) {
            const barFill = createSafeElement('div', {
                className: 'contrib-bar-fill bar-negative',
                style: { transform: `scaleX(${barWidth / 100})` }
            });
            barLeft.appendChild(barFill);
        }

        const barCenter = createSafeElement('div', { className: 'contrib-bar-center' });

        const barRight = createSafeElement('div', { className: 'contrib-bar-half contrib-bar-right' });
        if (isPositive) {
            const barFill = createSafeElement('div', {
                className: 'contrib-bar-fill bar-positive',
                style: { transform: `scaleX(${barWidth / 100})` }
            });
            barRight.appendChild(barFill);
        }

        barContainer.appendChild(barLeft);
        barContainer.appendChild(barCenter);
        barContainer.appendChild(barRight);

        // Value cell
        const valueCell = createSafeElement('div', {
            className: ['contrib-row-value', isPositive ? 'value-positive' : 'value-negative']
        });
        const valuePct = createSafeElement('span', { className: 'contrib-value-pct', text: signedDisplay });
        const valueHint = createSafeElement('span', { className: 'contrib-value-hint', text: t('chart.clickForInfo', 'Click for info') });
        valueCell.appendChild(valuePct);
        valueCell.appendChild(valueHint);

        // Assemble row inner
        rowInner.appendChild(labelCell);
        rowInner.appendChild(barContainer);
        rowInner.appendChild(valueCell);

        // Detail section
        const detailDiv = createSafeElement('div', { className: 'contrib-row-detail' });
        const detailText = createSafeElement('p', { className: 'contrib-detail-text', text: infoText });
        detailDiv.appendChild(detailText);

        // Assemble full row
        row.appendChild(rowInner);
        row.appendChild(detailDiv);

        return row;
    };

    /**
     * Render all contribution rows.
     * @param {HTMLElement} container
     * @param {Object} contributions
     * @param {boolean} filterState
     */
    const renderContributionRows = (container, contributions, filterState) => {
        const items = Object.entries(contributions)
            .map(([key, deltaI]) => ({ key, deltaI, abs: Math.abs(deltaI) }))
            .sort((a, b) => b.abs - a.abs);

        const filteredItems = filterState ? items.filter(i => i.deltaI > 0) : items;
        const maxAbs = filteredItems.reduce((max, i) => i.abs > max ? i.abs : max, 0.001);

        filteredItems.forEach(({ key, deltaI }) => {
            const row = buildContributionRow({ key, deltaI, maxAbs });
            container.appendChild(row);
        });
    };

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
        container.replaceChildren();

        const { contributions } = summaryData;
        const activeModel = DRC.App?.getActiveModel?.();

        filterByModel(contributions, activeModel);
        setupContributionEvents(container);

        // Default to hiding protective factors (button off by default)
        const showProtective = container.getAttribute('data-show-protective') === 'true';

        if (showProtective) {
            container.classList.remove('contrib-simple-mode');
        } else {
            container.classList.add('contrib-simple-mode');
        }

        renderFilterToggle(container, showProtective);
        if (showProtective) {
            renderContributionHeader(container);
        }
        renderContributionRows(container, contributions, !showProtective);
    };

    // ─── Rendering: Treatment overview ──────────────────────────────────

    // ===== Shared Helpers (used by both contribution and treatment charts) =====

    /**
     * Filter items to only include factors in the active model.
     * @param {Array} items - Array of items with 'factor' property
     * @param {Object} model - Active model with treatmentFields array
     * @returns {Array} Filtered items
     */
    const filterContributionsByModel = (items, model) => {
        const treatmentFields = model?.treatmentFields;
        return treatmentFields ? items.filter(i => treatmentFields.includes(i.factor)) : items;
    };

    /**
     * Calculate maximum value from array using accessor function.
     * @param {Array} items - Array of items
     * @param {Function} accessor - Function to extract value (e.g., i => i.pct)
     * @param {number} minValue - Minimum return value (default: 1)
     * @returns {number} Maximum value
     */
    const calculateMaxValue = (items, accessor, minValue = 1) =>
        items.reduce((max, i) => Math.max(max, accessor(i)), minValue);

    /**
     * Calculate bar width as percentage relative to max.
     * @param {number} value - Current value
     * @param {number} max - Maximum value
     * @returns {number} Width percentage (0-100)
     */
    const calculateBarWidth = (value, max) => max > 0 ? (value / max) * 100 : 0;

    /**
     * Format risk percentage with sign and threshold display.
     * @param {number} value - Risk value (0-1)
     * @returns {string} Formatted string like '+1.5' or '−0.8' or '<0.1'
     */
    const formatRiskPercent = (value) => {
        const v = Math.abs(value) * 100;
        const sign = value >= 0 ? '+' : '−';
        const disp = v < 0.1 ? '<0.1' : v.toFixed(1);
        return `${sign}${disp}`;
    };

    // ===== Treatment-specific calculation functions =====

    /**
     * Build therapy HTML string for a treatment factor.
     * @param {string} factor - Factor key
     * @param {Object} treatment - Treatment config
     * @param {boolean} waistIsHigh - Whether waist is clinically elevated
     * @returns {string} HTML string for therapies
     */
    const buildTherapiesHTML = (factor, treatment, waistIsHigh) => {
        let therapies = [...treatment.therapies];
        if (factor === 'waist' && waistIsHigh && treatment.surgicalOption) {
            therapies.push(treatment.surgicalOption);
        }
        return therapies.map((tItem, idx) => {
            const therapyName = t(`treatments.${factor}.therapy${idx+1}_name`, tItem.name);
            const therapyDesc = t(`treatments.${factor}.therapy${idx+1}_desc`, tItem.desc);
            return `<div class="therapy-mini"><div><strong>${escapeHtml(therapyName)}:</strong> ${escapeHtml(therapyDesc)}</div></div>`;
        }).join('');
    };

    /**
     * Calculate treatment items from contributions and marginals.
     * @param {Object} contributions - Log-odds contributions by factor
     * @param {Object} marginalContributions - Marginal contributions
     * @param {Object} treatStatus - Object with elevatedFactors array
     * @returns {Array} Sorted treatment items
     */
    const calculateTreatmentItems = (contributions, marginalContributions, treatStatus) => {
        const totalAbs = Object.values(contributions).reduce((sum, v) => sum + Math.abs(v), 0);

        return Object.keys(CFG.TREATMENTS).map(factor => {
            const marginalDelta = marginalContributions[factor] || 0;
            const isAboveAverage = marginalDelta >= 0;
            const isClinicallyElevated = treatStatus.elevatedFactors.includes(factor);
            const isIndicated = isClinicallyElevated && isAboveAverage;
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
    };

    /**
     * Determine treatment status info (icon, label, class) based on state.
     * @param {boolean} isIndicated - Whether treatment is clinically indicated
     * @param {boolean} isElevated - Whether factor is above average
     * @returns {Object} { statusIcon, statusLabel, statusClass }
     */
    const determineTreatmentStatus = (isIndicated, isElevated) => {
        if (isIndicated) {
            return {
                statusIcon: 'alert-triangle',
                statusLabel: t('status.indicated', 'Indicated'),
                statusClass: 'status-indicated'
            };
        }
        if (isElevated) {
            return {
                statusIcon: 'alert-circle',
                statusLabel: t('status.elevated', 'Elevated'),
                statusClass: 'status-elevated'
            };
        }
        return {
            statusIcon: 'check-circle',
            statusLabel: t('status.normal', 'Normal'),
            statusClass: 'status-normal'
        };
    };

    // ===== Treatment DOM rendering functions =====

    /**
     * Parse therapy HTML and append to details container.
     * @param {HTMLElement} detailsInner - Container for therapy items
     * @param {string} therapiesHTML - HTML string of therapies
     */
    const appendTherapiesToDetails = (detailsInner, therapiesHTML) => {
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(therapiesHTML, 'text/html');
        const therapyElements = parsedDoc.body.children;
        while (therapyElements.length > 0) {
            detailsInner.appendChild(therapyElements[0]);
        }
    };

    /**
     * Create simulate button for indicated treatments.
     * @param {string} factor - Factor key
     * @returns {HTMLElement} Simulate button element
     */
    const createSimulateButton = (factor) => {
        const simButton = createSafeElement('button', {
            className: 'btn-simulate-treatment',
            attrs: { 'data-sim-factor': factor }
        });
        const playIcon = createSafeElement('i', {
            className: 'lucide-icon',
            attrs: { 'data-lucide': 'play-circle' }
        });
        simButton.appendChild(playIcon);
        simButton.appendChild(document.createTextNode(' ' + t('buttons.simulate', 'Simulate Treatment')));
        return simButton;
    };

    /**
     * Render a single treatment row.
     * @param {Object} item - Treatment item data
     * @param {number} maxPct - Maximum percentage for bar scaling
     * @param {boolean} waistIsHigh - Whether waist is clinically elevated
     * @returns {HTMLElement} Treatment row element
     */
    const renderTreatmentRow = (item, maxPct, waistIsHigh) => {
        const { factor, treatment, pct, marginalDelta, isIndicated, isElevated, isAboveAverage, isSimulated } = item;
        const barWidth = calculateBarWidth(pct, maxPct);

        // Create row container
        const rowClasses = [
            'treatment-overview-row',
            isIndicated ? 'indicated' : (isElevated ? 'elevated' : 'normal'),
            isSimulated ? 'simulated' : ''
        ].filter(c => c !== '');
        const row = createSafeElement('div', {
            className: rowClasses,
            attrs: { 'data-field': factor }
        });
        row.id = treatment.id;

        // Icon column
        const iconCol = createSafeElement('div', { className: 'tov-icon-col' });
        const iconEl = createSafeElement('i', {
            className: ['lucide-icon', 'tov-factor-icon'],
            attrs: { 'data-lucide': treatment.icon }
        });
        iconCol.appendChild(iconEl);

        // Main column
        const mainCol = createSafeElement('div', { className: 'tov-main-col' });

        // Label row — always clickable (expand/collapse)
        const labelRow = createSafeElement('div', {
            className: 'tov-label-row tov-clickable',
            attrs: {
                'data-toggle-factor': factor,
                tabindex: '0',
                role: 'button',
                'aria-expanded': isIndicated ? 'true' : 'false'
            }
        });
        const titleText = t(`treatments.${factor}.title`, treatment.title);
        const titleSpan = createSafeElement('span', {
            className: 'tov-title',
            text: titleText,
            attrs: { title: titleText }
        });
        labelRow.appendChild(titleSpan);

        if (isSimulated) {
            // Reduction pill: replaces status badge for simulated cards
            const reduction = DRC.TreatmentSimulator?.getIndividualReduction?.(factor) ?? 0;
            const reductionPill = createSafeElement('span', { className: 'tov-reduction-pill' });
            const arrowIcon = createSafeElement('i', {
                className: 'lucide-icon',
                attrs: { 'data-lucide': 'arrow-down' }
            });
            reductionPill.appendChild(arrowIcon);
            reductionPill.appendChild(document.createTextNode('\u00a0' + reduction.toFixed(1) + '%'));
            labelRow.appendChild(reductionPill);
            const chevronIcon = createSafeElement('i', {
                className: ['lucide-icon', 'tov-chevron', 'collapsed'],
                attrs: { 'data-lucide': 'chevron-down' }
            });
            labelRow.appendChild(chevronIcon);
        } else {
            // Status badge + expand chevron
            const { statusIcon, statusLabel, statusClass } = determineTreatmentStatus(isIndicated, isElevated);
            const statusSpan = createSafeElement('span', { className: ['tov-status', statusClass] });
            const statusIconEl = createSafeElement('i', {
                className: 'lucide-icon',
                attrs: { 'data-lucide': statusIcon }
            });
            statusSpan.appendChild(statusIconEl);
            statusSpan.appendChild(document.createTextNode(' ' + statusLabel));
            const chevronIcon = createSafeElement('i', {
                className: ['lucide-icon', 'tov-chevron', isIndicated ? '' : 'collapsed'],
                attrs: { 'data-lucide': 'chevron-down' }
            });
            labelRow.appendChild(statusSpan);
            labelRow.appendChild(chevronIcon);
        }

        // Bar container (kept for relative-contribution context)
        const barContainer = createSafeElement('div', { className: 'tov-bar-container' });
        const bar = createSafeElement('div', {
            className: ['tov-bar', isAboveAverage ? 'bar-indicated' : 'bar-normal'],
            style: { transform: `scaleX(${barWidth / 100})` }
        });
        barContainer.appendChild(bar);

        mainCol.appendChild(labelRow);
        mainCol.appendChild(barContainer);

        if (isSimulated) {
            // Expandable details with therapies (collapsed by default)
            const therapiesHTML = buildTherapiesHTML(factor, treatment, waistIsHigh);
            const detailsDiv = createSafeElement('div', { className: 'tov-details' });
            const detailsInner = createSafeElement('div', { className: 'tov-details-inner' });
            appendTherapiesToDetails(detailsInner, therapiesHTML);
            detailsDiv.appendChild(detailsInner);
            mainCol.appendChild(detailsDiv);

            // Undo button always visible below the bar
            const undoBtn = createSafeElement('button', {
                className: 'btn-undo-treatment',
                attrs: {
                    type: 'button',
                    'data-sim-factor': factor,
                    'aria-label': t('buttons.undoTreatment', 'Undo this treatment')
                }
            });
            const undoIcon = createSafeElement('i', {
                className: 'lucide-icon',
                attrs: { 'data-lucide': 'rotate-ccw' }
            });
            undoBtn.appendChild(undoIcon);
            undoBtn.appendChild(document.createTextNode(' ' + t('buttons.undo', 'Undo')));
            mainCol.appendChild(undoBtn);
        } else {
            // Risk contribution text + expandable details
            const riskContribText = formatRiskPercent(marginalDelta);
            const pctDiv = createSafeElement('div', {
                className: 'tov-pct',
                text: riskContribText + '% ' + t('treatments.riskContribution', 'risk contribution compared to average')
            });
            mainCol.appendChild(pctDiv);

            const therapiesHTML = buildTherapiesHTML(factor, treatment, waistIsHigh);
            const detailsDiv = createSafeElement('div', {
                className: ['tov-details', isIndicated ? 'expanded' : '']
            });
            const detailsInner = createSafeElement('div', { className: 'tov-details-inner' });
            appendTherapiesToDetails(detailsInner, therapiesHTML);
            if (isIndicated) {
                detailsInner.appendChild(createSimulateButton(factor));
            }
            detailsDiv.appendChild(detailsInner);
            mainCol.appendChild(detailsDiv);
        }

        // Assemble row
        row.appendChild(iconCol);
        row.appendChild(mainCol);

        // Neutral icon styling — colour stays only on the bar
        iconCol.style.background = 'rgba(0, 0, 0, 0.07)';
        iconEl.style.setProperty('color', '#636366', 'important');

        return row;
    };

    /**
     * Setup event delegation for treatment container.
     * Handles expand/collapse and simulate treatment clicks.
     */
    const setupTreatmentEvents = () => {
        if (_treatmentDelegationAttached) return;

        const container = el('treatment-overview');
        if (!container) return;

        // Delegated undo handler on the chosen-treatments-list container
        // (inside #simulation-results, outside #treatment-overview).
        const chosenList = el('chosen-treatments-list');
        if (chosenList) {
            chosenList.addEventListener('click', (e) => {
                const undoBtn = e.target.closest('.btn-undo-treatment');
                if (!undoBtn) return;
                e.stopPropagation();
                const simFactor = undoBtn.getAttribute('data-sim-factor');
                if (simFactor && DRC.TreatmentSimulator?.unsimulate) {
                    DRC.TreatmentSimulator.unsimulate(simFactor);
                }
            });
        }

        container.addEventListener('click', (e) => {
            // Expand/collapse handler
            const clickable = e.target.closest('.tov-clickable');
            if (clickable) {
                const row = clickable.closest('.treatment-overview-row');
                if (row) {
                    const details = row.querySelector('.tov-details');
                    details?.classList.toggle('expanded');
                    row.querySelector('.tov-chevron')?.classList.toggle('collapsed');
                    const isExpanded = details?.classList.contains('expanded');
                    clickable.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                }
                return;
            }

            // Simulate treatment handler
            const simBtn = e.target.closest('.btn-simulate-treatment');
            if (simBtn) {
                e.stopPropagation();
                const simFactor = simBtn.getAttribute('data-sim-factor');
                if (simFactor && DRC.TreatmentSimulator) {
                    expandTreatmentPanel();
                    handleSimulation(simFactor);
                }
                return;
            }

            // Undo simulation handler
            const undoBtn = e.target.closest('.btn-undo-treatment');
            if (undoBtn) {
                e.stopPropagation();
                const simFactor = undoBtn.getAttribute('data-sim-factor');
                if (simFactor && DRC.TreatmentSimulator?.unsimulate) {
                    DRC.TreatmentSimulator.unsimulate(simFactor);
                }
            }
        });

        container.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const clickable = e.target.closest('.tov-clickable');
            if (!clickable) return;
            e.preventDefault();
            const row = clickable.closest('.treatment-overview-row');
            if (row) {
                const details = row.querySelector('.tov-details');
                details?.classList.toggle('expanded');
                row.querySelector('.tov-chevron')?.classList.toggle('collapsed');
                const isExpanded = details?.classList.contains('expanded');
                clickable.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            }
        });

        _treatmentDelegationAttached = true;
    };

    /**
     * Expand treatment panel if collapsed.
     */
    const expandTreatmentPanel = () => {
        const panel = el('panel-treatment');
        if (!panel) return;

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
    };

    /**
     * Handle simulation with profile warning check.
     * @param {string} factor - Factor to simulate
     */
    const handleSimulation = (factor) => {
        if (DRC.ProfileWarning) {
            DRC.ProfileWarning.checkBeforeSimulation(factor).then(shouldProceed => {
                if (shouldProceed === true) {
                    DRC.TreatmentSimulator.simulate(factor);
                }
            });
        } else {
            DRC.TreatmentSimulator.simulate(factor);
        }
    };

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
        container.replaceChildren();

        // Check if risk-factors-only filter is active
        const contribContainer = el('contribution-chart');
        const filterRiskOnly = contribContainer?.getAttribute('data-filter-risk') !== 'false';

        // Calculate treatment items
        const treatStatus = { elevatedFactors, waistIsHigh };
        const items = calculateTreatmentItems(contributions, marginalContributions, treatStatus);

        // Filter by active model
        const activeModel = DRC.App?.getActiveModel?.();
        const modelFilteredItems = filterContributionsByModel(items, activeModel);

        // Mark simulated items before filtering — they must always be shown
        const simulatedSet = new Set(DRC.TreatmentSimulator?.getSimulatedFactors?.() ?? []);
        modelFilteredItems.forEach(item => { item.isSimulated = simulatedSet.has(item.factor); });

        // Apply risk filter but always keep simulated items (their value changed, not their relevance)
        const displayItems = filterRiskOnly
            ? modelFilteredItems.filter(i => i.isAboveAverage || i.isSimulated)
            : modelFilteredItems;
        displayItems.sort((a, b) => {
            if (a.isSimulated !== b.isSimulated) return a.isSimulated ? -1 : 1;
            return b.absContrib - a.absContrib;
        });

        // Calculate max percentage for bar scaling
        const maxPct = calculateMaxValue(displayItems, i => i.pct, 1);

        // Render simulated cards first, then a divider, then the rest
        const simulatedItems = displayItems.filter(i => i.isSimulated);
        const remainingItems = displayItems.filter(i => !i.isSimulated);

        if (simulatedItems.length > 0) {
            const simDivider = createSafeElement('div', { className: 'treatment-section-divider' });
            const simLabel = createSafeElement('span', {
                className: 'treatment-section-label',
                text: t('treatments.simulatedInterventions', 'Simulated Interventions')
            });
            simDivider.appendChild(simLabel);
            container.appendChild(simDivider);
        }

        simulatedItems.forEach(item => {
            container.appendChild(renderTreatmentRow(item, maxPct, waistIsHigh));
        });

        if (simulatedItems.length > 0 && remainingItems.length > 0) {
            const divider = createSafeElement('div', { className: 'treatment-section-divider' });
            const label = createSafeElement('span', {
                className: 'treatment-section-label',
                text: t('treatments.otherInterventions', 'Other Interventions')
            });
            divider.appendChild(label);
            container.appendChild(divider);
        }

        remainingItems.forEach(item => {
            container.appendChild(renderTreatmentRow(item, maxPct, waistIsHigh));
        });

        // Setup event delegation
        setupTreatmentEvents();

        // Re-initialize Lucide icons for dynamically added content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    /** Legacy no-op kept for API compatibility. */
    const renderTreatmentRecommendations = () => {
        const c = el('dynamic-treatments');
        if (c) c.replaceChildren();
    };

    // ─── Rendering: What-if badges ──────────────────────────────────────

    /** Update a single what-if delta badge. */
    const renderWhatIfBadge = (field, delta) => {
        const badge = el(`what-if-${field}`);
        if (!badge) return;
        // Handle edge cases: NaN, Infinity
        if (!isFinite(delta) || Math.abs(delta) < 0.01) {
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

        // Handle edge cases: NaN, Infinity
        if (!isFinite(riskPct)) {
            // Clear container safely
            while (container.firstChild) container.removeChild(container.firstChild);
            if (label) label.textContent = t('iconArray.error', 'Unable to calculate risk visualization');
            return;
        }

        const affected = Math.min(Math.max(Math.round(riskPct), 0), 100);
        // Clear container safely (remove all children)
        while (container.firstChild) container.removeChild(container.firstChild);
        for (let i = 0; i < 100; i++) {
            const icon = document.createElement('div');
            icon.className = `icon-array-item${i < affected ? ' affected' : ''}`;
            container.appendChild(icon);
        }
        if (label) {
            label.textContent = t('iconArray.label', '${affected} out of 100 people with your profile may develop diabetes within 9 years').replace('${affected}', affected);
        }
    };

    // ─── Rendering: Chosen risk & treatments list ──────────────────────

    /**
     * Render the "Your Risk with Chosen Treatments" value.
     * @param {number} pct — Post-simulation risk percentage.
     * @param {number} [originalPct] — Pre-simulation risk percentage for reduction display.
     */
    const renderChosenRisk = (pct, originalPct) => {
        // Handle edge cases: NaN, Infinity
        if (!isFinite(pct)) {
            setText('chosen-risk-percentage', '---');
            return;
        }
        // Clamp to valid range
        const safePct = Math.min(Math.max(pct, 0), 100);
        setText('chosen-risk-percentage', safePct.toFixed(1));
        const { color } = getRiskLevel(safePct);
        const chosenEl = el('chosen-risk-percentage');
        if (chosenEl) chosenEl.style.color = color;

        // Color the % unit symbol too
        const unitEl = el('chosen-risk-unit');
        if (unitEl) unitEl.style.color = color;

        // Update original risk display in side-by-side comparison
        if (originalPct != null) {
            const origEl = el('orig-risk-display');
            if (origEl) {
                origEl.textContent = originalPct.toFixed(1);
                origEl.style.color = getRiskLevel(originalPct).color;
            }
        }

        // Update the risk bar marker position and color
        const marker = el('chosen-risk-bar-marker');
        if (marker) {
            marker.style.left = `${Math.min(safePct, 100)}%`;
            marker.style.borderColor = color;
        }

        // Show total reduction badge
        const badge = el('treatment-reduction-badge');
        if (badge && originalPct != null) {
            const reduction = originalPct - pct;
            if (reduction > 0.05) {
                badge.textContent = '↓ ' + reduction.toFixed(1) + '% ' + t('hero.reductionLabel', 'Risk Reduction by Treatments');
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    };

    /**
     * Show/hide the simulation-results summary panel.
     * Individual simulated treatments now appear inline in renderTreatmentOverview.
     * @param {string[]} factors — Array of simulated factor keys.
     */
    const renderChosenTreatmentsList = (factors) => {
        const simResults = el('simulation-results');
        if (simResults) simResults.style.display = (!factors || factors.length === 0) ? 'none' : '';
    };

    // ─── Non-modifiable summary ─────────────────────────────────────────

    /** Update the collapsed summary line for non-modifiable factors. */
    const updateNonModSummary = () => {
        const age    = el('age-value')?.value || '50';
        const sex    = el('sex-toggle')?.checked ? t('units.male', 'Male') : t('units.female', 'Female');
        const race   = el('race-toggle')?.checked ? t('units.black', 'Black') : t('units.other', 'Other');
        const parent = el('parentHist-toggle')?.checked ? t('units.yes', 'Yes') : t('units.no', 'No');
        const hVal   = el('height-value')?.value || '66';
        const hUnit  = el('height-value-unit')?.textContent || 'in';

        setText('summary-age',    t('summary.age', 'Age') + ': ' + age);
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

        // Clear existing content
        track.textContent = '';
        labels.textContent = '';

        // Build safe segment
        const safeSegment = createSafeElement('div', {
            className: 'slider-segment safe',
            style: { '--flex': String(safeFlex) }
        });
        track.appendChild(safeSegment);

        // Build danger segment
        const dangerSegment = createSafeElement('div', {
            className: 'slider-segment danger',
            style: { '--flex': String(dangerFlex) }
        });
        track.appendChild(dangerSegment);

        // Build labels
        const minLabel = createSafeElement('span', {
            style: { '--flex': String(safeFlex), textAlign: 'left' },
            text: String(min)
        });
        const thresholdLabel = createSafeElement('span', {
            style: { '--flex': '0', whiteSpace: 'nowrap' },
            text: String(threshold)
        });
        const maxLabel = createSafeElement('span', {
            style: { '--flex': String(dangerFlex), textAlign: 'right' },
            text: String(max)
        });
        labels.appendChild(minLabel);
        labels.appendChild(thresholdLabel);
        labels.appendChild(maxLabel);
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

        setText('summary-fastGlu', t('summary.glucose', 'Glucose') + ': ' + gVal + ' ' + gUnit);
        setText('summary-waist',   t('summary.waist', 'Waist') + ': ' + wVal + ' ' + wUnit);
        setText('summary-sbp',     t('summary.bp', 'Blood Pressure') + ': ' + bp + ' mmHg');
        setText('summary-hdl',     t('summary.hdl', 'HDL') + ': ' + hdlVal + ' ' + hdlUnit);
        setText('summary-tri',     t('summary.tg', 'TG') + ': ' + tVal + ' ' + tUnit);
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

    // ─── Public API ─────────────────────────────────────────────────────

    return {
        readInputs, updateUnitLabels, updateSliderRanges,
        applyConvertedValues, updateSliderFill, updateAllSliderFills,
        renderRisk, renderChosenRisk, renderChosenTreatmentsList,
        renderContributionChart,
        renderTreatmentOverview, renderTreatmentRecommendations,
        renderWhatIfBadge, renderIconArray,
        updateNonModSummary, updateModSummary, updateWaistSegments,
        getSliderElements, getUnitToggleState
    };
})();
