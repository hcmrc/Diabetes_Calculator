# Security Policy

## Supported Versions

This is a static web application with no server-side components. Security updates will be applied to the main branch as needed.

| Version | Supported          |
| ------- | ------------------ |
| Main    | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email the maintainer directly with details
3. Include steps to reproduce and potential impact
4. Allow time for assessment and remediation

## Security Considerations

This application:
- Runs entirely client-side (no server)
- Uses localStorage for data persistence
- Does not transmit personal health data over networks
- Implements Content Security Policy (CSP) headers

### Data Privacy

- All patient data is stored locally in the browser
- No data is sent to external servers
- Users can export/import their data via Excel files

## Dependencies

The application uses minimal external dependencies:
- Lucide Icons (local)
- SheetJS for Excel import/export (loaded from CDN with integrity check)
- Google Fonts (loaded from CDN)

All external resources use Subresource Integrity (SRI) where applicable.
