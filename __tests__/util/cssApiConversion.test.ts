import { describe, expect, it } from 'vitest';
import cssApiConversion from '../../src/util/cssApiConversion';

describe('cssApiConversion', () => {
  it('should replace v3 @tailwind directives with the v4 import API', () => {
    const content = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n.btn { color: red; }';

    const { newContent, changed } = cssApiConversion(content);

    expect(changed).toBe(true);
    expect(newContent).toBe('@import "tailwindcss";\n\n.btn { color: red; }');
  });

  it('should remove @tailwind directives when the v4 import already exists', () => {
    const content = '@import "tailwindcss";\n@tailwind utilities;\n.foo { color: blue; }';

    const { newContent, changed } = cssApiConversion(content);

    expect(changed).toBe(true);
    expect(newContent).toBe('@import "tailwindcss";\n.foo { color: blue; }');
  });

  it('should insert a real import when import text only appears in a comment', () => {
    const content = '/* @import "tailwindcss"; */\n@tailwind utilities;\n.foo { color: blue; }';

    const { newContent, changed } = cssApiConversion(content);

    expect(changed).toBe(true);
    expect(newContent).toBe('/* @import "tailwindcss"; */\n@import "tailwindcss";\n.foo { color: blue; }');
  });

  it('should not change CSS without Tailwind directives', () => {
    const content = '@import "tailwindcss";\n.foo { color: blue; }';

    const { newContent, changed } = cssApiConversion(content);

    expect(changed).toBe(false);
    expect(newContent).toBe(content);
  });
});
