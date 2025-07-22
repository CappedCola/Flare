const { MarkdownParser } = require('../utils/markdown-parser');

/**
 * DebugUpdater - Updates debugging-detailed.md with current error handling patterns
 * Focuses on error boundaries, logging patterns, and debugging utilities
 */
class DebugUpdater {
  constructor() {
    this.parser = new MarkdownParser();
  }

  async update(analysis, currentDoc, changes) {
    if (!currentDoc.content) {
      return '';
    }

    const sections = currentDoc.sections;
    let updated = false;

    // Update error handling patterns
    updated = await this.updateErrorHandlingSection(sections, analysis) || updated;

    // Update debugging utilities
    updated = await this.updateDebuggingUtilitiesSection(sections, analysis) || updated;

    // Update logging patterns
    updated = await this.updateLoggingPatternsSection(sections, analysis) || updated;

    if (updated) {
      return this.parser.reassembleSections(sections);
    }
    return currentDoc.content;
  }

  async updateErrorHandlingSection(sections, analysis) {
    const errorSection = this.parser.findSection(sections, 'Error Handling Patterns');
    if (!errorSection) return false;

    let updated = false;

    // Update try-catch patterns
    const tryCatchSection = this.parser.findSection(errorSection.subsections, 'Try-Catch Patterns');
    if (tryCatchSection && analysis.services) {
      const errorHandlingPatterns = this.findErrorHandlingPatterns(analysis.services.services);
      if (errorHandlingPatterns.length > 0) {
        const errorCode = this.generateErrorHandlingCode(errorHandlingPatterns);
        this.updateCodeBlocksInSection(tryCatchSection, errorCode, 'typescript');
        updated = true;
      }
    }

    // Update error boundaries
    const boundarySection = this.parser.findSection(errorSection.subsections, 'Error Boundaries');
    if (boundarySection && analysis.components) {
      const errorBoundaries = analysis.components.components.filter(comp =>
        comp.name.toLowerCase().includes('error') && comp.name.toLowerCase().includes('boundary')
      );
      
      if (errorBoundaries.length > 0) {
        const boundaryCode = this.generateErrorBoundaryCode(errorBoundaries[0]);
        this.updateCodeBlocksInSection(boundarySection, boundaryCode, 'typescript');
        updated = true;
      }
    }

    return updated;
  }

  async updateDebuggingUtilitiesSection(sections, analysis) {
    const debugSection = this.parser.findSection(sections, 'Debugging Utilities');
    if (!debugSection) return false;

    let updated = false;

    // Update console logging patterns
    const consoleSection = this.parser.findSection(debugSection.subsections, 'Console Logging');
    if (consoleSection) {
      const loggingCode = this.generateLoggingUtilitiesCode(analysis);
      this.updateCodeBlocksInSection(consoleSection, loggingCode, 'typescript');
      updated = true;
    }

    // Update development helpers
    const devHelpersSection = this.parser.findSection(debugSection.subsections, 'Development Helpers');
    if (devHelpersSection) {
      const helpersCode = this.generateDevHelpersCode(analysis);
      this.updateCodeBlocksInSection(devHelpersSection, helpersCode, 'typescript');
      updated = true;
    }

    return updated;
  }

  async updateLoggingPatternsSection(sections, analysis) {
    const loggingSection = this.parser.findSection(sections, 'Logging and Monitoring');
    if (!loggingSection || !analysis.services) return false;

    // Find logging patterns across services
    const loggingPatterns = this.findLoggingPatterns(analysis.services.services);
    if (loggingPatterns.length > 0) {
      const loggingCode = this.generateLoggingPatternsCode(loggingPatterns);
      this.updateCodeBlocksInSection(loggingSection, loggingCode, 'typescript');
      return true;
    }

    return false;
  }

  updateCodeBlocksInSection(section, newCode, language = 'typescript') {
    if (section.codeBlocks.length > 0) {
      const tsBlock = section.codeBlocks.find(block => 
        ['typescript', 'ts', 'tsx', 'javascript', 'js'].includes(block.language)
      );
      
      if (tsBlock) {
        this.parser.replaceCodeBlock(section, tsBlock, newCode, language);
      }
    }
  }

  findErrorHandlingPatterns(services) {
    const patterns = [];
    
    for (const service of services) {
      for (const func of service.functions) {
        // Look for functions with error handling keywords
        if (func.body && (
          func.body.includes('try {') ||
          func.body.includes('catch (') ||
          func.body.includes('.catch(') ||
          func.body.includes('throw ')
        )) {
          patterns.push({
            service: service.name,
            function: func.name,
            type: this.detectErrorHandlingType(func.body),
            async: func.async
          });
        }
      }
    }
    
    return patterns.slice(0, 3); // Limit for brevity
  }

