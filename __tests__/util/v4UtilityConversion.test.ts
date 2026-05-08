import { describe, expect, it } from 'vitest';
import v4UtilityConversion from '../../src/util/v4UtilityConversion';

describe('v4UtilityConversion', () => {
  it('should rename Tailwind v4 exact utility changes', () => {
    const content = '<div class="shadow-sm shadow rounded-sm rounded blur-sm blur outline-none ring"></div>';

    const { newContent, changed } = v4UtilityConversion(content, 'test.html');

    expect(changed).toBe(true);
    expect(newContent).toBe(
      '<div class="shadow-xs shadow-sm rounded-xs rounded-sm blur-xs blur-sm outline-hidden ring-3"></div>',
    );
  });

  it('should preserve variants when renaming utilities', () => {
    const content = '<div class="hover:shadow-sm focus:outline-none md:ring"></div>';

    const { newContent, changed } = v4UtilityConversion(content, 'test.html');

    expect(changed).toBe(true);
    expect(newContent).toBe('<div class="hover:shadow-xs focus:outline-hidden md:ring-3"></div>');
  });

  it('should rename removed deprecated utility prefixes', () => {
    const content = '<div class="flex-shrink-0 flex-grow overflow-ellipsis decoration-clone"></div>';

    const { newContent, changed } = v4UtilityConversion(content, 'test.html');

    expect(changed).toBe(true);
    expect(newContent).toBe('<div class="shrink-0 grow text-ellipsis box-decoration-clone"></div>');
  });

  it('should rename duplicate deprecated utilities', () => {
    const content = '<div class="shadow shadow flex-shrink-0 flex-shrink-0"></div>';

    const { newContent, changed } = v4UtilityConversion(content, 'test.html');

    expect(changed).toBe(true);
    expect(newContent).toBe('<div class="shadow-sm shadow-sm shrink-0 shrink-0"></div>');
  });

  it('should not alter unrelated utilities or already modern utilities', () => {
    const content = '<div class="shadow-xs rounded-md ring-2 shrink-0 grow text-red-500"></div>';

    const { newContent, changed } = v4UtilityConversion(content, 'test.html');

    expect(changed).toBe(false);
    expect(newContent).toBe(content);
  });
});
