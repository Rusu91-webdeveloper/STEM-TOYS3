/**
 * Tree shaking and import optimization utilities for STEM-TOYS2
 */

import { logger } from "./logger";

// Import analysis configuration
export interface ImportOptimizationConfig {
  enabled: boolean;
  analyzeUnusedImports: boolean;
  optimizeBarrelExports: boolean;
  preferNamedImports: boolean;
  excludePatterns: string[];
  libraryOptimizations: {
    lodash: boolean;
    reactIcons: boolean;
    materialUI: boolean;
    antd: boolean;
  };
}

// Default configuration
const defaultConfig: ImportOptimizationConfig = {
  enabled: process.env.NODE_ENV === 'production',
  analyzeUnusedImports: true,
  optimizeBarrelExports: true,
  preferNamedImports: true,
  excludePatterns: [
    'node_modules',
    '.next',
    'dist',
    'build'
  ],
  libraryOptimizations: {
    lodash: true,
    reactIcons: true,
    materialUI: true,
    antd: true
  }
};

// Import optimization patterns
export const ImportOptimizations = {
  // Lodash optimizations
  lodash: {
    // ❌ Bad: Imports entire lodash library
    bad: "import _ from 'lodash'",
    // ✅ Good: Import only what you need
    good: "import { debounce, throttle } from 'lodash'",
    // 🚀 Best: Individual function imports
    best: "import debounce from 'lodash/debounce'"
  },

  // React Icons optimizations
  reactIcons: {
    bad: "import * as Icons from 'react-icons'",
    good: "import { FiHome, FiUser } from 'react-icons/fi'",
    best: "import { FiHome } from 'react-icons/fi'"
  },

  // Date libraries
  date: {
    bad: "import moment from 'moment'",
    good: "import { format } from 'date-fns'",
    best: "import format from 'date-fns/format'"
  },

  // UI Libraries
  ui: {
    bad: "import * from '@/components/ui'",
    good: "import { Button, Input } from '@/components/ui'",
    best: "import Button from '@/components/ui/button'"
  }
};

// Tree shaking analyzer
export class TreeShakingAnalyzer {
  private config: ImportOptimizationConfig;
  private importStats = {
    totalImports: 0,
    optimizedImports: 0,
    barrelImports: 0,
    defaultImports: 0,
    namedImports: 0,
    namespaceImports: 0
  };

