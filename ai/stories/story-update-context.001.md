# User Story: /update-context Slash Command Implementation

## Story Information
- **Epic ID**: update-context
- **Story ID**: 001
- **Status**: Draft
- **Priority**: High
- **Complexity**: High
- **Estimated Dev Time**: 2-3 weeks

## User Story
**As a** developer working on the Flare React Native app  
**I want to** execute a `/update-context` slash command  
**So that** all 5 context documentation files are automatically synchronized with the current codebase implementation without manual intervention

## Problem Statement
The Flare app's documentation context files (`architecture-detailed.md`, `features-detailed.md`, `ui-patterns-detailed.md`, `firebase-database-detailed.md`, `debugging-detailed.md`) contain extensive code examples and implementation details that become outdated as the codebase evolves. Manually updating these files is time-consuming and error-prone, leading to documentation drift.

## Acceptance Criteria

### Primary Functionality
- [ ] **AC1.1**: Command executes successfully from project root directory
- [ ] **AC1.2**: Scans entire `/app/` directory tree recursively for TypeScript/JavaScript files
- [ ] **AC1.3**: Processes Firebase configuration files (`firebase.json`, `firestore.rules`)
- [ ] **AC1.4**: Updates all 5 context files in a single execution
- [ ] **AC1.5**: Completes execution within 30 seconds for current codebase size
- [ ] **AC1.6**: Provides detailed summary of changes made

### Code Analysis Requirements
- [ ] **AC2.1**: Extracts TypeScript interfaces and type definitions from `/app/types/`
- [ ] **AC2.2**: Analyzes service layer patterns from `/app/services/firebaseService.ts`, `/app/services/flareChainService.ts`
- [ ] **AC2.3**: Maps navigation structure from `/app/navigation/RootNavigator.tsx`, `/app/navigation/BottomTabs.tsx`
- [ ] **AC2.4**: Identifies context providers from `/app/context/AuthContext.tsx`, `/app/context/NavigationContext.tsx`
- [ ] **AC2.5**: Documents hook implementations from `/app/hooks/useFlareChains.ts`, `/app/hooks/useChainTimer.ts`
- [ ] **AC2.6**: Captures component architecture from `/app/screens/` and `/app/components/`
- [ ] **AC2.7**: Extracts Firebase integration patterns and real-time subscription implementations
- [ ] **AC2.8**: Identifies error handling patterns with `withFirebaseRetry` and `handleFirebaseError`

### Change Detection
- [ ] **AC3.1**: Compares current code against existing documentation examples
- [ ] **AC3.2**: Identifies new components, services, hooks, and screens
- [ ] **AC3.3**: Detects modified function signatures and interfaces
- [ ] **AC3.4**: Finds removed or deprecated code patterns
- [ ] **AC3.5**: Reports unchanged sections to avoid unnecessary updates
- [ ] **AC3.6**: Provides file-by-file change summary

### Documentation Preservation
- [ ] **AC4.1**: Preserves existing markdown structure and headings
- [ ] **AC4.2**: Maintains manual content and explanatory text
- [ ] **AC4.3**: Updates only code examples and implementation details
- [ ] **AC4.4**: Keeps cross-references and internal links intact
- [ ] **AC4.5**: Maintains consistent code formatting and syntax highlighting
- [ ] **AC4.6**: Avoids overwriting recent manual edits

## Technical Implementation

