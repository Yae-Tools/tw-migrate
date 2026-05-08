import { ConversionResult } from '../types/conversionTypes.js';
import { convertClassMatches, replaceMatchingPairs } from './classConversionHelpers.js';

const sizeConversion = (content: string, filePath = 'unknown'): ConversionResult =>
  convertClassMatches(content, filePath, (processor, parsedClasses) =>
    replaceMatchingPairs(processor, parsedClasses, 'w', 'h', 'size'),
  );

export default sizeConversion;
