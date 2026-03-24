# Excel Encryption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side AES-256-GCM encryption for Excel exports with password-based key derivation and session-based password memory.

**Architecture:** New crypto-service.js module using Web Crypto API, encryption modal UI, integration with existing patient-manager.js for intercepting exports and handling encrypted imports.

**Tech Stack:** Vanilla JS, Web Crypto API (native browser), SheetJS (xlsx), sessionStorage for temporary password storage.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `js/crypto-service.js` | Encryption/decryption logic, key derivation, format handling |
| `js/patient-manager.js` | Modified to show modal before export, handle encrypted imports |
| `index.html` | Add encryption modal markup, update script loading order |
| `style.css` | Modal styling (reuse existing modal patterns) |
| `tests/test-crypto-service.js` | Unit tests for crypto operations |

---

## Task 1: Create Crypto Service Module

**Files:**
- Create: `js/crypto-service.js`
- Modify: `index.html:33` (add script tag in correct order)

### Step 1.1: Create crypto-service.js with basic structure

```javascript
/**
 * @fileoverview Crypto Service — AES-256-GCM encryption for Excel exports.
 *
 * Uses Web Crypto API for all cryptographic operations.
 * Format: Magic header + JSON metadata + encrypted payload
 *
 * @module CryptoService
 * @memberof DRC
 */

'use strict';

DRC.CryptoService = (() => {
    const MAGIC_HEADER = new Uint8Array([0x44, 0x52, 0x43, 0x45, 0x4E, 0x43, 0x31, 0x00]); // "DRCENC1\0"
    const VERSION = 1;
    const PBKDF2_ITERATIONS = 100000;
    const SALT_LENGTH = 16;
    const IV_LENGTH = 12;
    const TAG_LENGTH = 16;
    const KEY_LENGTH = 32;

    /**
     * Derive AES key from password using PBKDF2.
     * @param {string} password
     * @param {Uint8Array} salt
     * @returns {Promise<CryptoKey>}
     */
    const deriveKey = async (password, salt) => {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    };

    /**
     * Encrypt data with password.
     * @param {Uint8Array} data
     * @param {string} password
     * @returns {Promise<Uint8Array>} Encrypted package with header
     */
    const encrypt = async (data, password) => {
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const key = await deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        // Build output: header + metadata length + metadata + ciphertext
        const encryptedArray = new Uint8Array(encrypted);
        const ciphertext = encryptedArray.slice(0, -TAG_LENGTH);
        const tag = encryptedArray.slice(-TAG_LENGTH);

        const metadata = {
            version: VERSION,
            salt: Array.from(salt),
            iv: Array.from(iv),
            tag: Array.from(tag)
        };
        const metadataJson = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataJson);
        const metadataLength = new Uint8Array(4);
        new DataView(metadataLength.buffer).setUint32(0, metadataBytes.length, false); // big-endian

        const output = new Uint8Array(
            MAGIC_HEADER.length +
            metadataLength.length +
            metadataBytes.length +
            ciphertext.length
        );

        let offset = 0;
        output.set(MAGIC_HEADER, offset);
        offset += MAGIC_HEADER.length;
        output.set(metadataLength, offset);
        offset += metadataLength.length;
        output.set(metadataBytes, offset);
        offset += metadataBytes.length;
        output.set(ciphertext, offset);

        return output;
    };

    /**
     * Decrypt data with password.
     * @param {Uint8Array} encryptedPackage
     * @param {string} password
     * @returns {Promise<Uint8Array>} Original data
     * @throws {Error} If decryption fails (wrong password or corrupted)
     */
    const decrypt = async (encryptedPackage, password) => {
        // Check header
        const header = encryptedPackage.slice(0, MAGIC_HEADER.length);
        if (!header.every((b, i) => b === MAGIC_HEADER[i])) {
            throw new Error('Invalid encrypted file format');
        }

        // Read metadata length
        const metadataLengthView = new DataView(
            encryptedPackage.buffer,
            MAGIC_HEADER.length,
            4
        );
        const metadataLength = metadataLengthView.getUint32(0, false);

        // Read metadata
        const metadataStart = MAGIC_HEADER.length + 4;
        const metadataBytes = encryptedPackage.slice(
            metadataStart,
            metadataStart + metadataLength
        );
        const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));

        if (metadata.version !== VERSION) {
            throw new Error(`Unsupported encryption version: ${metadata.version}`);
        }

        const salt = new Uint8Array(metadata.salt);
        const iv = new Uint8Array(metadata.iv);
        const tag = new Uint8Array(metadata.tag);
        const ciphertext = encryptedPackage.slice(metadataStart + metadataLength);

        // Reconstruct full ciphertext with tag
        const fullCiphertext = new Uint8Array(ciphertext.length + tag.length);
        fullCiphertext.set(ciphertext, 0);
        fullCiphertext.set(tag, ciphertext.length);

        const key = await deriveKey(password, salt);

        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                fullCiphertext
            );
            return new Uint8Array(decrypted);
        } catch (e) {
            throw new Error('Decryption failed: wrong password or corrupted file');
        }
    };

    /**
     * Check if data appears to be encrypted with our format.
     * @param {Uint8Array} data
     * @returns {boolean}
     */
    const isEncrypted = (data) => {
        if (data.length < MAGIC_HEADER.length) return false;
        return data.slice(0, MAGIC_HEADER.length).every((b, i) => b === MAGIC_HEADER[i]);
    };

    return {
        encrypt,
        decrypt,
        isEncrypted
    };
})();
```

