import { ConversionResult } from '../types/conversionTypes.js';

const TAILWIND_DIRECTIVE_PATTERN = /^\s*@tailwind\s+(base|components|utilities)\s*;\s*$/;
const TAILWIND_IMPORT = '@import "tailwindcss";';

const cssApiConversion = (content: string): ConversionResult => {
  const lines = content.split('\n');
  const hasTailwindDirective = lines.some((line) => TAILWIND_DIRECTIVE_PATTERN.test(line));

  if (!hasTailwindDirective) {
    return { newContent: content, changed: false };
  }

  let insertedImport = content.includes(TAILWIND_IMPORT);
  const newContent = lines
    .flatMap((line) => {
      if (!TAILWIND_DIRECTIVE_PATTERN.test(line)) {
        return [line];
      }

      if (insertedImport) {
        return [];
      }

      insertedImport = true;
      return [TAILWIND_IMPORT];
    })
    .join('\n');

  return { newContent, changed: newContent !== content };
};

export default cssApiConversion;
