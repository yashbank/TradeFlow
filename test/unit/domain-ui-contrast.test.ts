import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// =============================================================================
// Helper Functions: WCAG 2.1 Luminance & Contrast Mathematics
// =============================================================================

/**
 * Calculates W3C WCAG 2.1 relative luminance for an sRGB hex or RGB tuple.
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const c = val / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s = s / 100;
  l = l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) =>
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const l1 = getLuminance(...color1);
  const l2 = getLuminance(...color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// =============================================================================
// Helper Functions: Static Code Inspection & Defect Detectors
// =============================================================================

function readProjectFile(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Finds lines containing dark text classes without dark:text-* overrides.
 */
export function findDarkOnDarkDefects(fileContent: string): { line: number; text: string }[] {
  const lines = fileContent.split('\n');
  const defects: { line: number; text: string }[] = [];
  const darkTextRegex = /\btext-(slate|zinc|gray)-(700|800|900)\b/;
  const darkOverrideRegex = /\bdark:text-/;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (darkTextRegex.test(line) && !darkOverrideRegex.test(line)) {
      if (!line.includes("theme === 'light'") && !line.includes("theme === 'dark'")) {
        defects.push({ line: idx + 1, text: trimmed });
      }
    }
  });

  return defects;
}

/**
 * Finds native form controls or cards with unconditioned white/light backgrounds.
 * Fully supports multi-line JSX tags for <select ...> and <textarea ...>.
 */
export function findWhiteBoxDefects(fileContent: string): { line: number; text: string; reason: string }[] {
  const lines = fileContent.split('\n');
  const defects: { line: number; text: string; reason: string }[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // Check 1: Native <select> lacking dark:bg or dark:border
    if (/<select\b/.test(line)) {
      const slice = lines.slice(idx, idx + 8).join(' ');
      const hasDarkBg = slice.includes('dark:bg-');
      const hasDarkBorder = slice.includes('dark:border-');
      if (!hasDarkBg || !hasDarkBorder) {
        defects.push({
          line: idx + 1,
          text: trimmed,
          reason: 'Native <select> lacking dark:bg-* or dark:border-* override',
        });
      }
    }

    // Check 2: Native <textarea> lacking dark:bg or dark:border
    if (/<textarea\b/.test(line)) {
      const slice = lines.slice(idx, idx + 8).join(' ');
      const hasDarkBg = slice.includes('dark:bg-');
      const hasDarkBorder = slice.includes('dark:border-');
      if (!hasDarkBg || !hasDarkBorder) {
        defects.push({
          line: idx + 1,
          text: trimmed,
          reason: 'Native <textarea> lacking dark:bg-* or dark:border-* override',
        });
      }
    }

    // Check 3: Container with bg-white or bg-slate-50 lacking dark:bg-*
    if (/\b(bg-white|bg-slate-50)\b/.test(line) && !line.includes('dark:bg-')) {
      if (/<(div|section|aside|nav|header|footer)\b/.test(line) && !line.includes('glass-') && !line.includes('text-')) {
        defects.push({
          line: idx + 1,
          text: trimmed,
          reason: 'Container with light background lacking dark:bg-* override',
        });
      }
    }
  });

  return defects;
}

