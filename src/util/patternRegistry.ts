import { PatternMatcher } from '../types/conversionTypes.js';

/**
 * Unified Pattern Registry for Framework-Agnostic Class Attribute Matching
 *
 * This registry provides consistent regex patterns for detecting and extracting
 * Tailwind CSS classes across different frameworks and syntax variations.
 */

/**
 * Extract classes from a quoted attribute value
 */
const extractQuoted = (match: string): string => {
  const quotedMatch = match.match(/["']([^"']*)["']/);
  return quotedMatch ? quotedMatch[1] : '';
};

/**
 * Extract classes from JSX-style curly braces with quotes
 */
const extractJSXCurly = (match: string): string => {
  const curlyMatch = match.match(/\{["']([^"']*)["']\}/);
  return curlyMatch ? curlyMatch[1] : '';
};

/**
 * Extract classes from template literals
 */
const extractTemplate = (match: string): string => {
  const templateMatch = match.match(/`([^`]*)`/);
  return templateMatch ? templateMatch[1] : '';
};

/**
 * Extract classes from Vue-style bindings
 */
const extractVueBinding = (match: string): string => {
  const bindingMatch = match.match(/["']([^"']*)["']/);
  return bindingMatch ? bindingMatch[1] : '';
};

/**
 * Reconstruct HTML-style class attribute
 */
const reconstructHTML = (classes: string[], original: string): string => {
  const quote = original.includes('"') ? '"' : "'";
  return `class=${quote}${classes.join(' ')}${quote}`;
};

/**
 * Reconstruct JSX-style className attribute
 */
const reconstructJSX = (classes: string[], original: string): string => {
  const quote = original.includes('"') ? '"' : "'";
  const hasCurly = original.includes('{');

  if (hasCurly) {
    return `className={${quote}${classes.join(' ')}${quote}}`;
  }
  return `className=${quote}${classes.join(' ')}${quote}`;
};

/**
 * Reconstruct Vue-style class binding
 */
const reconstructVue = (classes: string[], original: string): string => {
  const quote = original.includes('"') ? '"' : "'";
  const isBinding = original.includes(':class');
  const prefix = isBinding ? ':class' : 'v-bind:class';
  return `${prefix}=${quote}${classes.join(' ')}${quote}`;
};

/**
 * Reconstruct Angular-style class binding
 */
const reconstructAngular = (classes: string[], original: string): string => {
  const quote = original.includes('"') ? '"' : "'";
  const isBinding = original.includes('[class]');
  const prefix = isBinding ? '[class]' : '[ngClass]';
  return `${prefix}=${quote}${classes.join(' ')}${quote}`;
};

/**
 * Reconstruct Svelte-style class attribute
 */
const reconstructSvelte = (classes: string[], original: string): string => {
  const quote = original.includes('"') ? '"' : "'";
  return `class=${quote}${classes.join(' ')}${quote}`;
};

/**
 * Reconstruct template literal
 */
const reconstructTemplate = (classes: string[], original: string): string => {
  // Extract the quote style from the original template literal
  const quoteMatch = original.match(/class\s*=\s*(["'])/);
  const quote = quoteMatch ? quoteMatch[1] : '"'; // Default to double quotes if not found
  return `\`class=${quote}${classes.join(' ')}${quote}\``;
};

/**
 * Pattern matchers for different frameworks and syntax variations
 */
export const PATTERN_MATCHERS: PatternMatcher[] = [
  // HTML class attribute - quoted
  {
    pattern: /class\s*=\s*["']([^"']*)["']/g,
    framework: ['html', 'php', 'django', 'erb'],
    syntax: 'quoted',
    extractor: extractQuoted,
    reconstructor: reconstructHTML,
  },

  // React/JSX className - quoted
  {
    pattern: /className\s*=\s*["']([^"']*)["']/g,
    framework: ['react', 'jsx', 'tsx'],
    syntax: 'quoted',
    extractor: extractQuoted,
    reconstructor: reconstructJSX,
  },

  // React/JSX className - curly braces with quotes
  {
    pattern: /className\s*=\s*\{["']([^"']*)["']\}/g,
    framework: ['react', 'jsx', 'tsx'],
    syntax: 'binding',
    extractor: extractJSXCurly,
    reconstructor: reconstructJSX,
  },

  // Vue.js class binding - quoted
  {
    pattern: /:class\s*=\s*["']([^"']*)["']/g,
    framework: ['vue'],
    syntax: 'binding',
    extractor: extractVueBinding,
    reconstructor: reconstructVue,
  },

  // Vue.js v-bind:class - quoted
  {
    pattern: /v-bind:class\s*=\s*["']([^"']*)["']/g,
    framework: ['vue'],
    syntax: 'binding',
    extractor: extractVueBinding,
    reconstructor: reconstructVue,
  },

  // Angular class binding
  {
    pattern: /\[class\]\s*=\s*["']([^"']*)["']/g,
    framework: ['angular'],
    syntax: 'binding',
    extractor: extractVueBinding,
    reconstructor: reconstructAngular,
  },

  // Angular ngClass binding
  {
    pattern: /\[ngClass\]\s*=\s*["']([^"']*)["']/g,
    framework: ['angular'],
    syntax: 'binding',
    extractor: extractVueBinding,
    reconstructor: reconstructAngular,
  },

  // Svelte class attribute
  {
    pattern: /class\s*=\s*["']([^"']*)["']/g,
    framework: ['svelte'],
    syntax: 'quoted',
    extractor: extractQuoted,
    reconstructor: reconstructSvelte,
  },

  // Template literals with class attributes
  {
    pattern: /`[^`]*class\s*=\s*["']([^"'`]*)["'][^`]*`/g,
    framework: ['javascript', 'typescript'],
    syntax: 'template',
    extractor: extractTemplate,
    reconstructor: reconstructTemplate,
  },
];

