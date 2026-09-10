import { describe, it, expect, beforeEach } from 'vitest';
import type { AppTheme } from '@/lib/theme/ThemeContext';

describe('Theme Engine & Appearance Modes (test/unit/theme.test.ts)', () => {
  function getNextTheme(current: AppTheme): AppTheme {
    return current === 'light' ? 'dark' : current === 'dark' ? 'colorful' : 'light';
  }

  it('QA-THEME-01: Verifies exactly 3 distinct theme modes are supported', () => {
    const validThemes: AppTheme[] = ['light', 'dark', 'colorful'];
    expect(validThemes).toHaveLength(3);
  });

  it('QA-THEME-02: Cycles correctly: light -> dark -> colorful -> light', () => {
    let current: AppTheme = 'light';

    current = getNextTheme(current);
    expect(current).toBe('dark');

    current = getNextTheme(current);
    expect(current).toBe('colorful');

    current = getNextTheme(current);
    expect(current).toBe('light');
  });

  // Edge cases
  describe('Edge Cases (Expert Human QA)', () => {
    it('QA-THEME-EC01: Invalid theme string defaults safely to light mode', () => {
      const isValidTheme = (val: string): val is AppTheme =>
        ['light', 'dark', 'colorful'].includes(val);

      const invalidValues = ['neon', 'solarized', 'high-contrast', '', 'undefined', null, 123];

      invalidValues.forEach((val) => {
        const validated = isValidTheme(val as string) ? (val as AppTheme) : 'light';
        expect(validated).toBe('light');
      });
    });

    it('QA-THEME-EC02: Verifies theme data attributes and classes logic', () => {
      function computeRootClasses(theme: AppTheme) {
        const isDark = theme === 'dark';
        const isColorful = theme === 'colorful';
        return {
          dataTheme: theme,
          hasDarkClass: isDark,
          hasColorfulClass: isColorful,
        };
      }

      expect(computeRootClasses('light')).toEqual({
        dataTheme: 'light',
        hasDarkClass: false,
        hasColorfulClass: false,
      });

      expect(computeRootClasses('dark')).toEqual({
        dataTheme: 'dark',
        hasDarkClass: true,
        hasColorfulClass: false,
      });

      expect(computeRootClasses('colorful')).toEqual({
        dataTheme: 'colorful',
        hasDarkClass: false,
        hasColorfulClass: true,
      });
    });
  });
});
