import { describe, it, expect } from 'vitest';

describe('WCAG High-Contrast Theme Suite', () => {
  // Relative luminance calculation based on WCAG 2.1 specs
  function getLuminance(r: number, g: number, b: number) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]) {
    const lum1 = getLuminance(...rgb1);
    const lum2 = getLuminance(...rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  it('verifies Fresh Stream (Light) achieves WCAG AAA (>7:1) for primary text on daylight background', () => {
    const text: [number, number, number] = [15, 23, 42]; // Slate-900 / #0f172a
    const bg: [number, number, number] = [248, 250, 252]; // Slate-50 / #f8fafc
    const ratio = getContrastRatio(text, bg);
    expect(ratio).toBeGreaterThan(12); // Exceeds WCAG AAA requirement of 7:1
  });

  it('verifies Deep Drainage (Dark) achieves WCAG AAA (>7:1) for primary text on obsidian background', () => {
    const text: [number, number, number] = [255, 255, 255]; // Pure White #ffffff
    const bg: [number, number, number] = [3, 7, 18]; // Obsidian Midnight #030712
    const ratio = getContrastRatio(text, bg);
    expect(ratio).toBeGreaterThan(15); // Exceeds WCAG AAA requirement of 7:1
  });

  it('verifies Hydro Neon (Colorful) achieves WCAG AAA (>7:1) for primary text on twilight violet background', () => {
    const text: [number, number, number] = [255, 255, 255]; // Pure White #ffffff
    const bg: [number, number, number] = [9, 4, 20]; // Twilight Violet #090414
    const ratio = getContrastRatio(text, bg);
    expect(ratio).toBeGreaterThan(16); // Exceeds WCAG AAA requirement of 7:1
  });

  it('verifies all theme secondary/muted text achieves WCAG AA (>4.5:1)', () => {
    // Fresh Stream muted text
    const lightMuted: [number, number, number] = [51, 65, 85]; // Slate-700
    const lightBg: [number, number, number] = [255, 255, 255];
    expect(getContrastRatio(lightMuted, lightBg)).toBeGreaterThan(4.5);

    // Deep Drainage muted text
    const darkMuted: [number, number, number] = [203, 213, 225]; // Slate-300
    const darkBg: [number, number, number] = [11, 15, 25];
    expect(getContrastRatio(darkMuted, darkBg)).toBeGreaterThan(4.5);

    // Hydro Neon muted text
    const neonMuted: [number, number, number] = [233, 213, 255]; // Lavender-200
    const neonBg: [number, number, number] = [22, 12, 44];
    expect(getContrastRatio(neonMuted, neonBg)).toBeGreaterThan(4.5);
  });
});