### Step 1.2: Update index.html script loading order

Find the script tags section and insert crypto-service.js after app.js and before patient-manager.js:

```html
<!-- Crypto Service for Excel encryption -->
<script src="js/crypto-service.js"></script>
```

---

## Task 2: Create Encryption Modal UI

**Files:**
- Modify: `index.html` (add modal markup before closing body)
- Modify: `style.css` (add modal styles)

### Step 2.1: Add modal HTML

Add before `</body>`:

```html
<!-- Encryption Modal -->
<div id="encryptionModal" class="modal" aria-hidden="true">
    <div class="modal-overlay" id="encryptionModalOverlay"></div>
    <div class="modal-content" role="dialog" aria-labelledby="encryptionModalTitle">
        <div class="modal-header">
            <h3 id="encryptionModalTitle">
                <i data-lucide="shield" class="lucide-icon"></i>
                <span>Excel-Export sichern</span>
            </h3>
            <button class="modal-close" id="encryptionModalClose" aria-label="Schließen">
                <i data-lucide="x" class="lucide-icon"></i>
            </button>
        </div>

        <div class="modal-body">
            <p class="modal-description">
                Wählen Sie, wie Ihre Excel-Datei geschützt werden soll.
            </p>

            <div class="encryption-options">
                <label class="radio-option">
                    <input type="radio" name="encryptionLevel" value="none" checked>
                    <span class="radio-label">
                        <i data-lucide="unlock" class="lucide-icon"></i>
                        <span class="radio-title">Kein Passwort</span>
                        <span class="radio-hint">Datei wird unverschlüsselt gespeichert</span>
                    </span>
                </label>

                <label class="radio-option">
                    <input type="radio" name="encryptionLevel" value="password">
                    <span class="radio-label">
                        <i data-lucide="lock" class="lucide-icon"></i>
                        <span class="radio-title">Mit Passwort verschlüsseln</span>
                        <span class="radio-hint">AES-256 Verschlüsselung</span>
                    </span>
                </label>
            </div>

            <div id="passwordSection" class="password-section hidden">
                <div class="password-input-group">
                    <label for="encryptionPassword">Passwort:</label>
                    <div class="password-field">
                        <input
                            type="password"
                            id="encryptionPassword"
                            placeholder="Mindestens 8 Zeichen"
                            minlength="8"
                            autocomplete="off"
                        >
                        <button type="button" class="password-toggle" id="passwordToggle" aria-label="Passwort anzeigen">
                            <i data-lucide="eye" class="lucide-icon"></i>
                        </button>
                    </div>
                    <span id="passwordError" class="error-message hidden">Passwort muss mindestens 8 Zeichen haben</span>
                </div>

                <div class="quick-options" id="quickOptions"></div>

                <div class="checkbox-options">
                    <label class="checkbox-option">
                        <input type="checkbox" id="rememberPassword">
                        <span>Passwort für diese Session merken</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="setAsDefault">
                        <span>Als Standard für alle Exports setzen</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="encryptionCancel">Abbrechen</button>
            <button type="button" class="btn btn-primary" id="encryptionConfirm">Herunterladen</button>
        </div>
    </div>
</div>

<!-- Password Prompt Modal (for import) -->
<div id="passwordPromptModal" class="modal" aria-hidden="true">
    <div class="modal-overlay" id="passwordPromptOverlay"></div>
    <div class="modal-content" role="dialog" aria-labelledby="passwordPromptTitle">
        <div class="modal-header">
            <h3 id="passwordPromptTitle">
                <i data-lucide="lock" class="lucide-icon"></i>
                <span>Verschlüsselte Datei</span>
            </h3>
        </div>
        <div class="modal-body">
            <p>Diese Datei ist passwortgeschützt. Bitte geben Sie das Passwort ein:</p>
            <div class="password-input-group">
                <input
                    type="password"
                    id="importPassword"
                    placeholder="Passwort eingeben"
                    autocomplete="off"
                >
            </div>
            <span id="importPasswordError" class="error-message hidden">Falsches Passwort</span>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="importPasswordCancel">Abbrechen</button>
            <button type="button" class="btn btn-primary" id="importPasswordConfirm">Entschlüsseln</button>
        </div>
    </div>
</div>
```

