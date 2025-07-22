const { MarkdownParser } = require('../utils/markdown-parser');

/**
 * UIUpdater - Updates ui-patterns-detailed.md with current UI patterns
 * Focuses on component examples, styling patterns, and theme usage
 */
class UIUpdater {
  constructor() {
    this.parser = new MarkdownParser();
  }

  async update(analysis, currentDoc, changes) {
    if (!currentDoc.content) {
      return '';
    }

    const sections = currentDoc.sections;
    let updated = false;

    // Update component patterns
    updated = await this.updateComponentPatterns(sections, analysis) || updated;

    // Update styling patterns  
    updated = await this.updateStylingPatterns(sections, analysis) || updated;

    if (updated) {
      return this.parser.reassembleSections(sections);
    }
    return currentDoc.content;
  }

  async updateComponentPatterns(sections, analysis) {
    const compSection = this.parser.findSection(sections, 'Component Composition Patterns');
    if (!compSection || !analysis.components) return false;

    // Find representative components
    const screenComponents = analysis.components.screens.slice(0, 2);
    if (screenComponents.length > 0) {
      const compCode = this.generateComponentCode(screenComponents[0]);
      this.updateCodeBlocksInSection(compSection, compCode, 'typescript');
      return true;
    }

    return false;
  }

  async updateStylingPatterns(sections, analysis) {
    const styleSection = this.parser.findSection(sections, 'Styling');
    if (!styleSection) return false;

    // Generate generic styling example based on analysis
    const styleCode = this.generateStylingCode(analysis);
    this.updateCodeBlocksInSection(styleSection, styleCode, 'typescript');
    return true;
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

  generateComponentCode(component) {
    const imports = component.imports
      .filter(imp => imp.isReactNative || imp.source.includes('ui-kitten'))
      .slice(0, 3)
      .map(imp => `import ${imp.defaultImport || `{ ${imp.namedImports.join(', ')} }`} from '${imp.source}';`)
      .join('\n');

    return `${imports}

export const ${component.name}: React.FC = () => {
  // Component implementation with hooks
  ${component.hooks.map(hook => `const ${hook.destructured ? `[${hook.destructured.join(', ')}]` : 'result'} = ${hook.name}();`).join('\n  ')}
  
  return (
    <Layout style={styles.container}>
      {/* Component content */}
    </Layout>
  );
};`;
  }

  generateStylingCode(analysis) {
    return `// Common styling patterns found in codebase
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme['background-basic-color-1'],
  },
  
  card: {
    backgroundColor: theme['background-basic-color-3'],
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  button: {
    backgroundColor: theme['color-primary-500'],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  }
});`;
  }
}

module.exports = { UIUpdater };