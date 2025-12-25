/**
 * Theme Diagnostics Utility
 * 
 * This utility helps identify and diagnose theme-related issues including:
 * - Color contrast problems (WCAG compliance)
 * - Theme variable consistency
 * - Hardcoded color usage
 */

// WCAG 2.1 Contrast Requirements
const WCAG_AA_NORMAL = 4.5;  // Minimum for normal text
const WCAG_AA_LARGE = 3.0;    // Minimum for large text (18pt+ or 14pt+ bold)
const WCAG_AAA_NORMAL = 7.0;  // Enhanced for normal text
const WCAG_AAA_LARGE = 4.5;    // Enhanced for large text

/**
 * Calculate relative luminance of a color
 * @param {string} hex - Hex color code (e.g., "#ffffff")
 * @returns {number} Relative luminance (0-1)
 */
function calculateLuminance(hex) {
  // Remove hash and convert to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} foreground - Foreground color hex
 * @param {string} background - Background color hex
 * @returns {number} Contrast ratio (1-21)
 */
function calculateContrastRatio(foreground, background) {
  const L1 = calculateLuminance(foreground);
  const L2 = calculateLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 * @param {number} ratio - Contrast ratio
 * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {object} Compliance status
 */
function checkWCAGCompliance(ratio, isLargeText = false) {
  const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  return {
    ratio: ratio.toFixed(2),
    passesAA: ratio >= threshold,
    passesAAA: ratio >= (isLargeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL),
    threshold: threshold,
    isLargeText
  };
}

/**
 * Diagnose theme contrast issues
 * @param {object} theme - Theme object with colors
 * @returns {object} Diagnostic results
 */
export function diagnoseThemeContrast(theme) {
  const issues = [];
  const warnings = [];
  const results = {};

  const colors = theme.colors || theme;

  // Helper to check contrast
  const checkContrast = (fg, bg, context, isLargeText = false) => {
    if (!fg || !bg) return;
    const ratio = calculateContrastRatio(fg, bg);
    const compliance = checkWCAGCompliance(ratio, isLargeText);
    results[context] = compliance;

    if (!compliance.passesAA) {
      issues.push({
        context,
        foreground: fg,
        background: bg,
        ratio: compliance.ratio,
        threshold: compliance.threshold,
        severity: 'critical',
        message: `${context}: Contrast ratio ${compliance.ratio}:1 fails WCAG AA (requires ${compliance.threshold}:1)`
      });
    } else if (!compliance.passesAAA) {
      warnings.push({
        context,
        foreground: fg,
        background: bg,
        ratio: compliance.ratio,
        threshold: WCAG_AAA_NORMAL,
        severity: 'warning',
        message: `${context}: Contrast ratio ${compliance.ratio}:1 passes AA but not AAA (requires ${WCAG_AAA_NORMAL}:1)`
      });
    }
  };

  // Check primary text on background
  checkContrast(colors.textPrimary, colors.background, 'textPrimary on background');
  
  // Check secondary text on background
  checkContrast(colors.textSecondary, colors.background, 'textSecondary on background');
  
  // Check light text on background (often problematic)
  checkContrast(colors.textLight, colors.background, 'textLight on background', true);
  
  // Check table header text on table header background
  checkContrast(colors.tableHeaderText, colors.tableHeaderBg, 'tableHeaderText on tableHeaderBg');
  
  // Check table body text on card background
  checkContrast(colors.textSecondary, colors.cardBackground, 'textSecondary on cardBackground');
  
  // Check badge text on badge backgrounds
  checkContrast(colors.success, colors.successLight, 'success on successLight');
  checkContrast(colors.danger, colors.dangerLight, 'danger on dangerLight');
  checkContrast(colors.warning, colors.warningLight, 'warning on warningLight');
  checkContrast(colors.info, colors.infoLight, 'info on infoLight');
  
  // Check button text (white) on primary color
  checkContrast('#ffffff', colors.primary, 'white text on primary button');
  
  // Check button text (white) on primary hover
  checkContrast('#ffffff', colors.primaryHover, 'white text on primaryHover button');

  return {
    themeName: theme.name || 'Unknown',
    issues,
    warnings,
    results,
    summary: {
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      warnings: warnings.length,
      totalChecks: Object.keys(results).length
    }
  };
}

/**
 * Diagnose all themes
 * @param {object} themes - All themes object
 * @returns {object} All diagnostic results
 */
export function diagnoseAllThemes(themes) {
  const results = {};
  const allIssues = [];
  const allWarnings = [];

  Object.entries(themes).forEach(([key, theme]) => {
    const diagnosis = diagnoseThemeContrast(theme);
    results[key] = diagnosis;
    allIssues.push(...diagnosis.issues);
    allWarnings.push(...diagnosis.warnings);
  });

  return {
    themes: results,
    summary: {
      totalThemes: Object.keys(themes).length,
      totalCriticalIssues: allIssues.length,
      totalWarnings: allWarnings.length,
      themesWithIssues: Object.values(results).filter(r => r.issues.length > 0).length
    }
  };
}

/**
 * Log theme diagnostics to console
 * @param {object} diagnosis - Diagnosis result from diagnoseThemeContrast
 */
export function logThemeDiagnostics(diagnosis) {
  console.group(`🎨 Theme Diagnostics: ${diagnosis.themeName}`);
  
  console.log('📊 Summary:', diagnosis.summary);
  
  if (diagnosis.issues.length > 0) {
    console.group('❌ Critical Issues (WCAG AA Failures)');
    diagnosis.issues.forEach((issue, i) => {
      console.error(`${i + 1}. ${issue.message}`);
      console.log(`   Foreground: ${issue.foreground}`);
      console.log(`   Background: ${issue.background}`);
      console.log(`   Ratio: ${issue.ratio}:1 (Required: ${issue.threshold}:1)`);
    });
    console.groupEnd();
  }
  
  if (diagnosis.warnings.length > 0) {
    console.group('⚠️ Warnings (WCAG AAA Failures)');
    diagnosis.warnings.forEach((warning, i) => {
      console.warn(`${i + 1}. ${warning.message}`);
      console.log(`   Foreground: ${warning.foreground}`);
      console.log(`   Background: ${warning.background}`);
      console.log(`   Ratio: ${warning.ratio}:1 (Required: ${warning.threshold}:1)`);
    });
    console.groupEnd();
  }
  
  if (diagnosis.issues.length === 0 && diagnosis.warnings.length === 0) {
    console.log('✅ No contrast issues found!');
  }
  
  console.group('📋 Detailed Results');
  Object.entries(diagnosis.results).forEach(([context, result]) => {
    const icon = result.passesAA ? '✅' : (result.passesAAA ? '⚠️' : '❌');
    console.log(`${icon} ${context}: ${result.ratio}:1 (AA: ${result.passesAA}, AAA: ${result.passesAAA})`);
  });
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Log all themes diagnostics
 * @param {object} themes - All themes object
 */
export function logAllThemesDiagnostics(themes) {
  const diagnosis = diagnoseAllThemes(themes);
  
  console.group('🎨 All Themes Diagnostics');
  console.log('📊 Overall Summary:', diagnosis.summary);
  
  if (diagnosis.summary.totalCriticalIssues > 0) {
    console.error(`❌ Found ${diagnosis.summary.totalCriticalIssues} critical issues across ${diagnosis.summary.themesWithIssues} themes`);
  }
  
  if (diagnosis.summary.totalWarnings > 0) {
    console.warn(`⚠️ Found ${diagnosis.summary.totalWarnings} warnings across all themes`);
  }
  
  Object.entries(diagnosis.themes).forEach(([key, themeDiagnosis]) => {
    if (themeDiagnosis.issues.length > 0 || themeDiagnosis.warnings.length > 0) {
      logThemeDiagnostics(themeDiagnosis);
    }
  });
  
  console.groupEnd();
}

/**
 * Check for hardcoded color usage in components
 * @returns {object} Hardcoded color findings
 */
export function findHardcodedColors() {
  const findings = {
    hardcodedTailwindClasses: [],
    hardcodedHexColors: [],
    themeVariableUsage: []
  };

  // Common hardcoded Tailwind color classes that should use theme variables
  const problematicClasses = [
    'bg-red-100', 'bg-red-700', 'bg-blue-100', 'bg-blue-700',
    'bg-gray-100', 'bg-gray-700', 'text-red-600', 'text-blue-600',
    'bg-info', 'bg-danger', 'bg-success', 'bg-warning',
    'text-info', 'text-danger', 'text-success', 'text-warning',
    'bg-primary', 'text-primary', 'bg-card', 'text-text-primary',
    'text-text-secondary', 'text-text-light', 'border-border'
  ];

  findings.hardcodedTailwindClasses = problematicClasses;

  return findings;
}

/**
 * Get recommended fixes for contrast issues
 * @param {object} diagnosis - Diagnosis result
 * @returns {array} Recommended fixes
 */
export function getRecommendedFixes(diagnosis) {
  const fixes = [];

  diagnosis.issues.forEach(issue => {
    const fix = {
      context: issue.context,
      issue: issue.message,
      recommendations: []
    };

    // Generate specific recommendations based on context
    if (issue.context.includes('textLight')) {
      fix.recommendations.push('Increase textLight color darkness for better contrast');
      fix.recommendations.push('Consider using textSecondary instead of textLight for important content');
    } else if (issue.context.includes('tableHeader')) {
      fix.recommendations.push('Darken tableHeaderText or lighten tableHeaderBg');
      fix.recommendations.push('Consider using textPrimary for table headers');
    } else if (issue.context.includes('successLight') || issue.context.includes('dangerLight') || 
               issue.context.includes('warningLight') || issue.context.includes('infoLight')) {
      fix.recommendations.push('Use darker text color on light badge backgrounds');
      fix.recommendations.push('Consider using the main color (success, danger, etc.) with a darker background');
    } else if (issue.context.includes('primary')) {
      fix.recommendations.push('Ensure primary color is dark enough for white text');
      fix.recommendations.push('Consider using a darker shade for primaryHover');
    }

    fixes.push(fix);
  });

  return fixes;
}

/**
 * Run comprehensive theme diagnostics and log results
 * @param {object} themes - All themes object
 */
export function runThemeDiagnostics(themes) {
  console.log('🔍 Running comprehensive theme diagnostics...\n');
  
  // Diagnose all themes
  const allDiagnosis = diagnoseAllThemes(themes);
  logAllThemesDiagnostics(themes);
  
  // Find hardcoded colors
  console.group('🔍 Hardcoded Color Usage Check');
  const hardcoded = findHardcodedColors();
  console.log('⚠️ Potentially problematic Tailwind classes found:');
  hardcoded.hardcodedTailwindClasses.forEach(cls => {
    console.log(`   - ${cls} (should use theme variables)`);
  });
  console.groupEnd();
  
  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log(`   Total Themes: ${allDiagnosis.summary.totalThemes}`);
  console.log(`   Themes with Issues: ${allDiagnosis.summary.themesWithIssues}`);
  console.log(`   Total Critical Issues: ${allDiagnosis.summary.totalCriticalIssues}`);
  console.log(`   Total Warnings: ${allDiagnosis.summary.totalWarnings}`);
  
  if (allDiagnosis.summary.totalCriticalIssues > 0) {
    console.log('\n❌ ACTION REQUIRED: Fix critical contrast issues to meet WCAG AA standards');
  } else if (allDiagnosis.summary.totalWarnings > 0) {
    console.log('\n⚠️ RECOMMENDED: Consider fixing warnings for better accessibility (WCAG AAA)');
  } else {
    console.log('\n✅ All themes pass WCAG AA contrast requirements!');
  }
  
  return allDiagnosis;
}

export default {
  calculateLuminance,
  calculateContrastRatio,
  checkWCAGCompliance,
  diagnoseThemeContrast,
  diagnoseAllThemes,
  logThemeDiagnostics,
  logAllThemesDiagnostics,
  findHardcodedColors,
  getRecommendedFixes,
  runThemeDiagnostics
};