### Step 2.2: Add modal CSS styles

Add to `style.css`:

```css
/* ============================================
   ENCRYPTION MODAL STYLES
   ============================================ */

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    display: none;
    align-items: center;
    justify-content: center;
}

.modal.active {
    display: flex;
}

.modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}

.modal-content {
    position: relative;
    background: var(--card-bg, white);
    border-radius: 12px;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.modal-header h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
}

.modal-header h3 .lucide-icon {
    width: 20px;
    height: 20px;
    color: var(--primary-color, #3b82f6);
}

.modal-close {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
    border-radius: 6px;
    transition: all 0.15s ease;
}

.modal-close:hover {
    background: var(--hover-bg, #f1f5f9);
    color: var(--text-primary, #1e293b);
}

.modal-body {
    padding: 24px;
}

.modal-description {
    margin: 0 0 20px;
    color: var(--text-secondary, #64748b);
    font-size: 0.9375rem;
    line-height: 1.5;
}

/* Radio Options */
.encryption-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.radio-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border: 2px solid var(--border-color, #e2e8f0);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.radio-option:hover {
    border-color: var(--primary-color, #3b82f6);
    background: var(--hover-bg, #f8fafc);
}

.radio-option input[type="radio"] {
    margin-top: 2px;
    accent-color: var(--primary-color, #3b82f6);
}

.radio-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.radio-label .lucide-icon {
    width: 18px;
    height: 18px;
    margin-bottom: 4px;
}

.radio-title {
    font-weight: 600;
    color: var(--text-primary, #1e293b);
}

.radio-hint {
    font-size: 0.8125rem;
    color: var(--text-secondary, #64748b);
}

/* Password Section */
.password-section {
    padding-top: 16px;
    border-top: 1px solid var(--border-color, #e2e8f0);
}

.password-section.hidden {
    display: none;
}

.password-input-group {
    margin-bottom: 16px;
}

.password-input-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #1e293b);
    margin-bottom: 8px;
}

.password-field {
    position: relative;
    display: flex;
}

.password-field input {
    flex: 1;
    padding: 10px 40px 10px 12px;
    border: 2px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    font-size: 0.9375rem;
    background: var(--input-bg, white);
    color: var(--text-primary, #1e293b);
    transition: border-color 0.15s ease;
}

.password-field input:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
}

.password-toggle {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
}

.error-message {
    display: block;
    margin-top: 6px;
    font-size: 0.8125rem;
    color: var(--error-color, #ef4444);
}

.error-message.hidden {
    display: none;
}

/* Quick Options */
.quick-options {
    margin-bottom: 16px;
}

.quick-option-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: var(--secondary-bg, #f1f5f9);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-primary, #1e293b);
    transition: all 0.15s ease;
}

.quick-option-btn:hover {
    background: var(--hover-bg, #e2e8f0);
}

.quick-option-btn .lucide-icon {
    width: 16px;
    height: 16px;
    color: var(--primary-color, #3b82f6);
}

/* Checkbox Options */
.checkbox-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
    accent-color: var(--primary-color, #3b82f6);
}

/* Modal Footer */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px 24px;
}

.btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
}

.btn-secondary {
    background: var(--secondary-bg, #f1f5f9);
    border: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-secondary, #64748b);
}

.btn-secondary:hover {
    background: var(--hover-bg, #e2e8f0);
}

.btn-primary {
    background: var(--primary-color, #3b82f6);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-hover, #2563eb);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .modal-content {
        background: var(--card-bg-dark, #1e293b);
    }

    .modal-header {
        border-color: var(--border-color-dark, #334155);
    }

    .radio-option {
        border-color: var(--border-color-dark, #334155);
    }

    .radio-option:hover {
        background: var(--hover-bg-dark, #334155);
    }

    .password-field input {
        background: var(--input-bg-dark, #0f172a);
        border-color: var(--border-color-dark, #334155);
        color: var(--text-primary-dark, #f1f5f9);
    }

    .quick-option-btn {
        background: var(--secondary-bg-dark, #334155);
        border-color: var(--border-color-dark, #475569);
    }
}
```