### Main Script Structure (`/scripts/update-context.js`)
```javascript
#!/usr/bin/env node

const { TypeScriptAnalyzer } = require('./analyzers/typescript-analyzer');
const { ComponentAnalyzer } = require('./analyzers/component-analyzer');
const { ServiceAnalyzer } = require('./analyzers/service-analyzer');
const { FirebaseAnalyzer } = require('./analyzers/firebase-analyzer');
const { ArchitectureUpdater } = require('./updaters/architecture-updater');
const { FeaturesUpdater } = require('./updaters/features-updater');
const { UIUpdater } = require('./updaters/ui-updater');
const { FirebaseUpdater } = require('./updaters/firebase-updater');
const { DebugUpdater } = require('./updaters/debug-updater');

class UpdateContextOrchestrator {
  constructor() {
    this.analyzers = {
      typescript: new TypeScriptAnalyzer(),
      component: new ComponentAnalyzer(),
      service: new ServiceAnalyzer(),
      firebase: new FirebaseAnalyzer()
    };
    
    this.updaters = {
      architecture: new ArchitectureUpdater(),
      features: new FeaturesUpdater(),
      ui: new UIUpdater(),
      firebase: new FirebaseUpdater(),
      debug: new DebugUpdater()
    };
  }

  async execute() {
    console.log('🔄 Starting /update-context command...');
    
    // Phase 1: Analyze codebase
    const analysis = await this.analyzeCodebase();
    
    // Phase 2: Load current documentation
    const currentDocs = await this.loadContextFiles();
    
    // Phase 3: Detect changes
    const changes = await this.detectChanges(analysis, currentDocs);
    
    // Phase 4: Generate updates
    const updatedDocs = await this.generateUpdates(changes);
    
    // Phase 5: Write updated files
    await this.writeUpdatedContextFiles(updatedDocs);
    
    // Phase 6: Generate summary
    return this.generateSummaryReport(changes);
  }
}

// CLI entry point
if (require.main === module) {
  const orchestrator = new UpdateContextOrchestrator();
  orchestrator.execute()
    .then(summary => {
      console.log('✅ Update completed successfully');
      console.log(summary);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Update failed:', error);
      process.exit(1);
    });
}
```

### Key Analyzer Implementations

#### TypeScript Analyzer (`/scripts/analyzers/typescript-analyzer.js`)
```javascript
const ts = require('typescript');
const path = require('path');
const fs = require('fs');

class TypeScriptAnalyzer {
  constructor() {
    this.program = null;
    this.typeChecker = null;
  }

  async analyze(files) {
    // Create TypeScript program
    const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');

    this.program = ts.createProgram(files, compilerOptions.options);
    this.typeChecker = this.program.getTypeChecker();

    const analysis = {
      interfaces: [],
      types: [],
      enums: [],
      functions: [],
      classes: []
    };

    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.fileName.includes('/app/')) {
        this.analyzeSourceFile(sourceFile, analysis);
      }
    }

    return analysis;
  }

  analyzeSourceFile(sourceFile, analysis) {
    const visit = (node) => {
      if (ts.isInterfaceDeclaration(node)) {
        analysis.interfaces.push(this.extractInterface(node, sourceFile));
      } else if (ts.isTypeAliasDeclaration(node)) {
        analysis.types.push(this.extractType(node, sourceFile));
      } else if (ts.isEnumDeclaration(node)) {
        analysis.enums.push(this.extractEnum(node, sourceFile));
      } else if (ts.isFunctionDeclaration(node)) {
        analysis.functions.push(this.extractFunction(node, sourceFile));
      } else if (ts.isClassDeclaration(node)) {
        analysis.classes.push(this.extractClass(node, sourceFile));
      }
      
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
  }

  extractInterface(node, sourceFile) {
    return {
      name: node.name.text,
      filePath: sourceFile.fileName,
      members: node.members.map(member => ({
        name: member.name?.text,
        type: this.typeChecker.typeToString(this.typeChecker.getTypeAtLocation(member)),
        optional: !!member.questionToken,
        comments: this.getComments(member)
      })),
      comments: this.getComments(node),
      exported: this.isExported(node)
    };
  }
}
```

