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
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (parsed) {
                patients = parsed.patients || [];
                activePatientId = parsed.activePatientId || null;
            }
        } catch (_) { patients = []; activePatientId = null; }
    };

    // ─── Value capture/apply ────────────────────────────────────────────

    /** Capture current slider/toggle values + displayed risk. */
    const captureCurrentValues = () => {
        const vals = {};
        FIELDS.forEach(f => {
            if (f === 'race')       vals[f] = document.getElementById('race-toggle')?.checked ? 1 : 0;
            else if (f === 'parentHist') vals[f] = document.getElementById('parentHist-toggle')?.checked ? 1 : 0;
            else                    vals[f] = parseFloat(document.getElementById(`${f}-value`)?.value) || 0;
        });
        vals._riskPct = parseFloat(document.getElementById('risk-percentage')?.textContent) || 0;
        return vals;
    };

    /** Apply stored patient data to sliders/toggles. */
    const applyValues = (data) => {
        if (!data) return;
        FIELDS.forEach(f => {
            if (f === 'race' || f === 'parentHist') {
                const toggle = document.getElementById(f === 'race' ? 'race-toggle' : 'parentHist-toggle');
                if (toggle) toggle.checked = !!data[f];
            } else {
                const input  = document.getElementById(`${f}-value`);
                const slider = document.getElementById(`${f}-slider`);
                if (input)  input.value  = data[f] ?? 0;
                if (slider) slider.value = data[f] ?? 0;
                DRC.UIController.updateSliderFill(f);
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
        DRC.App?._calculate?.() ||
            document.getElementById('age-slider')?.dispatchEvent(new Event('input'));
    };

    // ─── Excel Import/Export ────────────────────────────────────────────

    /** Column mappings for Excel (column name → field key). */
    const EXCEL_COLUMNS = {
        Name: 'name', Age: 'age', Race_African_American: 'race',
        Parent_History: 'parentHist', Systolic_BP: 'sbp', Height: 'height',
        Waist: 'waist', Fasting_Glucose: 'fastGlu', HDL_Cholesterol: 'cholHDL',
        Triglycerides: 'cholTri', Risk_Pct: 'riskPct', Saved_At: 'savedAt'
    };

    const exportToExcel = () => {
        if (patients.length === 0) { alert('No patients to export.'); return; }
        const rows = patients.map(p => ({
            Name: p.name, Age: p.data.age, Race_African_American: p.data.race,
            Parent_History: p.data.parentHist, Systolic_BP: p.data.sbp,
            Height: p.data.height, Waist: p.data.waist,
            Fasting_Glucose: p.data.fastGlu, HDL_Cholesterol: p.data.cholHDL,
            Triglycerides: p.data.cholTri, Risk_Pct: p.riskPct, Saved_At: p.savedAt
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Patients');
        XLSX.writeFile(wb, 'diabetes_risk_patients.xlsx');
    };

    const importFromExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb   = XLSX.read(e.target.result, { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                rows.forEach(row => {
                    const name = row.Name || row.name || 'Imported Patient';
                    const data = {
                        age: parseFloat(row.Age || row.age) || 50,
                        race: parseInt(row.Race_African_American || row.race) || 0,
                        parentHist: parseInt(row.Parent_History || row.parentHist) || 0,
                        sbp: parseFloat(row.Systolic_BP || row.sbp) || 120,
                        height: parseFloat(row.Height || row.height) || 170,
                        waist: parseFloat(row.Waist || row.waist) || 90,
                        fastGlu: parseFloat(row.Fasting_Glucose || row.fastGlu) || 100,
                        cholHDL: parseFloat(row.HDL_Cholesterol || row.cholHDL) || 50,
                        cholTri: parseFloat(row.Triglycerides || row.cholTri) || 150,
                        _riskPct: parseFloat(row.Risk_Pct || 0) || 0
                    };
                    patients.push({
                        id: generateId(), name, data,
                        riskPct: data._riskPct, savedAt: row.Saved_At || new Date().toISOString()
                    });
                });
                saveToStorage(); renderList(); updateNavLabel();
            } catch (err) { alert('Error reading Excel file: ' + err.message); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── UI Rendering ───────────────────────────────────────────────────

    const updateNavLabel = () => {
        const active = patients.find(p => p.id === activePatientId);
        const label = document.getElementById('patientNameLabel');
        const activeLabel = document.getElementById('pdActiveLabel');
        if (label) label.textContent = active ? active.name : 'No Patient';
        if (activeLabel) activeLabel.textContent = active
            ? `${active.name} (${active.riskPct?.toFixed(1) || '?'}%)`
            : 'No patient selected';
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
            card.innerHTML = `
                <div class="pd-patient-avatar">${initials}</div>
                <div class="pd-patient-info">
                    <div class="pd-patient-name">${p.name}</div>
                    <div class="pd-patient-risk">Risk: ${p.riskPct?.toFixed(1) || '?'}% \u00B7 ${new Date(p.savedAt).toLocaleDateString()}</div>
                </div>
                <div class="pd-patient-actions">
                    <button class="pd-btn-icon save" title="Update with current values" data-action="save" data-id="${p.id}">
                        <span class="material-icons-round">save</span>
                    </button>
                    <button class="pd-btn-icon delete" title="Delete patient" data-action="delete" data-id="${p.id}">
                        <span class="material-icons-round">delete_outline</span>
                    </button>
                </div>
            `;
            card.addEventListener('click', (e) => { if (!e.target.closest('[data-action]')) loadPatient(p.id); });
            card.querySelector('[data-action="save"]').addEventListener('click', (e) => { e.stopPropagation(); updatePatient(p.id); });
            card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete patient "${p.name}"?`)) deletePatient(p.id);
            });
            container.appendChild(card);
        });
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

    return { init, loadPatient, captureCurrentValues, updateNavLabel, getActivePatientData };
})();