  constructor(config: Partial<ImportOptimizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enabled) {
      logger.info('Tree shaking analysis enabled', {
        optimizeBarrels: this.config.optimizeBarrelExports,
        preferNamed: this.config.preferNamedImports
      });
    }
  }

  /**
   * Analyze import statements in code
   */
  analyzeImports(code: string, filePath: string): {
    issues: Array<{
      line: number;
      type: 'barrel' | 'namespace' | 'unused' | 'inefficient';
      message: string;
      suggestion?: string;
    }>;
    stats: typeof this.importStats;
  } {
    const issues: Array<{
      line: number;
      type: 'barrel' | 'namespace' | 'unused' | 'inefficient';
      message: string;
      suggestion?: string;
    }> = [];

    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for import statements
      if (line.trim().startsWith('import')) {
        this.importStats.totalImports++;
        
        // Analyze import patterns
        this.analyzeImportLine(line, lineNumber, issues);
      }
    });

    logger.debug('Import analysis complete', {
      file: filePath,
      issues: issues.length,
      stats: this.importStats
    });

    return {
      issues,
      stats: { ...this.importStats }
    };
  }

  /**
   * Analyze individual import line
   */
  private analyzeImportLine(
    this: TreeShakingAnalyzer,
    line: string, 
    lineNumber: number, 
    issues: Array<{
      line: number;
      type: 'barrel' | 'namespace' | 'unused' | 'inefficient';
      message: string;
      suggestion?: string;
    }>
  ): void {
    // Namespace imports (import * as)
    if (line.includes('import * as') || line.includes('import *')) {
      this.importStats.namespaceImports++;
      issues.push({
        line: lineNumber,
        type: 'namespace',
        message: 'Namespace import may prevent tree shaking',
        suggestion: 'Use named imports instead: import { specific, functions } from "..."'
      });
    }

    // Default imports
    else if (line.match(/import\s+\w+\s+from/)) {
      this.importStats.defaultImports++;
    }

    // Named imports
    else if (line.includes('{') && line.includes('}')) {
      this.importStats.namedImports++;
    }

    // Check for barrel imports
    if (this.isBarrelImport(line)) {
      this.importStats.barrelImports++;
      issues.push({
        line: lineNumber,
        type: 'barrel',
        message: 'Barrel import may include unnecessary code',
        suggestion: 'Import directly from source files when possible'
      });
    }

    // Check for inefficient library imports
    this.checkLibraryOptimizations(line, lineNumber, issues);
  }

  /**
   * Check if import is a barrel import
   */
  private isBarrelImport(line: string): boolean {
    // Common barrel import patterns
    const barrelPatterns = [
      /from\s+['"]@\/components['"]/, // from "@/components"
      /from\s+['"]@\/lib['"]/, // from "@/lib"
      /from\s+['"]@\/utils['"]/, // from "@/utils"
      /from\s+['"]\.\.?\/index['"]/, // from "./index" or "../index"
    ];

    return barrelPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Check for library-specific optimizations
   */
  private checkLibraryOptimizations(
    this: TreeShakingAnalyzer,
    line: string, 
    lineNumber: number, 
    issues: Array<{
      line: number;
      type: 'barrel' | 'namespace' | 'unused' | 'inefficient';
      message: string;
      suggestion?: string;
    }>
  ): void {
    // Lodash optimizations
    if (this.config.libraryOptimizations.lodash && line.includes('lodash')) {
      if (line.includes("import _ from 'lodash'") || line.includes("import * as _ from 'lodash'")) {
        issues.push({
          line: lineNumber,
          type: 'inefficient',
          message: 'Importing entire lodash library',
          suggestion: 'Use specific imports: import debounce from "lodash/debounce"'
        });
      }
    }

    // React Icons optimizations
    if (this.config.libraryOptimizations.reactIcons && line.includes('react-icons')) {
      if (line.includes('import * as')) {
        issues.push({
          line: lineNumber,
          type: 'inefficient',
          message: 'Importing all react-icons',
          suggestion: 'Use specific icon imports: import { FiHome } from "react-icons/fi"'
        });
      }
    }

    // Date library optimizations
    if (line.includes('moment') && !line.includes('moment/locale')) {
      issues.push({
        line: lineNumber,
        type: 'inefficient',
        message: 'Moment.js is large and not tree-shakeable',
        suggestion: 'Consider using date-fns or dayjs for better tree shaking'
      });
    }
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.importStats;

    if (stats.namespaceImports > stats.namedImports * 0.2) {
      recommendations.push('Reduce namespace imports (import *) in favor of named imports');
    }

    if (stats.barrelImports > stats.totalImports * 0.3) {
      recommendations.push('Consider reducing barrel imports for better tree shaking');
    }

    if (stats.totalImports > 50) {
      recommendations.push('High number of imports detected. Consider code splitting or lazy loading');
    }

    return recommendations;
  }

  /**
   * Generate import optimization report
   */
  generateReport(): {
    summary: {
      totalImports: number;
      issues: number;
      optimizationOpportunities: number;
    };
    breakdown: typeof this.importStats;
    recommendations: string[];
  } {
    const recommendations = this.getRecommendations();
    
    return {
      summary: {
        totalImports: this.importStats.totalImports,
        issues: this.importStats.namespaceImports + this.importStats.barrelImports,
        optimizationOpportunities: recommendations.length
      },
      breakdown: { ...this.importStats },
      recommendations
    };
  }
}

// Bundle size optimization utilities
export class BundleOptimizer {
  /**
   * Optimize lodash imports
   */
  static optimizeLodashImports(code: string): string {
    // Replace full lodash imports with specific function imports
    return code
      .replace(
        /import\s+_\s+from\s+['"]lodash['"];?\s*\n/g,
        '// Optimized: Use specific lodash imports instead\n'
      )
      .replace(
        /import\s*\*\s*as\s+_\s+from\s+['"]lodash['"];?\s*\n/g,
        '// Optimized: Use specific lodash imports instead\n'
      );
  }

  /**
   * Optimize React Icons imports
   */
  static optimizeReactIconsImports(code: string): string {
    return code.replace(
      /import\s*\*\s*as\s+\w+\s+from\s+['"]react-icons['"];?\s*\n/g,
      '// Optimized: Use specific icon imports like: import { FiHome } from "react-icons/fi"\n'
    );
  }

  /**
   * Add tree shaking comments for webpack
   */
  static addTreeShakingComments(code: string): string {
    // Add webpack magic comments for better tree shaking
    return code.replace(
      /import\(/g,
      'import(/* webpackChunkName: "dynamic-import" */'
    );
  }
}

// Export utilities
export const treeShakingAnalyzer = new TreeShakingAnalyzer();

// Convenience functions
export function analyzeFileImports(code: string, filePath: string) {
  return treeShakingAnalyzer.analyzeImports(code, filePath);
}

export function getImportOptimizationReport() {
  return treeShakingAnalyzer.generateReport();
}

// Common import optimization patterns
export const OptimizedImports = {
  // UI Components
  button: "import Button from '@/components/ui/button'",
  input: "import Input from '@/components/ui/input'",
  dialog: "import Dialog from '@/components/ui/dialog'",

  // Utilities
  clsx: "import { clsx } from 'clsx'",
  cn: "import { cn } from '@/lib/utils'",
  
  // Icons (optimized)
  homeIcon: "import { FiHome } from 'react-icons/fi'",
  userIcon: "import { FiUser } from 'react-icons/fi'",
  
  // Lodash (optimized)
  debounce: "import debounce from 'lodash/debounce'",
  throttle: "import throttle from 'lodash/throttle'",
  get: "import get from 'lodash/get'",
  
  // Date utilities (optimized)
  formatDate: "import { format } from 'date-fns'",
  parseDate: "import { parse } from 'date-fns'",
};

// Tree shaking validation
export function validateTreeShaking(bundleStats: any): {
  isOptimal: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for common tree shaking problems
  if (bundleStats?.modules?.some((mod: any) => 
    mod.name?.includes('lodash') && mod.size > 50000)) {
    issues.push('Large lodash modules detected');
    suggestions.push('Use individual lodash function imports');
  }

  if (bundleStats?.modules?.some((mod: any) => 
    mod.name?.includes('moment') && !mod.name?.includes('locale'))) {
    issues.push('Moment.js detected (not tree-shakeable)');
    suggestions.push('Consider switching to date-fns or dayjs');
  }

  return {
    isOptimal: issues.length === 0,
    issues,
    suggestions
  };
}

 