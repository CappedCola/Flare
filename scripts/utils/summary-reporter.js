/**
 * SummaryReporter - Generates comprehensive reports of update operations
 * Provides detailed summaries with statistics and change breakdowns
 */
class SummaryReporter {
  constructor() {
    this.colors = {
      success: '\x1b[32m',
      warning: '\x1b[33m', 
      error: '\x1b[31m',
      info: '\x1b[36m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
  }

  /**
   * Generate comprehensive update report
   * @param {Object} data - Report data
   * @returns {string} Formatted report
   */
  generateReport(data) {
    const { changes, executionTime, filesUpdated, timestamp } = data;
    
    let report = '';
    
    // Header
    report += this.generateHeader(timestamp, executionTime);
    
    // Overall summary
    report += this.generateOverallSummary(changes, filesUpdated);
    
    // File-by-file breakdown
    report += this.generateFileBreakdown(changes);
    
    // Change statistics
    report += this.generateChangeStatistics(changes);
    
    // Next steps
    report += this.generateNextSteps(changes);
    
    return report;
  }

  /**
   * Generate report header
   */
  generateHeader(timestamp, executionTime) {
    return `
${this.colors.bold}📊 /update-context Summary Report${this.colors.reset}
${this.colors.info}═══════════════════════════════════════════════════════════${this.colors.reset}

🕒 Completed: ${new Date(timestamp).toLocaleString()}
⚡ Execution Time: ${executionTime}s
📝 Command: /update-context

`;
  }

  /**
   * Generate overall summary
   */
  generateOverallSummary(changes, filesUpdated) {
    const totalChanges = this.getTotalChanges(changes);
    const changesByType = this.getChangesByType(changes);
    
    let summary = `${this.colors.bold}📋 Overall Summary${this.colors.reset}\n`;
    summary += `${this.colors.info}────────────────────${this.colors.reset}\n\n`;
    
    if (totalChanges === 0) {
      summary += `${this.colors.success}✅ No changes detected - documentation is up to date!${this.colors.reset}\n\n`;
      return summary;
    }
    
    summary += `📁 Files Updated: ${filesUpdated}\n`;
    summary += `🔄 Total Changes: ${totalChanges}\n\n`;
    
    // Change type breakdown
    if (changesByType.added > 0) {
      summary += `${this.colors.success}➕ Added: ${changesByType.added} items${this.colors.reset}\n`;
    }
    if (changesByType.modified > 0) {
      summary += `${this.colors.warning}📝 Modified: ${changesByType.modified} items${this.colors.reset}\n`;
    }
    if (changesByType.removed > 0) {
      summary += `${this.colors.error}➖ Removed: ${changesByType.removed} items${this.colors.reset}\n`;
    }
    
    summary += `${this.colors.info}ℹ️  Unchanged: ${changesByType.unchanged} items${this.colors.reset}\n\n`;
    
    return summary;
  }

  /**
   * Generate file-by-file breakdown
   */
  generateFileBreakdown(changes) {
    let breakdown = `${this.colors.bold}📄 File-by-File Breakdown${this.colors.reset}\n`;
    breakdown += `${this.colors.info}─────────────────────────${this.colors.reset}\n\n`;
    
    for (const [fileName, fileChanges] of Object.entries(changes)) {
      if (!fileChanges || typeof fileChanges !== 'object') continue;
      
      const fileTotal = (fileChanges.added?.length || 0) + 
                       (fileChanges.modified?.length || 0) + 
                       (fileChanges.removed?.length || 0);
      
      if (fileTotal === 0) {
        breakdown += `📄 ${fileName}: ${this.colors.success}No changes${this.colors.reset}\n`;
        continue;
      }
      
      breakdown += `📄 ${fileName}: ${fileTotal} changes\n`;
      
      if (fileChanges.added?.length > 0) {
        breakdown += `   ${this.colors.success}➕ ${fileChanges.added.length} added${this.colors.reset}\n`;
        for (const item of fileChanges.added.slice(0, 3)) {
          breakdown += `      • ${item.type}: ${item.name}\n`;
        }
        if (fileChanges.added.length > 3) {
          breakdown += `      ... and ${fileChanges.added.length - 3} more\n`;
        }
      }
      
      if (fileChanges.modified?.length > 0) {
        breakdown += `   ${this.colors.warning}📝 ${fileChanges.modified.length} modified${this.colors.reset}\n`;
        for (const item of fileChanges.modified.slice(0, 3)) {
          breakdown += `      • ${item.type}: ${item.name}`;
          if (item.changes && item.changes.length > 0) {
            breakdown += ` (${item.changes.length} changes)`;
          }
          breakdown += `\n`;
        }
        if (fileChanges.modified.length > 3) {
          breakdown += `      ... and ${fileChanges.modified.length - 3} more\n`;
        }
      }
      
      if (fileChanges.removed?.length > 0) {
        breakdown += `   ${this.colors.error}➖ ${fileChanges.removed.length} removed${this.colors.reset}\n`;
        for (const item of fileChanges.removed.slice(0, 3)) {
          breakdown += `      • ${item.type}: ${item.name}\n`;
        }
        if (fileChanges.removed.length > 3) {
          breakdown += `      ... and ${fileChanges.removed.length - 3} more\n`;
        }
      }
      
      breakdown += '\n';
    }
    
    return breakdown;
  }

  /**
   * Generate change statistics
   */
  generateChangeStatistics(changes) {
    let stats = `${this.colors.bold}📊 Change Statistics${this.colors.reset}\n`;
    stats += `${this.colors.info}──────────────────${this.colors.reset}\n\n`;
    
    const typeStats = this.getChangeTypeStatistics(changes);
    const fileStats = this.getFileStatistics(changes);
    
    // Most active file
    const mostActiveFile = Object.entries(fileStats)
      .sort(([,a], [,b]) => b.total - a.total)[0];
    
    if (mostActiveFile) {
      stats += `🏆 Most Updated File: ${mostActiveFile[0]} (${mostActiveFile[1].total} changes)\n`;
    }
    
    // Type distribution
    if (Object.keys(typeStats).length > 0) {
      stats += `\n📈 Change Types:\n`;
      for (const [type, count] of Object.entries(typeStats).sort(([,a], [,b]) => b - a)) {
        stats += `   • ${type}: ${count}\n`;
      }
    }
    
    // File impact
    const impactedFiles = Object.keys(fileStats).length;
    const totalFiles = 5; // Always 5 context files
    const updatePercentage = ((impactedFiles / totalFiles) * 100).toFixed(1);
    
    stats += `\n📁 File Impact: ${impactedFiles}/${totalFiles} files (${updatePercentage}%)\n`;
    
    return stats + '\n';
  }

  /**
   * Generate next steps recommendations
   */
  generateNextSteps(changes) {
    let nextSteps = `${this.colors.bold}🚀 Next Steps${this.colors.reset}\n`;
    nextSteps += `${this.colors.info}─────────────${this.colors.reset}\n\n`;
    
    const totalChanges = this.getTotalChanges(changes);
    
    if (totalChanges === 0) {
      nextSteps += `${this.colors.success}✅ Documentation is up to date!${this.colors.reset}\n`;
      nextSteps += `   No further action required.\n\n`;
      return nextSteps;
    }
    
    nextSteps += `1. ${this.colors.info}Review Updated Files${this.colors.reset}\n`;
    nextSteps += `   Check the updated context files for accuracy\n\n`;
    
    nextSteps += `2. ${this.colors.info}Validate Code Examples${this.colors.reset}\n`;
    nextSteps += `   Ensure all code examples compile and run correctly\n\n`;
    
    nextSteps += `3. ${this.colors.info}Update Cross-References${this.colors.reset}\n`;
    nextSteps += `   Verify internal links and references are still valid\n\n`;
    
    // Conditional recommendations
    const hasRemovedItems = Object.values(changes).some(fileChanges => 
      fileChanges?.removed && fileChanges.removed.length > 0
    );
    
    if (hasRemovedItems) {
      nextSteps += `4. ${this.colors.warning}Review Removed Items${this.colors.reset}\n`;
      nextSteps += `   Verify that removed items are truly obsolete\n\n`;
    }
    
    const hasLargeChanges = Object.values(changes).some(fileChanges => {
      const total = (fileChanges?.added?.length || 0) + 
                   (fileChanges?.modified?.length || 0) + 
                   (fileChanges?.removed?.length || 0);
      return total > 10;
    });
    
    if (hasLargeChanges) {
      nextSteps += `${hasRemovedItems ? '5' : '4'}. ${this.colors.warning}Large Change Set Detected${this.colors.reset}\n`;
      nextSteps += `   Consider reviewing changes in smaller batches\n\n`;
    }
    
    nextSteps += `${this.colors.info}💡 Tip: Run this command regularly to keep documentation synchronized!${this.colors.reset}\n`;
    
    return nextSteps;
  }

  /**
   * Helper methods for statistics
   */
  getTotalChanges(changes) {
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

  getChangesByType(changes) {
    let added = 0, modified = 0, removed = 0, unchanged = 0;
    
    for (const fileChanges of Object.values(changes)) {
      if (fileChanges && typeof fileChanges === 'object') {
        added += fileChanges.added?.length || 0;
        modified += fileChanges.modified?.length || 0;
        removed += fileChanges.removed?.length || 0;
        unchanged += fileChanges.unchanged?.length || 0;
      }
    }
    
    return { added, modified, removed, unchanged };
  }

  getChangeTypeStatistics(changes) {
    const typeStats = {};
    
    for (const fileChanges of Object.values(changes)) {
      if (!fileChanges || typeof fileChanges !== 'object') continue;
      
      const allChanges = [
        ...(fileChanges.added || []),
        ...(fileChanges.modified || []),
        ...(fileChanges.removed || [])
      ];
      
      for (const change of allChanges) {
        if (change.type) {
          typeStats[change.type] = (typeStats[change.type] || 0) + 1;
        }
      }
    }
    
    return typeStats;
  }

  getFileStatistics(changes) {
    const fileStats = {};
    
    for (const [fileName, fileChanges] of Object.entries(changes)) {
      if (!fileChanges || typeof fileChanges !== 'object') continue;
      
      fileStats[fileName] = {
        added: fileChanges.added?.length || 0,
        modified: fileChanges.modified?.length || 0,
        removed: fileChanges.removed?.length || 0,
        total: (fileChanges.added?.length || 0) + 
               (fileChanges.modified?.length || 0) + 
               (fileChanges.removed?.length || 0)
      };
    }
    
    return fileStats;
  }

  /**
   * Generate a simple status report for CI/CD
   */
  generateStatusReport(changes) {
    const totalChanges = this.getTotalChanges(changes);
    
    if (totalChanges === 0) {
      return 'CLEAN: Documentation up to date';
    } else {
      return `UPDATED: ${totalChanges} changes across documentation`;
    }
  }

  /**
   * Generate JSON report for machine consumption
   */
  generateJSONReport(data) {
    return JSON.stringify({
      timestamp: data.timestamp,
      executionTime: data.executionTime,
      filesUpdated: data.filesUpdated,
      totalChanges: this.getTotalChanges(data.changes),
      changesByType: this.getChangesByType(data.changes),
      changesByFile: this.getFileStatistics(data.changes),
      details: data.changes
    }, null, 2);
  }
}

module.exports = { SummaryReporter };