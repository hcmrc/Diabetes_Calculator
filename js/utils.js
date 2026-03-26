/**
 * DRC Utilities Module
 * Central utility functions for the Diabetes Risk Calculator
 *
 * Dependencies: DRC.I18n (optional - safe if not loaded)
 * Loads after: ui-helpers.js
 * Loads before: ui-controller.js
 */

(function() {
    'use strict';

    // Ensure DRC namespace exists
    if (typeof window.DRC === 'undefined') {
        window.DRC = {};
    }

    const DRC = window.DRC;

    /**
     * Create a translator function
     * @returns {Function} Translator function (key, fallback) => string
     */
    const createTranslator = () => {
        return (key, fallback) => {
            return DRC.I18n?.t(key, fallback) || fallback || key;
        };
    };

    /**
     * Debounce a function
     * @param {Function} fn - Function to debounce
     * @param {number} ms - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    const debounce = (fn, ms) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), ms);
        };
    };

    /**
     * Create a DOM element with options
     * @param {string} tag - HTML tag name
     * @param {Object} options - Options object
     * @param {string} [options.className] - CSS class(es)
     * @param {string} [options.textContent] - Text content
     * @param {Object} [options.attributes] - Key-value attribute pairs
     * @returns {HTMLElement} Created element
     */
    const createElement = (tag, options = {}) => {
        const el = document.createElement(tag);
        if (options.className) el.className = options.className;
        if (options.textContent) el.textContent = options.textContent;
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([k, v]) => el.setAttribute(k, v));
        }
        return el;
    };

    /**
     * Escape HTML special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    const escapeHtml = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    /**
     * Create a DOM element cache
     * @returns {Object} Cache object with get and clear methods
     */
    const createElementCache = () => {
        const cache = new Map();
        return {
            get: (id) => {
                if (!cache.has(id)) {
                    const el = document.getElementById(id);
                    if (el) cache.set(id, el);
                }
                return cache.get(id);
            },
            clear: () => cache.clear()
        };
    };

    // Export utilities under DRC.Utils
    DRC.Utils = {
        createTranslator,
        debounce,
        createElement,
        escapeHtml,
        createElementCache
    };

})();
