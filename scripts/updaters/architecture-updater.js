const { MarkdownParser } = require('../utils/markdown-parser');

/**
 * ArchitectureUpdater - Updates architecture-detailed.md with current code patterns
 * Preserves manual content while updating TypeScript interfaces and code examples
 */
class ArchitectureUpdater {
  constructor() {
    this.parser = new MarkdownParser();
  }

  /**
   * Update architecture documentation
   * @param {Object} analysis - Current codebase analysis
   * @param {Object} currentDoc - Current documentation
   * @param {Object} changes - Detected changes
   * @returns {string} Updated documentation content
   */
  async update(analysis, currentDoc, changes) {
    if (!currentDoc.content) {
      console.log('    ⚠️  Architecture document is empty, skipping update');
      return '';
    }

    const sections = currentDoc.sections;
    let updated = false;

    // Update TypeScript interfaces section
    const interfacesUpdated = await this.updateTypeScriptSection(sections, analysis, changes);
    updated = updated || interfacesUpdated;

    // Update service patterns section  
    const servicesUpdated = await this.updateServicePatternsSection(sections, analysis, changes);
    updated = updated || servicesUpdated;

    // Update navigation structure section
    const navigationUpdated = await this.updateNavigationSection(sections, analysis, changes);
    updated = updated || navigationUpdated;

    // Update hooks section
    const hooksUpdated = await this.updateHooksSection(sections, analysis, changes);
    updated = updated || hooksUpdated;

    if (updated) {
      return this.parser.reassembleSections(sections);
    } else {
      console.log('    ℹ️  No updates needed for architecture documentation');
      return currentDoc.content;
    }
  }

  /**
   * Update TypeScript interfaces and types section
   */
  async updateTypeScriptSection(sections, analysis, changes) {
    const typeSection = this.parser.findSection(sections, 'TypeScript Type System');
    if (!typeSection || !analysis.typescript) {
      return false;
    }

    let updated = false;

    // Update core interfaces
    const coreSection = this.parser.findSection(typeSection.subsections, 'Core User Types');
    if (coreSection && analysis.typescript.interfaces) {
      const relevantInterfaces = analysis.typescript.interfaces.filter(iface => 
        this.isRelevantInterface(iface.name)
      );
      
      if (relevantInterfaces.length > 0) {
        const interfaceCode = this.generateInterfacesCode(relevantInterfaces);
        this.updateCodeBlocksInSection(coreSection, interfaceCode, 'typescript');
        updated = true;
      }
    }

    // Update enums section
    const enumSection = this.parser.findSection(typeSection.subsections, 'Status Enums');
    if (enumSection && analysis.typescript.enums) {
      const relevantEnums = analysis.typescript.enums.filter(enumDecl =>
        this.isRelevantEnum(enumDecl.name)
      );

      if (relevantEnums.length > 0) {
        const enumCode = this.generateEnumsCode(relevantEnums);
        this.updateCodeBlocksInSection(enumSection, enumCode, 'typescript');
        updated = true;
      }
    }

    return updated;
  }

  /**
   * Update service patterns section
   */
  async updateServicePatternsSection(sections, analysis, changes) {
    const serviceSection = this.parser.findSection(sections, 'Firebase Integration Architecture');
    if (!serviceSection || !analysis.services) {
      return false;
    }

    let updated = false;

    // Update Firebase service functions
    const coreServiceSection = this.parser.findSection(serviceSection.subsections, 'Core Firebase Service');
    if (coreServiceSection) {
      const firebaseService = analysis.services.services.find(s => 
        s.name.toLowerCase().includes('firebase')
      );
      
      if (firebaseService) {
        const serviceCode = this.generateServiceCode(firebaseService);
        this.updateCodeBlocksInSection(coreServiceSection, serviceCode, 'typescript');
        updated = true;
      }
    }

    return updated;
  }

  /**
   * Update navigation structure section
   */
  async updateNavigationSection(sections, analysis, changes) {
    const navSection = this.parser.findSection(sections, 'Navigation Architecture');
    if (!navSection || !analysis.components) {
      return false;
    }

    let updated = false;

    // Update root navigator
    const rootNavSection = this.parser.findSection(navSection.subsections, 'Root Navigation Structure');
    if (rootNavSection) {
      const rootNavigator = analysis.components.navigation.find(nav =>
        nav.name.toLowerCase().includes('root')
      );

      if (rootNavigator) {
        const navCode = this.generateNavigationCode(rootNavigator);
        this.updateCodeBlocksInSection(rootNavSection, navCode, 'typescript');
        updated = true;
      }
    }

    return updated;
  }

