const fs = require('fs').promises;
const path = require('path');

/**
 * ComponentAnalyzer - Analyzes React Native components and screens
 * Extracts component patterns, props, hooks usage, and navigation patterns
 */
class ComponentAnalyzer {
  constructor() {
    this.componentPatterns = {
      functional: /(?:export\s+)?(?:const|function)\s+(\w+).*?(?::\s*React\.FC|=\s*\([^)]*\)\s*=>)/g,
      props: /interface\s+(\w+Props)\s*\{([^}]+)\}/g,
      hooks: /(?:const|let)\s*(?:\[([^\]]+)\]|\w+)\s*=\s*use(\w+)/g,
      navigation: /navigation\.navigate|useNavigation|NavigationProp/g,
      firebase: /firebase|firestore|auth\.currentUser/g
    };
  }

  /**
   * Analyze React components and screens
   * @param {string[]} files - Component and screen files
   * @returns {Object} Component analysis results
   */
  async analyze(files) {
    const components = [];
    const screens = [];
    const navigation = [];
    
    console.log(`    ⚛️  Analyzing ${files.length} component files...`);

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(process.cwd(), filePath);
        
        const analysis = await this.analyzeFile(content, filePath, relativePath);
        
        if (filePath.includes('/screens/')) {
          screens.push(analysis);
        } else if (filePath.includes('/components/')) {
          components.push(analysis);
        } else if (filePath.includes('/navigation/')) {
          navigation.push(analysis);
        }
        
      } catch (error) {
        console.warn(`    ⚠️  Error analyzing ${filePath}:`, error.message);
      }
    }

    console.log(`       - ${components.length} components analyzed`);
    console.log(`       - ${screens.length} screens analyzed`);
    console.log(`       - ${navigation.length} navigation files analyzed`);

    return {
      components,
      screens,
      navigation,
      summary: {
        totalFiles: files.length,
        componentsCount: components.length,
        screensCount: screens.length,
        navigationCount: navigation.length
      }
    };
  }

  /**
   * Analyze individual component file
   */
  async analyzeFile(content, filePath, relativePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    return {
      name: fileName,
      filePath,
      relativePath,
      type: this.determineComponentType(filePath),
      components: this.extractComponents(content),
      props: this.extractProps(content),
      hooks: this.extractHooks(content),
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      navigation: this.extractNavigation(content),
      firebase: this.extractFirebaseUsage(content),
      stateManagement: this.extractStateManagement(content),
      styling: this.extractStyling(content)
    };
  }

  /**
   * Determine component type based on file path
   */
  determineComponentType(filePath) {
    if (filePath.includes('/screens/')) {
      return 'screen';
    } else if (filePath.includes('/components/')) {
      return 'component';
    } else if (filePath.includes('/navigation/')) {
      return 'navigation';
    } else if (filePath.includes('/context/')) {
      return 'context';
    }
    return 'unknown';
  }

  /**
   * Extract component definitions
   */
  extractComponents(content) {
    const components = [];
    
    // Functional components
    const functionalMatches = content.matchAll(this.componentPatterns.functional);
    for (const match of functionalMatches) {
      components.push({
        name: match[1],
        type: 'functional',
        exported: match[0].includes('export')
      });
    }
    
    // Class components (less common in modern React)
    const classRegex = /class\s+(\w+)\s+extends\s+(?:React\.)?Component/g;
    const classMatches = content.matchAll(classRegex);
    for (const match of classMatches) {
      components.push({
        name: match[1],
        type: 'class',
        exported: false // Simplified detection
      });
    }

    return components;
  }

  /**
   * Extract component props interfaces
   */
  extractProps(content) {
    const props = [];
    const matches = content.matchAll(this.componentPatterns.props);
    
    for (const match of matches) {
      const interfaceName = match[1];
      const propsBody = match[2];
      
      const properties = this.parsePropsBody(propsBody);
      
      props.push({
        interfaceName,
        properties,
        raw: match[0]
      });
    }
    
    return props;
  }

  /**
   * Parse props interface body
   */
  parsePropsBody(propsBody) {
    const properties = [];
    const lines = propsBody.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      
      const propMatch = trimmed.match(/(\w+)(\??):\s*([^;]+);?/);
      if (propMatch) {
        properties.push({
          name: propMatch[1],
          type: propMatch[3].trim(),
          optional: !!propMatch[2]
        });
      }
    }
    
    return properties;
  }

  /**
   * Extract React hooks usage
   */
  extractHooks(content) {
    const hooks = [];
    const matches = content.matchAll(this.componentPatterns.hooks);
    
    for (const match of matches) {
      const hookName = `use${match[2]}`;
      const destructured = match[1] || null;
      
      hooks.push({
        name: hookName,
        destructured: destructured ? destructured.split(',').map(s => s.trim()) : null,
        type: this.categorizeHook(hookName)
      });
    }
    
    // Also find custom hooks
    const customHookRegex = /use[A-Z]\w+/g;
    const customMatches = content.matchAll(customHookRegex);
    for (const match of customMatches) {
      if (!hooks.find(h => h.name === match[0])) {
        hooks.push({
          name: match[0],
          type: 'custom'
        });
      }
    }
    
    return hooks;
  }

  /**
   * Categorize hook type
   */
  categorizeHook(hookName) {
    if (['useState', 'useEffect', 'useContext', 'useReducer', 'useMemo', 'useCallback', 'useRef'].includes(hookName)) {
      return 'react';
    } else if (hookName.includes('Navigation') || hookName.includes('Route')) {
      return 'navigation';
    } else if (hookName.includes('Auth') || hookName.includes('Firebase')) {
      return 'firebase';
    } else if (hookName.startsWith('use') && hookName[3] === hookName[3].toUpperCase()) {
      return 'custom';
    }
    return 'unknown';
  }

  /**
   * Extract import statements
   */
  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:\{([^}]+)\}|(\w+)|(\*\s+as\s+\w+))\s+from\s+['"](.*?)['"];/g;
    const matches = content.matchAll(importRegex);
    
    for (const match of matches) {
      const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : null;
      const defaultImport = match[2] || null;
      const namespaceImport = match[3] || null;
      const source = match[4];
      
      imports.push({
        namedImports,
        defaultImport,
        namespaceImport,
        source,
        isRelative: source.startsWith('.'),
        isNodeModule: !source.startsWith('.')
      });
    }
    
    return imports;
  }

  /**
   * Extract export statements
   */
  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+\{([^}]+)\}/g;
    const namedMatches = content.matchAll(namedExportRegex);
    for (const match of namedMatches) {
      const items = match[1].split(',').map(s => s.trim());
      exports.push({
        type: 'named',
        items
      });
    }
    
    // Default exports
    const defaultExportRegex = /export\s+default\s+(\w+)/g;
    const defaultMatches = content.matchAll(defaultExportRegex);
    for (const match of defaultMatches) {
      exports.push({
        type: 'default',
        name: match[1]
      });
    }
    
    return exports;
  }

  /**
   * Extract navigation patterns
   */
  extractNavigation(content) {
    const navigation = {
      usesNavigation: content.includes('useNavigation'),
      usesRoute: content.includes('useRoute'),
      navigationCalls: [],
      screenDefinitions: []
    };
    
    // Find navigation.navigate calls
    const navigateRegex = /navigation\.navigate\(['"]([^'"]+)['"](?:,\s*({[^}]+}))?\)/g;
    const navigateMatches = content.matchAll(navigateRegex);
    for (const match of navigateMatches) {
      navigation.navigationCalls.push({
        screen: match[1],
        params: match[2] || null
      });
    }
    
    // Find screen definitions (in navigators)
    const screenRegex = /<\w*\.Screen\s+name=['"]([^'"]+)['"].*?component=\{(\w+)\}/g;
    const screenMatches = content.matchAll(screenRegex);
    for (const match of screenMatches) {
      navigation.screenDefinitions.push({
        name: match[1],
        component: match[2]
      });
    }
    
    return navigation;
  }

  /**
   * Extract Firebase usage patterns
   */
  extractFirebaseUsage(content) {
    const firebase = {
      usesAuth: content.includes('auth.currentUser') || content.includes('useAuth'),
      usesFirestore: content.includes('firestore') || content.includes('doc(') || content.includes('collection('),
      usesStorage: content.includes('storage') || content.includes('uploadPhoto'),
      authMethods: [],
      firestoreMethods: [],
      subscriptions: []
    };
    
    // Find auth method calls
    const authMethods = ['signIn', 'signUp', 'signOut'];
    for (const method of authMethods) {
      if (content.includes(method)) {
        firebase.authMethods.push(method);
      }
    }
    
    // Find Firestore operations
    const firestoreOps = ['getDoc', 'setDoc', 'updateDoc', 'deleteDoc', 'addDoc', 'getDocs'];
    for (const op of firestoreOps) {
      if (content.includes(op)) {
        firebase.firestoreMethods.push(op);
      }
    }
    
    // Find real-time subscriptions
    if (content.includes('onSnapshot') || content.includes('subscribe')) {
      const subscribeRegex = /(?:onSnapshot|subscribe\w*)\s*\(/g;
      const matches = content.matchAll(subscribeRegex);
      firebase.subscriptions = Array.from(matches).map((match, index) => ({
        id: `subscription_${index}`,
        type: match[0].includes('onSnapshot') ? 'firestore' : 'custom'
      }));
    }
    
    return firebase;
  }

  /**
   * Extract state management patterns
   */
  extractStateManagement(content) {
    return {
      usesContext: content.includes('useContext') || content.includes('createContext'),
      usesRedux: content.includes('useSelector') || content.includes('useDispatch'),
      localState: content.includes('useState'),
      effects: content.includes('useEffect'),
      memoization: content.includes('useMemo') || content.includes('useCallback')
    };
  }

  /**
   * Extract styling patterns
   */
  extractStyling(content) {
    const styling = {
      usesStyleSheet: content.includes('StyleSheet.create'),
      usesUIKitten: content.includes('@ui-kitten') || content.includes('eva'),
      usesTheme: content.includes('useTheme') || content.includes('theme['),
      inlineStyles: content.includes('style={{'),
      styledComponents: content.includes('styled-components')
    };
    
    // Count style objects
    const styleMatches = content.match(/style=\{[^}]+\}/g) || [];
    styling.styleCount = styleMatches.length;
    
    return styling;
  }
}

module.exports = { ComponentAnalyzer };