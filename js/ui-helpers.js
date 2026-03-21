/**
 * @fileoverview Shared DOM utility functions used across UI modules.
 *
 * Provides lightweight wrappers around common DOM operations to reduce
 * boilerplate and enforce consistent null-checking throughout the UI layer.
 *
 * @module UIHelpers
 * @memberof DRC
 */

'use strict';

DRC.UIHelpers = (() => {

    /**
     * Get element by ID (cached shorthand).
     * @param {string} id — DOM element ID.
     * @returns {HTMLElement|null}
     */
    const el = (id) => document.getElementById(id);

    /**
     * Set text content of an element by ID.
     * @param {string} id — DOM element ID.
     * @param {string} text — Text to set.
     */
    const setText = (id, text) => {
        const node = el(id);
        if (node) node.textContent = text;
    };

    /**
     * Clamp a value within [min, max] and round to step precision.
     * @param {number} value — Raw value.
     * @param {number} min — Lower bound.
     * @param {number} max — Upper bound.
     * @param {number} step — Step size (determines decimal precision).
     * @returns {number} Clamped and rounded value.
     */
    const clampAndRound = (value, min, max, step) => {
        const clamped = Math.min(Math.max(value, min), max);
        if (step >= 1) return Math.round(clamped);
        // Handle scientific notation (e.g., 1e-7) correctly
        const stepStr = String(step);
        let decimals;
        if (stepStr.includes('e-') || stepStr.includes('E-')) {
            // Scientific notation: extract exponent (handles both 1e-7 and 1E-7)
            decimals = parseInt(stepStr.split(/e-/i)[1], 10);
        } else if (stepStr.includes('.')) {
            decimals = stepStr.split('.')[1]?.length ?? 1;
        } else {
            decimals = 1;
        }
        return parseFloat(clamped.toFixed(decimals));
    };

    /**
     * Format a number for axis display, using one decimal if step < 1.
     * @param {number} value — Numeric value.
     * @param {boolean} isFloat — Whether to display as float.
     * @returns {string}
     */
    const formatAxisValue = (value, isFloat) =>
        isFloat ? parseFloat(value).toFixed(1) : String(value);

    /**
     * Escape a string for safe insertion into HTML/SVG markup.
     * @param {string} str — Raw string to escape.
     * @returns {string} HTML-safe string.
     */
    const escapeHtml = (str) => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    return { el, setText, clampAndRound, formatAxisValue, escapeHtml };
})();
