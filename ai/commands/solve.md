# Solve Command: /solve {issue-id}

## Purpose
Design comprehensive solutions for issues identified and investigated in previous phases. This command evaluates multiple approaches and selects the optimal fix strategy for the Flare app.

## Context Loading
@context/architecture-detailed.md
@context/features-detailed.md
@context/ui-patterns-detailed.md
@ai/debug/triage-{issue-id}.md
@ai/debug/investigation-{issue-id}.md

## Solution Design Process

### 1. Investigation Review
- [ ] Load investigation findings
- [ ] Understand root cause
- [ ] Review affected systems
- [ ] Consider constraints

### 2. Solution Approaches

#### Approach A: Quick Fix
- **Description**: Minimal change to stop error
- **Pros**: Fast implementation, low risk
- **Cons**: May not address underlying issue
- **Implementation**: [Specific changes]
- **Time Estimate**: [Hours/days]

#### Approach B: Proper Refactor
- **Description**: Address root cause properly
- **Pros**: Long-term stability, better architecture
- **Cons**: More complex, higher risk
- **Implementation**: [Specific changes]
- **Time Estimate**: [Hours/days]

#### Approach C: Defensive Coding
- **Description**: Add error handling and validation
- **Pros**: Prevents similar issues, improves robustness
- **Cons**: May hide underlying problems
- **Implementation**: [Specific changes]
- **Time Estimate**: [Hours/days]

### 3. Impact Analysis

#### Code Changes Required
- Files to modify: [List files]
- New files needed: [If any]
- Dependencies affected: [Services, contexts]
- Breaking changes: [API/Interface changes]

#### Testing Requirements
- Unit tests needed: [Test scenarios]
- Integration tests: [Cross-component tests]
- Manual testing: [User scenarios]
- Platform testing: [iOS/Android specific]

#### Risk Assessment
- **High Risk**: [Major changes]
- **Medium Risk**: [Moderate changes]
- **Low Risk**: [Safe changes]
- **Rollback Plan**: [How to revert]

### 4. Solution Selection

## Output Format

Generate: `ai/debug/solution-{issue-id}.md`

```markdown
# Solution Design: [Issue Summary]

## Recommended Solution
**Selected Approach**: [A/B/C or combination]
**Reasoning**: [Why this approach]

## Implementation Plan

### Phase 1: Immediate Fix
**Goal**: Stop the error from occurring
**Changes**:
1. File: `app/path/to/file.ts`
   ```typescript
   // Before
   [current code]
   
   // After
   [proposed code]
   ```

### Phase 2: Proper Solution
**Goal**: Address root cause
**Changes**:
1. [Change description]
2. [Change description]

### Phase 3: Prevention
**Goal**: Prevent similar issues
**Changes**:
1. Add validation: [Where/what]
2. Improve error handling: [How]
3. Add monitoring: [What to track]

## Detailed Changes

### File: app/services/firebaseService.ts
```typescript
// Add error handling for permission denied
async function createFlareChain(chainData: FlareChain) {
  try {
    // Check auth state first
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create chains');
    }
    
    // Existing code...
  } catch (error) {
    if (error.code === 'permission-denied') {
      // Handle permission error specifically
      console.error('Firebase permission denied:', error);
      throw new Error('You do not have permission to create chains');
    }
    throw error;
  }
}
```

### File: app/screens/flare/FlareCreationScreen.tsx
```typescript
// Add user feedback for errors
const handleCreateChain = async () => {
  try {
    setLoading(true);
    await createFlareChain(chainData);
  } catch (error) {
    Alert.alert(
      'Error Creating Chain',
      error.message || 'Something went wrong',
      [{ text: 'OK' }]
    );
  } finally {
    setLoading(false);
  }
};
```

## Testing Strategy

### Unit Tests
```typescript
describe('FlareChainService', () => {
  it('should handle permission denied errors', async () => {
    // Mock Firebase to return permission error
    // Assert proper error handling
  });
});
```

### Manual Testing
1. Test as authenticated user
2. Test as unauthenticated user
3. Test with restricted permissions
4. Test on both iOS and Android

## Migration Guide
[If solution requires data migration or user action]

## Monitoring Plan
- Add error tracking for: [Specific errors]
- Monitor metrics: [Success rate, error frequency]
- Alert thresholds: [When to notify team]

## Alternative Solutions Considered

### Why Not Approach A?
[Reasoning for not choosing]

### Why Not Approach B?
[Reasoning for not choosing]

## Success Criteria
- [ ] Error no longer occurs
- [ ] Feature works as expected
- [ ] No performance regression
- [ ] Tests pass on all platforms
- [ ] No new errors introduced

## Implementation Checklist
- [ ] Code changes implemented
- [ ] Tests written and passing
- [ ] Error handling added
- [ ] Documentation updated
- [ ] Team notified of changes

## Follow-up Recommendations
1. [Long-term improvement 1]
2. [Architecture consideration]
3. [Technical debt to address]

## Session ID
`{session-id}` (continuing from investigation)
```

## Solution Patterns for Flare

### Firebase Permission Fixes
```typescript
// Pattern 1: Auth check wrapper
const requireAuth = (fn: Function) => {
  return async (...args: any[]) => {
    if (!auth.currentUser) {
      throw new Error('Authentication required');
    }
    return fn(...args);
  };
};

// Pattern 2: Permission error handler
const handleFirebaseError = (error: any) => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission for this action';
    case 'not-found':
      return 'The requested data was not found';
    default:
      return 'An unexpected error occurred';
  }
};
```

### Navigation Fixes
```typescript
// Pattern: Safe navigation with validation
const navigateWithValidation = (screen: string, params: any) => {
  if (!navigation.isFocused()) return;
  
  // Validate required params
  const requiredParams = screenRequirements[screen];
  const missingParams = requiredParams.filter(p => !params[p]);
  
  if (missingParams.length > 0) {
    console.error(`Missing params for ${screen}:`, missingParams);
    return;
  }
  
  navigation.navigate(screen, params);
};
```

### State Management Fixes
```typescript
// Pattern: Cleanup-aware state updates
const useSafeState = <T>(initial: T) => {
  const [state, setState] = useState(initial);
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);
  
  const setSafeState = (value: T) => {
    if (isMounted.current) {
      setState(value);
    }
  };
  
  return [state, setSafeState] as const;
};
```

## Decision Matrix

| Factor | Quick Fix | Refactor | Defensive |
|--------|-----------|----------|-----------|
| Time | 🟢 Fast | 🔴 Slow | 🟡 Medium |
| Risk | 🟡 Medium | 🔴 High | 🟢 Low |
| Longevity | 🔴 Temporary | 🟢 Permanent | 🟡 Good |
| Maintenance | 🔴 High | 🟢 Low | 🟡 Medium |