#### Component Analyzer (`/scripts/analyzers/component-analyzer.js`)
```javascript
class ComponentAnalyzer {
  async analyzeComponents(files) {
    const components = [];
    
    for (const file of files) {
      if (this.isComponentFile(file)) {
        const component = await this.analyzeComponent(file);
        if (component) {
          components.push(component);
        }
      }
    }
    
    return components;
  }

  isComponentFile(filePath) {
    return (filePath.includes('/screens/') || filePath.includes('/components/')) &&
           (filePath.endsWith('.tsx') || filePath.endsWith('.ts'));
  }

  async analyzeComponent(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    return {
      name: this.extractComponentName(filePath),
      filePath,
      props: this.extractProps(content),
      hooks: this.extractHooks(content),
      dependencies: this.extractDependencies(content),
      stateManagement: this.extractStateManagement(content),
      navigation: this.extractNavigation(content),
      firebaseIntegration: this.extractFirebaseIntegration(content)
    };
  }

  extractProps(content) {
    const propsRegex = /interface\s+(\w+Props)\s*\{([^}]+)\}/g;
    const props = [];
    let match;
    
    while ((match = propsRegex.exec(content)) !== null) {
      props.push({
        interfaceName: match[1],
        definition: match[2].trim()
      });
    }
    
    return props;
  }
}
```

### Structure-Preserving Updater System

#### Architecture Updater (`/scripts/updaters/architecture-updater.js`)
```javascript
const { MarkdownParser } = require('../utils/markdown-parser');

class ArchitectureUpdater {
  constructor() {
    this.parser = new MarkdownParser();
  }

  async updateArchitectureDoc(analysis, existingContent) {
    const sections = this.parser.parseSections(existingContent);
    
    // Update specific sections while preserving structure
    this.updateTypeDefinitions(sections, analysis.typescript.interfaces);
    this.updateServicePatterns(sections, analysis.services);
    this.updateNavigationStructure(sections, analysis.navigation);
    this.updateContextProviders(sections, analysis.contexts);
    this.updateHookImplementations(sections, analysis.hooks);
    
    return this.parser.reassembleSections(sections);
  }

  updateTypeDefinitions(sections, interfaces) {
    const typesSection = this.findSection(sections, 'TypeScript Type System');
    if (!typesSection) return;

    // Find code blocks within the section
    const codeBlocks = this.parser.extractCodeBlocks(typesSection.content);
    
    for (const block of codeBlocks) {
      if (this.isTypeDefinitionBlock(block)) {
        // Update with current interface definitions
        const updatedCode = this.generateInterfaceCode(interfaces);
        this.replaceCodeBlock(typesSection, block, updatedCode);
      }
    }
  }

  generateInterfaceCode(interfaces) {
    return interfaces
      .filter(iface => iface.exported && this.isRelevantInterface(iface))
      .map(iface => this.formatInterface(iface))
      .join('\n\n');
  }

  formatInterface(iface) {
    const members = iface.members
      .map(member => `  ${member.name}${member.optional ? '?' : ''}: ${member.type};`)
      .join('\n');
    
    return `interface ${iface.name} {
${members}
}`;
  }
}
```

### Change Detection Engine

```javascript
class ChangeDetector {
  async detectChanges(currentAnalysis, existingDocs) {
    const changes = {
      added: [],
      modified: [],
      removed: [],
      unchanged: []
    };

    // Compare interfaces
    const currentInterfaces = new Map(currentAnalysis.typescript.interfaces.map(i => [i.name, i]));
    const documentedInterfaces = this.extractDocumentedInterfaces(existingDocs.architecture);

    for (const [name, current] of currentInterfaces) {
      const documented = documentedInterfaces.get(name);
      
      if (!documented) {
        changes.added.push({ type: 'interface', name, data: current });
      } else if (this.hasInterfaceChanged(current, documented)) {
        changes.modified.push({ type: 'interface', name, data: current, previous: documented });
      } else {
        changes.unchanged.push({ type: 'interface', name });
      }
    }

    // Detect removed interfaces
    for (const [name, documented] of documentedInterfaces) {
      if (!currentInterfaces.has(name)) {
        changes.removed.push({ type: 'interface', name, data: documented });
      }
    }

    return changes;
  }

  hasInterfaceChanged(current, documented) {
    // Compare member count
    if (current.members.length !== documented.members.length) {
      return true;
    }

    // Compare individual members
    for (let i = 0; i < current.members.length; i++) {
      const currentMember = current.members[i];
      const documentedMember = documented.members[i];
      
      if (currentMember.name !== documentedMember.name ||
          currentMember.type !== documentedMember.type ||
          currentMember.optional !== documentedMember.optional) {
        return true;
      }
    }

    return false;
  }
}
```

