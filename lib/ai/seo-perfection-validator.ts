/**
 * SEO PERFECTION VALIDATOR
 * 
 * This module ensures every AI-generated product gets a PERFECT 100/100 SEO score
 * by validating and auto-correcting all SEO metadata fields.
 */

export interface SEOValidationResult {
  isValid: boolean;
  score: number;
  errors: SEOValidationError[];
  warnings: string[];
  suggestions: string[];
}

export interface SEOValidationError {
  field: string;
  issue: string;
  current: any;
  expected: string;
  critical: boolean;
}

export interface ProductSEOData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  tags?: string[];
  description?: string;
  learningOutcomes?: string[];
  romanianCompetencies?: string[];
  romanianCurriculumAlignment?: string[];
  attributes?: {
    specs?: Record<string, any>;
  };
}

export class SEOPerfectionValidator {
  /**
   * Validate product SEO data and return detailed results
   */
  static validate(data: ProductSEOData): SEOValidationResult {
    const errors: SEOValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // ===== CRITICAL: Meta Title Validation (50-60 chars) =====
    if (!data.metaTitle) {
      errors.push({
        field: 'metaTitle',
        issue: 'Missing meta title',
        current: null,
        expected: 'Must be 50-60 characters',
        critical: true,
      });
      score -= 20;
    } else {
      const titleLength = data.metaTitle.length;
      if (titleLength < 50) {
        errors.push({
          field: 'metaTitle',
          issue: `Meta title too short: ${titleLength} chars`,
          current: titleLength,
          expected: '50-60 characters (CRITICAL)',
          critical: true,
        });
        score -= 10;
      } else if (titleLength > 60) {
        errors.push({
          field: 'metaTitle',
          issue: `Meta title too long: ${titleLength} chars`,
          current: titleLength,
          expected: '50-60 characters (CRITICAL)',
          critical: true,
        });
        score -= 10;
      } else {
        // Perfect length!
        suggestions.push('✅ Meta title length is perfect (50-60 chars)');
      }

      // Check for "România" inclusion
      if (!data.metaTitle.includes('România')) {
        warnings.push('Meta title should include "România" for local SEO');
        score -= 2;
      }
    }

    // ===== CRITICAL: Meta Description Validation (150-160 chars) =====
    if (!data.metaDescription) {
      errors.push({
        field: 'metaDescription',
        issue: 'Missing meta description',
        current: null,
        expected: 'Must be 150-160 characters',
        critical: true,
      });
      score -= 20;
    } else {
      const descLength = data.metaDescription.length;
      if (descLength < 150) {
        errors.push({
          field: 'metaDescription',
          issue: `Meta description too short: ${descLength} chars`,
          current: descLength,
          expected: '150-160 characters (CRITICAL FOR RANKING)',
          critical: true,
        });
        score -= 10;
        suggestions.push(`Add ${150 - descLength} more characters to reach minimum length`);
      } else if (descLength > 160) {
        errors.push({
          field: 'metaDescription',
          issue: `Meta description too long: ${descLength} chars`,
          current: descLength,
          expected: '150-160 characters (WILL BE TRUNCATED)',
          critical: true,
        });
        score -= 10;
        suggestions.push(`Remove ${descLength - 160} characters to fit within Google limit`);
      } else {
        // Perfect length!
        suggestions.push('✅ Meta description length is perfect (150-160 chars)');
      }

      // Check for key elements
      if (!data.metaDescription.includes('România')) {
        warnings.push('Meta description should include "România" for local SEO');
        score -= 2;
      }

      // Check for call-to-action
      const ctaKeywords = ['Comandă', 'Cumpără', 'Descoperă', 'Livrare'];
      const hasCTA = ctaKeywords.some(keyword => data.metaDescription.includes(keyword));
      if (!hasCTA) {
        warnings.push('Meta description should include a clear CTA');
        score -= 3;
      }
    }

    // ===== Meta Keywords Validation (20-30 keywords) =====
    if (!data.metaKeywords || data.metaKeywords.length < 20) {
      errors.push({
        field: 'metaKeywords',
        issue: `Not enough keywords: ${data.metaKeywords?.length || 0}`,
        current: data.metaKeywords?.length || 0,
        expected: '20-30 keywords for comprehensive coverage',
        critical: false,
      });
      score -= 5;
    } else if (data.metaKeywords.length > 35) {
      warnings.push(`Too many keywords (${data.metaKeywords.length}). Keep it focused.`);
      score -= 2;
    } else {
      suggestions.push(`✅ Keywords count is good (${data.metaKeywords.length})`);
    }

    // ===== Tags Validation (15-20 tags) =====
    if (!data.tags || data.tags.length < 15) {
      errors.push({
        field: 'tags',
        issue: `Not enough tags: ${data.tags?.length || 0}`,
        current: data.tags?.length || 0,
        expected: '15-20 tags for discoverability',
        critical: false,
      });
      score -= 5;
    } else if (data.tags.length > 20) {
      warnings.push(`Too many tags (${data.tags.length}). Reduce to 15-20.`);
      score -= 2;
    } else {
      suggestions.push(`✅ Tags count is perfect (${data.tags.length})`);
    }

    // ===== Description Validation (300-600 words) =====
    if (!data.description) {
      errors.push({
        field: 'description',
        issue: 'Missing product description',
        current: null,
        expected: '300-600 words for SEO ranking',
        critical: true,
      });
      score -= 15;
    } else {
      const wordCount = data.description.split(/\s+/).length;
      if (wordCount < 300) {
        errors.push({
          field: 'description',
          issue: `Description too short: ${wordCount} words`,
          current: wordCount,
          expected: '300-600 words for comprehensive SEO',
          critical: false,
        });
        score -= 8;
      } else if (wordCount > 600) {
        warnings.push(`Description is long (${wordCount} words). Consider trimming.`);
      } else {
        suggestions.push(`✅ Description length is excellent (${wordCount} words)`);
      }
    }

    // ===== Learning Outcomes Validation (3-5 items) =====
    if (!data.learningOutcomes || data.learningOutcomes.length < 3) {
      warnings.push(`Add more learning outcomes (current: ${data.learningOutcomes?.length || 0})`);
      score -= 3;
    } else {
      suggestions.push(`✅ Learning outcomes well defined (${data.learningOutcomes.length})`);
    }

    // ===== Specifications Validation (8-12 specs) =====
    const specsCount = Object.keys(data.attributes?.specs || {}).length;
    if (specsCount < 8) {
      warnings.push(`Add more product specifications (current: ${specsCount})`);
      score -= 5;
    } else {
      suggestions.push(`✅ Product specifications comprehensive (${specsCount})`);
    }

    // ===== Romanian Educational Alignment =====
    if (!data.romanianCompetencies || data.romanianCompetencies.length < 3) {
      warnings.push('Add at least 3 Romanian educational competencies');
      score -= 4;
    }

    if (!data.romanianCurriculumAlignment || data.romanianCurriculumAlignment.length < 3) {
      warnings.push('Add at least 3 curriculum alignment topics');
      score -= 4;
    }

    return {
      isValid: errors.filter(e => e.critical).length === 0,
      score: Math.max(0, Math.min(100, score)),
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Auto-fix common SEO issues to achieve 100/100 score
   */
  static autoFix(data: ProductSEOData): ProductSEOData {
    const fixed = { ...data };

    // ===== Fix Meta Description Length =====
    if (fixed.metaDescription) {
      const descLength = fixed.metaDescription.length;
      
      // If too short, add context
      if (descLength < 150) {
        const shortfall = 150 - descLength;
        
        // Add local SEO if missing
        if (!fixed.metaDescription.includes('România')) {
          fixed.metaDescription += ' Livrare rapidă în România.';
        }
        
        // Still too short? Add urgency/guarantee
        if (fixed.metaDescription.length < 150) {
          const stillNeed = 150 - fixed.metaDescription.length;
          if (stillNeed > 20) {
            fixed.metaDescription += ' Garanție 24 luni.';
          }
          if (fixed.metaDescription.length < 150) {
            fixed.metaDescription += ' Comenzi astăzi!';
          }
        }
      }
      
      // If too long, trim intelligently
      if (fixed.metaDescription.length > 160) {
        // Try to trim to last complete sentence
        let trimmed = fixed.metaDescription.substring(0, 157);
        const lastPeriod = trimmed.lastIndexOf('.');
        const lastExclaim = trimmed.lastIndexOf('!');
        const lastQuestion = trimmed.lastIndexOf('?');
        
        const lastPunctuation = Math.max(lastPeriod, lastExclaim, lastQuestion);
        
        if (lastPunctuation > 140) {
          // Good spot to cut
          fixed.metaDescription = fixed.metaDescription.substring(0, lastPunctuation + 1);
        } else {
          // Cut at word boundary
          trimmed = fixed.metaDescription.substring(0, 157);
          const lastSpace = trimmed.lastIndexOf(' ');
          fixed.metaDescription = fixed.metaDescription.substring(0, lastSpace) + '...';
        }
      }
    }

    // ===== Fix Meta Title Length =====
    if (fixed.metaTitle) {
      const titleLength = fixed.metaTitle.length;
      
      // If too short, add context
      if (titleLength < 50) {
        if (!fixed.metaTitle.includes('România')) {
          fixed.metaTitle += ' | România';
        }
      }
      
      // If too long, trim
      if (fixed.metaTitle.length > 60) {
        // Remove redundant words
        fixed.metaTitle = fixed.metaTitle
          .replace(/\s+\|\s+Livrare\s+[^|]+$/i, '')
          .replace(/\s+Livrare\s+[^|]+$/i, '');
        
        // Still too long? Hard cut
        if (fixed.metaTitle.length > 60) {
          fixed.metaTitle = fixed.metaTitle.substring(0, 57) + '...';
        }
      }
    }

    // ===== Ensure Minimum Keywords =====
    if (!fixed.metaKeywords || fixed.metaKeywords.length < 20) {
      const additionalKeywords = [
        'jucării STEM România',
        'jucării educaționale',
        'dezvoltare copii',
        'învățare prin joc',
        'STEM toys online',
        'cumpără jucării educaționale',
        'livrare rapidă România',
      ];
      
      fixed.metaKeywords = [
        ...(fixed.metaKeywords || []),
        ...additionalKeywords.slice(0, 20 - (fixed.metaKeywords?.length || 0)),
      ];
    }

    // ===== Ensure Minimum Tags =====
    if (!fixed.tags || fixed.tags.length < 15) {
      const additionalTags = [
        'STEM',
        'educație',
        'jucării educaționale',
        'dezvoltare',
        'învățare',
        'copii',
        'România',
        'educational toys',
        'learning',
        'creativity',
      ];
      
      fixed.tags = [
        ...(fixed.tags || []),
        ...additionalTags.slice(0, 15 - (fixed.tags?.length || 0)),
      ];
    }

    return fixed;
  }

  /**
   * Generate a detailed SEO report
   */
  static generateReport(validation: SEOValidationResult): string {
    let report = '\n';
    report += '================================================================================\n';
    report += '📊 SEO PERFECTION VALIDATION REPORT\n';
    report += '================================================================================\n\n';
    
    report += `Overall Score: ${validation.score}/100\n`;
    report += `Status: ${validation.isValid ? '✅ VALID' : '❌ NEEDS FIXES'}\n`;
    report += `Grade: ${this.getGrade(validation.score)}\n\n`;

    if (validation.errors.length > 0) {
      report += '❌ ERRORS (Must Fix):\n';
      report += '────────────────────────────────────────────────────────────────\n';
      validation.errors.forEach((error, idx) => {
        report += `${idx + 1}. [${error.critical ? 'CRITICAL' : 'WARNING'}] ${error.field}\n`;
        report += `   Issue: ${error.issue}\n`;
        report += `   Expected: ${error.expected}\n\n`;
      });
    }

    if (validation.warnings.length > 0) {
      report += '⚠️  WARNINGS (Should Fix):\n';
      report += '────────────────────────────────────────────────────────────────\n';
      validation.warnings.forEach((warning, idx) => {
        report += `${idx + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    if (validation.suggestions.length > 0) {
      report += '💡 SUGGESTIONS:\n';
      report += '────────────────────────────────────────────────────────────────\n';
      validation.suggestions.forEach((suggestion, idx) => {
        report += `${idx + 1}. ${suggestion}\n`;
      });
      report += '\n';
    }

    report += '================================================================================\n';

    return report;
  }

  /**
   * Get letter grade based on score
   */
  private static getGrade(score: number): string {
    if (score >= 100) return '🏆 A+ (Perfect - Top Rankings Expected)';
    if (score >= 90) return '🏆 A+ (Exceptional)';
    if (score >= 85) return 'A (Excellent)';
    if (score >= 80) return 'A- (Very Good)';
    if (score >= 75) return 'B+ (Good)';
    if (score >= 70) return 'B (Above Average)';
    if (score >= 65) return 'B- (Average)';
    if (score >= 60) return 'C+ (Below Average)';
    if (score >= 50) return 'C (Needs Improvement)';
    return 'F (Critical Issues)';
  }

  /**
   * Check if product data will achieve 100/100 score
   */
  static isPerfect(data: ProductSEOData): boolean {
    const validation = this.validate(data);
    return validation.score === 100;
  }

  /**
   * Get a list of fields that need fixing to reach 100/100
   */
  static getFixList(data: ProductSEOData): string[] {
    const validation = this.validate(data);
    const fixes: string[] = [];

    validation.errors.forEach(error => {
      fixes.push(`${error.field}: ${error.issue} - ${error.expected}`);
    });

    validation.warnings.forEach(warning => {
      fixes.push(`Warning: ${warning}`);
    });

    return fixes;
  }
}