---

## Task 3: Update Patient Manager

**Files:**
- Modify: `js/patient-manager.js`

### Step 3.1: Add encryption modal controller functions

Add after `toggleDrawer` function:

```javascript
// ─── Encryption Modal ───────────────────────────────────────────────

const ENCRYPTION_STORAGE = {
    getLastPassword: () => sessionStorage.getItem('drc_last_password'),
    setLastPassword: (pwd) => sessionStorage.setItem('drc_last_password', pwd),
    clearLastPassword: () => sessionStorage.removeItem('drc_last_password'),
    getDefaultPassword: () => sessionStorage.getItem('drc_default_password'),
    setDefaultPassword: (pwd) => sessionStorage.setItem('drc_default_password', pwd),
    clearDefaultPassword: () => sessionStorage.removeItem('drc_default_password'),
    isDefaultEnabled: () => sessionStorage.getItem('drc_default_enabled') === 'true',
    setDefaultEnabled: (enabled) => sessionStorage.setItem('drc_default_enabled', enabled ? 'true' : 'false')
};

let encryptionModalResolver = null;

const initEncryptionModal = () => {
    const modal = document.getElementById('encryptionModal');
    const overlay = document.getElementById('encryptionModalOverlay');
    const closeBtn = document.getElementById('encryptionModalClose');
    const cancelBtn = document.getElementById('encryptionCancel');
    const confirmBtn = document.getElementById('encryptionConfirm');
    const passwordSection = document.getElementById('passwordSection');
    const passwordInput = document.getElementById('encryptionPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordError = document.getElementById('passwordError');
    const radioOptions = document.querySelectorAll('input[name="encryptionLevel"]');
    const quickOptions = document.getElementById('quickOptions');

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        if (encryptionModalResolver) {
            encryptionModalResolver({ cancelled: true });
            encryptionModalResolver = null;
        }
    };

    // Toggle password section visibility
    radioOptions.forEach(radio => {
        radio.addEventListener('change', () => {
            const showPassword = radio.value === 'password';
            passwordSection.classList.toggle('hidden', !showPassword);
            if (showPassword) {
                setTimeout(() => passwordInput.focus(), 100);
            }
        });
    });

    // Password visibility toggle
    passwordToggle?.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        const icon = passwordToggle.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    // Populate quick options using safe DOM methods
    const populateQuickOptions = () => {
        quickOptions.innerHTML = '';
        const defaultPwd = ENCRYPTION_STORAGE.getDefaultPassword();
        const lastPwd = ENCRYPTION_STORAGE.getLastPassword();

        if (defaultPwd) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quick-option-btn';

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'key');
            icon.className = 'lucide-icon';

            const text = document.createTextNode(' Standard-Passwort verwenden');

            btn.appendChild(icon);
            btn.appendChild(text);

            btn.addEventListener('click', () => {
                passwordInput.value = defaultPwd;
                document.querySelector('input[name="encryptionLevel"][value="password"]').checked = true;
                passwordSection.classList.remove('hidden');
            });
            quickOptions.appendChild(btn);
        }

        if (lastPwd && lastPwd !== defaultPwd) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quick-option-btn';

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'history');
            icon.className = 'lucide-icon';

            const text = document.createTextNode(' Letztes Passwort verwenden');

            btn.appendChild(icon);
            btn.appendChild(text);

            btn.addEventListener('click', () => {
                passwordInput.value = lastPwd;
                document.querySelector('input[name="encryptionLevel"][value="password"]').checked = true;
                passwordSection.classList.remove('hidden');
            });
            quickOptions.appendChild(btn);
        }

        if (quickOptions.children.length > 0 && typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    // Confirm button
    confirmBtn.addEventListener('click', () => {
        const useEncryption = document.querySelector('input[name="encryptionLevel"]:checked').value === 'password';
        const password = passwordInput.value;
        const remember = document.getElementById('rememberPassword').checked;
        const setDefault = document.getElementById('setAsDefault').checked;

        if (useEncryption && password.length < 8) {
            passwordError.classList.remove('hidden');
            passwordInput.focus();
            return;
        }

        passwordError.classList.add('hidden');

        // Save password preferences
        if (useEncryption && remember) {
            ENCRYPTION_STORAGE.setLastPassword(password);
        }
        if (useEncryption && setDefault) {
            ENCRYPTION_STORAGE.setDefaultPassword(password);
            ENCRYPTION_STORAGE.setDefaultEnabled(true);
        } else if (setDefault) {
            ENCRYPTION_STORAGE.clearDefaultPassword();
            ENCRYPTION_STORAGE.setDefaultEnabled(false);
        }

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');

        if (encryptionModalResolver) {
            encryptionModalResolver({
                cancelled: false,
                useEncryption,
                password: useEncryption ? password : null
            });
            encryptionModalResolver = null;
        }
    });

    // Close handlers
    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Reset on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    return { populateQuickOptions };
};

const showEncryptionModal = () => {
    return new Promise((resolve) => {
        encryptionModalResolver = resolve;
        const modal = document.getElementById('encryptionModal');
        const passwordInput = document.getElementById('encryptionPassword');
        const passwordSection = document.getElementById('passwordSection');
        const passwordError = document.getElementById('passwordError');

        // Reset state
        passwordInput.value = '';
        passwordSection.classList.add('hidden');
        passwordError.classList.add('hidden');
        document.querySelector('input[name="encryptionLevel"][value="none"]').checked = true;

        // Pre-select default if set
        const defaultPwd = ENCRYPTION_STORAGE.getDefaultPassword();
        if (ENCRYPTION_STORAGE.isDefaultEnabled() && defaultPwd) {
            document.querySelector('input[name="encryptionLevel"][value="password"]').checked = true;
            passwordSection.classList.remove('hidden');
            passwordInput.value = defaultPwd;
            document.getElementById('rememberPassword').checked = true;
            document.getElementById('setAsDefault').checked = true;
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        // Refresh icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
};
```

