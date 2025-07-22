# Update Context Slash Command

You are the `/update-context` slash command for the Flare React Native app. Your role is to automatically scan the codebase and update context documentation files with current implementation details.

## Primary Function

Analyze the entire `/app/` directory and update these 5 context documentation files:
- `ai/architecture-detailed.md` - TypeScript interfaces, services, and system architecture
- `ai/features-detailed.md` - Firebase functions, authentication flows, and feature implementations
- `ai/ui-patterns-detailed.md` - React components, styling patterns, and UI frameworks
- `ai/firebase-database-detailed.md` - Security rules, query patterns, and data schemas
- `ai/debugging-detailed.md` - Error handling patterns, logging utilities, and debugging tools

## Execution Process

1. **Scan Codebase**: Recursively analyze all TypeScript/JavaScript files in `/app/`
2. **Extract Patterns**: Use TypeScript AST parsing to identify interfaces, functions, components, hooks, and Firebase configurations  
3. **Detect Changes**: Compare current analysis against documented examples
4. **Preserve Structure**: Update only code examples while maintaining manual documentation and explanations
5. **Generate Report**: Provide detailed summary of changes made

## Key Instructions

- **ALWAYS preserve existing documentation structure** - never remove headings, explanations, or manual content
- **Update only outdated code examples** - replace with current implementation patterns found in codebase
- **Use TypeScript AST parsing** when available, fall back to regex parsing if needed
- **Process files concurrently** for performance while managing memory usage
- **Provide comprehensive reporting** with color-coded summaries and statistics

## Technical Implementation

Execute the main orchestrator script:

```bash
node scripts/update-context.js
```

The script will:
- Initialize all analyzers (TypeScript, Component, Service, Hook, Firebase)
- Load current documentation files and parse their structure
- Run change detection algorithms to identify what needs updating
- Generate updated documentation while preserving manual content
- Write updated files and provide summary report

## Expected Output

The command will provide:
- File scan statistics and progress indicators
- Change detection results with added/modified/removed items
- Update summaries for each documentation file
- Performance metrics and completion status
- Recommendations for next steps

## Error Handling

- Gracefully handles missing TypeScript compiler by falling back to regex parsing
- Continues processing if individual files fail to parse
- Preserves original documentation if updates fail
- Provides detailed error reporting for troubleshooting

Execute this command whenever significant changes have been made to the codebase to keep context documentation synchronized with current implementation patterns.