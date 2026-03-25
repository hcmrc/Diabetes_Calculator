/**
 * Profile Warning Modal
 *
 * Shows a centered modal when user attempts treatment simulation without an active profile.
 * Similar to the export encryption modal with blurred background.
 *
 * @module ProfileWarning
 * @memberof DRC
 */

(function() {
    'use strict';

    // Namespace initialisieren
    window.DRC = window.DRC || {};

    // DOM Elemente
    let elements = {};
    let _pendingFactor = null;
    let _modalResolve = null;

    /**
     * Cache DOM-Elemente
     */
    function cacheElements() {
        elements.modal = document.getElementById('profileWarningModal');
        elements.closeBtn = document.getElementById('profileWarnClose');
        elements.createBtn = document.getElementById('profileWarnCreateBtn');
        elements.continueBtn = document.getElementById('profileWarnContinueBtn');
        elements.cancelBtn = document.getElementById('profileWarnCancelBtn');
    }

    /**
     * Prueft ob aktuell ein Patientenprofil aktiv ist
     */
    function hasActiveProfile() {
        const patientData = DRC.PatientManager?.getActivePatientData?.();
        return patientData !== null && patientData !== undefined;
    }

    /**
     * Prueft ob aktuelle Daten von Defaults abweichen
     */
    function checkForUnsavedData() {
        const current = DRC.UIController?.readInputs?.();
        if (!current) return false;

        const isMetric = DRC.App?._getState?.()?.isMetric ?? false;
        const D = DRC.CONFIG?.DEFAULTS;
        if (!D) return false;

        // Vergleiche numerische Felder
        const numericFields = ['age', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'];
        const tolerance = 0.001;

        for (const field of numericFields) {
            let defaultValue;
            if (['height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'].includes(field)) {
                defaultValue = isMetric ? D[field]?.si : D[field]?.us;
            } else {
                defaultValue = D[field];
            }

            if (defaultValue !== undefined && Math.abs(current[field] - defaultValue) > tolerance) {
                return true;
            }
        }

        // Vergleiche Toggle-Felder
        if (current.sex !== (D.sex ? 1 : 0)) return true;
        if (current.race !== (D.race ? 1 : 0)) return true;
        if (current.parentHist !== (D.parentHist ? 1 : 0)) return true;

        return false;
    }

    /**
     * Zeigt das Modal an
     * @returns {Promise<'create'|'continue'|'cancel'>}
     */
    function showModal() {
        return new Promise((resolve) => {
            _modalResolve = resolve;

            if (!elements.modal) {
                resolve('cancel');
                return;
            }

            // Modal sichtbar machen
            elements.modal.style.display = 'flex';
            // Force reflow fuer Animation
            void elements.modal.offsetHeight;
            elements.modal.classList.add('open');

            // Body scroll verhindern
            document.body.style.overflow = 'hidden';

            // Icons aktualisieren
            if (DRC.UIHelpers?.refreshIcons) {
                DRC.UIHelpers.refreshIcons();
            }
        });
    }

    /**
     * Versteckt das Modal
     */
    function hideModal() {
        if (!elements.modal) return;

        elements.modal.classList.remove('open');
        document.body.style.overflow = '';

        setTimeout(() => {
            elements.modal.style.display = 'none';
        }, 300);

        _modalResolve = null;
    }

    /**
     * Behandelt Modal-Aktion
     */
    function handleAction(action) {
        if (_modalResolve) {
            _modalResolve(action);
        }
        hideModal();
    }

    /**
     * Oeffnet das Patient-Drawer zum Profil erstellen
     */
    function openPatientDrawer() {
        const drawer = document.getElementById('patientDrawer');
        const overlay = document.getElementById('patientOverlay');

        if (drawer) {
            drawer.classList.add('open');
        }
        if (overlay) {
            overlay.classList.add('open');
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        }

        // Fokus auf Namensfeld
        setTimeout(() => {
            const nameInput = document.getElementById('pdNewPatientName');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    /**
     * Prueft vor Treatment-Simulation und zeigt Modal wenn noetig
     * @param {string} factor - Der zu simulierende Faktor
     * @returns {Promise<boolean>}
     */
    async function checkBeforeSimulation(factor) {
        _pendingFactor = factor;

        // Wenn Profil existiert, direkt fortfahren
        if (hasActiveProfile()) {
            return true;
        }

        // Wenn keine Daten geaendert wurden, direkt fortfahren
        if (!checkForUnsavedData()) {
            return true;
        }

        // Modal anzeigen und auf Benutzer warten
        const choice = await showModal();

        switch (choice) {
            case 'create':
                openPatientDrawer();
                // Simulation wird nach Profil-Erstellung fortgesetzt
                return 'pending';
            case 'continue':
                return true;
            case 'cancel':
            default:
                return false;
        }
    }

    /**
     * Event Handler Setup
     */
    function bindEvents() {
        if (!elements.modal) return;

        // Close Button
        elements.closeBtn?.addEventListener('click', () => handleAction('cancel'));

        // Create Profile Button
        elements.createBtn?.addEventListener('click', () => handleAction('create'));

        // Continue Button
        elements.continueBtn?.addEventListener('click', () => handleAction('continue'));

        // Cancel Button
        elements.cancelBtn?.addEventListener('click', () => handleAction('cancel'));

        // Klick auf Overlay schliesst Modal
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                handleAction('cancel');
            }
        });

        // ESC Taste schliesst Modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal?.classList.contains('open')) {
                handleAction('cancel');
            }
        });

        // Auf Profil-Erstellung hoeren
        if (DRC.App?.on) {
            DRC.App.on('patient:saved', () => {
                // Wenn eine Simulation wartet, fortsetzen
                if (_pendingFactor && hasActiveProfile()) {
                    const factor = _pendingFactor;
                    _pendingFactor = null;
                    DRC.TreatmentSimulator?.simulate(factor);
                }
            });
        }
    }

    /**
     * Initialisiert das Modul
     */
    function init() {
        cacheElements();
        bindEvents();

        // Modal initial verstecken
        if (elements.modal) {
            elements.modal.style.display = 'none';
        }
    }

    // Auto-initialisieren wenn DOM bereit
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    DRC.ProfileWarning = {
        hasActiveProfile,
        checkForUnsavedData,
        checkBeforeSimulation,
        showModal,
        hideModal
    };
})();
