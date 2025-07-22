# Triage Command: /triage $ARGUMENTS

## Purpose
Initial assessment and categorization of issues in the Flare app. This command performs the first-level analysis to understand the problem scope and severity.

## Context Loading
@context/architecture-detailed.md
@context/features-detailed.md  
@context/ui-patterns-detailed.md
@context/debugging-detailed.md
@context/firebase-database-detailed.md

## Input Processing

I'll analyze the provided arguments to extract:
- **Error Message**: The exact error text or description
- **Location**: File, component, screen, or service where the error occurs
- **Context**: Additional details, platform, reproduction steps
- **Stack Trace**: If provided, the full error stack

## Triage Process

### 1. Error Classification
- [ ] Parse error type (Firebase, Navigation, UI, Camera, etc.)
- [ ] Identify error category (Permission, Network, Logic, State, etc.)
- [ ] Determine affected subsystem

### 2. Impact Assessment
- [ ] User-facing impact (crash, feature broken, visual glitch)
- [ ] System impact (data integrity, performance, security)
- [ ] Scope (single screen, feature-wide, app-wide)
- [ ] Severity (Critical, High, Medium, Low)

### 3. Initial Analysis
- [ ] Known issue check (reference debugging-detailed.md)
- [ ] Recent changes that might relate
- [ ] Platform-specific considerations
- [ ] Related components analysis

### 4. Reproduction Verification
- [ ] Document exact steps to reproduce
- [ ] Identify required conditions (auth state, data state, etc.)
- [ ] Note frequency (always, intermittent, rare)
- [ ] Platform/device specific factors

## Output Format

Generate: `ai/debug/triage-{timestamp}-{issue-summary}.md`

```markdown
# Triage Report: [Issue Summary]

## Issue Details
- **Error**: [Exact error message]
- **Location**: [File/Component/Screen]
- **Timestamp**: [When reported]
- **Platform**: [iOS/Android/Both]
- **Severity**: [Critical/High/Medium/Low]

## Classification
- **Category**: [Permission/Network/Logic/State/UI]
- **Subsystem**: [Firebase/Navigation/Camera/UI/Auth]
- **Impact**: [User-facing description]

## Initial Findings
[Quick analysis of potential causes]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual behavior]

## Affected Areas
- Primary: [Main affected component]
- Secondary: [Related components]

## Next Steps
- Investigation Focus: [Key areas to investigate]
- Immediate Mitigation: [Any quick fixes available]

## Session ID
`{unique-session-id}`
```

## Example Usage

```bash
# Basic error report
/triage "Permission denied" in "FlareChainService"

# Detailed error report
/triage error="TypeError: Cannot read property 'uid' of null" file="AuthContext.tsx" line=87 context="Happens after logout"

# With reproduction steps
/triage "Camera crashes on lens switch" screen="VisionCameraScreen" steps="1. Open camera 2. Tap 0.5x lens 3. App freezes" platform="iOS"
```

## Quick Reference

### Common Flare Issues to Check
1. **Firebase Permissions**: Check security rules, auth state
2. **Navigation State**: Check navigation params, deep linking
3. **Camera Permissions**: Platform-specific permission handling
4. **Image Upload**: Storage rules, file size, network state
5. **Real-time Updates**: Listener cleanup, subscription limits

### Severity Guidelines
- **Critical**: App crash, data loss, security breach
- **High**: Feature completely broken, frequent errors
- **Medium**: Feature partially working, workarounds exist  
- **Low**: Visual issues, minor inconvenience

## Notes
- Always capture the full error message
- Include any console warnings that appear before the error
- Note if error is consistent or intermittent
- Check if error is new or regression