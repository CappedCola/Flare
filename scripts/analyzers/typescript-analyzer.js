const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * TypeScriptAnalyzer - Analyzes TypeScript files using AST parsing
 * Extracts interfaces, types, enums, functions, and classes from the Flare codebase
 */
class TypeScriptAnalyzer {
  constructor() {
    this.ts = null;
    this.program = null;
    this.typeChecker = null;
    this.analysisCache = new Map();
  }

  /**
   * Initialize TypeScript compiler API
   */
  async initializeTypeScript() {
    if (this.ts) return;
    
    try {
      // Try to load TypeScript
      this.ts = require('typescript');
      console.log('    ✅ TypeScript compiler API loaded');
    } catch (error) {
      console.warn('    ⚠️  TypeScript compiler not available, using fallback parsing');
      this.ts = null;
    }
  }

  /**
   * Analyze TypeScript files
   * @param {string[]} files - Array of TypeScript file paths
   * @returns {Object} Analysis results
   */
  async analyze(files) {
    const startTime = performance.now();
    await this.initializeTypeScript();

    const analysis = {
      interfaces: [],
      types: [],
      enums: [],
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      metadata: {
        totalFiles: files.length,
        analysisMethod: this.ts ? 'AST' : 'regex',
        timestamp: new Date().toISOString()
      }
    };

    console.log(`    📊 Analyzing ${files.length} TypeScript files...`);

    if (this.ts) {
      await this.analyzeWithAST(files, analysis);
    } else {
      await this.analyzeWithRegex(files, analysis);
    }

    const endTime = performance.now();
    const analysisTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`    ⚡ TypeScript analysis completed in ${analysisTime}s`);
    console.log(`       - ${analysis.interfaces.length} interfaces`);
    console.log(`       - ${analysis.types.length} type aliases`);
    console.log(`       - ${analysis.enums.length} enums`);
    console.log(`       - ${analysis.functions.length} functions`);
    console.log(`       - ${analysis.classes.length} classes`);

