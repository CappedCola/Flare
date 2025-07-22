const fs = require('fs').promises;
const path = require('path');

/**
 * HookAnalyzer - Analyzes custom React hooks
 * Extracts hook signatures, dependencies, and usage patterns
 */
class HookAnalyzer {
  async analyze(files) {
    const hooks = [];
    
    console.log(`    🪝 Analyzing ${files.length} hook files...`);
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(process.cwd(), filePath);
        
        const hookAnalysis = await this.analyzeHookFile(content, filePath, relativePath);
        if (hookAnalysis) {
          hooks.push(hookAnalysis);
        }
        
      } catch (error) {
        console.warn(`    ⚠️  Error analyzing ${filePath}:`, error.message);
      }
    }

    console.log(`       - ${hooks.length} custom hooks analyzed`);
    
    return {
      hooks,
      patterns: this.extractHookPatterns(hooks),
      summary: {
        totalHooks: hooks.length,
        mostComplexHook: this.findMostComplexHook(hooks)
      }
    };
  }

  async analyzeHookFile(content, filePath, relativePath) {
    const hookName = path.basename(filePath, path.extname(filePath));
    
    // Only analyze files that export hooks
    if (!hookName.startsWith('use') || !content.includes('export')) {
      return null;
    }

    return {
      name: hookName,
      filePath,
      relativePath,
      signature: this.extractHookSignature(content, hookName),
      dependencies: this.extractDependencies(content),
      returnType: this.extractReturnType(content),
      internalHooks: this.extractInternalHooks(content),
      complexity: this.calculateComplexity(content)
    };
  }

  extractHookSignature(content, hookName) {
    const regex = new RegExp(`export\\s+const\\s+${hookName}\\s*=\\s*\\(([^)]*)\\)`, 'g');
    const match = content.match(regex);
    
    if (match) {
      return match[0];
    }
    
    return null;
  }

  extractDependencies(content) {
    const deps = [];
    const importRegex = /import\s+.*?from\s+['"](.*?)['"];/g;
    const matches = content.matchAll(importRegex);
    
    for (const match of matches) {
      deps.push(match[1]);
    }
    
    return deps;
  }

  extractReturnType(content) {
    // Simple return type extraction
    const returnMatch = content.match(/return\s+(\{[^}]+\}|\w+)/);
    return returnMatch ? returnMatch[1] : 'unknown';
  }

  extractInternalHooks(content) {
    const hooks = [];
    const hookRegex = /use[A-Z]\w*\(/g;
    const matches = content.matchAll(hookRegex);
    
    for (const match of matches) {
      const hookName = match[0].slice(0, -1); // Remove the '('
      if (!hooks.includes(hookName)) {
        hooks.push(hookName);
      }
    }
    
    return hooks;
  }

  calculateComplexity(content) {
    const useEffectCount = (content.match(/useEffect/g) || []).length;
    const conditionalCount = (content.match(/if\s*\(/g) || []).length;
    const loopCount = (content.match(/for\s*\(|while\s*\(|\.map\s*\(|\.filter\s*\(/g) || []).length;
    
    return {
      effects: useEffectCount,
      conditionals: conditionalCount,
      loops: loopCount,
      score: useEffectCount * 2 + conditionalCount + loopCount
    };
  }

  extractHookPatterns(hooks) {
    return {
      mostUsedInternalHooks: this.getMostUsedInternalHooks(hooks),
      complexityDistribution: this.getComplexityDistribution(hooks),
      commonPatterns: this.identifyCommonPatterns(hooks)
    };
  }

  getMostUsedInternalHooks(hooks) {
    const usage = {};
    
    for (const hook of hooks) {
      for (const internalHook of hook.internalHooks) {
        usage[internalHook] = (usage[internalHook] || 0) + 1;
      }
    }
    
    return Object.entries(usage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }

  getComplexityDistribution(hooks) {
    const distribution = { simple: 0, medium: 0, complex: 0 };
    
    for (const hook of hooks) {
      if (hook.complexity.score <= 3) {
        distribution.simple++;
      } else if (hook.complexity.score <= 8) {
        distribution.medium++;
      } else {
        distribution.complex++;
      }
    }
    
    return distribution;
  }

  identifyCommonPatterns(hooks) {
    // Identify common patterns in hooks
    return [];
  }

  findMostComplexHook(hooks) {
    if (hooks.length === 0) return null;
    
    return hooks.reduce((most, current) => 
      current.complexity.score > most.complexity.score ? current : most
    );
  }
}

module.exports = { HookAnalyzer };