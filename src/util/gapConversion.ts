import { ClassInfo, ConversionResult } from '../types/conversionTypes.js';
import { convertClassMatches, replaceMatchingPairs } from './classConversionHelpers.js';

const gapConversion = (content: string, filePath = 'unknown'): ConversionResult =>
  convertClassMatches(content, filePath, (processor, parsedClasses) => {
    if (!hasFlexOrGridClass(parsedClasses)) {
      return false;
    }

    return replaceMatchingPairs(processor, parsedClasses, 'space-x', 'space-y', 'gap');
  });

function hasFlexOrGridClass(classes: ClassInfo[]): boolean {
  return classes.some(
    ({ className }) =>
      className === 'flex' ||
      className === 'grid' ||
      className.startsWith('flex-') ||
      className.startsWith('grid-'),
  );
}

export default gapConversion;