    return analysis;
  }

  /**
   * Analyze using TypeScript AST (preferred method)
   */
  async analyzeWithAST(files, analysis) {
    try {
      // Create TypeScript program
      const configPath = this.ts.findConfigFile('./', this.ts.sys.fileExists, 'tsconfig.json');
      let compilerOptions = {
        target: this.ts.ScriptTarget.ES2020,
        module: this.ts.ModuleKind.ESNext,
        lib: ['ES2020', 'DOM'],
        allowJs: true,
        skipLibCheck: true,
        strict: false
      };

      if (configPath) {
        const configFile = this.ts.readConfigFile(configPath, this.ts.sys.readFile);
        const parsedConfig = this.ts.parseJsonConfigFileContent(configFile.config, this.ts.sys, './');
        compilerOptions = { ...compilerOptions, ...parsedConfig.options };
      }

      this.program = this.ts.createProgram(files, compilerOptions);
      this.typeChecker = this.program.getTypeChecker();

      // Analyze each source file
      for (const sourceFile of this.program.getSourceFiles()) {
        if (files.includes(sourceFile.fileName)) {
          await this.analyzeSourceFile(sourceFile, analysis);
        }
      }
    } catch (error) {
      console.warn('    ⚠️  AST analysis failed, falling back to regex:', error.message);
      await this.analyzeWithRegex(files, analysis);
    }
  }

  /**
   * Analyze individual TypeScript source file
   */
  async analyzeSourceFile(sourceFile, analysis) {
    const relativePath = path.relative(process.cwd(), sourceFile.fileName);
    
    const visit = (node) => {
      try {
        if (this.ts.isInterfaceDeclaration(node)) {
          const iface = this.extractInterface(node, sourceFile);
          if (iface) analysis.interfaces.push(iface);
        } else if (this.ts.isTypeAliasDeclaration(node)) {
          const type = this.extractTypeAlias(node, sourceFile);
          if (type) analysis.types.push(type);
        } else if (this.ts.isEnumDeclaration(node)) {
          const enumDecl = this.extractEnum(node, sourceFile);
          if (enumDecl) analysis.enums.push(enumDecl);
        } else if (this.ts.isFunctionDeclaration(node)) {
          const func = this.extractFunction(node, sourceFile);
          if (func) analysis.functions.push(func);
        } else if (this.ts.isClassDeclaration(node)) {
          const cls = this.extractClass(node, sourceFile);
          if (cls) analysis.classes.push(cls);
        } else if (this.ts.isImportDeclaration(node)) {
          const imp = this.extractImport(node, sourceFile);
          if (imp) analysis.imports.push(imp);
        } else if (this.ts.isExportDeclaration(node) || this.ts.isExportAssignment(node)) {
          const exp = this.extractExport(node, sourceFile);
          if (exp) analysis.exports.push(exp);
        }
      } catch (error) {
        // Continue processing even if individual node fails
        console.warn(`      ⚠️  Error processing node in ${relativePath}:`, error.message);
      }
      
      this.ts.forEachChild(node, visit);
    };

    this.ts.forEachChild(sourceFile, visit);
  }

  /**
   * Extract interface declaration
   */
  extractInterface(node, sourceFile) {
    const name = node.name?.text;
    if (!name) return null;

    const members = node.members?.map(member => {
      const memberName = member.name?.text || member.name?.escapedText;
      const isOptional = !!member.questionToken;
      
      let type = 'unknown';
      try {
        if (member.type) {
          type = this.typeChecker?.typeToString(
            this.typeChecker.getTypeFromTypeNode(member.type)
          ) || this.getTypeStringFromNode(member.type);
        }
      } catch (error) {
        type = this.getTypeStringFromNode(member.type) || 'unknown';
      }

      return {
        name: memberName,
        type,
        optional: isOptional,
        comments: this.getComments(member)
      };
    }).filter(Boolean) || [];

    return {
      name,
      filePath: sourceFile.fileName,
      relativePath: path.relative(process.cwd(), sourceFile.fileName),
      members,
      comments: this.getComments(node),
      exported: this.isExported(node),
      heritage: this.getHeritageClause(node),
      generics: this.getGenericParameters(node)
    };
  }

  /**
   * Extract type alias declaration
   */
  extractTypeAlias(node, sourceFile) {
    const name = node.name?.text;
    if (!name) return null;

    let type = 'unknown';
    try {
      if (node.type) {
        type = this.typeChecker?.typeToString(
          this.typeChecker.getTypeFromTypeNode(node.type)
        ) || this.getTypeStringFromNode(node.type);
      }
    } catch (error) {
      type = this.getTypeStringFromNode(node.type) || 'unknown';
    }

    return {
      name,
      filePath: sourceFile.fileName,
      relativePath: path.relative(process.cwd(), sourceFile.fileName),
      type,
      comments: this.getComments(node),
      exported: this.isExported(node),
      generics: this.getGenericParameters(node)
    };
  }

  /**
   * Extract enum declaration
   */
  extractEnum(node, sourceFile) {
    const name = node.name?.text;
    if (!name) return null;

    const members = node.members?.map(member => {
      const memberName = member.name?.text || member.name?.escapedText;
      let value = null;
      
      if (member.initializer) {
        if (this.ts.isStringLiteral(member.initializer)) {
          value = member.initializer.text;
        } else if (this.ts.isNumericLiteral(member.initializer)) {
          value = member.initializer.text;
        }
      }

      return {
        name: memberName,
        value,
        comments: this.getComments(member)
      };
    }).filter(Boolean) || [];

    return {
      name,
      filePath: sourceFile.fileName,
      relativePath: path.relative(process.cwd(), sourceFile.fileName),
      members,
      comments: this.getComments(node),
      exported: this.isExported(node)
    };
  }

  /**
   * Extract function declaration
   */
  extractFunction(node, sourceFile) {
    const name = node.name?.text;
    if (!name) return null;

    const parameters = node.parameters?.map(param => {
      const paramName = param.name?.text;
      const isOptional = !!param.questionToken;
      let type = 'any';
      
      try {
        if (param.type) {
          type = this.typeChecker?.typeToString(
            this.typeChecker.getTypeFromTypeNode(param.type)
          ) || this.getTypeStringFromNode(param.type);
        }
      } catch (error) {
        type = this.getTypeStringFromNode(param.type) || 'any';
      }

      return {
        name: paramName,
        type,
        optional: isOptional,
        hasDefaultValue: !!param.initializer
      };
    }).filter(Boolean) || [];

    let returnType = 'void';
    try {
      if (node.type) {
        returnType = this.typeChecker?.typeToString(
          this.typeChecker.getTypeFromTypeNode(node.type)
        ) || this.getTypeStringFromNode(node.type);
      }
    } catch (error) {
      returnType = this.getTypeStringFromNode(node.type) || 'void';
    }

    return {
      name,
      filePath: sourceFile.fileName,
      relativePath: path.relative(process.cwd(), sourceFile.fileName),
      parameters,
      returnType,
      isAsync: !!node.modifiers?.some(mod => mod.kind === this.ts.SyntaxKind.AsyncKeyword),
      comments: this.getComments(node),
      exported: this.isExported(node)
    };
  }

  /**
   * Extract class declaration
   */
  extractClass(node, sourceFile) {
    const name = node.name?.text;
    if (!name) return null;

    const methods = [];
    const properties = [];

    for (const member of node.members || []) {
      if (this.ts.isMethodDeclaration(member)) {
        const method = this.extractMethod(member);
        if (method) methods.push(method);
      } else if (this.ts.isPropertyDeclaration(member)) {
        const property = this.extractProperty(member);
        if (property) properties.push(property);
      }
    }

    return {
      name,
      filePath: sourceFile.fileName,
      relativePath: path.relative(process.cwd(), sourceFile.fileName),
      methods,
      properties,
      heritage: this.getHeritageClause(node),
      comments: this.getComments(node),
      exported: this.isExported(node),
      isAbstract: !!node.modifiers?.some(mod => mod.kind === this.ts.SyntaxKind.AbstractKeyword)
    };
  }

  /**
   * Fallback regex-based analysis when TypeScript compiler is not available
   */
  async analyzeWithRegex(files, analysis) {
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Extract interfaces
        const interfaces = this.extractInterfacesWithRegex(content, filePath, relativePath);
        analysis.interfaces.push(...interfaces);
        
        // Extract type aliases
        const types = this.extractTypesWithRegex(content, filePath, relativePath);
        analysis.types.push(...types);
        
        // Extract enums
        const enums = this.extractEnumsWithRegex(content, filePath, relativePath);
        analysis.enums.push(...enums);
        
        // Extract functions
        const functions = this.extractFunctionsWithRegex(content, filePath, relativePath);
        analysis.functions.push(...functions);
        
        // Extract classes
        const classes = this.extractClassesWithRegex(content, filePath, relativePath);
        analysis.classes.push(...classes);

      } catch (error) {
        console.warn(`    ⚠️  Error analyzing ${filePath}:`, error.message);
      }
    }
  }

  /**
   * Extract interfaces using regex patterns
   */
  extractInterfacesWithRegex(content, filePath, relativePath) {
    const interfaces = [];
    const interfaceRegex = /(export\s+)?interface\s+(\w+)(?:<[^>]*>)?\s*(?:extends\s+[^{]+)?\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const exported = !!match[1];
      const name = match[2];
      const membersText = match[3];
      
      const members = this.parseInterfaceMembersRegex(membersText);
      
      interfaces.push({
        name,
        filePath,
        relativePath,
        members,
        exported,
        comments: [],
        heritage: null,
        generics: null
      });
    }

    return interfaces;
  }

  /**
   * Parse interface members from text using regex
   */
  parseInterfaceMembersRegex(membersText) {
    const members = [];
    const lines = membersText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }
      
      const memberMatch = trimmed.match(/(\w+)(\??):\s*([^;]+);?/);
      if (memberMatch) {
        members.push({
          name: memberMatch[1],
          type: memberMatch[3].trim(),
          optional: !!memberMatch[2],
          comments: []
        });
      }
    }
    
    return members;
  }

  /**
   * Helper methods
   */
  getComments(node) {
    // Implementation to extract JSDoc comments
    const comments = [];
    
    if (this.ts && this.ts.getLeadingCommentRanges) {
      const sourceFile = node.getSourceFile();
      const fullText = sourceFile.getFullText();
      const commentRanges = this.ts.getLeadingCommentRanges(fullText, node.getFullStart()) || [];
      
      for (const range of commentRanges) {
        const commentText = fullText.substring(range.pos, range.end);
        if (commentText.includes('/**') || commentText.includes('//')) {
          comments.push(commentText.trim());
        }
      }
    }
    
    return comments;
  }

  isExported(node) {
    if (!this.ts) return false;
    
    return node.modifiers?.some(modifier => 
      modifier.kind === this.ts.SyntaxKind.ExportKeyword
    ) || false;
  }

  getHeritageClause(node) {
    if (!node.heritageClauses || !this.ts) return null;
    
    for (const clause of node.heritageClauses) {
      if (clause.token === this.ts.SyntaxKind.ExtendsKeyword) {
        return clause.types?.map(type => type.expression?.text).filter(Boolean) || [];
      }
    }
    
    return null;
  }

  getGenericParameters(node) {
    if (!node.typeParameters || !this.ts) return null;
    
    return node.typeParameters.map(param => ({
      name: param.name?.text,
      constraint: param.constraint ? this.getTypeStringFromNode(param.constraint) : null,
      default: param.default ? this.getTypeStringFromNode(param.default) : null
    }));
  }

  getTypeStringFromNode(typeNode) {
    if (!typeNode || !this.ts) return 'unknown';
    
    switch (typeNode.kind) {
      case this.ts.SyntaxKind.StringKeyword:
        return 'string';
      case this.ts.SyntaxKind.NumberKeyword:
        return 'number';
      case this.ts.SyntaxKind.BooleanKeyword:
        return 'boolean';
      case this.ts.SyntaxKind.VoidKeyword:
        return 'void';
      case this.ts.SyntaxKind.AnyKeyword:
        return 'any';
      case this.ts.SyntaxKind.UnknownKeyword:
        return 'unknown';
      case this.ts.SyntaxKind.TypeReference:
        return typeNode.typeName?.text || 'unknown';
      case this.ts.SyntaxKind.ArrayType:
        const elementType = this.getTypeStringFromNode(typeNode.elementType);
        return `${elementType}[]`;
      default:
        return 'unknown';
    }
  }

  // Placeholder methods for regex-based extraction
  extractTypesWithRegex(content, filePath, relativePath) {
    const types = [];
    const typeRegex = /(export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*([^;]+);/g;
    let match;

    while ((match = typeRegex.exec(content)) !== null) {
      types.push({
        name: match[2],
        filePath,
        relativePath,
        type: match[3].trim(),
        exported: !!match[1],
        comments: [],
        generics: null
      });
    }

    return types;
  }

  extractEnumsWithRegex(content, filePath, relativePath) {
    // Simplified enum extraction
    return [];
  }

  extractFunctionsWithRegex(content, filePath, relativePath) {
    const functions = [];
    const functionRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\([^)]*\)[^{]*\{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[3],
        filePath,
        relativePath,
        exported: !!match[1],
        isAsync: !!match[2],
        parameters: [], // Simplified
        returnType: 'unknown',
        comments: []
      });
    }

    return functions;
  }

  extractClassesWithRegex(content, filePath, relativePath) {
    // Simplified class extraction
    return [];
  }

  extractMethod(member) {
    // Extract method details from class member
    return null;
  }

  extractProperty(member) {
    // Extract property details from class member
    return null;
  }

  extractImport(node, sourceFile) {
    // Extract import information
    return null;
  }

  extractExport(node, sourceFile) {
    // Extract export information
    return null;
  }
}

module.exports = { TypeScriptAnalyzer };