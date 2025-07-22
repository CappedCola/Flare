# Fix Command: /fix {issue-id}

## Purpose
Implement the solution designed in the solve phase. This command executes the actual code changes, validates the fix, and documents the implementation for the Flare app.

## Context Loading
@context/architecture-detailed.md
@context/features-detailed.md
@ai/debug/triage-{issue-id}.md
@ai/debug/investigation-{issue-id}.md
@ai/debug/solution-{issue-id}.md

## Implementation Process

### 1. Pre-Implementation Checklist
- [ ] Review solution design
- [ ] Confirm file locations
- [ ] Check current code state
- [ ] Verify no conflicting changes
- [ ] Set up test environment

### 2. Code Implementation

#### Step-by-Step Execution
1. **Backup Current State**
   - Note current functionality
   - Save problematic code snippets
   - Document current behavior

2. **Apply Primary Fix**
   - Implement solution from design
   - Follow Flare coding standards
   - Maintain consistency with existing patterns

3. **Add Error Handling**
   - Implement defensive coding
   - Add user-friendly error messages
   - Include logging for debugging

4. **Update Related Code**
   - Modify dependent components
   - Update type definitions
   - Adjust imports/exports

### 3. Validation Process

#### Code Quality Checks
- [ ] TypeScript compilation passes
- [ ] No ESLint errors
- [ ] Imports are correct
- [ ] Types are properly defined

#### Functional Testing
- [ ] Original error resolved
- [ ] Feature works as expected
- [ ] No regression in related features
- [ ] Edge cases handled

#### Platform Testing
- [ ] iOS: Tested and working
- [ ] Android: Tested and working
- [ ] Web (if applicable): Tested

### 4. Documentation Updates

## Output Format

Generate: `ai/debug/fix-{issue-id}.md`

```markdown
# Fix Implementation: [Issue Summary]

## Implementation Summary
**Status**: ✅ Completed
**Files Modified**: [Count]
**Lines Changed**: [Added/Removed]
**Test Status**: [Pass/Fail]

## Code Changes

### File: app/services/firebaseService.ts
**Changes Made**: Added authentication check and error handling

```typescript
// Previous Code (Lines 234-245)
async function createFlareChain(chainData: FlareChain): Promise<string> {
  const chainRef = firestore.collection('flareChains').doc();
  await chainRef.set({
    ...chainData,
    createdAt: serverTimestamp(),
  });
  return chainRef.id;
}

// New Code (Lines 234-256)
async function createFlareChain(chainData: FlareChain): Promise<string> {
  // Added: Authentication check
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required to create Flare Chains');
  }

  try {
    const chainRef = firestore.collection('flareChains').doc();
    
    // Added: Include userId in chain data
    await chainRef.set({
      ...chainData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    
    return chainRef.id;
  } catch (error: any) {
    // Added: Specific error handling
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to create chains. Please try again later.');
    }
    throw error;
  }
}
```

### File: app/screens/flare/FlareCreationScreen.tsx
**Changes Made**: Added loading state and error handling UI

```typescript
// Added to component state
const [isCreating, setIsCreating] = useState(false);
const [error, setError] = useState<string | null>(null);

// Updated handleCreateChain function
const handleCreateChain = async () => {
  setError(null);
  setIsCreating(true);
  
  try {
    const chainId = await createFlareChain({
      prompt: selectedPrompt,
      participants: selectedFriends.map(f => f.id),
      firstPhoto: capturedPhoto,
    });
    
    // Navigate to chain view
    navigation.navigate('FlareChainView', { chainId });
  } catch (error: any) {
    setError(error.message || 'Failed to create chain. Please try again.');
    console.error('Chain creation error:', error);
  } finally {
    setIsCreating(false);
  }
};

// Added error display UI
{error && (
  <Card status='danger' style={styles.errorCard}>
    <Text category='s1'>{error}</Text>
  </Card>
)}
```

### File: app/types/flare.ts
**Changes Made**: Updated FlareChain interface

```typescript
// Added userId to FlareChain type
export interface FlareChain {
  id: string;
  prompt: Prompt;
  participants: string[];
  userId: string; // Added: Chain creator
  firstPhoto: string;
  photos: ChainPhoto[];
  status: 'active' | 'completed' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

## Test Results

### Unit Tests
```bash
✓ FlareChainService - handles unauthenticated user (23ms)
✓ FlareChainService - creates chain with auth (45ms)
✓ FlareChainService - handles permission denied (12ms)
```

### Manual Testing
- [x] Created chain as authenticated user - Success
- [x] Attempted creation without auth - Proper error shown
- [x] Tested on iOS device - Working
- [x] Tested on Android device - Working
- [x] Verified error messages are user-friendly

## Verification Steps

1. **Error Resolution**
   - Original error no longer occurs ✅
   - Proper error messages displayed ✅
   - No console errors ✅

2. **Feature Functionality**
   - Chain creation works ✅
   - Navigation after creation ✅
   - Photo upload successful ✅

3. **Edge Cases**
   - Network disconnection handled ✅
   - Auth state changes handled ✅
   - Rapid button taps prevented ✅

## Performance Impact
- No measurable performance regression
- Added checks are negligible (<1ms)
- Error handling improves UX

## Additional Improvements Made

1. **Loading States**
   - Added spinner during chain creation
   - Disabled button while processing
   - Clear visual feedback

2. **Error Recovery**
   - Users can retry after errors
   - Error messages are actionable
   - State properly reset on error

3. **Logging Enhanced**
   - Added debug logs for troubleshooting
   - Error context preserved
   - Analytics events added

## Follow-up Tasks

### Immediate
- [x] Deploy fix to development
- [ ] Monitor error rates
- [ ] Update documentation

### Future Improvements
1. Add retry logic for transient failures
2. Implement offline queue for chains
3. Add more granular permissions
4. Create error boundary component

## Rollback Plan
If issues arise, revert these commits:
- `abc123`: Fix Firebase permission error in chain creation
- `def456`: Add error handling UI to FlareCreationScreen

## Lessons Learned
1. Always check auth state before Firebase operations
2. User-friendly error messages improve UX significantly
3. Loading states prevent user confusion and double-taps

## Session Complete
**Session ID**: `{session-id}`
**Total Time**: Triage (15m) → Investigate (30m) → Solve (20m) → Fix (45m)
**Result**: ✅ Issue Resolved
```

## Post-Fix Checklist

### Code Review
- [ ] Self-review completed
- [ ] Follows project conventions
- [ ] No commented debug code
- [ ] Types properly defined

### Testing Complete
- [ ] Error scenario tested
- [ ] Happy path tested  
- [ ] Edge cases tested
- [ ] Cross-platform tested

### Documentation
- [ ] Code comments added
- [ ] README updated if needed
- [ ] Changelog entry added
- [ ] Team notified

### Deployment
- [ ] Changes committed
- [ ] PR created/updated
- [ ] CI/CD passing
- [ ] Ready for review

## Common Fix Patterns

### Safe Async Operations
```typescript
// Pattern: Cleanup-aware async operations
useEffect(() => {
  let isMounted = true;
  
  const loadData = async () => {
    try {
      const data = await fetchSomeData();
      if (isMounted) {
        setData(data);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };
  
  loadData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

### Firebase Error Boundaries
```typescript
// Pattern: Consistent Firebase error handling
export const handleFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(errorMessage, error);
    
    // User-friendly error messages
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission for this action');
    }
    if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again.');
    }
    
    throw new Error(errorMessage);
  }
};
```

## Success Metrics
- Error occurrence: 0 (down from X/day)
- User complaints: Resolved
- Feature usage: Normal
- Performance: No regression