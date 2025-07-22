const { MarkdownParser } = require('../utils/markdown-parser');

/**
 * FeaturesUpdater - Updates features-detailed.md with current implementations
 * Focuses on Firebase service functions, authentication flows, and real-time patterns
 */
class FeaturesUpdater {
  constructor() {
    this.parser = new MarkdownParser();
  }

  /**
   * Update features documentation
   */
  async update(analysis, currentDoc, changes) {
    if (!currentDoc.content) {
      return '';
    }

    const sections = currentDoc.sections;
    let updated = false;

    // Update Firebase service functions
    updated = await this.updateFirebaseServiceSection(sections, analysis) || updated;

    // Update authentication system
    updated = await this.updateAuthenticationSection(sections, analysis) || updated;

    // Update real-time subscriptions
    updated = await this.updateSubscriptionsSection(sections, analysis) || updated;

    if (updated) {
      return this.parser.reassembleSections(sections);
    }
    return currentDoc.content;
  }

  async updateFirebaseServiceSection(sections, analysis) {
    const serviceSection = this.parser.findSection(sections, 'Firebase Service Functions');
    if (!serviceSection || !analysis.services) return false;

    // Find Firebase service
    const firebaseService = analysis.services.services.find(s => 
      s.name.toLowerCase().includes('firebase')
    );

    if (firebaseService) {
      const authFunctions = firebaseService.functions.filter(f => 
        f.name.includes('sign') || f.name.includes('auth')
      );
      
      if (authFunctions.length > 0) {
        const authCode = this.generateAuthFunctionsCode(authFunctions);
        this.updateCodeBlocksInSection(serviceSection, authCode, 'typescript');
        return true;
      }
    }

    return false;
  }

  async updateAuthenticationSection(sections, analysis) {
    const authSection = this.parser.findSection(sections, 'Authentication System');
    if (!authSection) return false;

    // Update auth context implementation
    const authContextSection = this.parser.findSection(authSection.subsections, 'AuthContext Implementation');
    if (authContextSection && analysis.components) {
      const authContext = analysis.components.components.find(comp => 
        comp.name.toLowerCase().includes('auth') && comp.name.toLowerCase().includes('context')
      );

      if (authContext) {
        const contextCode = this.generateAuthContextCode(authContext);
        this.updateCodeBlocksInSection(authContextSection, contextCode, 'typescript');
        return true;
      }
    }

    return false;
  }

  async updateSubscriptionsSection(sections, analysis) {
    const subSection = this.parser.findSection(sections, 'Real-time Subscriptions');
    if (!subSection || !analysis.services) return false;

    // Find subscription functions
    const subscriptionFunctions = [];
    for (const service of analysis.services.services) {
      const subFuncs = service.functions.filter(f => 
        f.name.toLowerCase().includes('subscribe') || 
        f.name.toLowerCase().includes('listen')
      );
      subscriptionFunctions.push(...subFuncs);
    }

    if (subscriptionFunctions.length > 0) {
      const subCode = this.generateSubscriptionCode(subscriptionFunctions);
      this.updateCodeBlocksInSection(subSection, subCode, 'typescript');
      return true;
    }

    return false;
  }

  updateCodeBlocksInSection(section, newCode, language = 'typescript') {
    if (section.codeBlocks.length > 0) {
      const tsBlock = section.codeBlocks.find(block => 
        ['typescript', 'ts', 'tsx'].includes(block.language)
      );
      
      if (tsBlock) {
        this.parser.replaceCodeBlock(section, tsBlock, newCode, language);
      }
    }
  }

  generateAuthFunctionsCode(functions) {
    return functions
      .slice(0, 3) // Limit for brevity
      .map(func => this.formatFunction(func))
      .join('\n\n');
  }

  generateAuthContextCode(context) {
    return `// AuthContext implementation
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Implementation details...
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};`;
  }

  generateSubscriptionCode(functions) {
    return functions
      .slice(0, 2)
      .map(func => this.formatFunction(func))
      .join('\n\n');
  }

  formatFunction(func) {
    const params = func.parameters
      .map(param => `${param.name}: ${param.type}`)
      .join(', ');
    
    const asyncKeyword = func.async ? 'async ' : '';
    
    return `export const ${func.name} = ${asyncKeyword}(${params}) => {
  // Function implementation...
};`;
  }
}

module.exports = { FeaturesUpdater };