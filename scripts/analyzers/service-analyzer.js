const fs = require('fs').promises;
const path = require('path');

/**
 * ServiceAnalyzer - Analyzes service layer files
 * Extracts Firebase operations, API functions, and business logic patterns
 */
class ServiceAnalyzer {
  constructor() {
    this.firebasePatterns = {
      auth: /signIn|signUp|signOut|onAuthStateChanged|createUser|currentUser/g,
      firestore: /getDoc|setDoc|updateDoc|deleteDoc|addDoc|getDocs|onSnapshot|collection|doc|query|where|orderBy/g,
      storage: /uploadPhoto|getDownloadURL|putFile|deleteObject/g,
      functions: /httpsCallable|getFunctions/g
    };
  }

  /**
   * Analyze service files
   * @param {string[]} files - Service files to analyze
   * @returns {Object} Service analysis results
   */
  async analyze(files) {
    const services = [];
    const functions = [];
    const firebaseUsage = {
      auth: [],
      firestore: [],
      storage: [],
      functions: []
    };
    
    console.log(`    🔌 Analyzing ${files.length} service files...`);

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(process.cwd(), filePath);
        
        const serviceAnalysis = await this.analyzeService(content, filePath, relativePath);
        services.push(serviceAnalysis);
        
        // Aggregate functions and Firebase usage
        functions.push(...serviceAnalysis.functions);
        this.aggregateFirebaseUsage(serviceAnalysis.firebase, firebaseUsage);
        
      } catch (error) {
        console.warn(`    ⚠️  Error analyzing ${filePath}:`, error.message);
      }
    }

    console.log(`       - ${services.length} services analyzed`);
    console.log(`       - ${functions.length} functions extracted`);
    console.log(`       - ${firebaseUsage.auth.length} auth operations`);
    console.log(`       - ${firebaseUsage.firestore.length} firestore operations`);

    return {
      services,
      functions,
      firebaseUsage,
      patterns: this.extractPatterns(services),
      summary: {
        totalServices: services.length,
        totalFunctions: functions.length,
        mostUsedFirebaseService: this.getMostUsedFirebaseService(firebaseUsage)
      }
    };
  }

  /**
   * Analyze individual service file
   */
  async analyzeService(content, filePath, relativePath) {
    const serviceName = path.basename(filePath, path.extname(filePath));
    
    return {
      name: serviceName,
      filePath,
      relativePath,
      functions: this.extractFunctions(content),
      exports: this.extractExports(content),
      imports: this.extractImports(content),
      firebase: this.extractFirebaseOperations(content),
      errorHandling: this.extractErrorHandling(content),
      async: this.extractAsyncPatterns(content),
      types: this.extractTypeUsage(content)
    };
  }

  /**
   * Extract exported functions from service
   */
  extractFunctions(content) {
    const functions = [];
    
    // Arrow functions
    const arrowFunctionRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g;
    const arrowMatches = content.matchAll(arrowFunctionRegex);
    for (const match of arrowMatches) {
      functions.push({
        name: match[1],
        type: 'arrow',
        async: match[0].includes('async'),
        exported: true,
        parameters: this.extractParameters(match[0])
      });
    }
    
    // Function declarations
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
    const functionMatches = content.matchAll(functionRegex);
    for (const match of functionMatches) {
      functions.push({
        name: match[1],
        type: 'declaration',
        async: match[0].includes('async'),
        exported: true,
        parameters: this.extractParameters(match[0])
      });
    }
    
    // Method-style functions (const name = function)
    const methodRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\([^)]*\)/g;
    const methodMatches = content.matchAll(methodRegex);
    for (const match of methodMatches) {
      functions.push({
        name: match[1],
        type: 'method',
        async: match[0].includes('async'),
        exported: true,
        parameters: this.extractParameters(match[0])
      });
    }
    
    return functions;
  }

  /**
   * Extract function parameters
   */
  extractParameters(functionSignature) {
    const paramMatch = functionSignature.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1].trim()) return [];
    
    return paramMatch[1]
      .split(',')
      .map(param => param.trim())
      .filter(param => param)
      .map(param => {
        const [name, type] = param.split(':').map(s => s.trim());
        return {
          name: name.replace(/[{}]/g, ''), // Handle destructured params
          type: type || 'any',
          optional: param.includes('?'),
          destructured: name.includes('{') || name.includes('}')
        };
      });
  }

  /**
   * Extract imports for dependency analysis
   */
  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"](.*?)['"];/g;
    const matches = content.matchAll(importRegex);
    
    for (const match of matches) {
      const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : [];
      const defaultImport = match[2] || null;
      const source = match[3];
      
      imports.push({
        namedImports,
        defaultImport,
        source,
        isFirebase: source.includes('firebase'),
        isReactNative: source.includes('react-native'),
        isLocal: source.startsWith('.')
      });
    }
    
    return imports;
  }

  /**
   * Extract exports for API surface analysis
   */
  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+\{([^}]+)\}(?:\s+from\s+['"][^'"]+['"])?/g;
    const namedMatches = content.matchAll(namedExportRegex);
    for (const match of namedMatches) {
      const items = match[1].split(',').map(s => s.trim());
      exports.push({
        type: 'named',
        items,
        reexport: match[0].includes('from')
      });
    }
    
    // Individual exports (already handled in function extraction)
    const individualExports = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g) || [];
    for (const exportMatch of individualExports) {
      const name = exportMatch.match(/(\w+)$/)[1];
      exports.push({
        type: 'individual',
        name
      });
    }
    
    return exports;
  }

  /**
   * Extract Firebase operations
   */
  extractFirebaseOperations(content) {
    const operations = {
      auth: [],
      firestore: [],
      storage: [],
      functions: []
    };
    
    // Auth operations
    const authMatches = content.matchAll(this.firebasePatterns.auth);
    for (const match of authMatches) {
      operations.auth.push({
        operation: match[0],
        context: this.getOperationContext(content, match.index)
      });
    }
    
    // Firestore operations
    const firestoreMatches = content.matchAll(this.firebasePatterns.firestore);
    for (const match of firestoreMatches) {
      operations.firestore.push({
        operation: match[0],
        context: this.getOperationContext(content, match.index)
      });
    }
    
    // Storage operations
    const storageMatches = content.matchAll(this.firebasePatterns.storage);
    for (const match of storageMatches) {
      operations.storage.push({
        operation: match[0],
        context: this.getOperationContext(content, match.index)
      });
    }
    
    return operations;
  }

  /**
   * Get operation context (surrounding function name)
   */
  getOperationContext(content, index) {
    // Find the function that contains this operation
    const beforeMatch = content.substring(0, index);
    const functionMatch = beforeMatch.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|\s+(\w+)\s*[:=]).*$/);
    
    if (functionMatch) {
      return functionMatch[1] || functionMatch[2] || functionMatch[3];
    }
    
    return 'unknown';
  }

  /**
   * Extract error handling patterns
   */
  extractErrorHandling(content) {
    const errorHandling = {
      tryCatchBlocks: (content.match(/try\s*\{/g) || []).length,
      errorThrows: (content.match(/throw\s+(?:new\s+)?Error/g) || []).length,
      errorReturns: (content.match(/return\s+.*?error|reject\s*\(/g) || []).length,
      customErrorHandlers: []
    };
    
    // Look for custom error handlers
    const errorHandlerRegex = /(?:handle|process).*?Error|withRetry|withFirebaseRetry/g;
    const matches = content.matchAll(errorHandlerRegex);
    for (const match of matches) {
      errorHandling.customErrorHandlers.push(match[0]);
    }
    
    return errorHandling;
  }

  /**
   * Extract async patterns
   */
  extractAsyncPatterns(content) {
    return {
      asyncFunctions: (content.match(/async\s+function|const\s+\w+\s*=\s*async/g) || []).length,
      awaitUsage: (content.match(/await\s+/g) || []).length,
      promiseUsage: (content.match(/\.then\s*\(|\.catch\s*\(|new\s+Promise/g) || []).length,
      promiseAllUsage: (content.match(/Promise\.all/g) || []).length
    };
  }

  /**
   * Extract TypeScript type usage
   */
  extractTypeUsage(content) {
    const types = {
      interfaces: [],
      typeAliases: [],
      generics: []
    };
    
    // Find interface usage in function signatures
    const interfaceRegex = /:\s*(\w+(?:Props|Type|Data|Request|Response))/g;
    const interfaceMatches = content.matchAll(interfaceRegex);
    for (const match of interfaceMatches) {
      if (!types.interfaces.includes(match[1])) {
        types.interfaces.push(match[1]);
      }
    }
    
    // Find generic usage
    const genericRegex = /<([A-Z]\w*)>/g;
    const genericMatches = content.matchAll(genericRegex);
    for (const match of genericMatches) {
      if (!types.generics.includes(match[1])) {
        types.generics.push(match[1]);
      }
    }
    
    return types;
  }

  /**
   * Aggregate Firebase usage across services
   */
  aggregateFirebaseUsage(serviceFirebase, globalUsage) {
    for (const [category, operations] of Object.entries(serviceFirebase)) {
      globalUsage[category].push(...operations);
    }
  }

  /**
   * Extract common patterns across services
   */
  extractPatterns(services) {
    const patterns = {
      authenticationFlow: this.findAuthenticationFlow(services),
      crudOperations: this.findCrudOperations(services),
      subscriptionPatterns: this.findSubscriptionPatterns(services),
      errorHandlingPatterns: this.findErrorHandlingPatterns(services)
    };
    
    return patterns;
  }

  /**
   * Find authentication flow patterns
   */
  findAuthenticationFlow(services) {
    const authService = services.find(s => 
      s.name.toLowerCase().includes('auth') || 
      s.name.toLowerCase().includes('firebase')
    );
    
    if (!authService) return null;
    
    const authFunctions = authService.functions.filter(f => 
      f.name.includes('sign') || f.name.includes('auth')
    );
    
    return {
      service: authService.name,
      functions: authFunctions.map(f => f.name),
      hasSignIn: authFunctions.some(f => f.name.toLowerCase().includes('signin')),
      hasSignUp: authFunctions.some(f => f.name.toLowerCase().includes('signup')),
      hasSignOut: authFunctions.some(f => f.name.toLowerCase().includes('signout'))
    };
  }

  /**
   * Find CRUD operation patterns
   */
  findCrudOperations(services) {
    const crudPatterns = {
      create: [],
      read: [],
      update: [],
      delete: []
    };
    
    for (const service of services) {
      for (const func of service.functions) {
        const name = func.name.toLowerCase();
        if (name.includes('create') || name.includes('add')) {
          crudPatterns.create.push(`${service.name}.${func.name}`);
        } else if (name.includes('get') || name.includes('fetch') || name.includes('read')) {
          crudPatterns.read.push(`${service.name}.${func.name}`);
        } else if (name.includes('update') || name.includes('modify') || name.includes('edit')) {
          crudPatterns.update.push(`${service.name}.${func.name}`);
        } else if (name.includes('delete') || name.includes('remove')) {
          crudPatterns.delete.push(`${service.name}.${func.name}`);
        }
      }
    }
    
    return crudPatterns;
  }

  /**
   * Find subscription patterns
   */
  findSubscriptionPatterns(services) {
    const subscriptions = [];
    
    for (const service of services) {
      const subFunctions = service.functions.filter(f => 
        f.name.toLowerCase().includes('subscribe') || 
        f.name.toLowerCase().includes('listen')
      );
      
      subscriptions.push(...subFunctions.map(f => ({
        service: service.name,
        function: f.name,
        type: 'subscription'
      })));
    }
    
    return subscriptions;
  }

  /**
   * Find error handling patterns
   */
  findErrorHandlingPatterns(services) {
    const patterns = [];
    
    for (const service of services) {
      if (service.errorHandling.customErrorHandlers.length > 0) {
        patterns.push({
          service: service.name,
          handlers: service.errorHandling.customErrorHandlers,
          tryCatchCount: service.errorHandling.tryCatchBlocks
        });
      }
    }
    
    return patterns;
  }

  /**
   * Get most used Firebase service
   */
  getMostUsedFirebaseService(firebaseUsage) {
    const counts = {
      auth: firebaseUsage.auth.length,
      firestore: firebaseUsage.firestore.length,
      storage: firebaseUsage.storage.length,
      functions: firebaseUsage.functions.length
    };
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
}

module.exports = { ServiceAnalyzer };