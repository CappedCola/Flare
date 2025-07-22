/**
 * ChangeDetector - Identifies differences between current code and documented examples
 * Implements sophisticated comparison algorithms to detect additions, modifications, and removals
 */
class ChangeDetector {
  constructor() {
    this.changeThreshold = 0.1; // 10% change threshold to avoid false positives
  }

  /**
   * Main change detection method
   * @param {Object} analysis - Current codebase analysis
   * @param {Object} currentDoc - Existing documentation
   * @param {string} docType - Type of document being analyzed
   * @returns {Object} Detected changes
   */
  async detectChanges(analysis, currentDoc, docType) {
    const changes = {
      added: [],
      modified: [],
      removed: [],
      unchanged: [],
      metadata: {
        docType,
        analysisTimestamp: new Date().toISOString(),
        totalChanges: 0
      }
    };

    try {
      // Route to specific change detection based on document type
      switch (docType) {
        case 'architecture':
          await this.detectArchitectureChanges(analysis, currentDoc, changes);
          break;
        case 'features':
          await this.detectFeaturesChanges(analysis, currentDoc, changes);
          break;
        case 'ui':
          await this.detectUIChanges(analysis, currentDoc, changes);
          break;
        case 'firebase':
          await this.detectFirebaseChanges(analysis, currentDoc, changes);
          break;
        case 'debug':
          await this.detectDebugChanges(analysis, currentDoc, changes);
          break;
        default:
          console.warn(`Unknown document type: ${docType}`);
      }

      // Calculate total changes
      changes.metadata.totalChanges = 
        changes.added.length + changes.modified.length + changes.removed.length;

      return changes;
    } catch (error) {
      console.error(`Error detecting changes for ${docType}:`, error);
      return changes;
    }
  }

  /**
   * Detect changes in architecture documentation
   */
  async detectArchitectureChanges(analysis, currentDoc, changes) {
    // Compare TypeScript interfaces
    if (analysis.typescript && analysis.typescript.interfaces) {
      const currentInterfaces = this.extractCurrentInterfaces(analysis.typescript.interfaces);
      const documentedInterfaces = this.extractDocumentedInterfaces(currentDoc.content);
      
      this.compareInterfaces(currentInterfaces, documentedInterfaces, changes);
    }

    // Compare service patterns
    if (analysis.services) {
      const currentServices = this.extractCurrentServices(analysis.services);
      const documentedServices = this.extractDocumentedServices(currentDoc.content);
      
      this.compareServices(currentServices, documentedServices, changes);
    }

    // Compare navigation structure
    if (analysis.components) {
      const currentNavigation = this.extractCurrentNavigation(analysis.components);
      const documentedNavigation = this.extractDocumentedNavigation(currentDoc.content);
      
      this.compareNavigation(currentNavigation, documentedNavigation, changes);
    }

    // Compare hooks
    if (analysis.hooks) {
      const currentHooks = this.extractCurrentHooks(analysis.hooks);
      const documentedHooks = this.extractDocumentedHooks(currentDoc.content);
      
      this.compareHooks(currentHooks, documentedHooks, changes);
    }
  }

  /**
   * Detect changes in features documentation
   */
  async detectFeaturesChanges(analysis, currentDoc, changes) {
    // Compare Firebase service functions
    if (analysis.services && analysis.firebase) {
      const currentFunctions = this.extractCurrentFirebaseFunctions(analysis.services, analysis.firebase);
      const documentedFunctions = this.extractDocumentedFirebaseFunctions(currentDoc.content);
      
      this.compareFunctions(currentFunctions, documentedFunctions, changes);
    }

    // Compare authentication flows
    if (analysis.services) {
      const currentAuthFlow = this.extractCurrentAuthFlow(analysis.services);
      const documentedAuthFlow = this.extractDocumentedAuthFlow(currentDoc.content);
      
      this.compareAuthFlow(currentAuthFlow, documentedAuthFlow, changes);
    }

    // Compare error handling patterns
    const currentErrorPatterns = this.extractCurrentErrorPatterns(analysis);
    const documentedErrorPatterns = this.extractDocumentedErrorPatterns(currentDoc.content);
    
    this.compareErrorPatterns(currentErrorPatterns, documentedErrorPatterns, changes);
  }

  /**
   * Detect changes in UI patterns documentation
   */
  async detectUIChanges(analysis, currentDoc, changes) {
    // Compare component patterns
    if (analysis.components) {
      const currentComponents = this.extractCurrentUIComponents(analysis.components);
      const documentedComponents = this.extractDocumentedUIComponents(currentDoc.content);
      
      this.compareUIComponents(currentComponents, documentedComponents, changes);
    }

    // Compare styling patterns
    const currentStyles = this.extractCurrentStyles(analysis);
    const documentedStyles = this.extractDocumentedStyles(currentDoc.content);
    
    this.compareStyles(currentStyles, documentedStyles, changes);

    // Compare theme usage
    const currentTheme = this.extractCurrentTheme(analysis);
    const documentedTheme = this.extractDocumentedTheme(currentDoc.content);
    
    this.compareTheme(currentTheme, documentedTheme, changes);
  }

