const marked = require('marked');

/**
 * MarkdownParser - Parses and manipulates markdown documents while preserving structure
 * Handles code block replacement, section management, and content preservation
 */
class MarkdownParser {
  constructor() {
    this.codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    this.headingRegex = /^(#{1,6})\s+(.+)$/gm;
    this.sectionSeparator = '\n---\n';
  }

  /**
   * Parse markdown content into structured sections
   * @param {string} content - Raw markdown content
   * @returns {Object[]} Array of section objects
   */
  parseSections(content) {
    if (!content || content.trim() === '') {
      return [];
    }

    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n');
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          level: headingMatch[1].length,
          title: headingMatch[2].trim(),
          rawTitle: line,
          startLine: i,
          content: '',
          codeBlocks: [],
          subsections: []
        };
        currentContent = [line];
      } else {
        if (currentContent) {
          currentContent.push(line);
        }
      }
    }

    // Add final section
    if (currentSection) {
      currentSection.content = currentContent.join('\n');
      sections.push(currentSection);
    }

    // Extract code blocks and build hierarchy
    this.extractCodeBlocks(sections);
    this.buildSectionHierarchy(sections);

    return sections;
  }

  /**
   * Extract code blocks from section content
   * @param {Object[]} sections - Array of section objects
   */
  extractCodeBlocks(sections) {
    for (const section of sections) {
      section.codeBlocks = [];
      let match;
      
      // Reset regex state
      this.codeBlockRegex.lastIndex = 0;
      
      while ((match = this.codeBlockRegex.exec(section.content)) !== null) {
        section.codeBlocks.push({
          language: match[1] || 'text',
          code: match[2].trim(),
          fullMatch: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }
  }

  /**
   * Build hierarchical section structure
   * @param {Object[]} sections - Flat array of sections
   */
  buildSectionHierarchy(sections) {
    const stack = [];
    
    for (const section of sections) {
      // Pop sections that are at the same level or deeper
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }
      
      // Add as subsection of parent
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        parent.subsections.push(section);
        section.parent = parent;
      }
      
      stack.push(section);
    }
  }

  /**
   * Find a section by title or partial title match
   * @param {Object[]} sections - Array of sections
   * @param {string} titlePattern - Title to search for
   * @param {boolean} exactMatch - Whether to do exact matching
   * @returns {Object|null} Found section or null
   */
  findSection(sections, titlePattern, exactMatch = false) {
    const searchPattern = exactMatch 
      ? titlePattern.toLowerCase()
      : titlePattern.toLowerCase();

    for (const section of sections) {
      const sectionTitle = section.title.toLowerCase();
      
      if (exactMatch ? sectionTitle === searchPattern : sectionTitle.includes(searchPattern)) {
        return section;
      }
      
      // Search in subsections recursively
      if (section.subsections.length > 0) {
        const found = this.findSection(section.subsections, titlePattern, exactMatch);
        if (found) return found;
      }
    }
    
    return null;
  }

  /**
   * Replace a code block within a section
   * @param {Object} section - Section containing the code block
   * @param {Object} oldBlock - Code block to replace
   * @param {string} newCode - New code content
   * @param {string} language - Programming language
   */
  replaceCodeBlock(section, oldBlock, newCode, language = null) {
    const lang = language || oldBlock.language || 'typescript';
    const newBlockContent = `\`\`\`${lang}\n${newCode.trim()}\n\`\`\``;
    
    section.content = section.content.replace(oldBlock.fullMatch, newBlockContent);
    
    // Update the code block object
    oldBlock.code = newCode.trim();
    oldBlock.language = lang;
    oldBlock.fullMatch = newBlockContent;
  }

  /**
   * Insert new code block into section
   * @param {Object} section - Target section
   * @param {string} code - Code content
   * @param {string} language - Programming language
   * @param {string} description - Optional description
   */
  insertCodeBlock(section, code, language = 'typescript', description = null) {
    const codeBlock = `${description ? `\n${description}\n` : ''}\`\`\`${language}\n${code.trim()}\n\`\`\`\n`;
    
    // Insert at the end of section content
    section.content += codeBlock;
    
    // Add to code blocks array
    section.codeBlocks.push({
      language,
      code: code.trim(),
      fullMatch: codeBlock,
      description
    });
  }

  /**
   * Update section content while preserving manual text
   * @param {Object} section - Section to update
   * @param {string[]} codeUpdates - Array of code updates
   * @param {boolean} preserveComments - Whether to preserve comments
   */
  updateSectionContent(section, codeUpdates, preserveComments = true) {
    if (!codeUpdates || codeUpdates.length === 0) {
      return;
    }

    let updatedContent = section.content;
    
    // Sort code blocks by position (reverse order to maintain indices)
    const sortedBlocks = [...section.codeBlocks].sort((a, b) => b.startIndex - a.startIndex);
    
    for (let i = 0; i < Math.min(sortedBlocks.length, codeUpdates.length); i++) {
      const block = sortedBlocks[i];
      const newCode = codeUpdates[i];
      
      if (newCode && newCode.trim() !== block.code.trim()) {
        this.replaceCodeBlock(section, block, newCode);
      }
    }
  }

  /**
   * Reassemble sections back into complete markdown
   * @param {Object[]} sections - Array of section objects
   * @returns {string} Complete markdown content
   */
  reassembleSections(sections) {
    return sections.map(section => section.content).join('\n\n');
  }

  /**
   * Get section statistics for reporting
   * @param {Object[]} sections - Array of sections
   * @returns {Object} Statistics object
   */
  getSectionStats(sections) {
    let totalCodeBlocks = 0;
    let totalLines = 0;
    const languageStats = {};
    const levelStats = {};

    for (const section of sections) {
      totalCodeBlocks += section.codeBlocks.length;
      totalLines += section.content.split('\n').length;
      
      levelStats[section.level] = (levelStats[section.level] || 0) + 1;
      
      for (const block of section.codeBlocks) {
        const lang = block.language || 'unknown';
        languageStats[lang] = (languageStats[lang] || 0) + 1;
      }
    }

    return {
      totalSections: sections.length,
      totalCodeBlocks,
      totalLines,
      averageCodeBlocksPerSection: (totalCodeBlocks / sections.length).toFixed(1),
      languageDistribution: languageStats,
      levelDistribution: levelStats
    };
  }

  /**
   * Validate markdown structure
   * @param {string} content - Markdown content to validate
   * @returns {Object} Validation results
   */
  validateMarkdown(content) {
    const issues = [];
    const warnings = [];

    // Check for unmatched code blocks
    const openCodeBlocks = (content.match(/```/g) || []).length;
    if (openCodeBlocks % 2 !== 0) {
      issues.push('Unmatched code blocks detected - missing closing ```');
    }

    // Check for empty code blocks
    const emptyBlocks = content.match(/```\w*\n\s*```/g);
    if (emptyBlocks) {
      warnings.push(`${emptyBlocks.length} empty code blocks found`);
    }

    // Check heading structure
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headings.length === 0) {
      warnings.push('No headings found in document');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      stats: {
        headingCount: headings.length,
        codeBlockCount: (content.match(/```/g) || []).length / 2
      }
    };
  }

  /**
   * Create a backup-friendly diff summary
   * @param {string} originalContent - Original markdown
   * @param {string} updatedContent - Updated markdown
   * @returns {Object} Diff summary
   */
  createDiffSummary(originalContent, updatedContent) {
    const originalLines = originalContent.split('\n');
    const updatedLines = updatedContent.split('\n');
    
    return {
      originalLength: originalLines.length,
      updatedLength: updatedLines.length,
      linesDelta: updatedLines.length - originalLines.length,
      significantChanges: this.findSignificantChanges(originalContent, updatedContent),
      timestamp: new Date().toISOString()
    };
  }

  findSignificantChanges(original, updated) {
    const changes = [];
    
    // Count code block changes
    const originalBlocks = (original.match(/```[\s\S]*?```/g) || []).length;
    const updatedBlocks = (updated.match(/```[\s\S]*?```/g) || []).length;
    
    if (originalBlocks !== updatedBlocks) {
      changes.push(`Code blocks: ${originalBlocks} → ${updatedBlocks}`);
    }

    // Count heading changes
    const originalHeadings = (original.match(/^#{1,6}\s+.+$/gm) || []).length;
    const updatedHeadings = (updated.match(/^#{1,6}\s+.+$/gm) || []).length;
    
    if (originalHeadings !== updatedHeadings) {
      changes.push(`Headings: ${originalHeadings} → ${updatedHeadings}`);
    }

    return changes;
  }
}

module.exports = { MarkdownParser };