/**
 * Get appropriate pattern matchers based on file extension
 */
export const getPatternMatchersForFile = (filePath: string): PatternMatcher[] => {
  const extension = filePath.split('.').pop()?.toLowerCase();

  const frameworkMap: Record<string, string[]> = {
    html: ['html', 'angular'],
    htm: ['html', 'angular'],
    php: ['php'],
    erb: ['erb'],
    jsx: ['react', 'jsx', 'html'],
    tsx: ['react', 'jsx', 'tsx', 'html'],
    js: ['javascript', 'html'],
    ts: ['typescript', 'html', 'angular'],
    vue: ['vue', 'html'],
    svelte: ['svelte'],
  };

  const relevantFrameworks = frameworkMap[extension || ''] || ['html'];

  return PATTERN_MATCHERS.filter((matcher) =>
    matcher.framework.some((fw) => relevantFrameworks.includes(fw)),
  );
};

/**
 * Apply all relevant patterns to content and extract class information
 */
export interface ClassMatch {
  match: string;
  classes: string;
  matcher: PatternMatcher;
  startIndex: number;
  endIndex: number;
}

export const extractAllClassMatches = (content: string, filePath: string): ClassMatch[] => {
  const matches: ClassMatch[] = [];
  const seen = new Set<string>();

  for (const matcher of getPatternMatchersForFile(filePath)) {
    collectMatcherResults(content, matcher, matches, seen);
  }

  return matches.sort((a, b) => a.startIndex - b.startIndex);
};

function collectMatcherResults(
  content: string,
  matcher: PatternMatcher,
  matches: ClassMatch[],
  seen: Set<string>,
): void {
  matcher.pattern.lastIndex = 0;

  for (
    let match = matcher.pattern.exec(content);
    match !== null;
    match = matcher.pattern.exec(content)
  ) {
    addMatchIfPreferred(match, matcher, matches, seen);

    if (!matcher.pattern.global) {
      break;
    }
  }
}

function addMatchIfPreferred(
  match: RegExpExecArray,
  matcher: PatternMatcher,
  matches: ClassMatch[],
  seen: Set<string>,
): void {
  const classMatch = createClassMatch(match, matcher);
  const key = `${classMatch.startIndex}-${classMatch.endIndex}-${classMatch.match}`;

  if (seen.has(key) || !preferCurrentMatch(classMatch, matches)) {
    return;
  }

  seen.add(key);
  matches.push(classMatch);
}

function createClassMatch(match: RegExpExecArray, matcher: PatternMatcher): ClassMatch {
  return {
    match: match[0],
    classes: matcher.extractor(match[0]),
    matcher,
    startIndex: match.index,
    endIndex: match.index + match[0].length,
  };
}

function preferCurrentMatch(currentMatch: ClassMatch, matches: ClassMatch[]): boolean {
  const overlappingMatch = matches.find((existing) => rangesOverlap(currentMatch, existing));
  if (!overlappingMatch) {
    return true;
  }

  const currentSpecificity = getPatternSpecificity(currentMatch.matcher.framework);
  const existingSpecificity = getPatternSpecificity(overlappingMatch.matcher.framework);
  if (currentSpecificity <= existingSpecificity) {
    return false;
  }

  matches.splice(matches.indexOf(overlappingMatch), 1);
  return true;
}

function rangesOverlap(first: ClassMatch, second: ClassMatch): boolean {
  return first.startIndex < second.endIndex && first.endIndex > second.startIndex;
}

/**
 * Get pattern specificity for prioritizing overlapping matches
 */
function getPatternSpecificity(frameworks: string[]): number {
  // Higher numbers = more specific
  if (frameworks.includes('vue')) return 3;
  if (frameworks.includes('react') || frameworks.includes('jsx') || frameworks.includes('tsx'))
    return 3;
  if (frameworks.includes('angular')) return 2;
  if (frameworks.includes('svelte')) return 2;
  if (frameworks.includes('html')) return 1;
  return 0;
}

/**
 * Replace content with new class matches, ensuring no overlapping replacements
 */
export const applyClassReplacements = (
  content: string,
  replacements: { original: ClassMatch; newClasses: string[] }[],
): string => {
  // Sort replacements by startIndex in descending order to avoid index shifting
  const sortedReplacements = replacements.sort(
    (a, b) => b.original.startIndex - a.original.startIndex,
  );

  let newContent = content;

  for (const { original, newClasses } of sortedReplacements) {
    const newMatch = original.matcher.reconstructor(newClasses, original.match);
    newContent =
      newContent.slice(0, original.startIndex) + newMatch + newContent.slice(original.endIndex);
  }

  return newContent;
};