  /**
   * Detect changes in Firebase documentation
   */
  async detectFirebaseChanges(analysis, currentDoc, changes) {
    if (!analysis.firebase) return;

    // Compare collection schemas
    const currentSchemas = this.extractCurrentSchemas(analysis.firebase);
    const documentedSchemas = this.extractDocumentedSchemas(currentDoc.content);
    
    this.compareSchemas(currentSchemas, documentedSchemas, changes);

    // Compare security rules
    const currentRules = this.extractCurrentSecurityRules(analysis.firebase);
    const documentedRules = this.extractDocumentedSecurityRules(currentDoc.content);
    
    this.compareSecurityRules(currentRules, documentedRules, changes);

    // Compare query patterns
    const currentQueries = this.extractCurrentQueries(analysis.firebase);
    const documentedQueries = this.extractDocumentedQueries(currentDoc.content);
    
    this.compareQueries(currentQueries, documentedQueries, changes);
  }

  /**
   * Detect changes in debugging documentation
   */
  async detectDebugChanges(analysis, currentDoc, changes) {
    // Compare error patterns
    const currentErrors = this.extractCurrentErrors(analysis);
    const documentedErrors = this.extractDocumentedErrors(currentDoc.content);
    
    this.compareErrors(currentErrors, documentedErrors, changes);

    // Compare logging patterns
    const currentLogging = this.extractCurrentLogging(analysis);
    const documentedLogging = this.extractDocumentedLogging(currentDoc.content);
    
    this.compareLogging(currentLogging, documentedLogging, changes);

    // Compare performance patterns
    const currentPerf = this.extractCurrentPerformance(analysis);
    const documentedPerf = this.extractDocumentedPerformance(currentDoc.content);
    
    this.comparePerformance(currentPerf, documentedPerf, changes);
  }

  /**
   * Compare TypeScript interfaces
   */
  compareInterfaces(current, documented, changes) {
    const currentMap = new Map(current.map(iface => [iface.name, iface]));
    const documentedMap = new Map(documented.map(iface => [iface.name, iface]));

    // Find added interfaces
    for (const [name, iface] of currentMap) {
      if (!documentedMap.has(name)) {
        changes.added.push({
          type: 'interface',
          name,
          data: iface,
          location: iface.filePath
        });
      }
    }

    // Find modified interfaces
    for (const [name, current] of currentMap) {
      const documented = documentedMap.get(name);
      if (documented && this.hasInterfaceChanged(current, documented)) {
        changes.modified.push({
          type: 'interface',
          name,
          data: current,
          previous: documented,
          location: current.filePath,
          changes: this.getInterfaceChanges(current, documented)
        });
      }
    }

    // Find removed interfaces
    for (const [name, documented] of documentedMap) {
      if (!currentMap.has(name)) {
        changes.removed.push({
          type: 'interface',
          name,
          data: documented
        });
      }
    }

    // Track unchanged interfaces
    for (const [name] of currentMap) {
      const documented = documentedMap.get(name);
      if (documented && !this.hasInterfaceChanged(currentMap.get(name), documented)) {
        changes.unchanged.push({
          type: 'interface',
          name
        });
      }
    }
  }

  /**
   * Check if interface has changed
   */
  hasInterfaceChanged(current, documented) {
    // Compare basic properties
    if (current.members.length !== documented.members.length) {
      return true;
    }

    // Compare member signatures
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

  /**
   * Get detailed interface changes
   */
  getInterfaceChanges(current, documented) {
    const changes = [];
    
    // Check for added/removed members
    const currentMembers = new Set(current.members.map(m => m.name));
    const documentedMembers = new Set(documented.members.map(m => m.name));
    
    for (const member of currentMembers) {
      if (!documentedMembers.has(member)) {
        changes.push(`Added member: ${member}`);
      }
    }
    
    for (const member of documentedMembers) {
      if (!currentMembers.has(member)) {
        changes.push(`Removed member: ${member}`);
      }
    }

    // Check for type changes
    for (const currentMember of current.members) {
      const documentedMember = documented.members.find(m => m.name === currentMember.name);
      if (documentedMember && currentMember.type !== documentedMember.type) {
        changes.push(`Changed ${currentMember.name}: ${documentedMember.type} → ${currentMember.type}`);
      }
    }

    return changes;
  }

  // Extraction methods for current code
  extractCurrentInterfaces(interfaces) {
    return interfaces.filter(iface => 
      iface.exported && 
      this.isRelevantInterface(iface.name)
    );
  }

  extractCurrentServices(services) {
    return services.filter(service => 
      this.isRelevantService(service.name)
    );
  }

  extractCurrentNavigation(components) {
    return components.filter(comp => 
      comp.filePath.includes('/navigation/') ||
      comp.name.toLowerCase().includes('navigator')
    );
  }

  extractCurrentHooks(hooks) {
    return hooks.filter(hook => 
      hook.name.startsWith('use') &&
      hook.exported
    );
  }

  extractCurrentFirebaseFunctions(services, firebase) {
    const functions = [];
    
    if (services) {
      for (const service of services) {
        if (service.functions) {
          functions.push(...service.functions.filter(f => 
            this.isFirebaseFunction(f.name)
          ));
        }
      }
    }
    
    return functions;
  }

  // Extraction methods for documented content
  extractDocumentedInterfaces(content) {
    const interfaces = [];
    const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1];
      const membersText = match[2];
      const members = this.parseInterfaceMembers(membersText);
      
      interfaces.push({
        name,
        members,
        raw: match[0]
      });
    }

