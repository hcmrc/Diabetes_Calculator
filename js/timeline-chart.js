/**
 * @fileoverview Timeline Chart — enhanced snapshot trend visualization.
 *
 * Displays a temporal sequence of risk snapshots as an SVG area chart with
 * treatment event markers, labeled data points, and a treatment history legend.
 * Implements EID temporal awareness by showing how risk evolves across
 * user-defined scenarios and treatment simulations.
 *
 * Design rationale:
 *   - Larger chart area (H=160) for improved readability (Shneiderman, 1996)
 *   - Treatment labels rendered directly on data points for immediate
 *     identification (Wickens & Carswell, 1995: Proximity Compatibility)
 *   - Color-coded treatment markers distinguish simulation events from
 *     manual snapshots (preattentive processing, Ware, 2012)
 *   - Treatment history legend below chart provides detailed event log
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
     * Maps treatment labels to distinct colors for preattentive discrimination.
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

    /** Render the timeline SVG into #timeline-chart. */
    const render = () => {
        const container = document.getElementById('timeline-chart');
        if (!container) return;

        if (snapshots.length === 0 && _baselineRisk === null) {
            container.innerHTML = '<p class="timeline-empty">Set a baseline and add snapshots to track your risk over scenarios.</p>';
            renderLegend();
            return;
        }

        const W   = container.offsetWidth - 48 || 400;
        const H   = 160;
        const PAD = { top: 22, right: 16, bottom: 28, left: 42 };
        const plotW = W - PAD.left - PAD.right;
        const plotH = H - PAD.top  - PAD.bottom;

        const allValues = snapshots.map(s => s.riskPct);
        if (_baselineRisk !== null) allValues.push(_baselineRisk);
        const maxY = Math.max(50, ...allValues) * 1.1;

        const xScale = (i) => PAD.left + (snapshots.length === 1 ? plotW / 2 : (i / (snapshots.length - 1)) * plotW);
        const yScale = (v) => PAD.top + plotH - (v / maxY) * plotH;

        const parts = [`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" overflow="hidden">`];

        // Y-axis gridlines and labels
        const gridSteps = [0, 10, 20, 30, 40, 50];
        gridSteps.filter(v => v <= maxY).forEach(v => {
            const y = yScale(v);
            parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="var(--border-light, #e5e5e5)" stroke-width="0.5" opacity="0.6"/>`);
            parts.push(`<text x="${PAD.left - 4}" y="${y + 3}" class="timeline-axis-label" text-anchor="end">${v}%</text>`);
        });

        // Baseline reference line
        // Dims to grey when multiple snapshots exist; reverts to blue on hover
        if (_baselineRisk !== null) {
            const y = yScale(_baselineRisk);
            const dimmed = snapshots.length > 1 ? ' dimmed' : '';
            parts.push(`<g class="timeline-baseline-group${dimmed}">`);
            // Wide invisible hit-area so hover triggers easily on a thin line
            parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="transparent" stroke-width="12" style="pointer-events:stroke"/>`);
            parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" class="timeline-baseline"/>`);
            parts.push(`<text x="${PAD.left + 4}" y="${y - 6}" class="timeline-baseline-label">Baseline ${_baselineRisk.toFixed(1)}%</text>`);
            parts.push(`</g>`);
        }

        // Area and line paths
        if (snapshots.length > 1) {
            const pathPoints = snapshots.map((s, i) => `${xScale(i)} ${yScale(s.riskPct)}`);
            const lineD = 'M ' + pathPoints.join(' L ');
            const areaD = lineD + ` L ${xScale(snapshots.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;
            parts.push(`<path d="${areaD}" class="timeline-area"/>`);
            parts.push(`<path d="${lineD}" class="timeline-line"/>`);
        }

        // Data points and labels
        snapshots.forEach((s, i) => {
            const cx = xScale(i);
            const cy = yScale(s.riskPct);
            const hasTreatment = !!s.treatmentLabel;

            let dotClass = 'timeline-dot';
            let dotRadius = 5;
            let dotColor = '';

            if (i === 0 && _baselineRisk !== null) {
                dotClass += ' baseline-dot';
                dotRadius = 6;
            } else if (hasTreatment) {
                dotClass += ' treatment-dot';
                dotRadius = 7;
                dotColor = getTreatmentColor(s.treatmentLabel);
            }

            const title = hasTreatment
                ? `#${i + 1}: ${s.riskPct.toFixed(1)}% — ${s.treatmentLabel} (${formatTime(s.timestamp)})`
                : `#${i + 1}: ${s.riskPct.toFixed(1)}% (${formatTime(s.timestamp)})`;

            // Dot
            const fillAttr = dotColor ? ` fill="${dotColor}"` : '';
            parts.push(`<circle cx="${cx}" cy="${cy}" r="${dotRadius}" class="${dotClass}"${fillAttr}><title>${title}</title></circle>`);

            // Treatment short label — above dot (no icon)
            if (hasTreatment) {
                const color = getTreatmentColor(s.treatmentLabel);
                const shortLabel = s.treatmentLabel.split(' ').slice(0, 2).join(' ');
                // Dynamic text-anchor for edge points
                let textAnchor = 'middle';
                let textXOffset = 0;
                if (i === 0) {
                    textAnchor = 'start';
                    textXOffset = 4;
                } else if (i === snapshots.length - 1 && snapshots.length > 1) {
                    textAnchor = 'end';
                    textXOffset = -4;
                }
                parts.push(`<text x="${cx + textXOffset}" y="${cy - dotRadius - 6}" class="timeline-treatment-text" text-anchor="${textAnchor}" fill="${color}">${shortLabel}</text>`);
            }

            // Risk value label — always below dot, clear of Y-axis and threshold line
            // Dynamic text-anchor for edge points
            let riskTextAnchor = 'middle';
            let riskXOffset = 0;
            if (i === 0) {
                riskTextAnchor = 'start';
                riskXOffset = 4;
            } else if (i === snapshots.length - 1 && snapshots.length > 1) {
                riskTextAnchor = 'end';
                riskXOffset = -4;
            }
            parts.push(`<text x="${cx + riskXOffset}" y="${cy + dotRadius + 11}" class="timeline-risk-value" text-anchor="${riskTextAnchor}">${s.riskPct.toFixed(1)}%</text>`);

            // X-axis: snapshot index + time
            if (snapshots.length <= 10 || i === 0 || i === snapshots.length - 1 || i % 3 === 0) {
                // Dynamic text-anchor for edge points
                let axisTextAnchor = 'middle';
                let axisXOffset = 0;
                if (i === 0) {
                    axisTextAnchor = 'start';
                    axisXOffset = 4;
                } else if (i === snapshots.length - 1 && snapshots.length > 1) {
                    axisTextAnchor = 'end';
                    axisXOffset = -4;
                }
                parts.push(`<text x="${cx + axisXOffset}" y="${H - 4}" class="timeline-label" text-anchor="${axisTextAnchor}">${i + 1}</text>`);
            }
        });

        parts.push('</svg>');
        container.innerHTML = parts.join('');
        renderLegend();
    };

    /** Render the treatment history legend below the chart. */
    const renderLegend = () => {
        let legendEl = document.getElementById('timeline-legend');
        if (!legendEl) {
            const container = document.getElementById('timeline-chart');
            if (!container) return;
            legendEl = document.createElement('div');
            legendEl.id = 'timeline-legend';
            legendEl.className = 'timeline-legend';
            container.parentNode.insertBefore(legendEl, container.nextSibling);
        }

        const treatmentSnapshots = snapshots.filter(s => s.treatmentLabel);
        if (treatmentSnapshots.length === 0) {
            legendEl.innerHTML = '';
            legendEl.style.display = 'none';
            return;
        }

        legendEl.style.display = 'block';
        const items = treatmentSnapshots.map((s, idx) => {
            const color = getTreatmentColor(s.treatmentLabel);
            const snapIdx = snapshots.indexOf(s);
            const prevSnap = snapIdx > 0 ? snapshots[snapIdx - 1] : null;
            const diff = prevSnap ? (s.riskPct - prevSnap.riskPct) : 0;
            const diffStr = prevSnap ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : '';
            const diffClass = diff < 0 ? 'delta-positive' : 'delta-negative';

            return `<div class="timeline-legend-item">
                <span class="timeline-legend-dot" style="background:${color}"></span>
                <span class="timeline-legend-label">${s.treatmentLabel}</span>
                <span class="timeline-legend-time">${formatTime(s.timestamp)}</span>
                <span class="timeline-legend-risk">${s.riskPct.toFixed(1)}%</span>
                ${diffStr ? `<span class="timeline-legend-delta ${diffClass}">${diffStr}</span>` : ''}
            </div>`;
        });

        legendEl.innerHTML = `<div class="timeline-legend-title">
            <span class="material-icons-round" style="font-size:14px; color:#007aff;">history</span>
            Treatment History
        </div>${items.join('')}`;
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

    return { addSnapshot, render, clear, setBaseline, clearBaseline, getLastSnapshot };
})();
