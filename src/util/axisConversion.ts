import { ConversionResult } from '../types/conversionTypes.js';
import { convertClassMatches, replaceMatchingPairs } from './classConversionHelpers.js';

const createAxisConversion =
  (prefix: string) =>
  (content: string, filePath = 'unknown'): ConversionResult =>
    convertClassMatches(content, filePath, (processor, parsedClasses) =>
      replaceMatchingPairs(processor, parsedClasses, `${prefix}x`, `${prefix}y`, prefix),
    );

export default createAxisConversion;