### Step 3.2: Modify export functions to use encryption

Replace `exportToExcel` function:

```javascript
const exportToExcel = async () => {
    if (patients.length === 0) { alert('No patients to export.'); return; }

    const { cancelled, useEncryption, password } = await showEncryptionModal();
    if (cancelled) return;

    const rows = patients.map(_buildExcelRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');

    if (useEncryption && password && DRC.CryptoService) {
        try {
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const excelData = new Uint8Array(excelBuffer);
            const encrypted = await DRC.CryptoService.encrypt(excelData, password);

            // Download encrypted file
            const blob = new Blob([encrypted], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diabetes_risk_patients.drc';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Encryption failed:', err);
            alert('Encryption failed. Exporting without encryption.');
            XLSX.writeFile(wb, 'diabetes_risk_patients.xlsx');
        }
    } else {
        XLSX.writeFile(wb, 'diabetes_risk_patients.xlsx');
    }
};
```

Replace `exportSinglePatient` function:

```javascript
const exportSinglePatient = async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) { alert('Patient not found.'); return; }

    const { cancelled, useEncryption, password } = await showEncryptionModal();
    if (cancelled) return;

    const rows = [_buildExcelRow(patient)];

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10);
    const sanitizedName = patient.name.replace(/[<>"/\\|?*]/g, '_').slice(0, 50);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profile');

    if (useEncryption && password && DRC.CryptoService) {
        try {
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const excelData = new Uint8Array(excelBuffer);
            const encrypted = await DRC.CryptoService.encrypt(excelData, password);

            const filename = `${sanitizedName}_${timestamp}_DRC_Export.drc`;
            const blob = new Blob([encrypted], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Encryption failed:', err);
            alert('Encryption failed. Exporting without encryption.');
            const filename = `${sanitizedName}_${timestamp}_DRC_Export.xlsx`;
            XLSX.writeFile(wb, filename);
        }
    } else {
        const filename = `${sanitizedName}_${timestamp}_DRC_Export.xlsx`;
        XLSX.writeFile(wb, filename);
    }
};
```

