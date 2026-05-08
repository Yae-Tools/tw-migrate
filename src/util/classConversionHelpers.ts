import { ClassInfo, ConversionResult } from '../types/conversionTypes.js';
import { ErrorHandler } from './errorHandler.js';
import parseClassName from './parseClassName.js';
import { applyClassReplacements, ClassMatch, extractAllClassMatches } from './patternRegistry.js';
import { ClassUtils, SafeClassProcessor } from './safeArrayOperations.js';

type Replacement = { original: ClassMatch; newClasses: string[] };

type MatchTransformer = (processor: SafeClassProcessor, parsedClasses: ClassInfo[]) => boolean;

function parseClasses(classes: string): ClassInfo[] {
  return classes
    .split(' ')
    .filter((className) => className.length > 0)
    .map((className, index) => ({
      ...parseClassName(className),
      index,
    }));
}

function buildReplacements(
  classMatches: ClassMatch[],
  transformer: MatchTransformer,
): Replacement[] {
  const replacements: Replacement[] = [];

  for (const match of classMatches) {
    const processor = ClassUtils.createProcessor(match.classes);
    const parsedClasses = parseClasses(match.classes);

    if (!transformer(processor, parsedClasses)) {
      continue;
    }

    const result = processor.execute();
    if (result.changed) {
      replacements.push({ original: match, newClasses: result.newClasses });
    }
  }

  return replacements;
}

export function convertClassMatches(
  content: string,
  filePath: string,
  transformer: MatchTransformer,
): ConversionResult {
  try {
    const classMatches = extractAllClassMatches(content, filePath);
    const replacements = buildReplacements(classMatches, transformer);
    const newContent =
      replacements.length > 0 ? applyClassReplacements(content, replacements) : content;

    return { newContent, changed: replacements.length > 0 };
  } catch (error) {
    const conversionError = ErrorHandler.handleContentError(error, filePath);
    ErrorHandler.recordError(conversionError);

    if (!ErrorHandler.shouldContinueProcessing(conversionError)) {
      throw conversionError;
    }

    return { newContent: content, changed: false };
  }
}

export function replaceMatchingPairs(
  processor: SafeClassProcessor,
  classes: ClassInfo[],
  firstPrefix: string,
  secondPrefix: string,
  replacementPrefix: string,
): boolean {
  let modified = false;
  const groupedByVariant = ClassUtils.groupByVariant(classes);

  for (const [variant, variantGroup] of Object.entries(groupedByVariant)) {
    const firstClasses = ClassUtils.findClassesWithPrefix(variantGroup, firstPrefix);
    const secondClasses = ClassUtils.findClassesWithPrefix(variantGroup, secondPrefix);
    modified =
      replaceVariantPairs(processor, firstClasses, secondClasses, variant, replacementPrefix) ||
      modified;
  }

  return modified;
}

function replaceVariantPairs(
  processor: SafeClassProcessor,
  firstClasses: ClassInfo[],
  secondClasses: ClassInfo[],
  variant: string,
  replacementPrefix: string,
): boolean {
  let modified = false;

  for (const firstClass of firstClasses) {
    for (const secondClass of secondClasses) {
      const value = getSharedValue(firstClass.className, secondClass.className);
      if (!value) {
        continue;
      }

      const newClass = `${variant}${replacementPrefix}-${value}`;
      modified =
        ClassUtils.replacePair(processor, firstClass.original, secondClass.original, newClass) ||
        modified;
    }
  }

  return modified;
}

function getSharedValue(firstClass: string, secondClass: string): string | null {
  if (!ClassUtils.haveSameValue(firstClass, secondClass)) {
    return null;
  }

  return ClassUtils.extractValue(firstClass);
}
