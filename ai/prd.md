# Product Requirements Document: /update-context Slash Command

## Executive Summary

The `/update-context` slash command automates the maintenance of Flare's documentation by intelligently scanning the React Native codebase and updating all 5 context files with current implementation details. This ensures documentation stays synchronized with actual code, reducing development friction and maintaining code quality standards.

**Target Users:** Development team working on Flare app  
**Primary Goal:** Automated documentation synchronization with zero manual intervention  
**Success Metric:** 100% accuracy in detecting and updating changed implementations  

---

## 1. User Stories & Acceptance Criteria

### Epic 1: Core Command Implementation

#### User Story 1.1: Execute Update Command
**As a** developer working on Flare  
**I want to** run `/update-context` command  
**So that** all context files are automatically updated with latest codebase changes

**Acceptance Criteria:**
- ✅ Command executes successfully from project root directory
- ✅ Scans entire `/app/` directory tree recursively  
- ✅ Identifies all TypeScript/JavaScript files (.ts, .tsx, .js, .jsx)
- ✅ Processes Firebase configuration files (firebase.json, firestore.rules)
- ✅ Updates all 5 context files in single execution
- ✅ Provides detailed summary of changes made
- ✅ Completes execution within 30 seconds for current codebase size

#### User Story 1.2: Change Detection & Analysis
**As a** developer  
**I want to** see what has changed since last documentation update  
**So that** I can review and validate the automated changes

**Acceptance Criteria:**
- ✅ Compares current code against existing documentation  
- ✅ Identifies new components, services, hooks, and screens
- ✅ Detects modified function signatures and interfaces
- ✅ Finds removed or deprecated code patterns
- ✅ Reports unchanged sections to avoid unnecessary updates
- ✅ Provides file-by-file change summary

### Epic 2: Intelligent Code Analysis

#### User Story 2.1: Architecture Pattern Extraction  
**As a** system  
**I need to** analyze code patterns and extract architectural information  
**So that** architecture-detailed.md stays current with implementation

**Acceptance Criteria:**
- ✅ Extracts TypeScript interfaces and type definitions from `/types/`
- ✅ Analyzes service layer patterns from `/services/`
- ✅ Maps navigation structure from `/navigation/`
- ✅ Identifies context providers from `/context/`
- ✅ Documents hook implementations from `/hooks/`
- ✅ Captures component architecture from `/components/` and `/screens/`

#### User Story 2.2: Feature Implementation Detection
**As a** system  
**I need to** understand current feature implementations  
**So that** features-detailed.md reflects actual functionality

**Acceptance Criteria:**
- ✅ Maps Firebase service functions with signatures
- ✅ Identifies authentication flows and patterns
- ✅ Documents real-time subscription implementations
- ✅ Extracts error handling patterns
- ✅ Analyzes navigation flows between screens
- ✅ Captures state management patterns

### Epic 3: Documentation Structure Preservation

#### User Story 3.1: Maintain Documentation Format
**As a** developer reading documentation  
**I want to** have consistent formatting and structure  
**So that** I can quickly find the information I need

**Acceptance Criteria:**
- ✅ Preserves existing markdown structure and headings
- ✅ Maintains manual content and explanatory text
- ✅ Updates only code examples and implementation details
- ✅ Keeps cross-references and internal links intact
- ✅ Preserves table of contents and navigation
- ✅ Maintains consistent code formatting and syntax highlighting

#### User Story 3.2: Selective Content Updates
**As a** system  
**I need to** update only outdated information  
**So that** manual documentation improvements are preserved

**Acceptance Criteria:**
- ✅ Identifies code blocks that need updating
- ✅ Preserves manually written explanations and context
- ✅ Updates function signatures while keeping descriptions
- ✅ Replaces outdated import statements
- ✅ Maintains documentation style and voice
- ✅ Avoids overwriting recent manual edits

---

## 2. Technical Requirements

### 2.1 Core Script Architecture

**Main Script:** `/scripts/update-context.js`
```javascript
// High-level structure requirement
const updateContext = async () => {
  const codebaseAnalysis = await analyzeCodebase();
  const currentDocs = await readContextFiles();
  const changes = await detectChanges(codebaseAnalysis, currentDocs);
  const updatedDocs = await generateUpdates(changes);
  await writeUpdatedContextFiles(updatedDocs);
  return generateSummaryReport(changes);
};
```

### 2.2 File Analysis Requirements

