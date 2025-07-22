#!/usr/bin/env node

/**
 * Flare /update-context Slash Command
 * 
 * Automatically updates all 5 context documentation files by analyzing the current
 * React Native codebase and preserving manual content while updating code examples.
 * 
 * Usage: node scripts/update-context.js
 * Or as slash command: /update-context
 */

const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

// Import analyzers
const { TypeScriptAnalyzer } = require('./analyzers/typescript-analyzer');
const { ComponentAnalyzer } = require('./analyzers/component-analyzer');
const { ServiceAnalyzer } = require('./analyzers/service-analyzer');
const { HookAnalyzer } = require('./analyzers/hook-analyzer');
const { FirebaseAnalyzer } = require('./analyzers/firebase-analyzer');

// Import updaters
const { ArchitectureUpdater } = require('./updaters/architecture-updater');
const { FeaturesUpdater } = require('./updaters/features-updater');
const { UIUpdater } = require('./updaters/ui-updater');
const { FirebaseUpdater } = require('./updaters/firebase-updater');
const { DebugUpdater } = require('./updaters/debug-updater');

// Import utilities
const { FileScanner } = require('./utils/file-scanner');
const { ChangeDetector } = require('./utils/change-detector');
const { MarkdownParser } = require('./utils/markdown-parser');
const { SummaryReporter } = require('./utils/summary-reporter');

class UpdateContextOrchestrator {
  constructor() {
    this.startTime = performance.now();
    this.projectRoot = process.cwd();
    this.appDir = path.join(this.projectRoot, 'app');
    this.contextDir = path.join(this.projectRoot, 'context');
    
    console.log('🚀 Initializing Update Context Orchestrator...');
    console.log(`📁 Project root: ${this.projectRoot}`);
    console.log(`📱 App directory: ${this.appDir}`);
    console.log(`📚 Context directory: ${this.contextDir}`);

    this.scanner = new FileScanner(this.appDir);
    this.detector = new ChangeDetector();
    this.parser = new MarkdownParser();
    this.reporter = new SummaryReporter();

    // Initialize analyzers
    this.analyzers = {
      typescript: new TypeScriptAnalyzer(),
      component: new ComponentAnalyzer(),
      service: new ServiceAnalyzer(),
      hook: new HookAnalyzer(),
      firebase: new FirebaseAnalyzer()
    };

    // Initialize updaters
    this.updaters = {
      architecture: new ArchitectureUpdater(),
      features: new FeaturesUpdater(),
      ui: new UIUpdater(),
      firebase: new FirebaseUpdater(),
      debug: new DebugUpdater()
    };

    // Context files to update
    this.contextFiles = [
      'architecture-detailed.md',
      'features-detailed.md',
      'ui-patterns-detailed.md',
      'firebase-database-detailed.md',
      'debugging-detailed.md'
    ];
  }

