const { MarkdownParser } = require('../utils/markdown-parser');

/**
 * FirebaseUpdater - Updates firebase-database-detailed.md with current Firebase patterns
 * Focuses on database schemas, security rules, and query patterns
 */
class FirebaseUpdater {
  constructor() {
    this.parser = new MarkdownParser();
  }

  async update(analysis, currentDoc, changes) {
    if (!currentDoc.content) {
      return '';
    }

    const sections = currentDoc.sections;
    let updated = false;

    // Update security rules
    updated = await this.updateSecurityRules(sections, analysis) || updated;

    // Update query patterns
    updated = await this.updateQueryPatterns(sections, analysis) || updated;

    if (updated) {
      return this.parser.reassembleSections(sections);
    }
    return currentDoc.content;
  }

  async updateSecurityRules(sections, analysis) {
    const rulesSection = this.parser.findSection(sections, 'Security Rules');
    if (!rulesSection || !analysis.firebase || !analysis.firebase.rules.firestore) return false;

    const firestoreRulesSection = this.parser.findSection(rulesSection.subsections, 'Firestore Rules');
    if (firestoreRulesSection) {
      const rulesCode = this.generateFirestoreRulesCode(analysis.firebase.rules.firestore);
      this.updateCodeBlocksInSection(firestoreRulesSection, rulesCode, 'javascript');
      return true;
    }

    return false;
  }

  async updateQueryPatterns(sections, analysis) {
    const querySection = this.parser.findSection(sections, 'Query Patterns and Indexes');
    if (!querySection || !analysis.firebase) return false;

    if (analysis.firebase.patterns.length > 0) {
      const queryCode = this.generateQueryPatternsCode(analysis.firebase.patterns);
      this.updateCodeBlocksInSection(querySection, queryCode, 'typescript');
      return true;
    }

    return false;
  }

  updateCodeBlocksInSection(section, newCode, language) {
    if (section.codeBlocks.length > 0) {
      const relevantBlock = section.codeBlocks.find(block => 
        block.language === language || 
        (language === 'javascript' && ['js', 'javascript'].includes(block.language)) ||
        (language === 'typescript' && ['ts', 'typescript'].includes(block.language))
      );
      
      if (relevantBlock) {
        this.parser.replaceCodeBlock(section, relevantBlock, newCode, language);
      }
    }
  }

  generateFirestoreRulesCode(rules) {
    if (!rules.collections || rules.collections.length === 0) {
      return '// No Firestore rules found';
    }

    const rulesCode = rules.collections
      .slice(0, 3) // Limit for brevity
      .map(collection => {
        const rulesText = collection.rules
          .map(rule => `      allow ${rule.operations.join(', ')}: if ${rule.condition};`)
          .join('\n');
        
        return `    match /${collection.path}/{${collection.variable}} {
${rulesText}
    }`;
      })
      .join('\n    \n');

    return `rules_version = '${rules.version}';
service cloud.firestore {
  match /databases/{database}/documents {
${rulesCode}
  }
}`;
  }

  generateQueryPatternsCode(patterns) {
    const queryPatterns = patterns.filter(p => 
      p.type === 'query_operation' || p.type === 'collection'
    );

    if (queryPatterns.length === 0) {
      return '// No query patterns found';
    }

    // Group patterns by context (function)
    const patternsByContext = {};
    for (const pattern of queryPatterns) {
      if (!patternsByContext[pattern.context]) {
        patternsByContext[pattern.context] = [];
      }
      patternsByContext[pattern.context].push(pattern);
    }

    const examples = Object.entries(patternsByContext)
      .slice(0, 3)
      .map(([context, contextPatterns]) => {
        const operations = contextPatterns.map(p => p.operation).join(', ');
        return `// Query pattern in ${context}
const query = query(
  collection(firestore, 'collection_name'),
  // Operations: ${operations}
);`;
      })
      .join('\n\n');

    return examples;
  }
}

module.exports = { FirebaseUpdater };