### Step 3.3: Modify import to handle encrypted files

Replace `importFromExcel` function:

```javascript
const importFromExcel = (file) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_MIME_TYPES = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

    if (file.size > MAX_FILE_SIZE) {
        alert('File is too large. Maximum size is 5MB.');
        return;
    }

    // Allow .drc extension for encrypted files
    const isDrcFile = file.name.endsWith('.drc');
    if (!isDrcFile && (!ALLOWED_MIME_TYPES.includes(file.type) || !/\.(xlsx|xls)$/i.test(file.name))) {
        alert('Invalid file type. Please upload a valid Excel file (.xlsx or .xls) or encrypted .drc file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let data = new Uint8Array(e.target.result);

            // Check if encrypted
            if (DRC.CryptoService && DRC.CryptoService.isEncrypted(data)) {
                const password = await showPasswordPrompt();
                if (!password) return;

                try {
                    data = await DRC.CryptoService.decrypt(data, password);
                } catch (err) {
                    alert('Decryption failed: ' + err.message);
                    return;
                }
            }

            const wb = XLSX.read(data, { type: 'array' });
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            const clamp = (v, min, max) => Math.min(Math.max(isNaN(v) ? min : v, min), max);

            rows.forEach(row => {
                const rawName = String(row.Name || row.name || 'Imported Patient').trim().slice(0, 60);
                const [ageMin, ageMax] = DRC.CONFIG.RANGES.age.us;
                const [sbpMin, sbpMax] = DRC.CONFIG.RANGES.sbp.us;
                const [heightMin, heightMax] = DRC.CONFIG.RANGES.height.us;
                const [waistMin, waistMax] = DRC.CONFIG.RANGES.waist.us;
                const [fastGluMin, fastGluMax] = DRC.CONFIG.RANGES.fastGlu.us;
                const [cholHDLMin, cholHDLMax] = DRC.CONFIG.RANGES.cholHDL.us;
                const [cholTriMin, cholTriMax] = DRC.CONFIG.RANGES.cholTri.us;

                const data = {
                    age: clamp(parseFloat(row.Age || row.age) || 50, ageMin, ageMax),
                    sex: clamp(parseInt(row.Sex_Male || row.sex) ?? 1, 0, 1),
                    race: clamp(parseInt(row.Ethnicity_African_American || row.Race_African_American || row.race) || 0, 0, 1),
                    parentHist: clamp(parseInt(row.Parental_Diabetes || row.Parent_History || row.parentHist) || 0, 0, 1),
                    sbp: clamp(parseFloat(row.Systolic_BP || row.sbp) || 120, sbpMin, sbpMax),
                    height: clamp(parseFloat(row.Height || row.height) || 170, heightMin, heightMax),
                    waist: clamp(parseFloat(row.Waist || row.waist) || 90, waistMin, waistMax),
                    fastGlu: clamp(parseFloat(row.Fasting_Glucose || row.fastGlu) || 95, fastGluMin, fastGluMax),
                    cholHDL: clamp(parseFloat(row.HDL_Cholesterol || row.cholHDL) || 50, cholHDLMin, cholHDLMax),
                    cholTri: clamp(parseFloat(row.Blood_Fats_Triglycerides || row.Triglycerides || row.cholTri) || 150, cholTriMin, cholTriMax),
                    _riskPct: clamp(parseFloat(row.Risk_Pct || 0) || 0, 0, 100),
                    _isMetric: false
                };

                patients.push({
                    id: generateId(),
                    name: rawName,
                    data,
                    riskPct: data._riskPct,
                    savedAt: row.Saved_At || new Date().toISOString()
                });
            });

            _persistAndRender();
            updateNavLabel();
            alert(`Successfully imported ${rows.length} patient(s).`);
        } catch (err) {
            console.error('Import error:', err);
            alert('Could not read the file. Please check that it is a valid .xlsx or .drc file.');
        }
    };
    reader.readAsArrayBuffer(file);
};
```

