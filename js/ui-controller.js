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
    const { el, setText, clampAndRound, formatAxisValue } = DRC.UIHelpers;
    const CFG = DRC.CONFIG;

    // ─── Risk-level color mapping ───────────────────────────────────────
    const RISK_COLORS = [
        { min: 50, color: '#ff3b30', level: 'danger' },
        { min: 25, color: '#ff6723', level: 'warning' },
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
        const pct = ((parseFloat(slider.value) - parseFloat(slider.min)) /
                     (parseFloat(slider.max) - parseFloat(slider.min))) * 100;
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
        ['height', 'waist', 'cholTri'].forEach(field => {
            const [min, max] = CFG.RANGES[field][mode];
            const isFloat = isMetric && CFG.RANGES[field].si[2] < 1;
            setText(`${field}-min`, formatAxisValue(min, isFloat));
            setText(`${field}-mid`, formatAxisValue((min + max) / 2, isFloat));
            setText(`${field}-max`, formatAxisValue(max, isFloat));
        });
    };

    // ─── Value conversion (US ↔ SI) ─────────────────────────────────────

    /** Convert and apply saved US values when switching units. */
    const applyConvertedValues = (savedValues, isMetric) => {
        const c    = CFG.CONVERSIONS;
        const mode = isMetric ? 'si' : 'us';

        // Conversion map: field → { toSI, fromSI } multipliers
        const convMap = {
            height:  c.heightToCm,
            waist:   c.waistToCm,
            fastGlu: c.gluToMmol,
            cholHDL: c.hdlToMmol,
            cholTri: c.triToMmol
        };

        Object.entries(savedValues).forEach(([field, rawVal]) => {
            let val = rawVal;
            const multiplier = convMap[field];
            if (multiplier) {
                val = isMetric ? val * multiplier : val / multiplier;
            }
            const [min, max, step] = CFG.RANGES[field][mode];
            val = clampAndRound(val, min, max, step);

            const input  = el(`${field}-value`);
            const slider = el(`${field}-slider`);
            if (input)  input.value  = val;
            if (slider) slider.value = val;
        });
    };

    // ─── Reading inputs ─────────────────────────────────────────────────

    /** Read all current input values from the DOM. */
    const readInputs = () => ({
        age:        parseFloat(el('age-value').value)      || 0,
        race:       el('race-toggle').checked  ? 1 : 0,
        parentHist: el('parentHist-toggle').checked ? 1 : 0,
        sbp:        parseFloat(el('sbp-value').value)      || 0,
        height:     parseFloat(el('height-value').value)   || 0,
        waist:      parseFloat(el('waist-value').value)    || 0,
        fastGlu:    parseFloat(el('fastGlu-value').value)  || 0,
        cholHDL:    parseFloat(el('cholHDL-value').value)  || 0,
        cholTri:    parseFloat(el('cholTri-value').value)  || 0
    });

    // ─── Rendering: Risk score (EID SBB) ────────────────────────────────

    /** Display the risk percentage with preattentive color glow. */
    const renderRisk = (pct) => {
        setText('risk-percentage', pct.toFixed(1));
        const { color, level } = getRiskLevel(pct);

        // Color the percentage text
        const riskEl = el('risk-percentage');
        const pctEl  = document.querySelector('.risk-unit');
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
     * Mathematical basis (Van Belle & Calster, 2015):
     *   percentage_i = |contribution_i| / sum(|contribution_j|) * 100
     */
    const renderContributionChart = (contributions) => {
        const container = el('contribution-chart');
        if (!container) return;
        container.innerHTML = '';

        // Risk-factors-only filter toggle (default: enabled)
        // Shows only factors with positive contribution (above population mean = risk-increasing)
        const filterState = container.getAttribute('data-filter-risk') !== 'false';

        const filterToggle = document.createElement('div');
        filterToggle.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-bottom:8px;';
        filterToggle.innerHTML = `
            <span style="font-size:11px;color:#6e6e73;">Show above average risk factors only</span>
            <label class="toggle-switch" style="transform:scale(0.75);">
                <input type="checkbox" id="risk-filter-toggle" ${filterState ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        `;
        container.appendChild(filterToggle);

        document.getElementById('risk-filter-toggle')?.addEventListener('change', (e) => {
            container.setAttribute('data-filter-risk', e.target.checked);
            // Trigger recalculation to re-render
            DRC.App._calculate();
        });

        const totalAbs = Object.values(contributions)
            .reduce((sum, v) => sum + Math.abs(v), 0);

        const items = Object.entries(contributions)
            .map(([key, val]) => ({
                key, val,
                abs: Math.abs(val),
                pct: totalAbs > 0 ? (Math.abs(val) / totalAbs) * 100 : 0
            }))
            .sort((a, b) => b.abs - a.abs);

        // When filter active: show only risk-increasing factors (positive contribution = above population mean)
        const filteredItems = filterState ? items.filter(i => i.val > 0) : items;
        const maxPct = Math.max(...filteredItems.map(i => i.pct), 1);

        filteredItems.forEach(({ key, val, pct }, idx) => {
            const barWidth = (pct / maxPct) * 100;
            const isPositive = val >= 0;
            const pctDisplay = pct < 1 && pct > 0 ? '<1%' : Math.round(pct) + '%';
            const barColor = isPositive
                ? 'linear-gradient(90deg, #ff3b30, #ff453a)'
                : 'linear-gradient(270deg, #34c759, #30d158)';
            const textColor = isPositive ? '#ff3b30' : '#34c759';

            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:6px 4px;border-bottom:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;border-radius:6px;';
            row.setAttribute('data-field', key);

            row.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;width:100%;">
                    <div style="width:80px;flex-shrink:0;font-size:11px;font-weight:500;color:#6e6e73;text-align:right;">${CFG.LABELS[key]}</div>
                    <div style="flex:1;display:flex;height:22px;position:relative;align-items:center;">
                        <div style="flex:1;display:flex;justify-content:flex-end;padding-right:1px;height:100%;align-items:center;">
                            ${!isPositive ? `<div style="height:16px;width:${barWidth}%;border-radius:4px;transition:width 0.4s cubic-bezier(0.25,0.46,0.45,0.94);min-width:3px;background:${barColor};"></div>` : ''}
                        </div>
                        <div style="width:2px;height:100%;background:#d1d1d6;border-radius:1px;flex-shrink:0;"></div>
                        <div style="flex:1;display:flex;justify-content:flex-start;padding-left:1px;height:100%;align-items:center;">
                            ${isPositive ? `<div style="height:16px;width:${barWidth}%;border-radius:4px;transition:width 0.4s cubic-bezier(0.25,0.46,0.45,0.94);min-width:3px;background:${barColor};"></div>` : ''}
                        </div>
                    </div>
                    <div style="width:50px;flex-shrink:0;font-size:10px;font-weight:600;color:${textColor};text-align:${isPositive ? 'left' : 'right'};">${pctDisplay}</div>
                </div>
                ${idx < 3 ? (() => {
                    const beta = CFG.BETAS[key] || 0;
                    const valueAboveMean = beta >= 0 ? isPositive : !isPositive;
                    const direction = valueAboveMean ? 'above' : 'below';
                    const explanation = isPositive
                        ? `contributes ${Math.round(pct)}% to your risk – your value is ${direction} the population average.`
                        : `accounts for ${Math.round(pct)}% – your value is ${direction} average, which is favorable.`;
                    return `<div style="width:calc(100% - 88px);margin-left:88px;font-size:9px;color:#86868b;font-style:italic;margin-top:2px;line-height:1.3;">Your ${CFG.LABELS[key].toLowerCase()} ${explanation}</div>`;
                })() : ''}
            `;
            container.appendChild(row);
        });

        // Legend
        const legend = document.createElement('div');
        legend.style.cssText = 'display:flex;justify-content:center;gap:16px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);';
        legend.innerHTML = `
            <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6e6e73;">
                <div style="width:10px;height:6px;border-radius:2px;background:linear-gradient(90deg,#30d158,#34c759);"></div> Reduces Risk
            </div>
            <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6e6e73;">
                <div style="width:10px;height:6px;border-radius:2px;background:linear-gradient(90deg,#ff3b30,#ff453a);"></div> Increases Risk
            </div>
            <div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#86868b;">(% of total contribution)</div>
        `;
        container.appendChild(legend);
    };

    // ─── Rendering: Heatmap pointer ─────────────────────────────────────

    /** Move the treatment zone map pointer based on contribution weights. */
    const renderHeatmapPointer = (contributions) => {
        const pointer = el('heatmap-pointer');
        if (!pointer) return;

        const gluContrib = contributions.fastGlu;
        const otherContrib = Object.entries(contributions)
            .filter(([k]) => k !== 'fastGlu')
            .reduce((sum, [, v]) => sum + v, 0);

        const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
        pointer.style.left   = `${5 + (clamp(gluContrib, -4, 4) + 4) / 8 * 90}%`;
        pointer.style.bottom = `${5 + (clamp(otherContrib, -3, 3) + 3) / 6 * 90}%`;
    };

    // ─── Rendering: Treatment overview ──────────────────────────────────

    /**
     * Unified treatment overview with expandable detail rows.
     * Indicated treatments auto-expand; normal ones are collapsed.
     */
    const renderTreatmentOverview = ({ elevatedFactors, waistIsHigh }, contributions = {}) => {
        const container = el('treatment-overview');
        if (!container) return;
        container.innerHTML = '';

        // Check if risk-factors-only filter is active
        const contribContainer = el('contribution-chart');
        const filterRiskOnly = contribContainer?.getAttribute('data-filter-risk') !== 'false';

        const totalAbs = Object.values(contributions)
            .reduce((sum, v) => sum + Math.abs(v), 0);

        const items = Object.keys(CFG.TREATMENTS).map(factor => ({
            factor,
            treatment: CFG.TREATMENTS[factor],
            absContrib: Math.abs(contributions[factor] || 0),
            pct: totalAbs > 0 ? (Math.abs(contributions[factor] || 0) / totalAbs) * 100 : 0,
            isIndicated: elevatedFactors.includes(factor)
        })).sort((a, b) => b.absContrib - a.absContrib);

        // When risk-filter active: show only treatments for indicated (elevated) factors
        const displayItems = filterRiskOnly ? items.filter(i => i.isIndicated) : items;

        const maxPct = Math.max(...displayItems.map(i => i.pct), 1);

        displayItems.forEach(({ factor, treatment, pct, isIndicated }) => {
            const barWidth = (pct / maxPct) * 100;

            // Build therapy HTML
            let therapies = [...treatment.therapies];
            if (factor === 'waist' && waistIsHigh && treatment.surgicalOption) {
                therapies.push(treatment.surgicalOption);
            }
            const therapiesHTML = therapies.map(t =>
                `<div class="therapy-mini"><div><strong>${t.name}:</strong> ${t.desc}</div></div>`
            ).join('');

            const statusIcon  = isIndicated ? 'warning' : 'check_circle';
            const statusLabel = isIndicated ? 'Indicated' : 'Normal';
            const statusClass = isIndicated ? 'status-indicated' : 'status-normal';

            const row = document.createElement('div');
            row.className = `treatment-overview-row ${isIndicated ? 'indicated' : 'normal'}`;
            row.setAttribute('data-field', factor);
            row.id = treatment.id;

            row.innerHTML = `
                <div class="tov-icon-col">
                    <span class="material-icons-round tov-factor-icon">${treatment.icon}</span>
                </div>
                <div class="tov-main-col">
                    <div class="tov-label-row tov-clickable" data-toggle-factor="${factor}">
                        <span class="tov-title">${treatment.title}</span>
                        <span class="tov-status ${statusClass}">
                            <span class="material-icons-round">${statusIcon}</span>
                            ${statusLabel}
                        </span>
                        <span class="material-icons-round tov-chevron ${isIndicated ? '' : 'collapsed'}">expand_more</span>
                    </div>
                    <div class="tov-bar-container">
                        <div class="tov-bar ${isIndicated ? 'bar-indicated' : 'bar-normal'}" style="width:${barWidth}%;"></div>
                    </div>
                    <div class="tov-pct">${Math.round(pct)}% risk contribution</div>
                    <div class="tov-details ${isIndicated ? 'expanded' : ''}">
                        <div class="tov-details-inner">
                            ${therapiesHTML}
                            ${isIndicated ? `<button class="btn-simulate-treatment" data-sim-factor="${factor}">
                                <span class="material-icons-round">play_circle</span>
                                Simulate Treatment
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Expand/collapse handler
            row.querySelector('.tov-clickable').addEventListener('click', () => {
                row.querySelector('.tov-details').classList.toggle('expanded');
                row.querySelector('.tov-chevron').classList.toggle('collapsed');
            });

            // Simulate treatment handler
            const simBtn = row.querySelector('.btn-simulate-treatment');
            if (simBtn) {
                simBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (DRC.TreatmentSimulator) DRC.TreatmentSimulator.simulate(factor);
                });
            }

            container.appendChild(row);
        });
    };

    /** Legacy no-op kept for API compatibility. */
    const renderTreatmentRecommendations = () => {
        const c = el('dynamic-treatments');
        if (c) c.innerHTML = '';
    };

    // ─── Rendering: Beta vectors (EID KBB) ──────────────────────────────

    /** Render directional arrows on input labels showing model weight direction/magnitude. */
    const renderBetaVectors = () => {
        const entries = Object.entries(CFG.BETAS).filter(([k]) => k !== 'sigma');
        const maxBeta = Math.max(...entries.map(([, v]) => Math.abs(v)));

        entries.forEach(([key, beta]) => {
            const vecEl = el(`beta-vector-${key}`);
            if (!vecEl) return;

            const isPositive = beta > 0;
            const magnitude  = Math.abs(beta) / maxBeta;
            const sizeLabel  = magnitude > 0.5 ? 'strong' : magnitude > 0.15 ? 'moderate' : 'weak';

            vecEl.className = `beta-vector ${isPositive ? 'risk-up' : 'protective'}`;
            vecEl.setAttribute('data-arrow', isPositive ? '\u2191' : '\u2193');
            vecEl.setAttribute('data-label', `(${sizeLabel})`);
            vecEl.title = `Model weight: ${beta.toFixed(4)} \u2013 ${isPositive ? 'increases' : 'decreases'} risk (${sizeLabel})`;
        });
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
        const cls   = delta < 0 ? 'improved' : 'worsened';
        const icon  = delta < 0 ? 'trending_down' : delta > 0 ? 'trending_up' : 'trending_flat';

        panel.innerHTML = `
            <div class="scenario-inline-row">
                <div class="scenario-inline-item">
                    <span class="material-icons-round scenario-inline-icon">flag</span>
                    <span class="scenario-inline-label">Baseline</span>
                    <span class="scenario-inline-value">${baselineRisk.toFixed(1)}%</span>
                </div>
                <span class="material-icons-round scenario-inline-arrow">arrow_forward</span>
                <div class="scenario-inline-item">
                    <span class="material-icons-round scenario-inline-icon current-icon">person</span>
                    <span class="scenario-inline-label">Current</span>
                    <span class="scenario-inline-value current-value">${currentRisk.toFixed(1)}%</span>
                </div>
                <div class="scenario-inline-delta ${cls}">
                    <span class="material-icons-round">${icon}</span>
                    <span>${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%</span>
                </div>
            </div>
        `;
    };

    // ─── Non-modifiable summary ─────────────────────────────────────────

    /** Update the collapsed summary line for non-modifiable factors. */
    const updateNonModSummary = () => {
        const age    = el('age-value')?.value || '50';
        const race   = el('race-toggle')?.checked ? 'Black' : 'Other';
        const parent = el('parentHist-toggle')?.checked ? 'Family history' : 'No family hist.';
        const hVal   = el('height-value')?.value || '66';
        const hUnit  = el('height-value-unit')?.textContent || 'in';

        setText('summary-age',    'Age: ' + age);
        setText('summary-race',   race);
        setText('summary-parent', parent);
        setText('summary-height', hVal + ' ' + hUnit);
    };

    /** Update the collapsed summary line for modifiable factors. */
    const updateModSummary = () => {
        const gVal  = el('fastGlu-value')?.value || '95';
        const gUnit = el('fastGlu-value-unit')?.textContent || 'mg/dL';
        const wVal  = el('waist-value')?.value || '36';
        const wUnit = el('waist-value-unit')?.textContent || 'in';
        const bp    = el('sbp-value')?.value || '120';
        const hVal  = el('cholHDL-value')?.value || '50';
        const hUnit = el('cholHDL-value-unit')?.textContent || 'mg/dL';
        const tVal  = el('cholTri-value')?.value || '150';
        const tUnit = el('cholTri-value-unit')?.textContent || 'mg/dL';

        setText('summary-fastGlu', 'Gluc: ' + gVal + ' ' + gUnit);
        setText('summary-waist',   'Waist: ' + wVal + ' ' + wUnit);
        setText('summary-sbp',     'BP: ' + bp + ' mmHg');
        setText('summary-hdl',     'HDL: ' + hVal + ' ' + hUnit);
        setText('summary-tri',     'TG: ' + tVal + ' ' + tUnit);
    };

    // ─── Public API ─────────────────────────────────────────────────────

    return {
        readInputs, updateUnitLabels, updateSliderRanges,
        applyConvertedValues, updateSliderFill, updateAllSliderFills,
        renderRisk, renderContributionChart, renderHeatmapPointer,
        renderTreatmentOverview, renderTreatmentRecommendations,
        renderBetaVectors, renderWhatIfBadge, renderIconArray,
        renderCausalityChains, renderScenarioComparison,
        updateNonModSummary, updateModSummary
    };
})();
