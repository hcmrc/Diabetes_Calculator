/**
 * @fileoverview Timeline Chart — enhanced snapshot trend visualization.
 *
 * Displays a temporal sequence of risk snapshots as an SVG area chart with
 * treatment event markers, labeled data points, and a treatment history legend.
 * Implements EID temporal awareness by showing how risk evolves across
 * user-defined scenarios and treatment simulations.
 *
 * Design rationale:
 *   - Responsive SVG with viewBox for consistent rendering at any width
 *   - Dynamic Y-axis scaling adapts gridlines to actual data range
 *   - Treatment labels rendered directly on data points for immediate
 *     identification (Wickens & Carswell, 1995: Proximity Compatibility)
 *   - Color-coded treatment markers distinguish simulation events from
 *     manual snapshots (preattentive processing, Ware, 2012)
 *   - Treatment history sidebar provides detailed event log
 *
 * @module TimelineChart
 * @memberof DRC
 */

'use strict';

DRC.TimelineChart = (() => {
    const snapshots = [];
    const MAX_SNAPSHOTS = 20;
    let _baselineRisk = null;

    /** Set the baseline reference line value. */
    const setBaseline = (riskPct) => { _baselineRisk = riskPct; render(); };

    /** Clear the baseline reference line. */
    const clearBaseline = () => { _baselineRisk = null; render(); };

    /**
     * Add a risk snapshot to the timeline.
     * @param {number} riskPct — Current risk percentage.
     * @param {Object} siVals — SI-unit values at this point.
     * @param {string|null} treatmentLabel — Optional treatment label for this snapshot.
     */
    const addSnapshot = (riskPct, siVals, treatmentLabel = null) => {
        if (snapshots.length >= MAX_SNAPSHOTS) snapshots.shift();
        snapshots.push({
            timestamp: new Date(),
            riskPct,
            siVals: { ...siVals },
            isBaseline: _baselineRisk !== null && snapshots.length === 0,
            treatmentLabel
        });
        render();
    };

    /**
     * Format a timestamp as HH:MM.
     * @param {Date} date
     * @returns {string}
     */
    const formatTime = (date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    /**
     * Treatment color palette for distinguishing different treatment types.
     */
    const TREATMENT_COLORS = {
        'Blood Sugar Management':              '#e74c3c',
        'Blood Pressure Control':              '#2ecc71',
        'HDL Improvement':                     '#f39c12',
        'Blood Fats (Triglycerides) Treatment': '#9b59b6',
        'Weight Management':                    '#1abc9c'
    };

    /** Get a consistent color for a treatment label. */
    const getTreatmentColor = (label) => TREATMENT_COLORS[label] || '#007aff';

    /**
     * Compute nice Y-axis grid steps that adapt to data range.
     * Returns an array of values from 0 up to ceil.
     */
    const computeGridSteps = (maxVal) => {
        const ceil = Math.ceil(maxVal);
        let step;
        if (ceil <= 10) step = 2;
        else if (ceil <= 25) step = 5;
        else if (ceil <= 60) step = 10;
        else if (ceil <= 120) step = 20;
        else step = 25;
        const steps = [];
        for (let v = 0; v <= ceil; v += step) steps.push(v);
        return steps;
    };

    /** Render the timeline SVG into #timeline-chart. */
    const render = () => {
        const container = document.getElementById('timeline-chart');
        if (!container) return;

        if (snapshots.length === 0 && _baselineRisk === null) {
            container.innerHTML = '<p class="timeline-empty">Set a baseline and add snapshots to track your risk over scenarios.</p>';
            renderLegend();
            return;
        }

        // Responsive viewBox — narrower on mobile so labels stay readable
        const containerW = container.clientWidth || 375;
        const isMobile = containerW < 500;
        const VW  = isMobile ? 500 : 1100;
        const VH  = isMobile ? 300 : 290;
        const PAD = isMobile
            ? { top: 30, right: 16, bottom: 40, left: 44 }
            : { top: 28, right: 28, bottom: 36, left: 52 };
        const plotW = VW - PAD.left - PAD.right;
        const plotH = VH - PAD.top  - PAD.bottom;

        // Dynamic Y-axis: adapt to actual data range
        // Minimum ceiling of 25% keeps the chart from feeling over-zoomed
        // on low-risk profiles while still adapting to high values.
        const allValues = snapshots.map(s => s.riskPct);
        if (_baselineRisk !== null) allValues.push(_baselineRisk);
        const dataMax = Math.max(25, ...allValues);
        const maxY = dataMax * 1.1; // 10% headroom above max

        const xScale = (i) => PAD.left + (snapshots.length === 1 ? plotW / 2 : (i / (snapshots.length - 1)) * plotW);
        const yScale = (v) => PAD.top + plotH - (v / maxY) * plotH;

        const parts = [`<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" class="timeline-svg">`];

        // Y-axis gridlines and labels — dynamic steps
        const gridSteps = computeGridSteps(maxY);
        gridSteps.forEach(v => {
            const y = yScale(v);
            parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${VW - PAD.right}" y2="${y}" stroke="var(--border-light, #e5e5e5)" stroke-width="0.5" opacity="0.5"/>`);
            parts.push(`<text x="${PAD.left - 6}" y="${y + 4}" class="tl-axis-y" text-anchor="end">${v}%</text>`);
        });

        // Left axis line
        parts.push(`<line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${VH - PAD.bottom}" stroke="var(--border, #d2d2d7)" stroke-width="0.7"/>`);

        // Baseline reference line
        if (_baselineRisk !== null) {
            const y = yScale(_baselineRisk);
            const dimmed = snapshots.length > 1 ? ' dimmed' : '';
            parts.push(`<g class="timeline-baseline-group${dimmed}">`);
            parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${VW - PAD.right}" y2="${y}" stroke="transparent" stroke-width="14" style="pointer-events:stroke"/>`);
            parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${VW - PAD.right}" y2="${y}" class="timeline-baseline"/>`);
            parts.push(`<text x="${PAD.left + 6}" y="${y - 8}" class="tl-baseline-label">Baseline ${_baselineRisk.toFixed(1)}%</text>`);
            parts.push(`</g>`);
        }

        // Area and line paths
        if (snapshots.length > 1) {
            const pathPoints = snapshots.map((s, i) => `${xScale(i).toFixed(1)} ${yScale(s.riskPct).toFixed(1)}`);
            const lineD = 'M ' + pathPoints.join(' L ');
            const areaD = lineD + ` L ${xScale(snapshots.length - 1).toFixed(1)} ${yScale(0).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(0).toFixed(1)} Z`;
            parts.push(`<path d="${areaD}" class="tl-area"/>`);
            parts.push(`<path d="${lineD}" class="tl-line"/>`);
        }

        // Data points and labels
        snapshots.forEach((s, i) => {
            const cx = xScale(i);
            const cy = yScale(s.riskPct);
            const hasTreatment = !!s.treatmentLabel;

            let dotClass = 'tl-dot';
            let dotRadius = 4;
            let dotColor = '';

            if (i === 0 && _baselineRisk !== null) {
                dotClass += ' tl-dot-baseline';
                dotRadius = 5;
            } else if (hasTreatment) {
                dotClass += ' tl-dot-treatment';
                dotRadius = 5;
                dotColor = getTreatmentColor(s.treatmentLabel);
            }

            const esc = DRC.UIHelpers.escapeHtml;
            const title = hasTreatment
                ? `#${i + 1}: ${s.riskPct.toFixed(1)}% — ${esc(s.treatmentLabel)} (${formatTime(s.timestamp)})`
                : `#${i + 1}: ${s.riskPct.toFixed(1)}% (${formatTime(s.timestamp)})`;

            // Dot
            const fillAttr = dotColor ? ` fill="${dotColor}"` : '';
            parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotRadius}" class="${dotClass}"${fillAttr}><title>${title}</title></circle>`);

            // Treatment short label — above dot
            if (hasTreatment) {
                const color = getTreatmentColor(s.treatmentLabel);
                const shortLabel = DRC.UIHelpers.escapeHtml(s.treatmentLabel.split(' ').slice(0, 2).join(' '));
                let textAnchor = 'middle';
                let textXOffset = 0;
                if (i === 0) { textAnchor = 'start'; textXOffset = 4; }
                else if (i === snapshots.length - 1 && snapshots.length > 1) { textAnchor = 'end'; textXOffset = -4; }
                parts.push(`<text x="${(cx + textXOffset).toFixed(1)}" y="${(cy - dotRadius - 8).toFixed(1)}" class="tl-treat-label" text-anchor="${textAnchor}" fill="${color}">${shortLabel}</text>`);
            }

            // Risk value label — below dot
            let riskTextAnchor = 'middle';
            let riskXOffset = 0;
            if (i === 0) { riskTextAnchor = 'start'; riskXOffset = 4; }
            else if (i === snapshots.length - 1 && snapshots.length > 1) { riskTextAnchor = 'end'; riskXOffset = -4; }
            parts.push(`<text x="${(cx + riskXOffset).toFixed(1)}" y="${(cy + dotRadius + 14).toFixed(1)}" class="tl-risk-val" text-anchor="${riskTextAnchor}">${s.riskPct.toFixed(1)}%</text>`);

            // X-axis labels
            if (snapshots.length <= 12 || i === 0 || i === snapshots.length - 1 || i % 3 === 0) {
                let axisAnchor = 'middle';
                let axisXOff = 0;
                if (i === 0) { axisAnchor = 'start'; axisXOff = 4; }
                else if (i === snapshots.length - 1 && snapshots.length > 1) { axisAnchor = 'end'; axisXOff = -4; }
                parts.push(`<text x="${(cx + axisXOff).toFixed(1)}" y="${VH - 8}" class="tl-axis-x" text-anchor="${axisAnchor}">${i + 1}</text>`);
            }
        });

        parts.push('</svg>');
        container.innerHTML = parts.join('');
        renderLegend();
    };

    /** Render the treatment history legend as a sidebar. */
    const renderLegend = () => {
        const legendEl = document.getElementById('timeline-legend');
        if (!legendEl) return;

        const treatmentSnapshots = snapshots.filter(s => s.treatmentLabel);
        if (treatmentSnapshots.length === 0) {
            legendEl.innerHTML = '';
            legendEl.style.display = 'none';
            return;
        }

        legendEl.style.display = 'flex';
        const items = treatmentSnapshots.map((s) => {
            const color = getTreatmentColor(s.treatmentLabel);
            const snapIdx = snapshots.indexOf(s);
            const prevSnap = snapIdx > 0 ? snapshots[snapIdx - 1] : null;
            const diff = prevSnap ? (s.riskPct - prevSnap.riskPct) : 0;
            const diffStr = prevSnap ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : '';
            const diffClass = diff < 0 ? 'delta-positive' : 'delta-negative';

            const escapedLabel = DRC.UIHelpers.escapeHtml(s.treatmentLabel);
            return `<div class="tl-legend-item">
                <span class="tl-legend-dot" style="background:${color}"></span>
                <span class="tl-legend-label">${escapedLabel}</span>
                <div class="tl-legend-values">
                    <span class="tl-legend-risk">${s.riskPct.toFixed(1)}%</span>
                    ${diffStr ? `<span class="tl-legend-delta ${diffClass}">${diffStr}</span>` : ''}
                </div>
            </div>`;
        });

        legendEl.innerHTML = `<div class="tl-legend-title">
            <i data-lucide="history" class="lucide-icon" style="width:14px; height:14px; color:#007aff;"></i>
            Treatment History
        </div>${items.join('')}`;

        // Initialize Lucide icons for the legend
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    /** Clear all snapshots and baseline. */
    const clear = () => {
        snapshots.length = 0;
        _baselineRisk = null;
        render();
        const legendEl = document.getElementById('timeline-legend');
        if (legendEl) { legendEl.innerHTML = ''; legendEl.style.display = 'none'; }
    };

    /** Return the most recent snapshot (or null). */
    const getLastSnapshot = () => snapshots.length ? snapshots[snapshots.length - 1] : null;

    return { addSnapshot, render, clear, setBaseline, clearBaseline, getLastSnapshot, hasBaseline: () => _baselineRisk !== null };
})();
