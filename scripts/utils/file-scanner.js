const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * FileScanner - Recursively scans the Flare app directory for relevant files
 * Handles large codebases efficiently with filtering and exclusion rules
 */
class FileScanner {
  constructor(appDir) {
    this.appDir = appDir;
    this.scannedFiles = [];
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /\.expo/,
      /dist/,
      /build/,
      /coverage/,
      /\.next/,
      /\.cache/,
      /\.DS_Store/,
      /\.vscode/,
      /\.idea/,
      /Thumbs\.db/
    ];
  }

  /**
   * Scan directory with flexible filtering options
   * @param {Object} options - Scanning options
   * @param {string[]} options.extensions - File extensions to include
   * @param {string[]} options.excludePaths - Additional paths to exclude
   * @param {string[]} options.includePaths - Specific paths to include
   * @param {string[]} options.includeConfig - Config files to include regardless of location
   */
  async scanDirectory(options = {}) {
    const startTime = performance.now();
    
    const {
      extensions = ['.ts', '.tsx', '.js', '.jsx'],
      excludePaths = [],
      includePaths = ['app/'],
      includeConfig = ['firebase.json', 'firestore.rules', 'storage.rules']
    } = options;

    console.log('  🔍 Starting directory scan...');
    console.log(`    📂 Scanning: ${this.appDir}`);
    console.log(`    📋 Extensions: ${extensions.join(', ')}`);
    
    this.scannedFiles = [];
    
    // Add exclude patterns from options
    const dynamicExcludes = excludePaths.map(p => new RegExp(p.replace(/\//g, '\\/')));
    const allExcludes = [...this.excludePatterns, ...dynamicExcludes];

    // Scan main app directory
    for (const includePath of includePaths) {
      const fullPath = path.join(this.appDir, '../', includePath);
      if (await this.pathExists(fullPath)) {
        await this.scanPath(fullPath, extensions, allExcludes);
      }
    }

    // Scan for config files in project root
    const projectRoot = path.dirname(this.appDir);
    for (const configFile of includeConfig) {
      const configPath = path.join(projectRoot, configFile);
      if (await this.pathExists(configPath)) {
        this.scannedFiles.push(configPath);
        console.log(`    ⚙️  Found config: ${configFile}`);
      }
    }

    const endTime = performance.now();
    const scanTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`  ✅ Scan completed: ${this.scannedFiles.length} files found in ${scanTime}s`);
    
    return [...this.scannedFiles]; // Return copy to prevent mutation
  }

  async scanPath(dirPath, extensions, excludePatterns) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);
        
        // Check if path should be excluded
        if (this.shouldExclude(relativePath, excludePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanPath(fullPath, extensions, excludePatterns);
        } else if (entry.isFile()) {
          // Check if file has valid extension
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            this.scannedFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`    ⚠️  Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  shouldExclude(filePath, excludePatterns) {
    return excludePatterns.some(pattern => pattern.test(filePath));
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Group files by category for better organization
   */
  categorizeFiles(files) {
    const categories = {
      types: [],
      services: [],
      hooks: [],
      screens: [],
      components: [],
      navigation: [],
      context: [],
      utils: [],
      config: [],
      other: []
    };

    for (const file of files) {
      const relativePath = path.relative(process.cwd(), file);
      
      if (relativePath.includes('/types/')) {
        categories.types.push(file);
      } else if (relativePath.includes('/services/')) {
        categories.services.push(file);
      } else if (relativePath.includes('/hooks/')) {
        categories.hooks.push(file);
      } else if (relativePath.includes('/screens/')) {
        categories.screens.push(file);
      } else if (relativePath.includes('/components/')) {
        categories.components.push(file);
      } else if (relativePath.includes('/navigation/')) {
        categories.navigation.push(file);
      } else if (relativePath.includes('/context/')) {
        categories.context.push(file);
      } else if (relativePath.includes('/utils/')) {
        categories.utils.push(file);
      } else if (this.isConfigFile(file)) {
        categories.config.push(file);
      } else {
        categories.other.push(file);
      }
    }

    return categories;
  }

  isConfigFile(filePath) {
    const filename = path.basename(filePath);
    const configFiles = [
      'firebase.json',
      'firestore.rules',
      'storage.rules',
      'firestore.indexes.json',
      'package.json',
      'tsconfig.json',
      'expo.json',
      'eas.json'
    ];
    
    return configFiles.includes(filename);
  }

  /**
   * Get file statistics for reporting
   */
  getFileStats(files) {
    const categories = this.categorizeFiles(files);
    const extensions = {};
    
    for (const file of files) {
      const ext = path.extname(file);
      extensions[ext] = (extensions[ext] || 0) + 1;
    }

    return {
      totalFiles: files.length,
      categories: Object.fromEntries(
        Object.entries(categories).map(([key, files]) => [key, files.length])
      ),
      extensions,
      largestCategory: Object.entries(categories)
        .sort(([,a], [,b]) => b.length - a.length)[0]
    };
  }
}

module.exports = { FileScanner };