### Step 3.4: Add password prompt modal handler

Add before `initEncryptionModal`:

```javascript
let passwordPromptResolver = null;

const showPasswordPrompt = () => {
    return new Promise((resolve) => {
        passwordPromptResolver = resolve;
        const modal = document.getElementById('passwordPromptModal');
        const passwordInput = document.getElementById('importPassword');
        const errorMsg = document.getElementById('importPasswordError');

        passwordInput.value = '';
        errorMsg.classList.add('hidden');

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        passwordInput.focus();

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
};

const initPasswordPromptModal = () => {
    const modal = document.getElementById('passwordPromptModal');
    const overlay = document.getElementById('passwordPromptOverlay');
    const cancelBtn = document.getElementById('importPasswordCancel');
    const confirmBtn = document.getElementById('importPasswordConfirm');
    const passwordInput = document.getElementById('importPassword');
    const errorMsg = document.getElementById('importPasswordError');

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        if (passwordPromptResolver) {
            passwordPromptResolver(null);
            passwordPromptResolver = null;
        }
    };

    confirmBtn.addEventListener('click', () => {
        const password = passwordInput.value;
        if (!password) {
            errorMsg.textContent = 'Bitte geben Sie ein Passwort ein';
            errorMsg.classList.remove('hidden');
            return;
        }
        errorMsg.classList.add('hidden');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        if (passwordPromptResolver) {
            passwordPromptResolver(password);
            passwordPromptResolver = null;
        }
    });

    overlay.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmBtn.click();
        if (e.key === 'Escape') closeModal();
    });
};
```

### Step 3.5: Update init function

Modify the `init` function to initialize encryption modals:

```javascript
const init = () => {
    loadFromStorage();
    renderList();
    updateNavLabel();

    // Initialize encryption modals
    const encryptionModal = initEncryptionModal();
    initPasswordPromptModal();

    // Populate quick options on first open
    if (encryptionModal) {
        encryptionModal.populateQuickOptions();
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ... rest of existing init code
};
```

---

## Task 4: Test the Implementation

**Files:**
- Run existing tests: `node tests/test-*.js`
- Manual test: Export with encryption, import back

### Step 4.1: Run existing test suite

```bash
node tests/test-*.js
```

Expected: All 552 tests pass (no breaking changes).

### Step 4.2: Manual test checklist

- [ ] Export single patient without encryption → .xlsx file
- [ ] Export single patient with encryption → .drc file
- [ ] Export all patients without encryption → .xlsx file
- [ ] Export all patients with encryption → .drc file
- [ ] Import encrypted .drc file → prompts for password, imports successfully
- [ ] Import unencrypted .xlsx file → imports successfully
- [ ] Import encrypted file with wrong password → error message
- [ ] Session password memory works (remember checkbox)
- [ ] Default password setting works (set as default checkbox)
- [ ] Quick options appear when passwords stored

---

## Task 5: Update File Input for .drc Extension

**Files:**
- Modify: `index.html` (file input accept attribute)

### Step 5.1: Update file input

Find the file input element and update:

```html
<input
    type="file"
    id="pdImportFile"
    accept=".xlsx,.xls,.drc,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
    aria-label="Import patient data from Excel"
>
```

---

## Verification Steps

1. **Security:** Verify Web Crypto API is used, no external crypto libraries
2. **CSP:** Confirm no new CSP violations (no eval, no inline scripts)
3. **Browser support:** Web Crypto API is supported in all modern browsers
4. **Error handling:** Test edge cases (empty password, wrong password, corrupted file)
5. **Memory:** Verify passwords only stored in sessionStorage, never localStorage

---

## Implementation Order

1. Task 1: Create crypto-service.js (core encryption logic)
2. Task 2: Add modal HTML and CSS (UI)
3. Task 3: Modify patient-manager.js (integration)
4. Task 4: Run tests
5. Task 5: Update file input

**Estimated time:** 2-3 hours for complete implementation and testing.
