/**
 * Profile Warning Modal
 *
 * Shows a centered modal when user attempts treatment simulation without an active profile.
 *
 * @module ProfileWarning
 * @memberof DRC
 */

(function() {
    'use strict';

    window.DRC = window.DRC || {};

    let _pendingFactor = null;
    let _modalResolve = null;

    function hasActiveProfile() {
        const patientData = DRC.PatientManager?.getActivePatientData?.();
        return patientData !== null && patientData !== undefined;
    }

    function checkForUnsavedData() {
        const current = DRC.UIController?.readInputs?.();
        if (!current) return false;

        const isMetric = DRC.App?._getState?.()?.isMetric ?? false;
        const D = DRC.CONFIG?.DEFAULTS;
        if (!D) return false;

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

        if (current.sex !== (D.sex ? 1 : 0)) return true;
        if (current.race !== (D.race ? 1 : 0)) return true;
        if (current.parentHist !== (D.parentHist ? 1 : 0)) return true;

        return false;
    }

    function hideModal() {
        const modal = document.getElementById('profileWarningModal');
        if (modal) {
            modal.classList.remove('open');
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
        _modalResolve = null;
    }

    function showModal() {
        return new Promise((resolve) => {
            _modalResolve = resolve;

            const modal = document.getElementById('profileWarningModal');
            if (!modal) {
                resolve('cancel');
                return;
            }

            // Zuerst Klasse hinzufuegen, dann display setzen
            modal.classList.add('open');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            if (DRC.UIHelpers?.refreshIcons) {
                DRC.UIHelpers.refreshIcons();
            }
        });
    }

    function handleAction(action) {
        if (_modalResolve) {
            _modalResolve(action);
        }
        hideModal();
    }

    function openPatientDrawer() {
        const drawer = document.getElementById('patientDrawer');
        const overlay = document.getElementById('patientOverlay');

        if (drawer) drawer.classList.add('open');
        if (overlay) {
            overlay.classList.add('open');
        }

        setTimeout(() => {
            const nameInput = document.getElementById('pdNewPatientName');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    async function checkBeforeSimulation(factor) {
        _pendingFactor = factor;

        if (hasActiveProfile()) return true;
        if (!checkForUnsavedData()) return true;

        const choice = await showModal();

        if (choice === 'create') {
            openPatientDrawer();
            return 'pending';
        } else if (choice === 'continue') {
            return true;
        }
        return false;
    }

    function init() {
        const closeBtn = document.getElementById('profileWarnClose');
        const createBtn = document.getElementById('profileWarnCreateBtn');
        const continueBtn = document.getElementById('profileWarnContinueBtn');
        const cancelBtn = document.getElementById('profileWarnCancelBtn');
        const modal = document.getElementById('profileWarningModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => handleAction('cancel'));
        }

        if (createBtn) {
            createBtn.addEventListener('click', () => handleAction('create'));
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => handleAction('continue'));
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => handleAction('cancel'));
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleAction('cancel');
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const m = document.getElementById('profileWarningModal');
                if (m?.classList.contains('open')) {
                    handleAction('cancel');
                }
            }
        });

        if (DRC.App?.on) {
            DRC.App.on('patient:saved', () => {
                if (_pendingFactor && hasActiveProfile()) {
                    const factor = _pendingFactor;
                    _pendingFactor = null;
                    DRC.TreatmentSimulator?.simulate(factor);
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    DRC.ProfileWarning = {
        hasActiveProfile,
        checkForUnsavedData,
        checkBeforeSimulation,
        showModal,
        hideModal
    };
})();
