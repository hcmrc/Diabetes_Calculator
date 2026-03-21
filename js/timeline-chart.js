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
            // Note: isBaseline was previously set here but never used.
            // _baselineRisk check in render() is sufficient for baseline display.
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

    // SVG namespace for secure element creation
    const SVG_NS = 'http://www.w3.org/2000/svg';

    /** Clear container safely without innerHTML */
    const clearContainer = (container) => {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    };

    /** Render the timeline SVG into #timeline-chart. */
    const render = () => {
        const container = document.getElementById('timeline-chart');
        if (!container) return;

        if (snapshots.length === 0 && _baselineRisk === null) {
            clearContainer(container);
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'timeline-empty';
            emptyMsg.textContent = 'Set a baseline and add snapshots to track your risk over scenarios.';
            container.appendChild(emptyMsg);
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

        // Create SVG element using DOM API (secure against XSS)
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('class', 'timeline-svg');

        // Y-axis gridlines and labels — dynamic steps
        const gridSteps = computeGridSteps(maxY);
        gridSteps.forEach(v => {
            const y = yScale(v);

            const line = document.createElementNS(SVG_NS, 'line');
            line.setAttribute('x1', PAD.left);
            line.setAttribute('y1', y.toFixed(1));
            line.setAttribute('x2', VW - PAD.right);
            line.setAttribute('y2', y.toFixed(1));
            line.setAttribute('stroke', 'var(--border-light, #e5e5e5)');
            line.setAttribute('stroke-width', '0.5');
            line.setAttribute('opacity', '0.5');
            svg.appendChild(line);

            const text = document.createElementNS(SVG_NS, 'text');
            text.setAttribute('x', PAD.left - 6);
            text.setAttribute('y', (y + 4).toFixed(1));
            text.setAttribute('class', 'tl-axis-y');
            text.setAttribute('text-anchor', 'end');
            text.textContent = `${v}%`;
            svg.appendChild(text);
        });

        // Left axis line
        const axisLine = document.createElementNS(SVG_NS, 'line');
        axisLine.setAttribute('x1', PAD.left);
        axisLine.setAttribute('y1', PAD.top);
        axisLine.setAttribute('x2', PAD.left);
        axisLine.setAttribute('y2', VH - PAD.bottom);
        axisLine.setAttribute('stroke', 'var(--border, #d2d2d7)');
        axisLine.setAttribute('stroke-width', '0.7');
        svg.appendChild(axisLine);

        // Baseline reference line
        if (_baselineRisk !== null) {
            const y = yScale(_baselineRisk);
            const dimmed = snapshots.length > 1 ? ' dimmed' : '';

            const baselineGroup = document.createElementNS(SVG_NS, 'g');
            baselineGroup.setAttribute('class', `timeline-baseline-group${dimmed}`);

            const hitArea = document.createElementNS(SVG_NS, 'line');
            hitArea.setAttribute('x1', PAD.left);
            hitArea.setAttribute('y1', y.toFixed(1));
            hitArea.setAttribute('x2', VW - PAD.right);
            hitArea.setAttribute('y2', y.toFixed(1));
            hitArea.setAttribute('stroke', 'transparent');
            hitArea.setAttribute('stroke-width', '14');
            hitArea.setAttribute('style', 'pointer-events:stroke');
            baselineGroup.appendChild(hitArea);

            const baseline = document.createElementNS(SVG_NS, 'line');
            baseline.setAttribute('x1', PAD.left);
            baseline.setAttribute('y1', y.toFixed(1));
            baseline.setAttribute('x2', VW - PAD.right);
            baseline.setAttribute('y2', y.toFixed(1));
            baseline.setAttribute('class', 'timeline-baseline');
            baselineGroup.appendChild(baseline);

            const baselineLabel = document.createElementNS(SVG_NS, 'text');
            baselineLabel.setAttribute('x', PAD.left + 6);
            baselineLabel.setAttribute('y', (y - 8).toFixed(1));
            baselineLabel.setAttribute('class', 'tl-baseline-label');
            baselineLabel.textContent = `Baseline ${_baselineRisk.toFixed(1)}%`;
            baselineGroup.appendChild(baselineLabel);

            svg.appendChild(baselineGroup);
        }

        // Area and line paths
        if (snapshots.length > 1) {
            const pathPoints = snapshots.map((s, i) => `${xScale(i).toFixed(1)} ${yScale(s.riskPct).toFixed(1)}`);
            const lineD = 'M ' + pathPoints.join(' L ');
            const areaD = lineD + ` L ${xScale(snapshots.length - 1).toFixed(1)} ${yScale(0).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(0).toFixed(1)} Z`;

            const areaPath = document.createElementNS(SVG_NS, 'path');
            areaPath.setAttribute('d', areaD);
            areaPath.setAttribute('class', 'tl-area');
            svg.appendChild(areaPath);

            const linePath = document.createElementNS(SVG_NS, 'path');
            linePath.setAttribute('d', lineD);
            linePath.setAttribute('class', 'tl-line');
            svg.appendChild(linePath);
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

            // Create dot circle with title (using textContent for XSS protection)
            const dot = document.createElementNS(SVG_NS, 'circle');
            dot.setAttribute('cx', cx.toFixed(1));
            dot.setAttribute('cy', cy.toFixed(1));
            dot.setAttribute('r', dotRadius);
            dot.setAttribute('class', dotClass);
            if (dotColor) dot.setAttribute('fill', dotColor);

            const title = document.createElementNS(SVG_NS, 'title');
            const titleText = hasTreatment
                ? `#${i + 1}: ${s.riskPct.toFixed(1)}% — ${s.treatmentLabel} (${formatTime(s.timestamp)})`
                : `#${i + 1}: ${s.riskPct.toFixed(1)}% (${formatTime(s.timestamp)})`;
            title.textContent = titleText; // textContent automatically escapes
            dot.appendChild(title);
            svg.appendChild(dot);

            // Treatment short label — above dot
            if (hasTreatment) {
                const color = getTreatmentColor(s.treatmentLabel);
                // Use substring instead of split for better performance
                const firstSpace = s.treatmentLabel.indexOf(' ');
                const secondSpace = firstSpace > 0 ? s.treatmentLabel.indexOf(' ', firstSpace + 1) : -1;
                const shortLabel = secondSpace > 0 ? s.treatmentLabel.substring(0, secondSpace) : s.treatmentLabel;

                let textAnchor = 'middle';
                let textXOffset = 0;
                if (i === 0) { textAnchor = 'start'; textXOffset = 4; }
                else if (i === snapshots.length - 1 && snapshots.length > 1) { textAnchor = 'end'; textXOffset = -4; }

                const label = document.createElementNS(SVG_NS, 'text');
                label.setAttribute('x', (cx + textXOffset).toFixed(1));
                label.setAttribute('y', (cy - dotRadius - 8).toFixed(1));
                label.setAttribute('class', 'tl-treat-label');
                label.setAttribute('text-anchor', textAnchor);
                label.setAttribute('fill', color);
                label.textContent = shortLabel; // textContent escapes
                svg.appendChild(label);
            }

            // Risk value label — below dot
            let riskTextAnchor = 'middle';
            let riskXOffset = 0;
            if (i === 0) { riskTextAnchor = 'start'; riskXOffset = 4; }
            else if (i === snapshots.length - 1 && snapshots.length > 1) { riskTextAnchor = 'end'; riskXOffset = -4; }

            const riskLabel = document.createElementNS(SVG_NS, 'text');
            riskLabel.setAttribute('x', (cx + riskXOffset).toFixed(1));
            riskLabel.setAttribute('y', (cy + dotRadius + 14).toFixed(1));
            riskLabel.setAttribute('class', 'tl-risk-val');
            riskLabel.setAttribute('text-anchor', riskTextAnchor);
            riskLabel.textContent = `${s.riskPct.toFixed(1)}%`;
            svg.appendChild(riskLabel);

            // X-axis labels
            if (snapshots.length <= 12 || i === 0 || i === snapshots.length - 1 || i % 3 === 0) {
                let axisAnchor = 'middle';
                let axisXOff = 0;
                if (i === 0) { axisAnchor = 'start'; axisXOff = 4; }
                else if (i === snapshots.length - 1 && snapshots.length > 1) { axisAnchor = 'end'; axisXOff = -4; }

                const axisLabel = document.createElementNS(SVG_NS, 'text');
                axisLabel.setAttribute('x', (cx + axisXOff).toFixed(1));
                axisLabel.setAttribute('y', VH - 8);
                axisLabel.setAttribute('class', 'tl-axis-x');
                axisLabel.setAttribute('text-anchor', axisAnchor);
                axisLabel.textContent = `${i + 1}`;
                svg.appendChild(axisLabel);
            }
        });

        clearContainer(container);
        container.appendChild(svg);
        renderLegend();
    };

    /** Render the treatment history legend as a sidebar. */
    const renderLegend = () => {
        const legendEl = document.getElementById('timeline-legend');
        if (!legendEl) return;

        // O(n) approach: map snapshots to include their indices first, then filter
        const treatmentSnapshots = snapshots
            .map((s, idx) => ({ ...s, _originalIndex: idx }))
            .filter(s => s.treatmentLabel);

        if (treatmentSnapshots.length === 0) {
            while (legendEl.firstChild) legendEl.removeChild(legendEl.firstChild);
            legendEl.style.display = 'none';
            return;
        }

        legendEl.style.display = 'flex';

        // Clear and rebuild legend content safely
        while (legendEl.firstChild) legendEl.removeChild(legendEl.firstChild);

        // Create title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'tl-legend-title';

        const titleIcon = document.createElement('i');
        titleIcon.setAttribute('data-lucide', 'history');
        titleIcon.className = 'lucide-icon';
        titleIcon.style.cssText = 'width:14px; height:14px; color:#007aff;';

        titleDiv.appendChild(titleIcon);
        titleDiv.appendChild(document.createTextNode(' Treatment History'));
        legendEl.appendChild(titleDiv);

        // Create legend items (O(n) with pre-computed indices)
        treatmentSnapshots.forEach((s) => {
            const color = getTreatmentColor(s.treatmentLabel);
            const snapIdx = s._originalIndex; // O(1) lookup
            const prevSnap = snapIdx > 0 ? snapshots[snapIdx - 1] : null;
            const diff = prevSnap ? (s.riskPct - prevSnap.riskPct) : 0;
            const diffStr = prevSnap ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : '';
            const diffClass = diff < 0 ? 'delta-positive' : 'delta-negative';

            const item = document.createElement('div');
            item.className = 'tl-legend-item';

            const dot = document.createElement('span');
            dot.className = 'tl-legend-dot';
            dot.style.background = color;

            const label = document.createElement('span');
            label.className = 'tl-legend-label';
            label.textContent = s.treatmentLabel; // textContent escapes

            const valuesDiv = document.createElement('div');
            valuesDiv.className = 'tl-legend-values';

            const riskSpan = document.createElement('span');
            riskSpan.className = 'tl-legend-risk';
            riskSpan.textContent = `${s.riskPct.toFixed(1)}%`;
            valuesDiv.appendChild(riskSpan);

            if (diffStr) {
                const diffSpan = document.createElement('span');
                diffSpan.className = `tl-legend-delta ${diffClass}`;
                diffSpan.textContent = diffStr;
                valuesDiv.appendChild(diffSpan);
            }

            item.appendChild(dot);
            item.appendChild(label);
            item.appendChild(valuesDiv);
            legendEl.appendChild(item);
        });

        // Initialize Lucide icons for the legend
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    /** Clear all snapshots and baseline. */
    const clear = () => {
        snapshots.length = 0;
        _baselineRisk = null;
        render();
        const legendEl = document.getElementById('timeline-legend');
        if (legendEl) {
            while (legendEl.firstChild) {
                legendEl.removeChild(legendEl.firstChild);
            }
            legendEl.style.display = 'none';
        }
    };

    /** Return the most recent snapshot (or null). */
    const getLastSnapshot = () => snapshots.length ? snapshots[snapshots.length - 1] : null;

    return { addSnapshot, render, clear, setBaseline, clearBaseline, getLastSnapshot, hasBaseline: () => _baselineRisk !== null };
})();
