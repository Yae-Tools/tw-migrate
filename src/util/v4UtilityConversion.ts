import { ClassInfo, ConversionResult } from '../types/conversionTypes.js';
import { convertClassMatches } from './classConversionHelpers.js';
import { SafeClassProcessor } from './safeArrayOperations.js';

const EXACT_UTILITY_RENAMES: Record<string, string> = {
  'shadow-sm': 'shadow-xs',
  shadow: 'shadow-sm',
  'drop-shadow-sm': 'drop-shadow-xs',
  'drop-shadow': 'drop-shadow-sm',
  'blur-sm': 'blur-xs',
  blur: 'blur-sm',
  'backdrop-blur-sm': 'backdrop-blur-xs',
  'backdrop-blur': 'backdrop-blur-sm',
  'rounded-sm': 'rounded-xs',
  rounded: 'rounded-sm',
  'outline-none': 'outline-hidden',
  ring: 'ring-3',
  'overflow-ellipsis': 'text-ellipsis',
  'decoration-slice': 'box-decoration-slice',
  'decoration-clone': 'box-decoration-clone',
  'flex-shrink': 'shrink',
  'flex-grow': 'grow',
};

const PREFIX_UTILITY_RENAMES = [
  { from: 'flex-shrink-', to: 'shrink-' },
  { from: 'flex-grow-', to: 'grow-' },
] as const;

const v4UtilityConversion = (content: string, filePath = 'unknown'): ConversionResult =>
  convertClassMatches(content, filePath, replaceV4Utilities);

function replaceV4Utilities(processor: SafeClassProcessor, classes: ClassInfo[]): boolean {
  let modified = false;

  for (const classInfo of classes) {
    const replacement = getV4Replacement(classInfo.className);
    if (!replacement) {
      continue;
    }

    modified =
      processor.markForReplacement(classInfo.original, `${classInfo.variants}${replacement}`) ||
      modified;
  }

  return modified;
}

function getV4Replacement(className: string): string | null {
  const exactReplacement = EXACT_UTILITY_RENAMES[className];
  if (exactReplacement) {
    return exactReplacement;
  }

  for (const { from, to } of PREFIX_UTILITY_RENAMES) {
    if (className.startsWith(from)) {
      return `${to}${className.slice(from.length)}`;
    }
  }

  return null;
}

export default v4UtilityConversion;
