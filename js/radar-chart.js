/**
 * @fileoverview Radar Chart — SVG configural display (EID RBB).
 *
 * Renders a hexagonal radar polygon comparing the patient's risk-factor
 * profile against the population mean. A symmetric hexagon represents a
 * healthy baseline; distortion indicates deviation from the norm.
 *
 * EID mapping: Rule-Based Behavior (RBB) — the shape of the polygon
 * provides a configural cue that trained users can interpret at a glance
 * (Vicente & Rasmussen, 1992).
 *
 * @module RadarChart
 * @memberof DRC
 */

'use strict';

DRC.RadarChart = (() => {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const CENTER = 150;
    const RADIUS = 115;
    const AXES   = ['fastGlu', 'sbp', 'cholTri', 'waist', 'cholHDL', 'age'];
    const N      = AXES.length;

    /**
     * Normalize a field value to [0, 1] within its SI range.
     * HDL is inverted (higher = better = lower risk).
     */
    const normalizeAxis = (field, siValue) => {
        const [min, max] = DRC.CONFIG.RANGES[field].si;
        let ratio = Math.min(Math.max((siValue - min) / (max - min), 0), 1);
        if (field === 'cholHDL') ratio = 1 - ratio;
        return ratio;
    };

    /** Convert polar coordinates (axis index, radius) to SVG (x, y). */
    const polarToXY = (i, r) => {
        const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
        return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
    };

    /** Convert point array to SVG polygon points string. */
    const toPointsStr = (points) =>
        points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    /** Create an SVG element with attributes. */
    const createSVGElement = (tag, attrs) => {
        const elem = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([k, v]) => elem.setAttribute(k, v));
        return elem;
    };

    /** Initialize the radar chart SVG structure (rings, axes, polygons, labels). */
    const init = () => {
        const svg = document.getElementById('radar-svg');
        if (!svg) return;
        svg.innerHTML = '';

        // Concentric rings
        [0.2, 0.4, 0.6, 0.8, 1.0].forEach(frac => {
            const pts = AXES.map((_, i) => polarToXY(i, RADIUS * frac));
            svg.appendChild(createSVGElement('polygon', {
                points: toPointsStr(pts), class: 'radar-ring'
            }));
        });

        // Axis lines
        AXES.forEach((_, i) => {
            const { x, y } = polarToXY(i, RADIUS);
            svg.appendChild(createSVGElement('line', {
                x1: CENTER, y1: CENTER, x2: x, y2: y, class: 'radar-axis'
            }));
        });

        // Reference polygon (population average)
        const popPoints = AXES.map((field, i) =>
            polarToXY(i, RADIUS * normalizeAxis(field, DRC.CONFIG.MEANS[field])));
        const pointsStr = toPointsStr(popPoints);

        svg.appendChild(createSVGElement('polygon', {
            id: 'radar-population-poly', class: 'radar-population', points: pointsStr
        }));
        svg.appendChild(createSVGElement('polygon', {
            id: 'radar-patient-poly', class: 'radar-patient', points: ''
        }));

        // Data point dots
        AXES.forEach(field => {
            svg.appendChild(createSVGElement('circle', {
                id: `radar-dot-${field}`, class: 'radar-dot',
                r: '4', cx: CENTER, cy: CENTER
            }));
        });

        // Axis labels
        AXES.forEach((field, i) => {
            const { x, y } = polarToXY(i, RADIUS + 18);
            const label = createSVGElement('text', { x, y, class: 'radar-label' });
            label.textContent = DRC.CONFIG.RADAR_LABELS[field] || field;
            svg.appendChild(label);
        });
    };

    /** Update the patient polygon and dots based on current SI values. */
    const render = (siVals, elevatedFactors = []) => {
        const patientPoly = document.getElementById('radar-patient-poly');
        if (!patientPoly) return;

        const points = AXES.map((field, i) => {
            const norm = normalizeAxis(field, siVals[field]);
            const pt   = polarToXY(i, RADIUS * norm);

            const dot = document.getElementById(`radar-dot-${field}`);
            if (dot) {
                dot.setAttribute('cx', pt.x.toFixed(1));
                dot.setAttribute('cy', pt.y.toFixed(1));
                dot.classList.toggle('elevated', elevatedFactors.includes(field));
            }
            return pt;
        });

        patientPoly.setAttribute('points', toPointsStr(points));
    };

    return { init, render, AXES };
})();
