# Excel Encryption Design Document

**Date:** 2026-03-24
**Feature:** Client-side Excel encryption for patient profile exports

---

## Overview

Add password-based encryption for Excel exports in the Diabetes Risk Calculator. Users can choose to encrypt individual profiles or bulk exports with a password, with optional session-based password memory.

---

## Requirements

### Functional
1. Encrypt single patient exports (`exportSinglePatient`)
2. Encrypt bulk exports (`exportToExcel`)
3. Decrypt imports (`importFromExcel`)
4. Modal dialog before download to choose encryption options
5. Password options: none, new password, last used password, or default password
6. Remember password for session (sessionStorage)
7. Set password as default for exports (sessionStorage)

### Security
1. AES-256-GCM encryption via Web Crypto API
2. PBKDF2 key derivation with 100k iterations
3. Unique random salt per file
4. Authenticated encryption (GCM) prevents tampering
5. Never store passwords in localStorage or persistently
6. Memory-only password storage

---

## Architecture

### New Module: `crypto-service.js`

**Location:** `js/crypto-service.js`
**Load Order:** After `config.js`, before `patient-manager.js`

```
Namespace: DRC.CryptoService

Methods:
  - encryptData(data: Uint8Array, password: string): Promise<EncryptedPackage>
  - decryptData(package: EncryptedPackage, password: string): Promise<Uint8Array>
  - isEncrypted(data: Uint8Array): boolean

Types:
  EncryptedPackage: {
    version: 1,
    salt: Uint8Array (16 bytes),
    iv: Uint8Array (12 bytes),
    ciphertext: Uint8Array,
    tag: Uint8Array (16 bytes)
  }
```

### Encryption Format

File structure for encrypted Excel files:
```
[Magic Header: 8 bytes "DRCENC1\0"]
[JSON Metadata Length: 4 bytes (uint32, big-endian)]
[JSON Metadata: {salt: base64, iv: base64, tag: base64}]
[Encrypted Content: variable length]
```

This allows automatic detection of encrypted files during import.

### Password Storage

**sessionStorage keys:**
- `drc_encryption_last_password`: Last used password (cleared on session end)
- `drc_encryption_default_enabled`: Whether to use default password
- `drc_encryption_default_password`: Default password (if set)

**Security note:** These are intentionally session-only, not persisted to localStorage.

---

## UI Components

### Modal Dialog

**ID:** `encryptionModal`

Components:
1. Radio group: Protection level
   - "Kein Passwort" (no encryption)
   - "Mit Passwort verschlüsseln"
2. Password input (conditional, shown when encryption selected)
3. Checkboxes:
   - "Passwort für diese Session merken"
   - "Als Standard für alle Exports setzen"
4. Quick-select: "Letztes Passwort verwenden" (if available)

### Integration Points

**patient-manager.js changes:**
- `exportToExcel()`: Wrap with encryption modal
- `exportSinglePatient()`: Wrap with encryption modal
- `importFromExcel()`: Detect encrypted files, show password prompt

**index.html changes:**
- Add encryption modal markup
- Load `crypto-service.js` in script order

---

## Data Flow

### Export Flow
```
User clicks Export
    ↓
Show encryptionModal
    ↓
User selects options, enters password
    ↓
[Build Excel via SheetJS] → Uint8Array
    ↓
If encrypted:
    [Encrypt via CryptoService] → EncryptedPackage
    [Serialize with header] → Uint8Array
    ↓
Download via XLSX.writeFile or Blob download
```

### Import Flow
```
User selects file
    ↓
Read as ArrayBuffer
    ↓
Check for magic header "DRCENC1\0"
    ↓
If encrypted:
    Show password prompt
    Parse metadata
    Decrypt via CryptoService
    ↓
Pass decrypted data to SheetJS
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| Wrong password on import | Show clear error, allow retry (3 attempts) |
| Corrupted encrypted file | "File appears corrupted or was tampered with" |
| Unsupported encryption version | "This file uses an unsupported encryption version" |
| Browser lacks Web Crypto | Fallback to unencrypted export with warning |
| Empty password | Prevent export, show validation error |

---

## Testing Considerations

1. Encrypt/decrypt round-trip test
2. Import encrypted file back
3. Wrong password detection
4. Tampering detection (wrong ciphertext/tag)
5. Legacy unencrypted import still works
6. Mixed import (some encrypted, some not) - not supported, show error

---

## Script Loading Order

Updated `index.html` order:
```
1. lucide.min.js
2. xlsx.full.min.js
3. config.js
4. conversion-service.js
5. risk-model.js
6. ui-helpers.js
7. ui-controller.js
8. radar-chart.js
9. timeline-chart.js
10. app.js
11. crypto-service.js          ← NEW
12. patient-manager.js        ← MODIFIED
13. treatment-simulator.js
14. dark-mode.js
15. main.js
```

---

## Backwards Compatibility

- Unencrypted exports remain unchanged
- Encrypted files are opt-in per export
- Import automatically handles both encrypted and unencrypted
- No changes to localStorage patient data format

---

## CSP Compliance

Web Crypto API requires no additional CSP directives. All operations are client-side with no network requests.

---

## Performance

PBKDF2 with 100k iterations takes ~50-100ms on modern devices - acceptable for a user-initiated export operation. Encryption itself is near-instant with Web Crypto.
