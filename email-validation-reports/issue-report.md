# Email Template Validation Issues

Total Issues Found: 5

## HIGH Priority (3 issues)

### Admin - Comandă Nouă
- **Variable**: `order.customerEmail`
- **Issue**: Nested order property may not be passed: order.customerEmail
- **Impact**: May display empty if not included in runtime data
- **Fix**: Verify order object includes customerEmail when template is called

### Admin - Comandă Nouă
- **Variable**: `order.status`
- **Issue**: Nested order property may not be passed: order.status
- **Impact**: May display empty if not included in runtime data
- **Fix**: Verify order object includes status when template is called

### Admin - Plată Eșuată
- **Variable**: `order.customerEmail`
- **Issue**: Nested order property may not be passed: order.customerEmail
- **Impact**: May display empty if not included in runtime data
- **Fix**: Verify order object includes customerEmail when template is called

## MEDIUM Priority (2 issues)

### Confirmare Schimbare Email
- **Variable**: `newEmail`
- **Issue**: Unknown variable 'newEmail' - not in standard runtime variables
- **Impact**: May work if passed, but not documented
- **Fix**: Document this variable or use standard naming convention

### Confirmare Schimbare Email
- **Variable**: `oldEmail`
- **Issue**: Unknown variable 'oldEmail' - not in standard runtime variables
- **Impact**: May work if passed, but not documented
- **Fix**: Document this variable or use standard naming convention