**Supported File Types:**
- TypeScript: `.ts`, `.tsx` files
- JavaScript: `.js`, `.jsx` files  
- JSON Configuration: `firebase.json`, `package.json`
- Firebase Rules: `firestore.rules`, `storage.rules`

**Analysis Capabilities:**
- AST parsing for function signatures and interfaces
- Import/export dependency mapping
- Component prop extraction
- Service method identification
- Firebase integration pattern detection

### 2.3 Context File Specifications

**Target Files for Updates:**
1. `context/architecture-detailed.md` - Type definitions, service patterns, navigation structure
2. `context/features-detailed.md` - Implementation examples, database operations, real-time patterns
3. `context/ui-patterns-detailed.md` - Component examples, styling patterns, responsive design
4. `context/firebase-database-detailed.md` - Database schemas, security rules, queries
5. `context/debugging-detailed.md` - Error patterns, logging, troubleshooting guides

### 2.4 Performance Requirements

- **Execution Time:** Complete analysis and updates within 30 seconds
- **Memory Usage:** Stay under 512MB RAM during processing
- **File Size:** Handle projects up to 10,000 files efficiently
- **Concurrent Processing:** Analyze multiple files simultaneously where safe

### 2.5 Integration Requirements

**Slash Command Integration:**
- Must work as slash command in Claude Code environment
- Provide real-time progress feedback during execution
- Handle command-line arguments and options
- Support dry-run mode for preview without changes

---

## 3. Detailed Feature Specifications

### 3.1 Codebase Scanner Module

**Purpose:** Recursively scan `/app/` directory and extract structured code information

**Implementation Requirements:**
```javascript
// Scanner interface specification
const scanCodebase = async () => {
  return {
    types: extractTypeDefinitions(),
    services: extractServiceMethods(), 
    components: extractComponentProps(),
    hooks: extractHookSignatures(),
    navigation: extractRouteDefinitions(),
    firebase: extractFirebasePatterns()
  };
};
```

**Key Extraction Patterns:**
- TypeScript interface definitions with JSDoc comments
- React component prop interfaces and default props
- Custom hook return types and parameters
- Service function signatures with error handling
- Firebase collection schemas and queries
- Navigation parameter type definitions

### 3.2 Change Detection Engine

**Purpose:** Identify differences between current code and documented examples

**Detection Logic:**
- Function signature changes (parameters, return types)
- New or removed components and services  
- Modified Firebase rules and configurations
- Updated import paths and dependencies
- Changed prop interfaces and type definitions

**Comparison Algorithm:**
```javascript
const detectChanges = (current, documented) => {
  return {
    added: findNewImplementations(current, documented),
    modified: findChangedSignatures(current, documented), 
    removed: findDeprecatedCode(current, documented),
    unchanged: findStableCode(current, documented)
  };
};
```

### 3.3 Structure-Preserving Updater

**Purpose:** Update documentation while maintaining structure and manual content

**Update Strategy:**
- Parse markdown into structured sections
- Identify code blocks that need replacement
- Update only implementation details, preserve explanations
- Maintain heading hierarchy and cross-references
- Preserve manually written context and examples

**Content Replacement Rules:**
```javascript
const updateRules = {
  codeBlocks: 'REPLACE_IF_DIFFERENT',
  explanations: 'PRESERVE_MANUAL_CONTENT', 
  headings: 'PRESERVE_STRUCTURE',
  crossRefs: 'UPDATE_LINKS_IF_MOVED'
};
```

---

## 4. Implementation Architecture

### 4.1 File Structure

```
scripts/
├── update-context.js           # Main command entry point
├── analyzers/
│   ├── typescript-analyzer.js  # TypeScript AST parsing
│   ├── component-analyzer.js   # React component extraction
│   ├── service-analyzer.js     # Service layer analysis
│   ├── hook-analyzer.js        # Custom hook analysis
│   └── firebase-analyzer.js    # Firebase pattern detection
├── updaters/
│   ├── architecture-updater.js # Updates architecture-detailed.md
│   ├── features-updater.js     # Updates features-detailed.md  
│   ├── ui-updater.js          # Updates ui-patterns-detailed.md
│   ├── firebase-updater.js    # Updates firebase-database-detailed.md
│   └── debug-updater.js       # Updates debugging-detailed.md
└── utils/
    ├── markdown-parser.js      # Markdown structure parsing
    ├── ast-utils.js           # AST manipulation utilities
    └── file-utils.js          # File system operations
```

### 4.2 Analysis Pipeline

