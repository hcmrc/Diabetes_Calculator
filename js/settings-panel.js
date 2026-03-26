/**
 * @fileoverview Settings Panel Controller
 *
 * Manages the settings panel with Language Dropdown, Dark Mode, and Units toggles.
 * Language dropdown expands within the panel, pushing other options down.
 *
 * @module SettingsPanel
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.SettingsPanel = (() => {
    // State
    let _isOpen = false;
    let _btn = null;
    let _panel = null;
    let _overlay = null;
    let _langBtn = null;
    let _langDropdown = null;
    let _darkModeBtn = null;
    let _unitToggle = null;
    let _isLangDropdownOpen = false;

    // Model Dropdown State
    let _modelBtn = null;
    let _modelDropdown = null;
    let _isModelDropdownOpen = false;

    // SVG Flags
    const FLAG_SVGS = {
        en: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" fill="#1e3a8a" stroke="currentColor" stroke-width="0.5"/>
            <path d="M0 0L20 14M20 0L0 14" stroke="#f8fafc" stroke-width="2.5"/>
            <path d="M0 0L20 14M20 0L0 14" stroke="#dc2626" stroke-width="1.5"/>
            <rect x="8.5" y="0" width="3" height="14" fill="#f8fafc"/>
            <rect x="0" y="5.5" width="20" height="3" fill="#f8fafc"/>
            <rect x="9" y="0" width="2" height="14" fill="#dc2626"/>
            <rect x="0" y="6" width="20" height="2" fill="#dc2626"/>
        </svg>`,
        de: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" stroke="currentColor" stroke-width="0.5"/>
            <rect x="1" y="1" width="18" height="4" fill="#1f2937"/>
            <rect x="1" y="5" width="18" height="4" fill="#dc2626"/>
            <rect x="1" y="9" width="18" height="4" fill="#f59e0b"/>
        </svg>`,
        fr: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" stroke="currentColor" stroke-width="0.5"/>
            <rect x="1" y="1" width="6" height="12" fill="#1e40af"/>
            <rect x="7" y="1" width="6" height="12" fill="#f8fafc"/>
            <rect x="13" y="1" width="6" height="12" fill="#dc2626"/>
        </svg>`,
        es: `<svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.5" y="0.5" width="19" height="13" rx="1" stroke="currentColor" stroke-width="0.5"/>
            <rect x="1" y="1" width="18" height="3" fill="#dc2626"/>
            <rect x="1" y="4" width="18" height="6" fill="#fbbf24"/>
            <rect x="1" y="10" width="18" height="3" fill="#dc2626"/>
        </svg>`
    };

    // Language names
    const LANG_NAMES = {
        en: 'English',
        de: 'Deutsch',
        fr: 'Français',
        es: 'Español'
    };

    const init = () => {
        _btn = document.getElementById('settingsBtn');
        _panel = document.getElementById('settingsPanel');
        _langBtn = document.getElementById('settingsLangBtn');
        _langDropdown = document.getElementById('settingsLangDropdown');
        _darkModeBtn = document.getElementById('settingsDarkModeBtn');
        _unitToggle = document.getElementById('unit-toggle');

        // Model dropdown elements
        _modelBtn = document.getElementById('settingsModelBtn');
        _modelDropdown = document.getElementById('settingsModelDropdown');

        if (!_btn || !_panel) {
            console.warn('SettingsPanel: Required elements not found');
            return;
        }

        // Create overlay
        _overlay = document.createElement('div');
        _overlay.className = 'settings-overlay';
        document.body.appendChild(_overlay);

        // Event listeners
        _btn.addEventListener('click', _toggle);
        _overlay.addEventListener('click', _close);
        document.addEventListener('keydown', _handleKeydown);

        // Language button
        if (_langBtn) {
            _langBtn.addEventListener('click', _toggleLanguageDropdown);
        }

        // Model button
        if (_modelBtn) {
            _modelBtn.addEventListener('click', _toggleModelDropdown);
        }

        // Unit toggle
        if (_unitToggle) {
            _unitToggle.addEventListener('change', _handleUnitToggle);
        }

        // Restart Setup button
        const restartSetupBtn = document.getElementById('restartSetupBtn');
        if (restartSetupBtn) {
            restartSetupBtn.addEventListener('click', _handleRestartSetup);
        }

        // Listen for dark mode changes
        window.addEventListener('darkmode:change', () => {
            _updateDarkModeButtonState();
        });

        // Listen for language changes
        window.addEventListener('drc:language-changed', () => {
            _updateLanguageButtonState();
            _updateModelButtonState();
            // Rebuild model dropdown if open to update translations
            if (_isModelDropdownOpen) {
                _buildModelDropdown();
            }
        });

        // Listen for model changes
        window.addEventListener('model:changed', () => {
            _updateModelButtonState();
        });

        // SettingsPanel initialized
    };

    const _toggle = () => {
        if (_isOpen) {
            _close();
        } else {
            _open();
        }
    };

    const _open = () => {
        if (!_panel || _isOpen) return;

        _panel.classList.add('open');
        _panel.removeAttribute('hidden');
        _overlay.classList.add('visible');
        _btn.setAttribute('aria-expanded', 'true');
        _isOpen = true;

        // Update all states when opening
        _updateDarkModeButtonState();
        _updateLanguageButtonState();
        _updateUnitToggleState();
        _updateModelButtonState();

        // Refresh Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    };

    const _close = () => {
        if (!_panel || !_isOpen) return;

        // Also close dropdowns if open
        _closeLanguageDropdown();
        _closeModelDropdown();

        _panel.classList.remove('open');
        _overlay.classList.remove('visible');
        _btn.setAttribute('aria-expanded', 'false');
        _isOpen = false;

        setTimeout(() => {
            if (!_isOpen) {
                _panel.setAttribute('hidden', '');
            }
        }, 300);
    };

    const _handleKeydown = (e) => {
        if (e.key === 'Escape') {
            if (_isModelDropdownOpen) {
                _closeModelDropdown();
            } else if (_isLangDropdownOpen) {
                _closeLanguageDropdown();
            } else if (_isOpen) {
                _close();
            }
        }
    };

    // Model Dropdown Functions
    const _toggleModelDropdown = (e) => {
        e.stopPropagation();

        // Close language dropdown if open
        if (_isLangDropdownOpen) {
            _closeLanguageDropdown();
        }

        if (_isModelDropdownOpen) {
            _closeModelDropdown();
        } else {
            _openModelDropdown();
        }
    };

    const _openModelDropdown = () => {
        if (!_modelDropdown) return;

        // Build dropdown content
        _buildModelDropdown();

        _modelDropdown.removeAttribute('hidden');
        _modelBtn.setAttribute('aria-expanded', 'true');
        _isModelDropdownOpen = true;
    };

    const _closeModelDropdown = () => {
        if (!_modelDropdown) return;

        _modelDropdown.setAttribute('hidden', '');
        if (_modelBtn) {
            _modelBtn.setAttribute('aria-expanded', 'false');
        }
        _isModelDropdownOpen = false;
    };

    const _buildModelDropdown = () => {
        const CFG = DRC.CONFIG;
        if (!CFG || !CFG.MODELS) return;

        const t = DRC.Utils.createTranslator();

        // Get current model from app state
        const currentModelId = (DRC.App && DRC.App._getState) ? DRC.App._getState().activeModel : CFG.DEFAULT_MODEL;

        _modelDropdown.innerHTML = '';

        Object.entries(CFG.MODELS).forEach(([id, model]) => {
            const option = document.createElement('button');
            option.className = 'settings-model-option';
            option.setAttribute('data-model-id', id);
            option.setAttribute('role', 'menuitem');

            if (id === currentModelId) {
                option.classList.add('active');
                option.setAttribute('aria-current', 'true');
            }

            // Icon
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'layers');
            icon.className = 'lucide-icon model-option-icon';

            // Content container
            const content = document.createElement('div');
            content.className = 'model-option-content';

            // Info container
            const info = document.createElement('div');
            info.className = 'model-option-info';

            const name = document.createElement('span');
            name.className = 'model-option-name';
            name.textContent = t('models.' + id + '.name', model.name);

            const desc = document.createElement('span');
            desc.className = 'model-option-desc';
            desc.textContent = t('models.' + id + '.description', model.description);

            info.appendChild(name);
            info.appendChild(desc);

            // Accuracy badge
            const badge = document.createElement('span');
            badge.className = 'model-option-badge';
            badge.textContent = t('models.accuracy.' + model.accuracy, model.accuracyLabel);

            content.appendChild(info);
            content.appendChild(badge);

            option.appendChild(icon);
            option.appendChild(content);

            option.addEventListener('click', () => {
                _selectModel(id);
            });

            _modelDropdown.appendChild(option);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    };

    const _selectModel = (modelId) => {
        // Model selection started

        if (!DRC.App || typeof DRC.App.switchModel !== 'function') {
            console.error('SettingsPanel: DRC.App.switchModel not available');
            return;
        }

        DRC.App.switchModel(modelId);
        _updateModelButtonState();
        _closeModelDropdown();

        // Model switched successfully
    };

    const _updateModelButtonState = () => {
        if (!_modelBtn) return;

        const CFG = DRC.CONFIG;
        if (!CFG || !CFG.MODELS) return;

        const t = DRC.Utils.createTranslator();

        // Get current model
        const currentModelId = (DRC.App && DRC.App._getState) ? DRC.App._getState().activeModel : CFG.DEFAULT_MODEL;
        const model = CFG.MODELS[currentModelId];

        if (!model) return;

        const labelEl = _modelBtn.querySelector('#settingsModelLabel');
        if (labelEl) {
            labelEl.textContent = t('models.' + currentModelId + '.name', model.name);
        }
    };

    // Language Dropdown Functions
    const _toggleLanguageDropdown = (e) => {
        e.stopPropagation();

        // Close model dropdown if open
        if (_isModelDropdownOpen) {
            _closeModelDropdown();
        }

        if (_isLangDropdownOpen) {
            _closeLanguageDropdown();
        } else {
            _openLanguageDropdown();
        }
    };

    const _openLanguageDropdown = () => {
        if (!_langDropdown) return;

        // Build dropdown content
        _buildLanguageDropdown();

        _langDropdown.removeAttribute('hidden');
        _langBtn.setAttribute('aria-expanded', 'true');
        _isLangDropdownOpen = true;
    };

    const _closeLanguageDropdown = () => {
        if (!_langDropdown) return;

        _langDropdown.setAttribute('hidden', '');
        if (_langBtn) {
            _langBtn.setAttribute('aria-expanded', 'false');
        }
        _isLangDropdownOpen = false;
    };

    const _buildLanguageDropdown = () => {
        if (!DRC.I18n) return;

        const currentLang = DRC.I18n.getCurrentLang();
        const availableLangs = DRC.I18n.getAvailableLangs();

        _langDropdown.innerHTML = '';

        availableLangs.forEach(lang => {
            const option = document.createElement('button');
            option.className = 'settings-lang-option';
            option.setAttribute('data-lang', lang);
            option.setAttribute('role', 'menuitem');
            if (lang === currentLang) {
                option.classList.add('active');
                option.setAttribute('aria-current', 'true');
            }

            const flag = document.createElement('span');
            flag.className = 'lang-flag';
            flag.innerHTML = FLAG_SVGS[lang] || FLAG_SVGS['en'];

            const name = document.createElement('span');
            name.className = 'lang-name';
            name.textContent = LANG_NAMES[lang] || lang.toUpperCase();

            option.appendChild(flag);
            option.appendChild(name);

            option.addEventListener('click', () => {
                _selectLanguage(lang);
            });

            _langDropdown.appendChild(option);
        });
    };

    const _selectLanguage = (lang) => {
        // Language selection started

        if (!DRC.I18n) {
            console.error('SettingsPanel: DRC.I18n not available');
            return;
        }

        const success = DRC.I18n.setLanguage(lang);
        
        if (success) {
            DRC.I18n.translateDOM();
            _updateLanguageButtonState();
            _closeLanguageDropdown();
            
            window.dispatchEvent(new CustomEvent('drc:language-changed', {
                detail: { language: lang }
            }));
            
            // Language switched successfully
        }
    };

    const _updateLanguageButtonState = () => {
        if (!_langBtn) return;

        const lang = (DRC.I18n && DRC.I18n.getCurrentLang) ? DRC.I18n.getCurrentLang() : 'en';
        const codeEl = _langBtn.querySelector('.lang-code');
        const flagEl = _langBtn.querySelector('.lang-flag');

        if (codeEl) {
            codeEl.textContent = lang.toUpperCase();
        }

        if (flagEl) {
            flagEl.innerHTML = FLAG_SVGS[lang] || FLAG_SVGS['en'];
        }
    };

    const _updateDarkModeButtonState = () => {
        if (!_darkModeBtn) return;

        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            _darkModeBtn.classList.add('active');
            _darkModeBtn.setAttribute('aria-pressed', 'true');
        } else {
            _darkModeBtn.classList.remove('active');
            _darkModeBtn.setAttribute('aria-pressed', 'false');
        }

        const icon = _darkModeBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    };

    const _handleUnitToggle = (e) => {
        const isMetric = e.target.checked;
        
        window.dispatchEvent(new CustomEvent('drc:unit-changed', {
            detail: { isMetric }
        }));

        const usLabel = document.getElementById('unit-label-us');
        const siLabel = document.getElementById('unit-label-si');
        if (usLabel && siLabel) {
            usLabel.style.opacity = isMetric ? '0.5' : '1';
            siLabel.style.opacity = isMetric ? '1' : '0.5';
        }
    };

    const _updateUnitToggleState = () => {
        if (!_unitToggle) return;

        const isMetric = _unitToggle.checked;

        const usLabel = document.getElementById('unit-label-us');
        const siLabel = document.getElementById('unit-label-si');
        if (usLabel && siLabel) {
            usLabel.style.opacity = isMetric ? '0.5' : '1';
            siLabel.style.opacity = isMetric ? '1' : '0.5';
        }
    };

    const _handleRestartSetup = () => {
        // Close settings panel first
        _close();

        // Restart landing page
        if (DRC.LandingPage && typeof DRC.LandingPage.restart === 'function') {
            DRC.LandingPage.restart();
        } else {
            // Fallback: reload page if landing page module not available
            window.location.reload();
        }
    };

    return {
        init
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DRC.SettingsPanel.init();
    });
} else {
    DRC.SettingsPanel.init();
}
