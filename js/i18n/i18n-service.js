/**
 * @fileoverview Internationalization Service
 *
 * Manages language state, loads translations from JSON files,
 * and provides translation API for the entire application.
 *
 * @module I18nService
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.I18n = (() => {
    // ─── Configuration ─────────────────────────────────────────────────
    const STORAGE_KEY = 'drc-language';
    const DEFAULT_LANG = 'en';
    const AVAILABLE_LANGS = ['en', 'de', 'fr', 'es'];

    // ─── State ───────────────────────────────────────────────────────────
    let _currentLang = DEFAULT_LANG;
    let _translations = {};
    let _listeners = new Set();
    let _isReady = false;

    // ─── Private Methods ─────────────────────────────────────────────────

    /**
     * Get stored language preference from localStorage
     * @returns {string} Language code or default
     */
    const _getStoredLanguage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && AVAILABLE_LANGS.includes(stored)) {
                return stored;
            }
        } catch (e) {
            console.warn('i18n: localStorage not available');
        }
        return DEFAULT_LANG;
    };

    /**
     * Save language preference to localStorage
     * @param {string} lang - Language code
     */
    const _storeLanguage = (lang) => {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.warn('i18n: Could not save language preference');
        }
    };

    /**
     * Load translation file for given language
     * Falls back to English if requested language fails to load
     * @param {string} lang - Language code
     * @returns {Promise<Object>} Translation data
     */
    const _loadTranslations = async (lang) => {
        try {
            const response = await fetch(`js/i18n/translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`i18n: Error loading translations for ${lang}:`, error);
            // Fallback to English if non-English language fails
            if (lang !== DEFAULT_LANG) {
                console.warn(`i18n: Falling back to ${DEFAULT_LANG}`);
                return _loadTranslations(DEFAULT_LANG);
            }
            return {};
        }
    };

    /**
     * Get nested value from translation object using dot notation
     * @param {Object} obj - Translation object
     * @param {string} key - Dot-notation key (e.g., "nav.brand")
     * @returns {string|null} Translated value or null
     */
    const _getNestedValue = (obj, key) => {
        const keys = key.split('.');
        let value = obj;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        return typeof value === 'string' ? value : null;
    };

    /**
     * Notify all listeners of language change
     */
    const _notifyListeners = () => {
        _listeners.forEach(callback => {
            try {
                callback(_currentLang);
            } catch (e) {
                console.error('i18n: Error in language change listener:', e);
            }
        });
    };

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Initialize the i18n service
     * Loads the stored or default language
     * @returns {Promise<void>}
     */
    const init = async () => {
        const lang = _getStoredLanguage();
        _currentLang = lang;
        _translations = await _loadTranslations(lang);
        _isReady = true;
        document.documentElement.lang = lang;
        console.log(`i18n: Initialized with language '${lang}'`);
    };

    /**
     * Get the current language code
     * @returns {string} Current language code
     */
    const getCurrentLang = () => _currentLang;

    /**
     * Get list of available languages
     * @returns {string[]} Array of language codes
     */
    const getAvailableLangs = () => [...AVAILABLE_LANGS];

    /**
     * Check if a language code is valid
     * @param {string} lang - Language code to check
     * @returns {boolean} True if valid
     */
    const isValidLang = (lang) => AVAILABLE_LANGS.includes(lang);

    /**
     * Set the current language
     * @param {string} lang - Language code
     * @returns {Promise<boolean>} True if successful
     */
    const setLanguage = async (lang) => {
        if (!isValidLang(lang)) {
            console.error(`i18n: Invalid language code '${lang}'`);
            return false;
        }
        if (lang === _currentLang) {
            return true;
        }
        const newTranslations = await _loadTranslations(lang);
        _currentLang = lang;
        _translations = newTranslations;
        _storeLanguage(lang);
        document.documentElement.lang = lang;
        _notifyListeners();
        console.log(`i18n: Language changed to '${lang}'`);
        return true;
    };

    /**
     * Translate a key to the current language
     * @param {string} key - Dot-notation key (e.g., "nav.brand")
     * @param {string} [fallback] - Fallback text if translation not found
     * @returns {string} Translated text or fallback or key
     */
    const t = (key, fallback) => {
        const value = _getNestedValue(_translations, key);
        if (value) return value;
        if (fallback) return fallback;
        return key;
    };

    /**
     * Translate all DOM elements with data-i18n attribute
     * Preserves child elements (icons, etc.) by only updating text nodes
     */
    const translateDOM = () => {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated !== key) {
                if (el.children.length === 0) {
                    el.textContent = translated;
                } else {
                    let textNodeFound = false;
                    for (const node of el.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            node.textContent = translated;
                            textNodeFound = true;
                            break;
                        }
                    }
                    if (!textNodeFound) {
                        el.insertBefore(document.createTextNode(translated), el.firstChild);
                    }
                }
            }
        });
    };

    /**
     * Subscribe to language change events
     * @param {Function} callback - Called with new language code
     * @returns {Function} Unsubscribe function
     */
    const onLanguageChange = (callback) => {
        _listeners.add(callback);
        return () => _listeners.delete(callback);
    };

    /**
     * Check if i18n service is ready
     * @returns {boolean} True if initialized
     */
    const isReady = () => _isReady;

    /**
     * Get flag emoji for a language
     * @param {string} lang - Language code
     * @returns {string} Flag emoji
     */
    const getFlag = (lang) => {
        const flags = { en: '🇺🇸', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸' };
        return flags[lang] || '🌐';
    };

    /**
     * Get display name for a language
     * @param {string} lang - Language code
     * @returns {string} Language name in its own language
     */
    const getLanguageName = (lang) => {
        const names = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
        return names[lang] || lang;
    };

    // ─── Public API ─────────────────────────────────────────────────────
    return {
        init,
        getCurrentLang,
        getAvailableLangs,
        isValidLang,
        setLanguage,
        t,
        translateDOM,
        onLanguageChange,
        isReady,
        getFlag,
        getLanguageName
    };
})();
