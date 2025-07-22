# Investigate Command: /investigate {issue-id}

## Purpose
Deep dive into the root cause of issues identified in the triage phase. This command performs thorough code analysis and traces the problem through the Flare app architecture.

## Context Loading
@context/architecture-detailed.md
@context/features-detailed.md
@context/firebase-database-detailed.md
@context/debugging-detailed.md
@ai/debug/triage-{issue-id}.md

## Investigation Process

### 1. Triage Review
- [ ] Load and analyze triage report
- [ ] Identify investigation priorities
- [ ] Review affected subsystems
- [ ] Note reproduction steps

### 2. Code Path Analysis
- [ ] Trace execution flow from user action to error
- [ ] Identify all functions in call stack
- [ ] Check data flow and transformations
- [ ] Review state management involvement

### 3. Root Cause Analysis

#### Firebase Issues
- [ ] Security rules evaluation
- [ ] Authentication state at error time
- [ ] Query structure and indexes
- [ ] Real-time listener management
- [ ] Network connectivity handling

#### Navigation Issues
- [ ] Navigation state and params
- [ ] Screen lifecycle management
- [ ] Deep linking configuration
- [ ] Stack/tab coordination

#### Camera Issues
- [ ] Permission state verification
- [ ] Device capability checks
- [ ] Resource management
- [ ] Platform-specific implementation

#### State Management Issues
- [ ] Context provider hierarchy
- [ ] State update timing
- [ ] Async operation handling
- [ ] Component unmount cleanup

### 4. Environmental Factors
- [ ] Platform differences (iOS vs Android)
- [ ] Device-specific constraints
- [ ] Network conditions
- [ ] Firebase service status
- [ ] Third-party service dependencies

### 5. Related Code Review
- [ ] Recent commits affecting area
- [ ] Similar patterns in codebase
- [ ] Error handling adequacy
- [ ] Edge case coverage

## Output Format

Generate: `ai/debug/investigation-{issue-id}.md`

```markdown
# Investigation Report: [Issue Summary]

## Executive Summary
[Brief summary of findings and root cause]

## Detailed Analysis

### Error Flow Trace
1. User Action: [Initial trigger]
2. Function Call: [Component.method()]
   - Parameters: [What was passed]
   - State at call: [Relevant state]
3. [Continue trace to error point]

### Root Cause
**Primary Cause**: [Main reason for error]
**Contributing Factors**:
- [Factor 1]
- [Factor 2]

### Code Analysis

#### Problematic Code
```typescript
// File: path/to/file.ts
// Line: XX
[Relevant code snippet]
```

#### Issue Explanation
[Why this code causes the problem]

### Environmental Factors
- Platform Impact: [iOS/Android specific]
- Timing Issues: [Race conditions, async problems]
- Data Dependencies: [Required data state]

## Affected Systems

### Direct Impact
- [Primary component/service]
- [Data flow affected]

### Indirect Impact
- [Related features]
- [User flows disrupted]

## Similar Issues
[Reference any similar past issues from debugging-detailed.md]

## Technical Deep Dive

### Firebase Specific (if applicable)
- Collection/Document Path: [Exact path]
- Security Rules: [Relevant rules]
- Query Structure: [Query details]

### State Management (if applicable)
- Context: [Which context]
- State Shape: [Expected vs actual]
- Update Pattern: [How state changes]

## Recommendations for Solution Phase
1. [Primary fix approach]
2. [Alternative approaches]
3. [Preventive measures]

## Test Scenarios
- [Scenario 1: Normal flow]
- [Scenario 2: Edge case]
- [Scenario 3: Error condition]

## Session ID
`{session-id}` (continuing from triage)
```

## Investigation Techniques

### Firebase Debugging
```typescript
// Check auth state
const user = auth.currentUser;
console.log('Auth state:', user?.uid);

// Verify permissions
const testDoc = await firestore.collection('flareChains').doc('test').get();
console.log('Read permission:', !testDoc.exists);
```

### Navigation Debugging
```typescript
// Log navigation state
navigation.addListener('state', (e) => {
  console.log('Nav state:', e.data.state);
});
```

### Camera Debugging
```typescript
// Check camera permissions
const status = await Camera.requestCameraPermissionsAsync();
console.log('Camera permission:', status);
```

## Common Root Causes in Flare

1. **Async State Updates After Unmount**
   - Missing cleanup in useEffect
   - Unhandled promises

2. **Firebase Permission Denials**
   - Auth state not propagated
   - Security rules too restrictive

3. **Navigation Parameter Issues**
   - Missing required params
   - Type mismatches

4. **Camera Resource Conflicts**
   - Multiple camera instances
   - Improper cleanup

## Investigation Checklist
- [ ] Error reproduced locally
- [ ] Stack trace analyzed
- [ ] Code path traced
- [ ] State verified at each step
- [ ] Platform differences checked
- [ ] Related issues reviewed
- [ ] Root cause identified
- [ ] Solution approaches considered