import { ClassInfo, ConversionResult } from '../types/conversionTypes.js';
import { convertClassMatches } from './classConversionHelpers.js';
import { ClassUtils, SafeClassProcessor } from './safeArrayOperations.js';

const COLOR_PREFIXES = ['bg', 'text', 'border', 'ring', 'divide', 'placeholder'];

const colorOpacityConversion = (content: string, filePath = 'unknown'): ConversionResult =>
  convertClassMatches(content, filePath, replaceColorOpacityPairs);

function replaceColorOpacityPairs(
  processor: SafeClassProcessor,
  parsedClasses: ClassInfo[],
): boolean {
  let modified = false;
  const groupedByVariant = ClassUtils.groupByVariant(parsedClasses);

  for (const [variant, variantGroup] of Object.entries(groupedByVariant)) {
    modified = replaceVariantColorOpacityPairs(processor, variantGroup, variant) || modified;
  }

  return modified;
}

function replaceVariantColorOpacityPairs(
  processor: SafeClassProcessor,
  variantGroup: ClassInfo[],
  variant: string,
): boolean {
  let modified = false;

  for (const prefix of COLOR_PREFIXES) {
    const colorClasses = getColorClasses(variantGroup, prefix);
    const opacityClasses = getOpacityClasses(variantGroup, prefix);
    modified =
      replacePrefixColorOpacityPairs(processor, colorClasses, opacityClasses, variant) || modified;
  }

  return modified;
}

function getColorClasses(classes: ClassInfo[], prefix: string): ClassInfo[] {
  return classes.filter(
    ({ className }) =>
      className.startsWith(`${prefix}-`) &&
      !className.startsWith(`${prefix}-opacity-`) &&
      !className.includes('/'),
  );
}

function getOpacityClasses(classes: ClassInfo[], prefix: string): ClassInfo[] {
  return classes.filter(({ className }) => className.startsWith(`${prefix}-opacity-`));
}

function replacePrefixColorOpacityPairs(
  processor: SafeClassProcessor,
  colorClasses: ClassInfo[],
  opacityClasses: ClassInfo[],
  variant: string,
): boolean {
  let modified = false;

  for (const colorClass of colorClasses) {
    for (const opacityClass of opacityClasses) {
      const opacityValue = ClassUtils.extractValue(opacityClass.className);
      if (!opacityValue) {
        continue;
      }

      const newClass = `${variant}${colorClass.className}/${opacityValue}`;
      modified =
        ClassUtils.replacePair(processor, colorClass.original, opacityClass.original, newClass) ||
        modified;
    }
  }

  return modified;
}

export default colorOpacityConversion;