  /**
   * Update hooks documentation section
   */
  async updateHooksSection(sections, analysis, changes) {
    const hooksSection = this.parser.findSection(sections, 'Custom Hooks for Data Management');
    if (!hooksSection || !analysis.hooks) {
      return false;
    }

    let updated = false;

    // Update each documented hook
    for (const hookAnalysis of analysis.hooks.hooks) {
      const hookSection = this.parser.findSection(hooksSection.subsections, hookAnalysis.name);
      if (hookSection) {
        const hookCode = this.generateHookCode(hookAnalysis);
        this.updateCodeBlocksInSection(hookSection, hookCode, 'typescript');
        updated = true;
      }
    }

    return updated;
  }

  /**
   * Update code blocks within a section
   */
  updateCodeBlocksInSection(section, newCode, language = 'typescript') {
    if (section.codeBlocks.length > 0) {
      // Update the first TypeScript code block
      const tsBlock = section.codeBlocks.find(block => 
        block.language === language || block.language === 'ts' || block.language === 'tsx'
      );
      
      if (tsBlock) {
        this.parser.replaceCodeBlock(section, tsBlock, newCode, language);
      } else {
        // Add new code block if none exists
        this.parser.insertCodeBlock(section, newCode, language);
      }
    } else {
      // Add new code block
      this.parser.insertCodeBlock(section, newCode, language);
    }
  }

  /**
   * Code generation methods
   */
  generateInterfacesCode(interfaces) {
    return interfaces
      .map(iface => this.formatInterface(iface))
      .join('\n\n');
  }

  formatInterface(iface) {
    const members = iface.members
      .map(member => {
        const optional = member.optional ? '?' : '';
        const comment = member.comments.length > 0 ? ` // ${member.comments[0].replace(/\/\*\*|\*\/|\*/g, '').trim()}` : '';
        return `  ${member.name}${optional}: ${member.type};${comment}`;
      })
      .join('\n');

    const heritage = iface.heritage && iface.heritage.length > 0 
      ? ` extends ${iface.heritage.join(', ')}` 
      : '';

    return `interface ${iface.name}${heritage} {
${members}
}`;
  }

  generateEnumsCode(enums) {
    return enums
      .map(enumDecl => this.formatEnum(enumDecl))
      .join('\n\n');
  }

  formatEnum(enumDecl) {
    const members = enumDecl.members
      .map(member => {
        const value = member.value ? ` = '${member.value}'` : '';
        const comment = member.comments.length > 0 ? ` // ${member.comments[0]}` : '';
        return `  ${member.name}${value},${comment}`;
      })
      .join('\n');

    return `enum ${enumDecl.name} {
${members}
}`;
  }

  generateServiceCode(service) {
    const functions = service.functions
      .filter(func => this.isRelevantServiceFunction(func.name))
      .slice(0, 3) // Limit to 3 functions for brevity
      .map(func => this.formatServiceFunction(func))
      .join('\n\n');

    return functions || '// No relevant service functions found';
  }

  formatServiceFunction(func) {
    const params = func.parameters
      .map(param => `${param.name}: ${param.type}`)
      .join(', ');

    const asyncKeyword = func.async ? 'async ' : '';
    
    return `export const ${func.name} = ${asyncKeyword}(${params}) => {
  // Implementation details...
};`;
  }

  generateNavigationCode(navigator) {
    return `// Navigation structure for ${navigator.name}
export const ${navigator.name} = () => {
  // Navigation implementation...
};`;
  }

  generateHookCode(hook) {
    const returnTypeStr = hook.returnType !== 'unknown' ? `: ${hook.returnType}` : '';
    
    return `export const ${hook.name} = (${hook.signature || ''})${returnTypeStr} => {
  // Hook implementation...
  // Uses: ${hook.internalHooks.join(', ')}
  
  return {
    // Hook return values...
  };
};`;
  }

  /**
   * Helper methods to determine relevance
   */
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
      /Return$/,
      /Config$/,
      /State$/
    ];

    return relevantPatterns.some(pattern => pattern.test(name));
  }

  isRelevantEnum(name) {
    const relevantPatterns = [
      /Status$/,
      /Type$/,
      /Mode$/,
      /State$/
    ];

    return relevantPatterns.some(pattern => pattern.test(name));
  }

  isRelevantServiceFunction(name) {
    const relevantPatterns = [
      /^sign/i,
      /^create/i,
      /^update/i,
      /^delete/i,
      /^get/i,
      /^subscribe/i,
      /^upload/i,
      /firebase/i,
      /auth/i,
      /firestore/i
    ];

    return relevantPatterns.some(pattern => pattern.test(name));
  }
}

module.exports = { ArchitectureUpdater };