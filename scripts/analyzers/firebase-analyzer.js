const fs = require('fs').promises;
const path = require('path');

/**
 * FirebaseAnalyzer - Analyzes Firebase configurations and patterns
 * Extracts Firestore rules, security patterns, and database schemas
 */
class FirebaseAnalyzer {
  async analyze(files) {
    const firebase = {
      config: null,
      rules: {
        firestore: null,
        storage: null
      },
      schemas: [],
      security: [],
      patterns: []
    };
    
    console.log(`    🔥 Analyzing Firebase configurations...`);
    
    for (const filePath of files) {
      try {
        const fileName = path.basename(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        if (fileName === 'firebase.json') {
          firebase.config = this.analyzeFirebaseConfig(content);
        } else if (fileName === 'firestore.rules') {
          firebase.rules.firestore = this.analyzeFirestoreRules(content);
        } else if (fileName === 'storage.rules') {
          firebase.rules.storage = this.analyzeStorageRules(content);
        } else if (filePath.includes('/services/') && content.includes('firebase')) {
          const patterns = this.extractFirebasePatterns(content, filePath);
          firebase.patterns.push(...patterns);
        }
        
      } catch (error) {
        console.warn(`    ⚠️  Error analyzing ${filePath}:`, error.message);
      }
    }

    // Extract schemas from service files
    firebase.schemas = this.extractSchemas(firebase.patterns);
    firebase.security = this.analyzeSecurity(firebase);
    
    console.log(`       - ${firebase.patterns.length} Firebase patterns found`);
    console.log(`       - ${firebase.schemas.length} database schemas extracted`);
    
    return firebase;
  }

  analyzeFirebaseConfig(content) {
    try {
      const config = JSON.parse(content);
      return {
        services: Object.keys(config).filter(key => key !== 'emulators'),
        emulators: config.emulators || {},
        hasFirestore: !!config.firestore,
        hasStorage: !!config.storage,
        hasFunctions: !!config.functions,
        hasHosting: !!config.hosting
      };
    } catch (error) {
      return { error: 'Invalid JSON configuration' };
    }
  }

  analyzeFirestoreRules(content) {
    const rules = {
      version: this.extractRulesVersion(content),
      collections: this.extractFirestoreCollections(content),
      functions: this.extractFirestoreRuleFunctions(content),
      security: this.analyzeFirestoreSecurity(content)
    };
    
    return rules;
  }

  extractRulesVersion(content) {
    const versionMatch = content.match(/rules_version\s*=\s*['"]([^'"]+)['"]/);
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  extractFirestoreCollections(content) {
    const collections = [];
    const collectionRegex = /match\s+\/([^/]+)\/\{([^}]+)\}/g;
    const matches = content.matchAll(collectionRegex);
    
    for (const match of matches) {
      collections.push({
        path: match[1],
        variable: match[2],
        rules: this.extractCollectionRules(content, match.index)
      });
    }
    
    return collections;
  }

  extractCollectionRules(content, startIndex) {
    // Extract allow/deny rules for a collection
    const rules = [];
    const allowRegex = /allow\s+(read|write|create|update|delete)(?:\s*,\s*(read|write|create|update|delete))*\s*:\s*if\s+([^;]+);/g;
    
    // Get the section around this collection
    const section = content.substring(startIndex, startIndex + 500);
    const matches = section.matchAll(allowRegex);
    
    for (const match of matches) {
      const operations = [match[1], match[2]].filter(Boolean);
      rules.push({
        operations,
        condition: match[3].trim()
      });
    }
    
    return rules;
  }

  extractFirestoreRuleFunctions(content) {
    const functions = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]+\}/g;
    const matches = content.matchAll(functionRegex);
    
    for (const match of matches) {
      functions.push({
        name: match[1],
        definition: match[0]
      });
    }
    
