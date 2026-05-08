import createAxisConversion from './util/axisConversion.js';
import colorOpacityConversion from './util/colorOpacityConversion.js';
import cssApiConversion from './util/cssApiConversion.js';
import gapConversion from './util/gapConversion.js';
import sizeConversion from './util/sizeConversion.js';
import v4UtilityConversion from './util/v4UtilityConversion.js';

export const CONVERSIONS = {
  size: sizeConversion,
  margin: createAxisConversion('m'),
  padding: createAxisConversion('p'),
  'color-opacity': colorOpacityConversion,
  gap: gapConversion,
  'v4-utilities': v4UtilityConversion,
  'css-api': cssApiConversion,
};