  detectErrorHandlingType(body) {
    if (body.includes('try {') && body.includes('catch (')) {
      return 'try-catch';
    } else if (body.includes('.catch(')) {
      return 'promise-catch';
    } else if (body.includes('throw ')) {
      return 'explicit-throw';
    }
    return 'unknown';
  }

  findLoggingPatterns(services) {
    const patterns = [];
    
    for (const service of services) {
      for (const func of service.functions) {
        if (func.body && (
          func.body.includes('console.') ||
          func.body.includes('logger.') ||
          func.body.includes('debug(') ||
          func.body.includes('log(')
        )) {
          patterns.push({
            service: service.name,
            function: func.name,
            logType: this.detectLogType(func.body)
          });
        }
      }
    }
    
    return patterns.slice(0, 4); // Limit for brevity
  }

  detectLogType(body) {
    if (body.includes('console.error')) return 'error';
    if (body.includes('console.warn')) return 'warning';
    if (body.includes('console.info')) return 'info';
    if (body.includes('console.debug')) return 'debug';
    if (body.includes('console.log')) return 'log';
    return 'custom';
  }

  generateErrorHandlingCode(patterns) {
    const examples = patterns.map(pattern => {
      const asyncKeyword = pattern.async ? 'async ' : '';
      
      switch (pattern.type) {
        case 'try-catch':
          return `// ${pattern.service} - ${pattern.function}
export const ${pattern.function} = ${asyncKeyword}() => {
  try {
    // Operation that might fail
    const result = await riskyOperation();
    return result;
  } catch (error) {
    console.error('Error in ${pattern.function}:', error);
    throw error;
  }
};`;

        case 'promise-catch':
          return `// ${pattern.service} - ${pattern.function}
export const ${pattern.function} = ${asyncKeyword}() => {
  return riskyOperation()
    .catch((error) => {
      console.error('Promise error in ${pattern.function}:', error);
      throw error;
    });
};`;

        case 'explicit-throw':
          return `// ${pattern.service} - ${pattern.function}
export const ${pattern.function} = ${asyncKeyword}() => {
  if (invalidCondition) {
    throw new Error('Validation failed in ${pattern.function}');
  }
  // Continue with operation...
};`;

        default:
          return `// ${pattern.service} - ${pattern.function} (${pattern.type} handling)`;
      }
    });

    return examples.join('\n\n');
  }

  generateErrorBoundaryCode(boundary) {
    return `// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ${boundary.name} extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Layout style={styles.errorContainer}>
          <Text category="h6">Something went wrong</Text>
          <Text category="s1">Please try again later</Text>
        </Layout>
      );
    }

    return this.props.children;
  }
}`;
  }

  generateLoggingUtilitiesCode(analysis) {
    return `// Development Logging Utilities
const isDevelopment = __DEV__;

export const debugLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(\`[DEBUG] \${message}\`, data);
  }
};

export const errorLog = (message: string, error: any) => {
  console.error(\`[ERROR] \${message}\`, error);
  
  // In production, could send to crash analytics
  if (!isDevelopment) {
    // crashlytics().recordError(error);
  }
};

export const performanceLog = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  if (isDevelopment) {
    console.log(\`[PERF] \${operation} took \${duration}ms\`);
  }
};`;
  }

  generateDevHelpersCode(analysis) {
    return `// Development Helper Functions
export const logComponentProps = (componentName: string, props: any) => {
  if (__DEV__) {
    console.group(\`📱 \${componentName} Props\`);
    console.table(props);
    console.groupEnd();
  }
};

export const logNetworkRequest = (url: string, method: string, data?: any) => {
  if (__DEV__) {
    console.group(\`🌐 Network \${method} \${url}\`);
    if (data) console.log('Request Data:', data);
    console.groupEnd();
  }
};

export const logStateChange = (component: string, prevState: any, newState: any) => {
  if (__DEV__) {
    console.group(\`🔄 \${component} State Change\`);
    console.log('Previous:', prevState);
    console.log('New:', newState);
    console.groupEnd();
  }
};`;
  }

  generateLoggingPatternsCode(patterns) {
    const examples = patterns.map(pattern => {
      const logMethod = pattern.logType === 'custom' ? 'console.log' : `console.${pattern.logType}`;
      
      return `// Logging in ${pattern.service}.${pattern.function}
${logMethod}('${pattern.function}:', 'Operation details');`;
    });

    const fullExample = `// Common logging patterns found in codebase
${examples.join('\n')}

// Structured logging example
export const logWithContext = (level: 'info' | 'warn' | 'error', message: string, context?: any) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    context
  };
  
  console[level](\`[\${level.toUpperCase()}] \${timestamp}\`, message, context);
};`;

    return fullExample;
  }
}

module.exports = { DebugUpdater };