**Phase 1: Discovery**
1. Scan `/app/` directory recursively
2. Identify all relevant source files  
3. Build dependency graph
4. Extract Firebase configurations

**Phase 2: Analysis**  
1. Parse TypeScript files into ASTs
2. Extract interfaces, types, and function signatures
3. Analyze React components for props and patterns
4. Map service layer implementations
5. Document hook signatures and return types

**Phase 3: Comparison**
1. Load existing context files
2. Parse documented code examples  
3. Compare with current implementations
4. Identify additions, modifications, deletions

**Phase 4: Update Generation**
1. Generate updated content for each context file
2. Preserve manual content and explanations
3. Update code examples and signatures
4. Maintain markdown structure and formatting

**Phase 5: Output**
1. Write updated context files
2. Generate change summary report
3. Provide validation feedback

### 4.3 Error Handling Strategy

**Parsing Errors:**
- Log syntax errors but continue processing
- Skip malformed files with warning
- Provide detailed error context for debugging

**File System Errors:**
- Handle permission issues gracefully
- Backup existing files before updates
- Rollback changes if critical errors occur

**Analysis Errors:**
- Report unrecognized patterns
- Continue with available information
- Suggest manual review for complex cases

---

## 5. Success Metrics & Validation

### 5.1 Accuracy Metrics

- **Pattern Recognition Rate:** >95% of code patterns correctly identified
- **Change Detection Accuracy:** >98% of actual changes captured  
- **False Positive Rate:** <2% of unchanged content flagged as modified
- **Structure Preservation:** 100% of manual content preserved correctly

### 5.2 Performance Metrics

- **Execution Time:** Complete analysis within 30 seconds
- **Memory Efficiency:** Peak memory usage under 512MB
- **File Processing Rate:** >100 files per second analysis speed
- **Incremental Processing:** Skip unchanged files for speed

### 5.3 Quality Metrics

- **Documentation Accuracy:** Generated examples must compile and run
- **Cross-Reference Integrity:** All internal links remain valid
- **Format Consistency:** Maintained markdown style and structure
- **Content Completeness:** No missing implementations in documentation

---

## 6. Risk Assessment & Mitigation

### 6.1 Technical Risks

**Risk: Complex TypeScript Pattern Recognition**  
*Likelihood:* Medium | *Impact:* High  
*Mitigation:* Implement fallback patterns, extensive testing on current codebase

**Risk: Documentation Structure Corruption**  
*Likelihood:* Low | *Impact:* High  
*Mitigation:* Backup existing files, atomic updates, rollback capability

**Risk: Performance Degradation on Large Codebases**  
*Likelihood:* Medium | *Impact:* Medium  
*Mitigation:* Implement file filtering, parallel processing, incremental updates

### 6.2 User Experience Risks

**Risk: Breaking Manual Documentation Updates**  
*Likelihood:* Medium | *Impact:* Medium  
*Mitigation:* Preserve manual content, clear update indicators, review mode

**Risk: Inconsistent Output Quality**  
*Likelihood:* Low | *Impact:* Medium  
*Mitigation:* Comprehensive test suite, validation checks, quality metrics

---

## 7. Timeline & Dependencies

### Phase 1: Foundation (Week 1)
- Core script structure and file scanning
- Basic TypeScript AST parsing
- Markdown structure preservation

### Phase 2: Analysis (Week 2)  
- Component and service analysis
- Firebase pattern detection
- Change detection algorithms

### Phase 3: Updates (Week 3)
- Context file updaters implementation
- Structure-preserving content replacement
- Cross-reference maintenance

### Phase 4: Integration (Week 4)
- Slash command integration
- Error handling and validation
- Performance optimization and testing

**Dependencies:**
- Node.js TypeScript compiler API
- Markdown parsing library (marked or similar)
- File system utilities and AST parsers
- Access to current Flare codebase for testing

---

## 8. Future Enhancements

### 8.1 Advanced Features
- **Incremental Updates:** Track file modification times for faster processing
- **Custom Pattern Recognition:** Learn project-specific patterns over time  
- **Multi-Project Support:** Handle multiple codebases with shared patterns
- **AI-Enhanced Documentation:** Generate explanations for complex patterns

### 8.2 Integration Opportunities
- **CI/CD Integration:** Automatically update docs on code changes
- **IDE Integration:** Real-time documentation updates during development
- **Version Control Integration:** Track documentation changes with commits

---

This PRD provides comprehensive requirements for implementing the `/update-context` slash command, ensuring it meets all technical and user experience needs while maintaining the high quality of Flare's documentation system.