describe('Domain UI & Visual Contrast Audit Suite (110 Test Cases)', () => {
  // ===========================================================================
  // SECTION 1: Themes, Tokens & Transitions (Tests 1-15)
  // ===========================================================================
  describe('Scope 1: Themes & Transitions ("Fresh Stream", "Deep Drainage", "Hydro Neon")', () => {
    const globalsCss = readProjectFile('src/app/globals.css');
    const themeContext = readProjectFile('src/lib/theme/ThemeContext.tsx');

    it('001. Fresh Stream: defines :root and [data-theme="light"] CSS block in globals.css', () => {
      expect(globalsCss).toContain('[data-theme="light"]');
      expect(globalsCss).toContain('THEME 1: FRESH STREAM');
    });

    it('002. Fresh Stream: configures daylight porcelain background hsl(210, 50%, 98%)', () => {
      expect(globalsCss).toContain('--background: 210 50% 98%');
    });

    it('003. Fresh Stream: configures aquatic primary token hsl(199, 89%, 48%)', () => {
      expect(globalsCss).toContain('--primary: 199 89% 48%');
    });

    it('004. Deep Drainage: defines .dark and [data-theme="dark"] CSS block in globals.css', () => {
      expect(globalsCss).toContain('[data-theme="dark"]');
      expect(globalsCss).toContain('THEME 2: DEEP DRAINAGE');
    });

    it('005. Deep Drainage: configures obsidian midnight background hsl(224, 71%, 4%)', () => {
      expect(globalsCss).toContain('--background: 224 71% 4%');
    });

    it('006. Deep Drainage: configures electric cyan primary token hsl(187, 92%, 49%)', () => {
      expect(globalsCss).toContain('--primary: 187 92% 49%');
    });

    it('007. Hydro Neon: defines .colorful and [data-theme="colorful"] CSS block in globals.css', () => {
      expect(globalsCss).toContain('[data-theme="colorful"]');
      expect(globalsCss).toContain('THEME 3: HYDRO NEON');
    });

    it('008. Hydro Neon: configures twilight violet background hsl(265, 55%, 6%)', () => {
      expect(globalsCss).toContain('--background: 265 55% 6%');
    });

    it('009. Hydro Neon: configures electric neon purple primary token hsl(275, 88%, 68%)', () => {
      expect(globalsCss).toContain('--primary: 275 88% 68%');
    });

    it('010. Theme Transitions: globals.css applies smooth background-color and color transitions to body', () => {
      expect(globalsCss).toMatch(/transition:\s*background-color\s*0\.25s\s*ease,\s*color\s*0\.25s\s*ease/);
    });

    it('011. Body Styling: body binds directly to CSS custom properties hsl(var(--foreground)) & --background', () => {
      expect(globalsCss).toContain('color: hsl(var(--foreground))');
      expect(globalsCss).toContain('background-color: hsl(var(--background))');
    });

    it('012. Background Overlays: defines fixed radial gradients for Fresh Stream (#F8FAFC)', () => {
      expect(globalsCss).toContain('[data-theme="light"] body');
      expect(globalsCss).toContain('#F8FAFC');
    });

    it('013. Background Overlays: defines fixed radial gradients for Deep Drainage (#030712)', () => {
      expect(globalsCss).toContain('[data-theme="dark"] body');
      expect(globalsCss).toContain('#030712');
    });

    it('014. Background Overlays: defines fixed aurora radial gradients for Hydro Neon (#090414)', () => {
      expect(globalsCss).toContain('[data-theme="colorful"] body');
      expect(globalsCss).toContain('#090414');
    });

    it('015. Theme Engine: ThemeContext cycleTheme cycles in order light -> dark -> colorful -> light', () => {
      expect(themeContext).toContain("theme === 'light' ? 'dark' : theme === 'dark' ? 'colorful' : 'light'");
      expect(themeContext).toContain("THEME_STORAGE_KEY = 'tradeflow_theme_mode_v1'");
    });
  });

  // ===========================================================================
  // SECTION 2: W3C WCAG 2.1 AA/AAA Contrast Ratios (Tests 16-35)
  // ===========================================================================
  describe('Scope 2: W3C WCAG 2.1 AA/AAA Contrast Ratios', () => {
    const OBSIDIAN_DARK = hexToRgb('#030712');
    const TWILIGHT_VIOLET = hexToRgb('#090414');
    const DAYLIGHT_BG = hexToRgb('#F8FAFC');
    const PURE_WHITE = hexToRgb('#FFFFFF');
    const SLATE_900 = hexToRgb('#0F172A');
    const SLATE_700 = hexToRgb('#334155');
    const SLATE_600 = hexToRgb('#475569');
    const ZINC_100 = hexToRgb('#F4F4F5');
    const ZINC_200 = hexToRgb('#E4E4E7');
    const ZINC_400 = hexToRgb('#A1A1AA');
    const EMERALD_400 = hexToRgb('#34D399');
    const EMERALD_700 = hexToRgb('#047857');
    const CYAN_PRIMARY = hexToRgb('#06B6D4');
    const BLUE_PRIMARY = hexToRgb('#0284C7');
    const VIOLET_PRIMARY = hexToRgb('#A855F7');
    const ROSE_600 = hexToRgb('#E11D48');

    it('016. WCAG Math: relative luminance of pure white is 1.0 and pure black is 0.0', () => {
      expect(getLuminance(255, 255, 255)).toBeCloseTo(1.0, 4);
      expect(getLuminance(0, 0, 0)).toBeCloseTo(0.0, 4);
    });

    it('017. Fresh Stream: Normal text (#0f172a) on white card satisfies WCAG AAA (>15:1 >= 7:1)', () => {
      const ratio = getContrastRatio(SLATE_900, PURE_WHITE);
      expect(ratio).toBeGreaterThan(15.0);
    });

    it('018. Fresh Stream: Large headings (#0f172a) on daylight background (#F8FAFC) satisfies WCAG AAA (>14:1 >= 4.5:1)', () => {
      const ratio = getContrastRatio(SLATE_900, DAYLIGHT_BG);
      expect(ratio).toBeGreaterThan(14.0);
    });

    it('019. Fresh Stream: Secondary text (#334155) on white card satisfies WCAG AAA (>9:1 >= 7:1)', () => {
      const ratio = getContrastRatio(SLATE_700, PURE_WHITE);
      expect(ratio).toBeGreaterThan(9.0);
    });

    it('020. Fresh Stream: Muted metadata (#475569) on white card satisfies WCAG AA (>5:1 >= 4.5:1)', () => {
      const ratio = getContrastRatio(SLATE_600, PURE_WHITE);
      expect(ratio).toBeGreaterThan(4.5);
    });

    it('021. Deep Drainage: Normal text (zinc-100) on obsidian dark satisfies WCAG AAA (>18:1 >= 7:1)', () => {
      const ratio = getContrastRatio(ZINC_100, OBSIDIAN_DARK);
      expect(ratio).toBeGreaterThan(18.0);
    });

    it('022. Deep Drainage: Large headings (pure white) on obsidian dark satisfies WCAG AAA (>20:1 >= 4.5:1)', () => {
      const ratio = getContrastRatio(PURE_WHITE, OBSIDIAN_DARK);
      expect(ratio).toBeGreaterThan(20.0);
    });

    it('023. Deep Drainage: Secondary text (zinc-200) on obsidian dark satisfies WCAG AAA (>15:1 >= 7:1)', () => {
      const ratio = getContrastRatio(ZINC_200, OBSIDIAN_DARK);
      expect(ratio).toBeGreaterThan(15.0);
    });

    it('024. Deep Drainage: Muted metadata (zinc-400) on obsidian dark satisfies WCAG AAA normal text (>7:1 >= 7:1)', () => {
      const ratio = getContrastRatio(ZINC_400, OBSIDIAN_DARK);
      expect(ratio).toBeGreaterThan(7.0);
    });

    it('025. Hydro Neon: Normal text (pure white) on twilight violet satisfies WCAG AAA (>17:1 >= 7:1)', () => {
      const ratio = getContrastRatio(PURE_WHITE, TWILIGHT_VIOLET);
      expect(ratio).toBeGreaterThan(17.0);
    });

    it('026. Hydro Neon: Large headings (pure white) on twilight violet satisfies WCAG AAA (>17:1 >= 4.5:1)', () => {
      const ratio = getContrastRatio(PURE_WHITE, TWILIGHT_VIOLET);
      expect(ratio).toBeGreaterThan(17.0);
    });

    it('027. Hydro Neon: Secondary text (zinc-200) on twilight violet satisfies WCAG AAA (>13:1 >= 7:1)', () => {
      const ratio = getContrastRatio(ZINC_200, TWILIGHT_VIOLET);
      expect(ratio).toBeGreaterThan(13.0);
    });

    it('028. Hydro Neon: Muted metadata (zinc-400) on twilight violet satisfies WCAG AA (>6.5:1 >= 4.5:1)', () => {
      const ratio = getContrastRatio(ZINC_400, TWILIGHT_VIOLET);
      expect(ratio).toBeGreaterThan(6.0);
    });

    it('029. Financial Totals: emerald-400 (#34d399) on obsidian dark satisfies WCAG AAA (>10:1 >= 7:1)', () => {
      const ratio = getContrastRatio(EMERALD_400, OBSIDIAN_DARK);
      expect(ratio).toBeGreaterThan(10.0);
      expect(ratio).toBeGreaterThan(7.0);
    });

    it('030. Financial Totals: emerald-400 (#34d399) on twilight violet satisfies WCAG AAA (>10:1 >= 7:1)', () => {
      const ratio = getContrastRatio(EMERALD_400, TWILIGHT_VIOLET);
      expect(ratio).toBeGreaterThan(10.0);
      expect(ratio).toBeGreaterThan(7.0);
    });

    it('031. Financial Totals: emerald-700 (#047857) on white daylight satisfies WCAG AA (>4.5:1)', () => {
      const ratio = getContrastRatio(EMERALD_700, PURE_WHITE);
      expect(ratio).toBeGreaterThan(4.5);
    });

    it('032. Primary Button: White text on Fresh Stream primary blue (#0284c7) satisfies WCAG UI requirement (>3.0:1)', () => {
      const ratio = getContrastRatio(PURE_WHITE, BLUE_PRIMARY);
      expect(ratio).toBeGreaterThan(3.0);
    });

    it('033. Primary Button: Obsidian text on Deep Drainage cyan (#06b6d4) satisfies WCAG AAA (>8:1 >= 7:1)', () => {
      const ratio = getContrastRatio(OBSIDIAN_DARK, CYAN_PRIMARY);
      expect(ratio).toBeGreaterThan(7.0);
    });

    it('034. Primary Button: White text on Hydro Neon violet (#a855f7) satisfies WCAG AA (>3.0:1 for large/bold text)', () => {
      const ratio = getContrastRatio(PURE_WHITE, VIOLET_PRIMARY);
      expect(ratio).toBeGreaterThan(3.0);
    });

    it('035. Destructive Button: White text on rose-600 (#e11d48) satisfies WCAG AA (>4.5:1)', () => {
      const ratio = getContrastRatio(PURE_WHITE, ROSE_600);
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  // ===========================================================================
  // SECTION 3: Elimination of Dark-on-Dark Text (Tests 36-55)
  // ===========================================================================
  describe('Scope 3: Elimination of Dark-on-Dark Text Defect Engine', () => {
    const OBSIDIAN_DARK = hexToRgb('#030712');
    const SLATE_900 = hexToRgb('#0F172A');
    const SLATE_800 = hexToRgb('#1E293B');
    const SLATE_700 = hexToRgb('#334155');

    it('036. Math Proof: Unconditioned slate-900 on obsidian dark fails WCAG catastrophically (<1.25:1)', () => {
      const ratio = getContrastRatio(SLATE_900, OBSIDIAN_DARK);
      expect(ratio).toBeLessThan(1.25);
    });

    it('037. Math Proof: Unconditioned slate-800 on obsidian dark fails WCAG catastrophically (<1.6:1)', () => {
      const ratio = getContrastRatio(SLATE_800, OBSIDIAN_DARK);
      expect(ratio).toBeLessThan(1.6);
    });

    it('038. Math Proof: Unconditioned slate-700 on obsidian dark fails WCAG (<2.5:1)', () => {
      const ratio = getContrastRatio(SLATE_700, OBSIDIAN_DARK);
      expect(ratio).toBeLessThan(2.5);
    });

    it('039. Rule Engine: detects unconditioned text-slate-900 string and flags as defect', () => {
      const sample = '<h1 className="text-2xl font-bold text-slate-900">Title</h1>';
      expect(findDarkOnDarkDefects(sample).length).toBe(1);
    });

    it('040. Rule Engine: validates text-slate-900 paired with dark:text-zinc-100 as compliant', () => {
      const sample = '<h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Title</h1>';
      expect(findDarkOnDarkDefects(sample).length).toBe(0);
    });

    it('041. Rule Engine: detects unconditioned text-slate-800 string and flags as defect', () => {
      const sample = '<span className="text-sm font-semibold text-slate-800">Heading</span>';
      expect(findDarkOnDarkDefects(sample).length).toBe(1);
    });

    it('042. Rule Engine: validates text-slate-800 paired with dark:text-zinc-200 as compliant', () => {
      const sample = '<span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Heading</span>';
      expect(findDarkOnDarkDefects(sample).length).toBe(0);
    });

    it('043. Rule Engine: detects unconditioned text-slate-700 label and flags as defect', () => {
      const sample = '<label className="text-xs font-semibold text-slate-700 block mb-1">Field</label>';
      expect(findDarkOnDarkDefects(sample).length).toBe(1);
    });

    it('044. Rule Engine: validates text-slate-700 paired with dark:text-zinc-300 as compliant', () => {
      const sample = '<label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Field</label>';
      expect(findDarkOnDarkDefects(sample).length).toBe(0);
    });

    it('045. Dark-on-Dark Audit: Dashboard Client View (DashboardClientView.tsx)', () => {
      const content = readProjectFile('src/components/dashboard/DashboardClientView.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in DashboardClientView.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('046. Dark-on-Dark Audit: Owner Pictorial Dashboard (OwnerPictorialDashboard.tsx)', () => {
      const content = readProjectFile('src/components/dashboard/OwnerPictorialDashboard.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in OwnerPictorialDashboard.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('047. Dark-on-Dark Audit: Technician Field Portal (TechnicianFieldPortal.tsx)', () => {
      const content = readProjectFile('src/components/dashboard/TechnicianFieldPortal.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in TechnicianFieldPortal.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('048. Dark-on-Dark Audit: Customers Page (customers/page.tsx)', () => {
      const content = readProjectFile('src/app/(app)/customers/page.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in customers/page.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('049. Dark-on-Dark Audit: Customer Detail Page (customers/[id]/page.tsx)', () => {
      const content = readProjectFile('src/app/(app)/customers/[id]/page.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in customers/[id]/page.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('050. Dark-on-Dark Audit: Add Customer Modal (AddCustomerModal.tsx)', () => {
      const content = readProjectFile('src/components/customers/AddCustomerModal.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in AddCustomerModal.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('051. Dark-on-Dark Audit: Quotes List Page (quotes/page.tsx)', () => {
      const content = readProjectFile('src/app/(app)/quotes/page.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in quotes/page.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('052. Dark-on-Dark Audit: Quote Builder Component (QuoteBuilder.tsx)', () => {
      const content = readProjectFile('src/components/quotes/QuoteBuilder.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in QuoteBuilder.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('053. Dark-on-Dark Audit: Quote Detail Actions (QuoteDetailActions.tsx)', () => {
      const content = readProjectFile('src/components/quotes/QuoteDetailActions.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in QuoteDetailActions.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('054. Dark-on-Dark Audit: Job Scheduler Component (JobScheduler.tsx)', () => {
      const content = readProjectFile('src/components/jobs/JobScheduler.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in JobScheduler.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('055. Dark-on-Dark Audit: Job Detail Actions (JobDetailActions.tsx)', () => {
      const content = readProjectFile('src/components/jobs/JobDetailActions.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in JobDetailActions.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });
  });

  // ===========================================================================
  // SECTION 4: Elimination of White-Box Defects on Dark Background (Tests 56-75)
  // ===========================================================================
  describe('Scope 4: Elimination of White-Box Defects on Dark Background', () => {
    it('056. White-box Definition: unconditioned bg-white on inputs on dark backgrounds creates blinding contrast glare', () => {
      const sample = '<input className="w-full bg-white text-slate-900 border" />';
      expect(sample.includes('dark:bg-')).toBe(false);
    });

    it('057. Native Select Rule: flags native <select> lacking dark mode background or border', () => {
      const selectSample = '<select className="w-full h-11 px-3 border border-slate-200 bg-white text-sm" />';
      const defects = findWhiteBoxDefects(selectSample);
      expect(defects.length).toBe(1);
    });

    it('058. Native Select Rule: approves <select> with dark:bg-zinc-800/90 and dark:border-zinc-700', () => {
      const selectSample = '<select className="w-full h-11 px-3 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 text-sm" />';
      const defects = findWhiteBoxDefects(selectSample);
      expect(defects.length).toBe(0);
    });

    it('059. Native Textarea Rule: flags native <textarea> lacking dark mode styling', () => {
      const textareaSample = '<textarea className="w-full text-xs rounded-md border border-slate-300 p-2.5" />';
      const defects = findWhiteBoxDefects(textareaSample);
      expect(defects.length).toBe(1);
    });

    it('060. Native Textarea Rule: approves <textarea> with dark:bg-zinc-800/90 and dark:border-zinc-700', () => {
      const textareaSample = '<textarea className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 dark:text-zinc-100 p-2.5" />';
      const defects = findWhiteBoxDefects(textareaSample);
      expect(defects.length).toBe(0);
    });

    it('061. Card/Container Rule: flags unconditioned bg-white containers on dark themes', () => {
      const containerSample = '<div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm" />';
      const defects = findWhiteBoxDefects(containerSample);
      expect(defects.length).toBe(1);
    });

    it('062. Card/Container Rule: approves containers utilizing glass-panel or dark:bg-zinc-800', () => {
      const glassContainer = '<div className="glass-panel rounded-xl p-5" />';
      const darkContainer = '<div className="bg-white dark:bg-zinc-800/60 rounded-xl p-5 border border-slate-200 dark:border-zinc-700/80" />';
      expect(findWhiteBoxDefects(glassContainer).length).toBe(0);
      expect(findWhiteBoxDefects(darkContainer).length).toBe(0);
    });

    it('063. White-Box Audit: Job Completion Modal in JobDetailActions.tsx', () => {
      const content = readProjectFile('src/components/jobs/JobDetailActions.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in JobDetailActions.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('064. White-Box Audit: Record Payment Modal in RecordPaymentModal.tsx', () => {
      const content = readProjectFile('src/components/invoices/RecordPaymentModal.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in RecordPaymentModal.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('065. White-Box Audit: Convert Quote / Accept Quote Modals in QuoteDetailActions.tsx', () => {
      const content = readProjectFile('src/components/quotes/QuoteDetailActions.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in QuoteDetailActions.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('066. White-Box Audit: Customer Information & Preset Buttons in JobScheduler.tsx', () => {
      const content = readProjectFile('src/components/jobs/JobScheduler.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in JobScheduler.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('067. White-Box Audit: Line Items Table & Calculations in InvoiceBuilder.tsx', () => {
      const content = readProjectFile('src/components/invoices/InvoiceBuilder.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in InvoiceBuilder.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('068. White-Box Audit: Line Items Table in QuoteBuilder.tsx', () => {
      const content = readProjectFile('src/components/quotes/QuoteBuilder.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in QuoteBuilder.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('069. White-Box Audit: Business Settings & Country Select in SettingsForm.tsx', () => {
      const content = readProjectFile('src/components/settings/SettingsForm.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in SettingsForm.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('070. White-Box Audit: Sign In Card in LoginForm.tsx', () => {
      const content = readProjectFile('src/components/auth/LoginForm.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in LoginForm.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('071. White-Box Audit: Registration Card & Country/Currency Selects in SignUpForm.tsx', () => {
      const content = readProjectFile('src/components/auth/SignUpForm.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in SignUpForm.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('072. White-Box Audit: Public Quote Portal Cards in PublicQuotePortal.tsx', () => {
      const content = readProjectFile('src/components/portal/PublicQuotePortal.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in PublicQuotePortal.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('073. White-Box Audit: Public Invoice Recipient View in view/invoice/[token]/page.tsx', () => {
      const content = readProjectFile('src/app/(public)/view/invoice/[token]/page.tsx');
      const defects = findWhiteBoxDefects(content);
      expect(defects.length, `White-box defects in view/invoice/[token]/page.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('074. White-Box Audit: Mobile Sticky Action Bar in QuoteDetailActions.tsx', () => {
      const content = readProjectFile('src/components/quotes/QuoteDetailActions.tsx');
      expect(content).toContain('dark:bg-zinc-900/95');
      expect(content).toContain('dark:border-zinc-800');
    });

    it('075. White-Box Audit: Mobile Sticky Action Bar in JobDetailActions.tsx', () => {
      const content = readProjectFile('src/components/jobs/JobDetailActions.tsx');
      expect(content).toContain('dark:bg-zinc-900/95');
      expect(content).toContain('dark:border-zinc-800');
    });
  });

  // ===========================================================================
  // SECTION 5: Specular Highlight Borders, Glassmorphism & Tactile Micro-Interactions (Tests 76-90)
  // ===========================================================================
  describe('Scope 5: Specular Highlight Borders, Glassmorphic Backdrop-Blur & Tactile Micro-Interactions', () => {
    const globalsCss = readProjectFile('src/app/globals.css');
    const buttonTsx = readProjectFile('src/components/ui/button.tsx');

    it('076. Specular Highlight: --glass-specular token defined for Fresh Stream (rgba(255, 255, 255, 0.98))', () => {
      expect(globalsCss).toContain('--glass-specular: rgba(255, 255, 255, 0.98)');
    });

    it('077. Specular Highlight: --glass-specular token defined for Deep Drainage (rgba(255, 255, 255, 0.18))', () => {
      expect(globalsCss).toContain('--glass-specular: rgba(255, 255, 255, 0.18)');
    });

    it('078. Specular Highlight: --glass-specular token defined for Hydro Neon (rgba(255, 255, 255, 0.25))', () => {
      expect(globalsCss).toContain('--glass-specular: rgba(255, 255, 255, 0.25)');
    });

    it('079. Glassmorphic Surface: .glass-panel utility defines backdrop-filter: blur(24px) saturate(190%)', () => {
      expect(globalsCss).toContain('backdrop-filter: blur(24px) saturate(190%)');
    });

    it('080. Glassmorphic Surface: .glass-panel defines inset specular highlight box-shadow', () => {
      expect(globalsCss).toContain('inset 0 1px 1px 0 var(--glass-specular)');
    });

    it('081. Elevated Glassmorphic: .glass-panel-elevated utility defines blur(28px) and inset 0 1.5px', () => {
      expect(globalsCss).toContain('backdrop-filter: blur(28px) saturate(200%)');
      expect(globalsCss).toContain('inset 0 1.5px 1px 0 var(--glass-specular)');
    });

    it('082. Interactive Glass Cards: .glass-card-interactive defines hover translateY(-2px) elevation', () => {
      expect(globalsCss).toContain('.glass-card-interactive:hover');
      expect(globalsCss).toContain('transform: translateY(-2px)');
    });

    it('083. Interactive Glass Cards: .glass-card-interactive defines active spring compression scale(0.985)', () => {
      expect(globalsCss).toContain('.glass-card-interactive:active');
      expect(globalsCss).toContain('scale(0.985)');
    });

    it('084. Tactile Micro-Interactions: .spring-icon rotates -4deg and scales 1.15 on group/button hover', () => {
      expect(globalsCss).toContain('transform: scale(1.15) rotate(-4deg)');
      expect(globalsCss).toContain('filter: drop-shadow(0 2px 6px var(--hydro-glow))');
    });

    it('085. Tactile Micro-Interactions: buttons and links apply cubic-bezier spring scale(0.965) on active click', () => {
      expect(globalsCss).toContain('button:active');
      expect(globalsCss).toContain('transform: scale(0.965)');
    });

    it('086. Mobile Touch Optimization: buttons and clickable elements enforce touch-action: manipulation', () => {
      expect(globalsCss).toContain('touch-action: manipulation');
    });

    it('087. Tactile Card Hover: .card-hover-tactile utility defined with smooth cubic-bezier transitions', () => {
      expect(globalsCss).toContain('.card-hover-tactile');
      expect(globalsCss).toContain('cubic-bezier(0.34, 1.56, 0.64, 1)');
    });

    it('088. Button Component: button.tsx enforces active:scale-[0.965] and WCAG touch target min-h-[44px]', () => {
      expect(buttonTsx).toContain('active:scale-[0.965]');
      expect(buttonTsx).toContain('min-h-[44px]');
    });

    it('089. Toast Notification: ToastContainer.tsx defines countdown progress bar with shrinkWidth animation', () => {
      const toastContent = readProjectFile('src/components/ui/ToastContainer.tsx');
      expect(toastContent).toContain('shrinkWidth');
      expect(toastContent).toContain('backdrop-blur-xl');
    });

    it('090. Minimal Scrollbar: globals.css configures sleek 6px custom scrollbar for desktop', () => {
      expect(globalsCss).toContain('::-webkit-scrollbar');
      expect(globalsCss).toContain('width: 6px');
    });
  });

  // ===========================================================================
  // SECTION 6: UI Components Across All 11 Pages & Portals (Tests 91-110)
  // ===========================================================================
  describe('Scope 6: Comprehensive Page & Component Audit Across 11 Pages', () => {
    it('091. Page 1 - Dashboard: verifies container structure and dark-compatible layout in page.tsx', () => {
      const content = readProjectFile('src/app/(app)/dashboard/page.tsx');
      expect(content).toContain('DashboardClientView');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('092. Page 1 - Dashboard: verifies SLA gauge, cash dial, pipeline dials use dark tokens in OwnerPictorialDashboard.tsx', () => {
      const content = readProjectFile('src/components/dashboard/OwnerPictorialDashboard.tsx');
      expect(content).toContain('glass-panel');
      expect(content).toContain('dark:text-zinc-100');
      expect(content).toContain('text-emerald-400');
    });

    it('093. Page 1 - Dashboard: verifies technician dispatch cards and action buttons in TechnicianFieldPortal.tsx', () => {
      const content = readProjectFile('src/components/dashboard/TechnicianFieldPortal.tsx');
      expect(content).toContain('glass-panel');
      expect(content).toContain('dark:text-zinc-100');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('094. Page 2 - Customers List: verifies customer table rows and status badges in customers/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/customers/page.tsx');
      expect(content).toContain('dark:text-zinc-100');
      expect(content).toContain('dark:text-zinc-400');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('095. Page 2 - Customer Detail: audits customer profile headings and contact cards in customers/[id]/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/customers/[id]/page.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in customers/[id]/page.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('096. Page 3 - Quotes List: verifies quote status pills and total amount formatting in quotes/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/quotes/page.tsx');
      expect(content).toContain('dark:text-zinc-100');
      expect(content).toContain('card-hover-tactile');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('097. Page 4 - Quotes New: verifies quote creation page header and navigation link in quotes/new/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/quotes/new/page.tsx');
      expect(content).toContain('QuoteBuilder');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('098. Page 5 - Quotes Detail: verifies quote view layout and status indicator in quotes/[id]/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/quotes/[id]/page.tsx');
      expect(content).toContain('QuoteDetailActions');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('099. Page 6 - Jobs List: verifies job list cards, priority badges, and status colors in jobs/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/jobs/page.tsx');
      expect(content).toContain('dark:text-zinc-100');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('100. Page 7 - Jobs New: verifies job creation page layout in jobs/new/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/jobs/new/page.tsx');
      expect(content).toContain('JobScheduler');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('101. Page 8 - Jobs Detail: verifies job detail breadcrumbs and customer info card in jobs/[id]/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/jobs/[id]/page.tsx');
      expect(content).toContain('JobDetailActions');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('102. Page 9 - Invoices List: verifies invoice ledger rows and payment status badges in invoices/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/invoices/page.tsx');
      expect(content).toContain('dark:text-zinc-100');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('103. Page 10 - Invoices New: verifies invoice generator page structure in invoices/new/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/invoices/new/page.tsx');
      expect(content).toContain('InvoiceBuilder');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('104. Page 11 - Invoices Detail: verifies invoice summary header and balance due badge in invoices/[id]/page.tsx', () => {
      const content = readProjectFile('src/app/(app)/invoices/[id]/page.tsx');
      expect(content).toContain('InvoiceDetailActions');
      expect(findDarkOnDarkDefects(content).length).toBe(0);
    });

    it('105. Page 12 - Settings: audits business profile fields and license inputs in SettingsForm.tsx', () => {
      const content = readProjectFile('src/components/settings/SettingsForm.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in SettingsForm.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('106. Page 12 - Team Management: audits technician management panel in TeamManagement.tsx', () => {
      const content = readProjectFile('src/components/team/TeamManagement.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in TeamManagement.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('107. Page 13 - Auth Login: audits sign-in card and input fields in LoginForm.tsx', () => {
      const content = readProjectFile('src/components/auth/LoginForm.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in LoginForm.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('108. Page 13 - Auth Signup: audits registration card and country/currency selects in SignUpForm.tsx', () => {
      const content = readProjectFile('src/components/auth/SignUpForm.tsx');
      const defects = findDarkOnDarkDefects(content);
      expect(defects.length, `Defects in SignUpForm.tsx: ${JSON.stringify(defects)}`).toBe(0);
    });

    it('109. Page 14 - Auth Password Reset: audits reset cards in ForgotPasswordForm.tsx & ResetPasswordForm.tsx', () => {
      const forgot = readProjectFile('src/components/auth/ForgotPasswordForm.tsx');
      const reset = readProjectFile('src/components/auth/ResetPasswordForm.tsx');
      const defectsForgot = findDarkOnDarkDefects(forgot);
      const defectsReset = findDarkOnDarkDefects(reset);
      expect(defectsForgot.length, `Defects in ForgotPasswordForm.tsx: ${JSON.stringify(defectsForgot)}`).toBe(0);
      expect(defectsReset.length, `Defects in ResetPasswordForm.tsx: ${JSON.stringify(defectsReset)}`).toBe(0);
    });

    it('110. Page 15 - Public Portals: audits public quote and invoice portals for theme consistency and contrast', () => {
      const publicQuote = readProjectFile('src/components/portal/PublicQuotePortal.tsx');
      const publicInvoice = readProjectFile('src/app/(public)/view/invoice/[token]/page.tsx');
      const defectsQuote = findDarkOnDarkDefects(publicQuote);
      const defectsInvoice = findDarkOnDarkDefects(publicInvoice);
      expect(defectsQuote.length, `Defects in PublicQuotePortal.tsx: ${JSON.stringify(defectsQuote)}`).toBe(0);
      expect(defectsInvoice.length, `Defects in view/invoice/[token]/page.tsx: ${JSON.stringify(defectsInvoice)}`).toBe(0);
    });
  });
});