    return interfaces;
  }

  extractDocumentedServices(content) {
    const services = [];
    const serviceRegex = /export\s+(?:const|function)\s+(\w+)/g;
    let match;

    while ((match = serviceRegex.exec(content)) !== null) {
      services.push({
        name: match[1],
        raw: match[0]
      });
    }

    return services;
  }

  // Helper methods
  parseInterfaceMembers(membersText) {
    const members = [];
    const memberLines = membersText.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));

    for (const line of memberLines) {
      const memberMatch = line.match(/(\w+)(\??):\s*([^;]+);?/);
      if (memberMatch) {
        members.push({
          name: memberMatch[1],
          optional: !!memberMatch[2],
          type: memberMatch[3].trim()
        });
      }
    }

    return members;
  }

  isRelevantInterface(name) {
    const relevantPatterns = [
      /^User$/,
      /^Post$/,
      /^FlareChain$/,
      /^ChainParticipant$/,
      /^ChainPhoto$/,
      /^Comment$/,
      /^FriendRequest$/,
      /Props$/,
      /ContextType$/,
      /Return$/
    ];

    return relevantPatterns.some(pattern => pattern.test(name));
  }

  isRelevantService(name) {
    const relevantPatterns = [
      /firebase/i,
      /auth/i,
      /chain/i,
      /upload/i,
      /subscribe/i,
      /create/i,
      /update/i,
      /delete/i
    ];

    return relevantPatterns.some(pattern => pattern.test(name));
  }

  isFirebaseFunction(name) {
    const firebasePatterns = [
      /firebase/i,
      /firestore/i,
      /auth/i,
      /storage/i,
      /subscribe/i,
      /create\w*(?:User|Post|Chain)/i,
      /update\w*(?:User|Post|Chain)/i,
      /delete\w*(?:User|Post|Chain)/i,
      /upload/i,
      /signIn/i,
      /signUp/i,
      /signOut/i
    ];

    return firebasePatterns.some(pattern => pattern.test(name));
  }

  // Placeholder methods for other comparisons (to be implemented)
  compareFunctions() { /* Implementation for function comparison */ }
  compareAuthFlow() { /* Implementation for auth flow comparison */ }
  compareErrorPatterns() { /* Implementation for error pattern comparison */ }
  compareUIComponents() { /* Implementation for UI component comparison */ }
  compareStyles() { /* Implementation for style comparison */ }
  compareTheme() { /* Implementation for theme comparison */ }
  compareSchemas() { /* Implementation for schema comparison */ }
  compareSecurityRules() { /* Implementation for security rules comparison */ }
  compareQueries() { /* Implementation for query comparison */ }
  compareErrors() { /* Implementation for error comparison */ }
  compareLogging() { /* Implementation for logging comparison */ }
  comparePerformance() { /* Implementation for performance comparison */ }

  // Placeholder extraction methods (to be implemented as needed)
  extractCurrentAuthFlow() { return []; }
  extractCurrentErrorPatterns() { return []; }
  extractCurrentUIComponents() { return []; }
  extractCurrentStyles() { return []; }
  extractCurrentTheme() { return []; }
  extractCurrentSchemas() { return []; }
  extractCurrentSecurityRules() { return []; }
  extractCurrentQueries() { return []; }
  extractCurrentErrors() { return []; }
  extractCurrentLogging() { return []; }
  extractCurrentPerformance() { return []; }

  extractDocumentedFirebaseFunctions() { return []; }
  extractDocumentedAuthFlow() { return []; }
  extractDocumentedErrorPatterns() { return []; }
  extractDocumentedUIComponents() { return []; }
  extractDocumentedStyles() { return []; }
  extractDocumentedTheme() { return []; }
  extractDocumentedSchemas() { return []; }
  extractDocumentedSecurityRules() { return []; }
  extractDocumentedQueries() { return []; }
  extractDocumentedErrors() { return []; }
  extractDocumentedLogging() { return []; }
  extractDocumentedPerformance() { return []; }
}

module.exports = { ChangeDetector };