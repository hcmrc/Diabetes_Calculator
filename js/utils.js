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
     * Escape HTML special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    const escapeHtml = (str) => {
        if (str == null) return '';
        return String(str)
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

    /**
     * Create a focus trap for a container element.
     * Keeps Tab/Shift+Tab cycling within the container's focusable elements.
     * @param {HTMLElement} container - The container to trap focus within
     * @returns {Object} Focus trap with activate() and deactivate() methods
     */
    const createFocusTrap = (container) => {
        const focusableSelectors = 'button:not(:disabled), [href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]):not(:disabled)';

        const getFocusable = () => {
            const all = container.querySelectorAll(focusableSelectors);
            // Filter to visible elements only
            return Array.from(all).filter(el => el.offsetParent !== null);
        };

        const handleKeydown = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusable();
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        const handleFocusin = (e) => {
            if (!container.contains(e.target)) {
                const first = container.querySelector(focusableSelectors);
                if (first) first.focus();
            }
        };

        return {
            activate() {
                container.addEventListener('keydown', handleKeydown);
                document.addEventListener('focusin', handleFocusin);
                // Move focus to first focusable element
                const first = container.querySelector(focusableSelectors);
                if (first) first.focus();
            },
            deactivate() {
                container.removeEventListener('keydown', handleKeydown);
                document.removeEventListener('focusin', handleFocusin);
            }
        };
    };

    // Export utilities under DRC.Utils
    DRC.Utils = {
        createTranslator,
        debounce,
        escapeHtml,
        createElementCache,
        createFocusTrap
    };

})();