  async execute() {
    try {
      console.log('\n🔄 Starting /update-context command execution...\n');

      // Phase 1: Discovery and scanning
      console.log('📋 Phase 1: Scanning codebase...');
      const files = await this.scanCodebase();
      console.log(`✅ Found ${files.length} files to analyze\n`);

      // Phase 2: Code analysis
      console.log('🔍 Phase 2: Analyzing code patterns...');
      const analysis = await this.analyzeCodebase(files);
      console.log('✅ Code analysis completed\n');

      // Phase 3: Load current documentation
      console.log('📖 Phase 3: Loading existing documentation...');
      const currentDocs = await this.loadContextFiles();
      console.log('✅ Documentation loaded\n');

      // Phase 4: Change detection
      console.log('🔎 Phase 4: Detecting changes...');
      const changes = await this.detectChanges(analysis, currentDocs);
      console.log(`✅ Change detection completed - ${this.getChangeCount(changes)} changes found\n`);

      // Phase 5: Generate updates
      console.log('⚡ Phase 5: Generating updated documentation...');
      const updatedDocs = await this.generateUpdates(analysis, currentDocs, changes);
      console.log('✅ Updates generated\n');

      // Phase 6: Write updated files
      console.log('💾 Phase 6: Writing updated files...');
      await this.writeUpdatedContextFiles(updatedDocs);
      console.log('✅ Files written successfully\n');

      // Phase 7: Generate summary report
      const summary = this.generateSummaryReport(changes);
      
      const endTime = performance.now();
      const executionTime = ((endTime - this.startTime) / 1000).toFixed(2);
      
      console.log('🎉 Update completed successfully!');
      console.log(`⏱️  Execution time: ${executionTime}s\n`);
      console.log(summary);
      
      return summary;

    } catch (error) {
      console.error('\n❌ Update failed with error:');
      console.error(error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  async scanCodebase() {
    return await this.scanner.scanDirectory({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      excludePaths: ['node_modules', '.git', '.expo', 'dist', 'build'],
      includePaths: ['app/'],
      includeConfig: ['firebase.json', 'firestore.rules', 'storage.rules']
    });
  }

  async analyzeCodebase(files) {
    const analysis = {
      typescript: null,
      components: null,
      services: null,
      hooks: null,
      firebase: null,
      metadata: {
        totalFiles: files.length,
        analyzedAt: new Date().toISOString(),
        version: require('../package.json').version || '1.0.0'
      }
    };

    console.log('  🔧 Analyzing TypeScript patterns...');
    analysis.typescript = await this.analyzers.typescript.analyze(
      files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    );
    
    console.log('  ⚛️  Analyzing React components...');
    analysis.components = await this.analyzers.component.analyze(
      files.filter(f => f.includes('/screens/') || f.includes('/components/'))
    );
    
    console.log('  🔌 Analyzing service layer...');
    analysis.services = await this.analyzers.service.analyze(
      files.filter(f => f.includes('/services/'))
    );
    
    console.log('  🪝 Analyzing custom hooks...');
    analysis.hooks = await this.analyzers.hook.analyze(
      files.filter(f => f.includes('/hooks/'))
    );
    
    console.log('  🔥 Analyzing Firebase patterns...');
    analysis.firebase = await this.analyzers.firebase.analyze(files);

    return analysis;
  }

  async loadContextFiles() {
    const docs = {};
    
    for (const filename of this.contextFiles) {
      const filePath = path.join(this.contextDir, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        docs[filename] = {
          content,
          sections: this.parser.parseSections(content),
          lastModified: (await fs.stat(filePath)).mtime
        };
        console.log(`  📄 Loaded ${filename} (${content.length} chars)`);
      } catch (error) {
        console.warn(`  ⚠️  Could not load ${filename}: ${error.message}`);
        docs[filename] = {
          content: '',
          sections: [],
          lastModified: null
        };
      }
    }
    
    return docs;
  }

  async detectChanges(analysis, currentDocs) {
    console.log('  🔍 Detecting interface changes...');
    const changes = {};
    
    for (const [filename, updaterKey] of [
      ['architecture-detailed.md', 'architecture'],
      ['features-detailed.md', 'features'],
      ['ui-patterns-detailed.md', 'ui'],
      ['firebase-database-detailed.md', 'firebase'],
      ['debugging-detailed.md', 'debug']
    ]) {
      console.log(`    📊 Analyzing changes for ${filename}...`);
      changes[filename] = await this.detector.detectChanges(
        analysis, 
        currentDocs[filename], 
        updaterKey
      );
    }
    
    return changes;
  }

  async generateUpdates(analysis, currentDocs, changes) {
    const updatedDocs = {};
    
    console.log('  🏗️  Updating architecture documentation...');
    updatedDocs['architecture-detailed.md'] = await this.updaters.architecture.update(
      analysis, currentDocs['architecture-detailed.md'], changes['architecture-detailed.md']
    );
    
    console.log('  ⚙️  Updating features documentation...');
    updatedDocs['features-detailed.md'] = await this.updaters.features.update(
      analysis, currentDocs['features-detailed.md'], changes['features-detailed.md']
    );
    
    console.log('  🎨 Updating UI patterns documentation...');
    updatedDocs['ui-patterns-detailed.md'] = await this.updaters.ui.update(
      analysis, currentDocs['ui-patterns-detailed.md'], changes['ui-patterns-detailed.md']
    );
    
    console.log('  🔥 Updating Firebase documentation...');
    updatedDocs['firebase-database-detailed.md'] = await this.updaters.firebase.update(
      analysis, currentDocs['firebase-database-detailed.md'], changes['firebase-database-detailed.md']
    );
    
    console.log('  🐛 Updating debugging documentation...');
    updatedDocs['debugging-detailed.md'] = await this.updaters.debug.update(
      analysis, currentDocs['debugging-detailed.md'], changes['debugging-detailed.md']
    );
    
    return updatedDocs;
  }

  async writeUpdatedContextFiles(updatedDocs) {
    // Create backup directory
    const backupDir = path.join(this.contextDir, '.backup');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const specificBackupDir = path.join(backupDir, timestamp);
    
    await fs.mkdir(specificBackupDir, { recursive: true });
    console.log(`  💾 Created backup directory: ${specificBackupDir}`);

    // Backup existing files and write new ones
    for (const [filename, content] of Object.entries(updatedDocs)) {
      const originalPath = path.join(this.contextDir, filename);
      const backupPath = path.join(specificBackupDir, filename);
      const newPath = originalPath;

      // Backup original file if it exists
      try {
        await fs.copyFile(originalPath, backupPath);
        console.log(`    📋 Backed up ${filename}`);
      } catch (error) {
        console.log(`    📄 ${filename} is new file (no backup needed)`);
      }

      // Write updated content
      await fs.writeFile(newPath, content, 'utf-8');
      console.log(`    ✅ Updated ${filename} (${content.length} chars)`);
    }
  }

  getChangeCount(changes) {
    let total = 0;
    for (const fileChanges of Object.values(changes)) {
      if (fileChanges && typeof fileChanges === 'object') {
        total += (fileChanges.added?.length || 0) + 
                (fileChanges.modified?.length || 0) + 
                (fileChanges.removed?.length || 0);
      }
    }
    return total;
  }

  generateSummaryReport(changes) {
    return this.reporter.generateReport({
      changes,
      executionTime: ((performance.now() - this.startTime) / 1000).toFixed(2),
      filesUpdated: this.contextFiles.length,
      timestamp: new Date().toISOString()
    });
  }
}

// CLI entry point
if (require.main === module) {
  const orchestrator = new UpdateContextOrchestrator();
  
  orchestrator.execute()
    .then(summary => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error during execution:');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { UpdateContextOrchestrator };