    return functions;
  }

  analyzeFirestoreSecurity(content) {
    return {
      requiresAuth: content.includes('request.auth != null'),
      hasOwnershipChecks: content.includes('request.auth.uid =='),
      hasDataValidation: content.includes('request.resource.data'),
      hasFieldValidation: content.includes('.keys().hasAll('),
      customFunctions: content.includes('function ')
    };
  }

  analyzeStorageRules(content) {
    return {
      version: this.extractRulesVersion(content),
      paths: this.extractStoragePaths(content),
      security: this.analyzeStorageSecurity(content)
    };
  }

  extractStoragePaths(content) {
    const paths = [];
    const pathRegex = /match\s+([^{]+)\s*\{/g;
    const matches = content.matchAll(pathRegex);
    
    for (const match of matches) {
      paths.push({
        pattern: match[1].trim(),
        rules: this.extractStoragePathRules(content, match.index)
      });
    }
    
    return paths;
  }

  extractStoragePathRules(content, startIndex) {
    const rules = [];
    const section = content.substring(startIndex, startIndex + 300);
    const allowRegex = /allow\s+(read|write)\s*:\s*if\s+([^;]+);/g;
    const matches = section.matchAll(allowRegex);
    
    for (const match of matches) {
      rules.push({
        operation: match[1],
        condition: match[2].trim()
      });
    }
    
    return rules;
  }

  analyzeStorageSecurity(content) {
    return {
      requiresAuth: content.includes('request.auth != null'),
      hasOwnershipChecks: content.includes('request.auth.uid'),
      hasFileSizeChecks: content.includes('resource.size'),
      hasContentTypeChecks: content.includes('resource.contentType')
    };
  }

  extractFirebasePatterns(content, filePath) {
    const patterns = [];
    
    // Collection definitions
    const collectionRegex = /collection\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const collectionMatches = content.matchAll(collectionRegex);
    for (const match of collectionMatches) {
      patterns.push({
        type: 'collection',
        name: match[1],
        file: filePath,
        context: this.getPatternContext(content, match.index)
      });
    }
    
    // Document operations
    const docOperations = ['getDoc', 'setDoc', 'updateDoc', 'deleteDoc', 'addDoc'];
    for (const operation of docOperations) {
      const regex = new RegExp(`${operation}\\s*\\(`, 'g');
      const matches = content.matchAll(regex);
      for (const match of matches) {
        patterns.push({
          type: 'document_operation',
          operation,
          file: filePath,
          context: this.getPatternContext(content, match.index)
        });
      }
    }
    
    // Query operations
    const queryOperations = ['where', 'orderBy', 'limit', 'startAfter'];
    for (const operation of queryOperations) {
      const regex = new RegExp(`${operation}\\s*\\(`, 'g');
      const matches = content.matchAll(regex);
      for (const match of matches) {
        patterns.push({
          type: 'query_operation',
          operation,
          file: filePath,
          context: this.getPatternContext(content, match.index)
        });
      }
    }
    
    // Subscription patterns
    if (content.includes('onSnapshot')) {
      const subscriptionRegex = /onSnapshot\s*\(/g;
      const matches = content.matchAll(subscriptionRegex);
      for (const match of matches) {
        patterns.push({
          type: 'subscription',
          operation: 'onSnapshot',
          file: filePath,
          context: this.getPatternContext(content, match.index)
        });
      }
    }
    
    return patterns;
  }

  getPatternContext(content, index) {
    // Find the function containing this pattern
    const beforeMatch = content.substring(0, index);
    const functionMatch = beforeMatch.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|\s+(\w+)\s*[:=])[^{]*$/);
    
    if (functionMatch) {
      return functionMatch[1] || functionMatch[2] || functionMatch[3];
    }
    
    return 'unknown';
  }

  extractSchemas(patterns) {
    const schemas = new Map();
    
    // Group patterns by collection to infer schemas
    for (const pattern of patterns) {
      if (pattern.type === 'collection') {
        if (!schemas.has(pattern.name)) {
          schemas.set(pattern.name, {
            name: pattern.name,
            operations: [],
            usage: []
          });
        }
      }
    }
    
    // Add operations to schemas
    for (const pattern of patterns) {
      if (pattern.type === 'document_operation' && pattern.context !== 'unknown') {
        // Try to infer collection from context
        const collectionPattern = patterns.find(p => 
          p.type === 'collection' && 
          p.context === pattern.context
        );
        
        if (collectionPattern) {
          const schema = schemas.get(collectionPattern.name);
          if (schema && !schema.operations.includes(pattern.operation)) {
            schema.operations.push(pattern.operation);
          }
        }
      }
    }
    
    return Array.from(schemas.values());
  }

  analyzeSecurity(firebase) {
    const security = {
      firestore: firebase.rules.firestore?.security || {},
      storage: firebase.rules.storage?.security || {},
      recommendations: []
    };
    
    // Security recommendations based on analysis
    if (!security.firestore.requiresAuth) {
      security.recommendations.push('Consider adding authentication requirements to Firestore rules');
    }
    
    if (!security.firestore.hasOwnershipChecks) {
      security.recommendations.push('Consider adding user ownership checks to sensitive documents');
    }
    
    if (!security.storage.hasFileSizeChecks) {
      security.recommendations.push('Consider adding file size limits to storage rules');
    }
    
    return security;
  }
}

module.exports = { FirebaseAnalyzer };