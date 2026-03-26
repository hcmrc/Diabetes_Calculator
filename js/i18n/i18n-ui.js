/**
 * @fileoverview I18n UI Component
 *
 * Language selector button and dropdown for the top navigation.
 * Manages the UI interactions for language switching.
 *
 * @module I18nUI
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.I18nUI = (() => {
    // ─── State ───────────────────────────────────────────────────────────
    let _dropdown = null;
    let _button = null;
    let _isOpen = false;

    // ─── Private Methods ─────────────────────────────────────────────────

    /**
     * SVG Flag strings for each language (simplified flag designs)
     */
    const FLAG_SVGS = {
        // UK Flag - Union Jack simplified
        en: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" fill="#1e3a8a" stroke="currentColor" stroke-width="0.5"/>
            <path d="M0 0L20 14M20 0L0 14" stroke="#f8fafc" stroke-width="2.5"/>
            <path d="M0 0L20 14M20 0L0 14" stroke="#dc2626" stroke-width="1.5"/>
            <rect x="8.5" y="0" width="3" height="14" fill="#f8fafc"/>
            <rect x="0" y="5.5" width="20" height="3" fill="#f8fafc"/>
            <rect x="9" y="0" width="2" height="14" fill="#dc2626"/>
            <rect x="0" y="6" width="20" height="2" fill="#dc2626"/>
        </svg>`,
        // Germany Flag - Black Red Gold horizontal
        de: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" stroke="currentColor" stroke-width="0.5"/>
            <rect x="1" y="1" width="18" height="4" fill="#1f2937"/>
            <rect x="1" y="5" width="18" height="4" fill="#dc2626"/>
            <rect x="1" y="9" width="18" height="4" fill="#f59e0b"/>
        </svg>`,
        // France Flag - Blue White Red vertical
        fr: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" stroke="currentColor" stroke-width="0.5"/>
            <rect x="1" y="1" width="6" height="12" fill="#1e40af"/>
            <rect x="7" y="1" width="6" height="12" fill="#f8fafc"/>
            <rect x="13" y="1" width="6" height="12" fill="#dc2626"/>
        </svg>`,
        // Spain Flag - Red Yellow Red horizontal
        es: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" stroke="currentColor" stroke-width="0.5"/>
            <rect x="1" y="1" width="18" height="3" fill="#dc2626"/>
            <rect x="1" y="4" width="18" height="6" fill="#fbbf24"/>
            <rect x="1" y="10" width="18" height="3" fill="#dc2626"/>
        </svg>`
    };

    /**
     * Create the language dropdown element
     * @returns {HTMLElement} Dropdown element
     */
    const _createDropdown = () => {
        const dropdown = document.createElement('div');
        dropdown.className = 'lang-dropdown';
        dropdown.id = 'langDropdown';
        dropdown.setAttribute('hidden', '');
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', 'Language selection');

        const languages = DRC.I18n.getAvailableLangs();
        const currentLang = DRC.I18n.getCurrentLang();

        languages.forEach(lang => {
            const option = document.createElement('button');
            option.className = 'lang-option';
            option.setAttribute('data-lang', lang);
            option.setAttribute('role', 'menuitem');
            if (lang === currentLang) {
                option.classList.add('active');
                option.setAttribute('aria-current', 'true');
            }

            const flag = document.createElement('span');
            flag.className = 'lang-flag';
            flag.innerHTML = FLAG_SVGS[lang] || DRC.I18n.getFlag(lang);
            flag.setAttribute('aria-hidden', 'true');

            const name = document.createElement('span');
            name.className = 'lang-name';
            name.textContent = DRC.I18n.getLanguageName(lang);

            option.appendChild(flag);
            option.appendChild(name);

            option.addEventListener('click', () => _selectLanguage(lang));

            dropdown.appendChild(option);
        });

        return dropdown;
    };

    /**
     * Handle language selection
     * @param {string} lang - Language code
     */
    const _selectLanguage = (lang) => {
        if (lang === DRC.I18n.getCurrentLang()) {
            _closeDropdown();
            return;
        }

        const success = DRC.I18n.setLanguage(lang);
        if (success) {
            _updateButtonDisplay();
            _updateDropdownActiveState();
            _closeDropdown();
            DRC.I18n.translateDOM();

            window.dispatchEvent(new CustomEvent('drc:language-changed', {
                detail: { language: lang }
            }));
        }
    };

    /**
     * Update button display with current language
     */
    const _updateButtonDisplay = () => {
        if (!_button) return;

        const lang = DRC.I18n.getCurrentLang();
        const flagIcon = document.getElementById('langFlagIcon');
        const code = document.getElementById('langCode');

        if (flagIcon && FLAG_SVGS[lang]) {
            flagIcon.innerHTML = FLAG_SVGS[lang];
        }
        if (code) code.textContent = lang.toUpperCase();
    };

    /**
     * Update active state in dropdown
     */
    const _updateDropdownActiveState = () => {
        if (!_dropdown) return;

        const currentLang = DRC.I18n.getCurrentLang();
        const options = _dropdown.querySelectorAll('.lang-option');

        options.forEach(option => {
            const lang = option.getAttribute('data-lang');
            if (lang === currentLang) {
                option.classList.add('active');
                option.setAttribute('aria-current', 'true');
            } else {
                option.classList.remove('active');
                option.removeAttribute('aria-current');
            }
        });
    };

    /**
     * Open the dropdown
     */
    const _openDropdown = () => {
        if (!_dropdown || _isOpen) return;

        _dropdown.removeAttribute('hidden');
        _button?.setAttribute('aria-expanded', 'true');
        _isOpen = true;

        const rect = _button.getBoundingClientRect();
        _dropdown.style.top = `${rect.bottom + 8}px`;
        _dropdown.style.right = `${window.innerWidth - rect.right}px`;

        document.addEventListener('click', _handleDocumentClick);
        document.addEventListener('keydown', _handleKeydown);
    };

    /**
     * Close the dropdown
     */
    const _closeDropdown = () => {
        if (!_dropdown || !_isOpen) return;

        _dropdown.setAttribute('hidden', '');
        _button?.setAttribute('aria-expanded', 'false');
        _isOpen = false;

        document.removeEventListener('click', _handleDocumentClick);
        document.removeEventListener('keydown', _handleKeydown);
    };

    /**
     * Toggle dropdown visibility
     */
    const _toggleDropdown = () => {
        if (_isOpen) {
            _closeDropdown();
        } else {
            _openDropdown();
        }
    };

    /**
     * Handle clicks outside dropdown
     * @param {Event} e - Click event
     */
    const _handleDocumentClick = (e) => {
        if (!_dropdown || !_button) return;
        if (!_dropdown.contains(e.target) && !_button.contains(e.target)) {
            _closeDropdown();
        }
    };

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    const _handleKeydown = (e) => {
        if (e.key === 'Escape') {
            _closeDropdown();
            _button?.focus();
        }
    };

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Initialize the language selector UI
     * Must be called after DRC.I18n.init()
     */
    const init = () => {
        _button = document.getElementById('langBtn');
        if (!_button) {
            console.warn('i18n-ui: Language button not found (#langBtn)');
            return;
        }

        _dropdown = _createDropdown();
        document.body.appendChild(_dropdown);

        _updateButtonDisplay();

        _button.addEventListener('click', (e) => {
            e.stopPropagation();
            _toggleDropdown();
        });

        DRC.I18n.onLanguageChange(() => {
            _updateButtonDisplay();
        });

        console.log('i18n-ui: Language selector initialized');
    };

    // ─── Public API ─────────────────────────────────────────────────────
    return {
        init
    };
})();