## Dependencies

### Node.js Packages Required
```json
{
  "devDependencies": {
    "typescript": "^5.8.3",
    "marked": "^4.3.0",
    "glob": "^8.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "chalk": "^4.1.2"
  }
}
```

### Existing Flare Codebase Dependencies
- Must run from project root directory
- Requires access to `/app/` directory structure
- Needs read access to existing context files in `/context/`
- Requires TypeScript configuration (`tsconfig.json`)
- Must have Firebase configuration files accessible

## Testing Strategy

### Unit Tests
- [ ] Test TypeScript AST parsing with sample interfaces
- [ ] Test markdown structure preservation
- [ ] Test change detection algorithms
- [ ] Test code block replacement logic

### Integration Tests
- [ ] Test full command execution on sample codebase
- [ ] Test with various file combinations
- [ ] Test error handling for malformed files
- [ ] Test performance with large codebases

### Manual Testing Checklist
- [ ] Run command on current Flare codebase
- [ ] Verify all 5 context files are updated
- [ ] Check that manual content is preserved
- [ ] Validate that code examples compile
- [ ] Ensure cross-references remain valid

## Performance Requirements
- **Execution Time**: Complete analysis and updates within 30 seconds
- **Memory Usage**: Stay under 512MB RAM during processing
- **File Processing**: Handle 200+ TypeScript files efficiently
- **Concurrent Operations**: Process files in parallel where possible

## Error Handling Strategy

### File System Errors
- Backup existing context files before modifications
- Rollback changes if critical errors occur
- Provide detailed error context for debugging

### Parsing Errors
- Log syntax errors but continue processing other files
- Skip malformed files with warning messages
- Provide recovery suggestions for common issues

### Analysis Errors
- Report unrecognized patterns with file locations
- Continue with partial analysis when possible
- Suggest manual review for complex edge cases

## Success Metrics
- [ ] **Accuracy**: >95% of code patterns correctly identified
- [ ] **Change Detection**: >98% of actual changes captured
- [ ] **False Positives**: <2% of unchanged content flagged as modified
- [ ] **Structure Preservation**: 100% of manual content preserved
- [ ] **Performance**: Execution completes within 30 seconds
- [ ] **Reliability**: Command succeeds on clean codebase 100% of the time

## Definition of Done
- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests covering main scenarios
- [ ] Performance benchmarks achieved
- [ ] Error handling thoroughly tested
- [ ] Code review completed
- [ ] Documentation updated (PRD/Architecture alignment)
- [ ] Manual testing completed on Flare codebase
- [ ] Command successfully updates all 5 context files
- [ ] Generated examples compile and run correctly

## Story Dependencies
- **Prerequisite**: PRD and Architecture documents completed ✅
- **Follows**: None (foundational implementation)
- **Blocks**: Future documentation automation features

## Notes
This story implements the core functionality defined in the PRD (`/home/bzarnitz91/flare-repo/Flare/ai/prd.md`) and technical architecture (`/home/bzarnitz91/flare-repo/Flare/ai/architecture.md`). The implementation focuses on the Flare-specific patterns identified in the existing context documentation, particularly Firebase integration, React Native patterns, and UI Kitten usage.

The story emphasizes structure preservation to maintain the high-quality manual documentation while ensuring code examples stay current with the rapidly evolving Flare codebase.