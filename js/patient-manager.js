/**
 * @fileoverview Patient Manager — CRUD operations with localStorage + Excel I/O.
 *
 * Manages patient profiles stored in localStorage with import/export
 * capabilities via SheetJS (xlsx). Provides a drawer-based UI for
 * adding, loading, updating, and deleting patient records.
 *
 * @module PatientManager
 * @memberof DRC
 */

'use strict';

DRC.PatientManager = (() => {
    const STORAGE_KEY = 'diabetes_risk_patients';
    const FIELDS = DRC.CONFIG.ALL_FIELDS;

    let patients = [];
    let activePatientId = null;

    // ─── Persistence ────────────────────────────────────────────────────

    const saveToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ patients, activePatientId }));
        } catch (_) { /* quota exceeded — silent fail */ }
    };

    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            // Use reviver to prevent prototype pollution
            const parsed = JSON.parse(stored, (key, value) => {
                // Reject __proto__, constructor, prototype keys
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    return undefined;
                }
                return value;
            });

            if (parsed && typeof parsed === 'object') {
                // Validate data structure
                if (Array.isArray(parsed.patients)) {
                    patients = parsed.patients.filter(p => p && typeof p === 'object' && p.id);
                }
                if (typeof parsed.activePatientId === 'string' || parsed.activePatientId === null) {
                    activePatientId = parsed.activePatientId;
                }
            }
        } catch (e) {
            patients = [];
            activePatientId = null;
        }
    };

    // ─── Value capture/apply ────────────────────────────────────────────

    /** Capture current slider/toggle values + displayed risk + active unit system. */
    const captureCurrentValues = () => {
        const vals = {};
        FIELDS.forEach(f => {
            if (f === 'race')       vals[f] = document.getElementById('race-toggle')?.checked ? 1 : 0;
            else if (f === 'parentHist') vals[f] = document.getElementById('parentHist-toggle')?.checked ? 1 : 0;
            else                    vals[f] = parseFloat(document.getElementById(`${f}-value`)?.value) || 0;
        });
        vals._riskPct  = parseFloat(document.getElementById('risk-percentage')?.textContent) || 0;
        // Store active unit system so values can be correctly interpreted on load
        vals._isMetric = DRC.App?._getState?.()?.isMetric ?? false;
        return vals;
    };

    /** Apply stored patient data to sliders/toggles.
     *  Converts values if the saved unit system differs from the current one.
     */
    const applyValues = (data) => {
        if (!data) return;
        const currentIsMetric = DRC.App?._getState?.()?.isMetric ?? false;
        // Legacy profiles without _isMetric: assume US units (false) as conservative default
        // This prevents incorrect conversion when loading old profiles in SI mode
        const savedIsMetric = data._isMetric ?? false;

        FIELDS.forEach(f => {
            if (f === 'race' || f === 'parentHist') {
                const toggle = document.getElementById(f === 'race' ? 'race-toggle' : 'parentHist-toggle');
                if (toggle) toggle.checked = !!data[f];
            } else {
                // Convert value if the saved unit system differs from the current display unit
                let val = data[f] ?? 0;
                if (savedIsMetric !== currentIsMetric && DRC.CONFIG.CONVERTIBLE_FIELDS.includes(f)) {
                    const siVal = savedIsMetric ? val : DRC.ConversionService.convertField(f, val, true);
                    val = currentIsMetric ? siVal : DRC.ConversionService.convertField(f, siVal, false);
                }
                // Clamp to valid slider range to prevent out-of-range display values
                const mode = currentIsMetric ? 'si' : 'us';
                if (DRC.CONFIG.RANGES[f]) {
                    const [min, max, step] = DRC.CONFIG.RANGES[f][mode];
                    val = DRC.UIHelpers?.clampAndRound?.(val, min, max, step) ?? Math.min(Math.max(val, min), max);
                }
                const input  = document.getElementById(`${f}-value`);
                const slider = document.getElementById(`${f}-slider`);
                if (input)  input.value  = val;
                if (slider) slider.value = val;
                DRC.UIController?.updateSliderFill?.(f);
            }
        });
    };

    // ─── Unique ID generation ───────────────────────────────────────────

    const generateId = () =>
        Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // ─── CRUD Operations ────────────────────────────────────────────────

    const addPatient = (name) => {
        if (!name?.trim()) return null;
        const data = captureCurrentValues();
        const patient = {
            id: generateId(), name: name.trim(), data,
            riskPct: data._riskPct, savedAt: new Date().toISOString()
        };
        patients.push(patient);
        activePatientId = patient.id;
        saveToStorage(); renderList(); updateNavLabel();
        return patient;
    };

    const updatePatient = (id) => {
        const patient = patients.find(p => p.id === id);
        if (!patient) return;
        const data = captureCurrentValues();
        Object.assign(patient, { data, riskPct: data._riskPct, savedAt: new Date().toISOString() });
        saveToStorage(); renderList();
    };

    const deletePatient = (id) => {
        patients = patients.filter(p => p.id !== id);
        if (activePatientId === id) activePatientId = null;
        saveToStorage(); renderList(); updateNavLabel();
    };

    const loadPatient = (id) => {
        const patient = patients.find(p => p.id === id);
        if (!patient) return;
        activePatientId = id;
        applyValues(patient.data);
        saveToStorage(); renderList(); updateNavLabel();
        if (DRC.App?.trigger) {
            DRC.App.trigger('risk:recalculate');
        } else {
            document.getElementById('age-slider')?.dispatchEvent(new Event('input'));
        }
    };

    // ─── Excel Import/Export ────────────────────────────────────────────

    /** Column mappings for Excel (column name → field key). */
    const EXCEL_COLUMNS = {
        Name: 'name', Age: 'age', Ethnicity_African_American: 'race',
        Parental_Diabetes: 'parentHist', Systolic_BP: 'sbp', Height: 'height',
        Waist: 'waist', Fasting_Glucose: 'fastGlu', HDL_Cholesterol: 'cholHDL',
        Blood_Fats_Triglycerides: 'cholTri', Risk_Pct: 'riskPct', Saved_At: 'savedAt'
    };

    const exportToExcel = () => {
        if (patients.length === 0) { alert('No patients to export.'); return; }
        const rows = patients.map(p => ({
            Name: p.name, Age: p.data.age, Ethnicity_African_American: p.data.race,
            Parental_Diabetes: p.data.parentHist, Systolic_BP: p.data.sbp,
            Height: p.data.height, Waist: p.data.waist,
            Fasting_Glucose: p.data.fastGlu, HDL_Cholesterol: p.data.cholHDL,
            Blood_Fats_Triglycerides: p.data.cholTri, Risk_Pct: p.riskPct, Saved_At: p.savedAt
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Patients');
        XLSX.writeFile(wb, 'diabetes_risk_patients.xlsx');
    };

    /** Export a single patient profile with formatted filename. */
    const exportSinglePatient = (patientId) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) { alert('Patient not found.'); return; }

        const rows = [{
            Name: patient.name, Age: patient.data.age, Ethnicity_African_American: patient.data.race,
            Parental_Diabetes: patient.data.parentHist, Systolic_BP: patient.data.sbp,
            Height: patient.data.height, Waist: patient.data.waist,
            Fasting_Glucose: patient.data.fastGlu, HDL_Cholesterol: patient.data.cholHDL,
            Blood_Fats_Triglycerides: patient.data.cholTri, Risk_Pct: patient.riskPct, Saved_At: patient.savedAt
        }];

        // Format timestamp: YYYY-MM-DD
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 10);

        // Sanitize filename: remove special chars, limit length
        const sanitizedName = patient.name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 50);
        const filename = `${sanitizedName}_${timestamp}_DRC_Export.xlsx`;

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Profile');
        XLSX.writeFile(wb, filename);
    };

    const importFromExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb   = XLSX.read(e.target.result, { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const clamp = (v, min, max) => Math.min(Math.max(isNaN(v) ? min : v, min), max);
                rows.forEach(row => {
                    const rawName = String(row.Name || row.name || 'Imported Patient').trim().slice(0, 60);
                    const data = {
                        age:        clamp(parseFloat(row.Age        || row.age)        || 50,   20,  80),
                        race:       clamp(parseInt(row.Ethnicity_African_American || row.Race_African_American || row.race) || 0, 0, 1),
                        parentHist: clamp(parseInt(row.Parental_Diabetes || row.Parent_History || row.parentHist) || 0, 0, 1),
                        sbp:        clamp(parseFloat(row.Systolic_BP || row.sbp)       || 120,  80, 220),
                        height:     clamp(parseFloat(row.Height      || row.height)    || 170,  48, 213),
                        waist:      clamp(parseFloat(row.Waist       || row.waist)     || 90,   25, 152),
                        fastGlu:    clamp(parseFloat(row.Fasting_Glucose || row.fastGlu) || 95, 2.8, 300),
                        cholHDL:    clamp(parseFloat(row.HDL_Cholesterol || row.cholHDL) || 50, 0.5, 100),
                        cholTri:    clamp(parseFloat(row.Blood_Fats_Triglycerides || row.Triglycerides || row.cholTri) || 150, 0.6, 500),
                        _riskPct:   clamp(parseFloat(row.Risk_Pct || 0) || 0, 0, 100),
                        // Excel format stores raw values without explicit unit system metadata.
                        // Default to US units (false) as conservative assumption.
                        // Known limitation: SI-valued Excel exports will be misinterpreted.
                        // TODO: Add Unit_System column to Excel format for proper round-trip support.
                        _isMetric: false
                    };
                    patients.push({
                        id: generateId(), name: rawName, data,
                        riskPct: data._riskPct, savedAt: row.Saved_At || new Date().toISOString()
                    });
                });
                saveToStorage(); renderList(); updateNavLabel();
            } catch (_) { alert('Could not read the Excel file. Please check that it is a valid .xlsx file.'); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── UI Rendering ───────────────────────────────────────────────────

    const updateNavLabel = () => {
        const active = patients.find(p => p.id === activePatientId);
        const label = document.getElementById('patientNameLabel');
        const activeLabel = document.getElementById('pdActiveLabel');
        if (label) label.textContent = active ? active.name : 'Select Profile';
        if (activeLabel) activeLabel.textContent = active
            ? `${active.name} (${active.riskPct?.toFixed(1) || '?'}%)`
            : 'No profile selected';
    };

    const renderList = () => {
        const container = document.getElementById('pdPatientList');
        if (!container) return;
        if (patients.length === 0) {
            container.innerHTML = '<p class="pd-empty-msg">No patients saved yet.</p>';
            return;
        }
        container.innerHTML = '';
        patients.forEach(p => {
            const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

            const card = document.createElement('div');
            card.className = `pd-patient-card${p.id === activePatientId ? ' active' : ''}`;

            const avatar = document.createElement('div');
            avatar.className = 'pd-patient-avatar';
            avatar.textContent = initials;

            const info = document.createElement('div');
            info.className = 'pd-patient-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'pd-patient-name';
            nameEl.textContent = p.name;

            const riskEl = document.createElement('div');
            riskEl.className = 'pd-patient-risk';
            const savedDate = (() => { try { return new Date(p.savedAt).toLocaleDateString(); } catch (_) { return ''; } })();
            riskEl.textContent = `Risk: ${p.riskPct?.toFixed(1) || '?'}% \u00B7 ${savedDate}`;

            info.appendChild(nameEl);
            info.appendChild(riskEl);

            const actions = document.createElement('div');
            actions.className = 'pd-patient-actions';

            const mkBtn = (cls, title, action, icon) => {
                const btn = document.createElement('button');
                btn.className = `pd-btn-icon ${cls}`;
                btn.title = title;
                btn.dataset.action = action;
                btn.dataset.id = p.id;
                const iconEl = document.createElement('i');
                iconEl.setAttribute('data-lucide', icon.replace(/_/g, '-'));
                iconEl.className = 'lucide-icon';
                btn.appendChild(iconEl);
                return btn;
            };

            const exportBtn = mkBtn('export', 'Export this profile to Excel', 'export', 'download');
            const saveBtn = mkBtn('save', 'Update with current values', 'save', 'save');
            const delBtn  = mkBtn('delete', 'Delete patient', 'delete', 'trash-2');
            actions.appendChild(exportBtn);
            actions.appendChild(saveBtn);
            actions.appendChild(delBtn);

            card.appendChild(avatar);
            card.appendChild(info);
            card.appendChild(actions);

            card.addEventListener('click', (e) => { if (!e.target.closest('[data-action]')) loadPatient(p.id); });
            exportBtn.addEventListener('click', (e) => { e.stopPropagation(); exportSinglePatient(p.id); });
            saveBtn.addEventListener('click', (e) => { e.stopPropagation(); updatePatient(p.id); });
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete patient "${p.name}"?`)) deletePatient(p.id);
            });
            container.appendChild(card);
        });

        // Initialize Lucide icons for dynamically added content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // ─── Drawer toggle ──────────────────────────────────────────────────

    const toggleDrawer = (open) => {
        const action = open ? 'add' : 'remove';
        ['patientDrawer', 'patientOverlay', 'patientMenuBtn'].forEach(id =>
            document.getElementById(id)?.classList[action]('open'));
    };

    // ─── Init ───────────────────────────────────────────────────────────

    const init = () => {
        loadFromStorage(); renderList(); updateNavLabel();

        // Initialize Lucide icons for patient drawer elements
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('patientMenuBtn')?.addEventListener('click', () => {
            const isOpen = document.getElementById('patientDrawer')?.classList.contains('open');
            toggleDrawer(!isOpen);
        });
        document.getElementById('patientDrawerClose')?.addEventListener('click', () => toggleDrawer(false));
        document.getElementById('patientOverlay')?.addEventListener('click', () => toggleDrawer(false));

        document.getElementById('pdAddPatientBtn')?.addEventListener('click', () => {
            const input = document.getElementById('pdNewPatientName');
            if (!input?.value.trim()) { input?.focus(); return; }
            addPatient(input.value);
            input.value = '';
        });

        document.getElementById('pdNewPatientName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('pdAddPatientBtn')?.click();
        });

        document.getElementById('pdExportBtn')?.addEventListener('click', exportToExcel);
        document.getElementById('pdImportFile')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) importFromExcel(file);
            e.target.value = '';
        });
    };

    /**
     * Get the stored data of the currently active patient.
     * @returns {Object|null} Patient data object or null if no patient is active.
     */
    const getActivePatientData = () => {
        if (!activePatientId) return null;
        const patient = patients.find(p => p.id === activePatientId);
        return patient ? patient.data : null;
    };

    return { init, loadPatient, applyValues, captureCurrentValues, updateNavLabel, getActivePatientData };
})();
