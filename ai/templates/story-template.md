# Story Template

Save this as: `ai/templates/story-template.md`

---

# Story: {Epic}.{Story} - {Story Title}

## Status
**Current Status**: Draft | In Progress | Complete

## User Story
**As a** [type of user]  
**I want** [goal/desire]  
**So that** [benefit/value]

## Epic Context
**Epic**: {Epic Name}  
**Story ID**: {Epic}.{Story}  
**Priority**: High | Medium | Low  
**Estimated Effort**: {Story Points/Hours}

## Acceptance Criteria
- [ ] **AC1**: {Specific, testable requirement}
- [ ] **AC2**: {Specific, testable requirement}
- [ ] **AC3**: {Specific, testable requirement}
- [ ] **AC4**: {Specific, testable requirement}

## Technical Implementation

### Components to Create/Modify
- `app/components/{ComponentName}.tsx` - {Purpose}
- `app/screens/{ScreenName}.tsx` - {Purpose}
- `app/services/{serviceName}.ts` - {Purpose}

### Database Changes
- **New Collections**: {Collection name and schema}
- **Modified Collections**: {Existing collection changes}
- **Security Rules**: {Firestore rule updates needed}

### API/Service Changes
- **New Functions**: 
  - `{functionName}()` - {Purpose and parameters}
- **Modified Functions**:
  - `{existingFunction}()` - {Changes needed}

### Navigation Changes
- **New Routes**: {Screen names and navigation paths}
- **Modified Routes**: {Existing route changes}

### State Management
- **New Hooks**: `use{HookName}` - {Purpose}
- **Context Updates**: {Context provider changes}
- **Real-time Subscriptions**: {Firebase listeners needed}

## UI/UX Requirements

### Design Specifications
- **Colors**: Use newflaretheme.ts color scheme
- **Components**: UI Kitten components with established patterns
- **Layout**: {Responsive design requirements}
- **Animations**: {Animation requirements if any}

### Accessibility
- **Screen Reader**: {Accessibility labels and roles}
- **Navigation**: {Keyboard navigation requirements}
- **Color Contrast**: {Contrast requirements}

## Testing Requirements

### Unit Tests
- [ ] Component rendering tests
- [ ] Service function tests
- [ ] Hook behavior tests
- [ ] Error handling tests

### Integration Tests
- [ ] Navigation flow tests
- [ ] Firebase integration tests
- [ ] Real-time subscription tests

### Manual Testing
- [ ] iOS device testing
- [ ] Android device testing
- [ ] Multiple screen sizes
- [ ] Edge cases and error scenarios

## Dependencies

### Technical Dependencies
- **Libraries**: {New dependencies if any}
- **Services**: {External services required}
- **Permissions**: {Device permissions needed}

### Story Dependencies
- **Blocked By**: {Stories that must complete first}
- **Blocks**: {Stories that depend on this one}

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code follows existing Flare patterns
- [ ] TypeScript strict mode compliance
- [ ] UI Kitten + newflaretheme.ts consistency
- [ ] Firebase integration follows established patterns
- [ ] Error handling implemented
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Committed to Git with descriptive message

## Implementation Notes

### Code Patterns to Follow
- Use existing service patterns from firebaseService.ts
- Follow component composition from existing screens
- Use established error handling with withFirebaseRetry
- Implement real-time subscriptions with onSnapshot
- Follow TypeScript interface definitions

### Files to Reference
- `app/services/firebaseService.ts` - For Firebase patterns
- `app/context/AuthContext.tsx` - For context patterns
- `app/screens/FeedScreen.tsx` - For screen layout patterns
- `app/theme/newflaretheme.ts` - For styling consistency

---

**Last Updated**: {Date}  
**Assigned Developer**: {Name}  
**Estimated Completion**: {Date}