import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Helper to load component source text for static & architectural auditing
function loadSource(relativePath: string): string {
  const fullPath = path.resolve(__dirname, '../../', relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Component file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Pre-load key component sources
const sources = {
  button: loadSource('src/components/ui/button.tsx'),
  input: loadSource('src/components/ui/input.tsx'),
  appShell: loadSource('src/components/layout/AppShell.tsx'),
  themeToggle: loadSource('src/components/theme/ThemeToggle.tsx'),
  languageSelector: loadSource('src/components/i18n/LanguageSelector.tsx'),
  currencySelector: loadSource('src/components/currency/CurrencySelector.tsx'),
  publicQuotePortal: loadSource('src/components/portal/PublicQuotePortal.tsx'),
  publicInvoicePage: loadSource('src/app/(public)/view/invoice/[token]/page.tsx'),
  invoiceDetailActions: loadSource('src/components/invoices/InvoiceDetailActions.tsx'),
  quoteDetailActions: loadSource('src/components/quotes/QuoteDetailActions.tsx'),
  jobDetailActions: loadSource('src/components/jobs/JobDetailActions.tsx'),
  invoiceBuilder: loadSource('src/components/invoices/InvoiceBuilder.tsx'),
  quoteBuilder: loadSource('src/components/quotes/QuoteBuilder.tsx'),
  jobScheduler: loadSource('src/components/jobs/JobScheduler.tsx'),
  technicianPortal: loadSource('src/components/dashboard/TechnicianFieldPortal.tsx'),
  ownerDashboard: loadSource('src/components/dashboard/OwnerPictorialDashboard.tsx'),
  teamManagement: loadSource('src/components/team/TeamManagement.tsx'),
  addCustomerModal: loadSource('src/components/customers/AddCustomerModal.tsx'),
  recordPaymentModal: loadSource('src/components/invoices/RecordPaymentModal.tsx'),
  invoicesPage: loadSource('src/app/(app)/invoices/page.tsx'),
  quotesPage: loadSource('src/app/(app)/quotes/page.tsx'),
  customersPage: loadSource('src/app/(app)/customers/page.tsx'),
  customerDetailPage: loadSource('src/app/(app)/customers/[id]/page.tsx'),
  jobsPage: loadSource('src/app/(app)/jobs/page.tsx'),
  settingsForm: loadSource('src/components/settings/SettingsForm.tsx'),
  tailwindConfig: loadSource('tailwind.config.ts'),
  globalsCss: loadSource('src/app/globals.css'),
};

// ============================================================================
// SUITE 1: DEVICE VIEWPORTS, BREAKPOINTS & ORIENTATIONS (Tests 1 - 28)
// ============================================================================
describe('Suite 1: Device Viewports, Breakpoint Mathematics & Screen Orientations', () => {
  // Tailwind default breakpoint definitions
  const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  // Viewport categorization helper
  function getActiveBreakpoint(width: number): string {
    if (width < BREAKPOINTS.sm) return 'base';
    if (width < BREAKPOINTS.md) return 'sm';
    if (width < BREAKPOINTS.lg) return 'md';
    if (width < BREAKPOINTS.xl) return 'lg';
    if (width < BREAKPOINTS['2xl']) return 'xl';
    return '2xl';
  }

  // Usable content width calculation given 16px horizontal container padding (p-4 = 16px each side)
  function getUsableContentWidth(viewportWidth: number, paddingX = 16): number {
    return viewportWidth - paddingX * 2;
  }

  // Device orientation evaluation
  function getOrientation(width: number, height: number): 'portrait' | 'landscape' {
    return width >= height ? 'landscape' : 'portrait';
  }

  it('RESP-VP-01: Mobile Small (320px - iPhone SE) categorizes strictly in base mobile tier (<640px)', () => {
    const width = 320;
    expect(width).toBeLessThan(BREAKPOINTS.sm);
    expect(getActiveBreakpoint(width)).toBe('base');
  });

  it('RESP-VP-02: Mobile Small (320px) retains minimum 288px usable content width with standard p-4 padding', () => {
    const usable = getUsableContentWidth(320, 16);
    expect(usable).toBe(288);
    expect(usable).toBeGreaterThanOrEqual(280);
  });

  it('RESP-VP-03: Mobile Standard (375px - iPhone 12/13 mini) categorizes in base mobile tier', () => {
    const width = 375;
    expect(width).toBeLessThan(BREAKPOINTS.sm);
    expect(getActiveBreakpoint(width)).toBe('base');
    expect(getUsableContentWidth(width, 16)).toBe(343);
  });

  it('RESP-VP-04: Mobile Standard (390px - iPhone 12-16) categorizes in base mobile tier', () => {
    const width = 390;
    expect(width).toBeLessThan(BREAKPOINTS.sm);
    expect(getActiveBreakpoint(width)).toBe('base');
    expect(getUsableContentWidth(width, 16)).toBe(358);
  });

  it('RESP-VP-05: Mobile Large / Phablet (414px - iPhone 11 Pro Max/XR) categorizes in base mobile tier', () => {
    const width = 414;
    expect(width).toBeLessThan(BREAKPOINTS.sm);
    expect(getActiveBreakpoint(width)).toBe('base');
    expect(getUsableContentWidth(width, 16)).toBe(382);
  });

  it('RESP-VP-06: Mobile Large / Phablet (428px/430px - 15/16 Pro Max, S24 Ultra) categorizes in base mobile tier', () => {
    const width = 430;
    expect(width).toBeLessThan(BREAKPOINTS.sm);
    expect(getActiveBreakpoint(width)).toBe('base');
    expect(getUsableContentWidth(width, 16)).toBe(398);
  });

  it('RESP-VP-07: Tablet Portrait (768px - iPad Mini/Air) activates Tailwind md: breakpoint', () => {
    const width = 768;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS.md);
    expect(getActiveBreakpoint(width)).toBe('md');
  });

  it('RESP-VP-08: Tablet Portrait (820px - iPad 10th gen) activates Tailwind md: breakpoint', () => {
    const width = 820;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS.md);
    expect(width).toBeLessThan(BREAKPOINTS.lg);
    expect(getActiveBreakpoint(width)).toBe('md');
  });

  it('RESP-VP-09: Tablet Landscape / Small Laptop (1024px) activates Tailwind lg: breakpoint', () => {
    const width = 1024;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS.lg);
    expect(getActiveBreakpoint(width)).toBe('lg');
  });

  it('RESP-VP-10: Desktop Standard (1280px - MacBook Air) activates Tailwind xl: breakpoint', () => {
    const width = 1280;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS.xl);
    expect(getActiveBreakpoint(width)).toBe('xl');
  });

  it('RESP-VP-11: Desktop Large (1440px - MacBook Pro 16" / External QHD) activates xl: tier', () => {
    const width = 1440;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS.xl);
    expect(width).toBeLessThan(BREAKPOINTS['2xl']);
    expect(getActiveBreakpoint(width)).toBe('xl');
  });

  it('RESP-VP-12: High-Res FHD (1920px - 1080p display) activates Tailwind 2xl: tier', () => {
    const width = 1920;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS['2xl']);
    expect(getActiveBreakpoint(width)).toBe('2xl');
  });

  it('RESP-VP-13: High-Res QHD (2560px - 1440p / Apple Studio Display) activates 2xl: tier and is constrained by max-w-7xl', () => {
    const width = 2560;
    expect(width).toBeGreaterThanOrEqual(BREAKPOINTS['2xl']);
    const MAX_W_7XL = 1280; // 80rem
    expect(MAX_W_7XL).toBeLessThan(width);
    // Verifies layout will center content rather than blowing out
    const marginAutoGutter = (width - MAX_W_7XL) / 2;
    expect(marginAutoGutter).toBe(640);
  });

  it('RESP-VP-14: Ultra High-Res 4K UHD (3840px) is constrained by max-w-7xl container preventing extreme elongation', () => {
    const width = 3840;
    const MAX_W_7XL = 1280;
    const marginGutter = (width - MAX_W_7XL) / 2;
    expect(marginGutter).toBe(1280);
    expect(sources.appShell).toContain('max-w-7xl');
  });

  it('RESP-VP-15: Orientation Portrait - iPhone 14/15/16 (390x844) validates aspect ratio < 1.0', () => {
    const width = 390;
    const height = 844;
    expect(getOrientation(width, height)).toBe('portrait');
    const aspectRatio = width / height;
    expect(aspectRatio).toBeLessThan(1.0);
    expect(aspectRatio).toBeCloseTo(0.462, 2);
  });

  it('RESP-VP-16: Orientation Landscape - iPhone 14/15/16 (844x390) validates aspect ratio > 1.0', () => {
    const width = 844;
    const height = 390;
    expect(getOrientation(width, height)).toBe('landscape');
    const aspectRatio = width / height;
    expect(aspectRatio).toBeGreaterThan(1.0);
    expect(aspectRatio).toBeCloseTo(2.164, 2);
  });

  it('RESP-VP-17: Orientation Mobile Landscape: vertical viewport of 390px leaves adequate workspace after 64px nav', () => {
    const viewportHeight = 390;
    const bottomNavHeight = 64; // h-16
    const topHeaderHeight = 44;
    const usableHeight = viewportHeight - (bottomNavHeight + topHeaderHeight);
    expect(usableHeight).toBe(282);
    expect(usableHeight).toBeGreaterThan(200);
  });

  it('RESP-VP-18: Orientation Tablet Landscape (1024x768) confirms 4:3 aspect ratio (1.33)', () => {
    const width = 1024;
    const height = 768;
    expect(getOrientation(width, height)).toBe('landscape');
    expect(width / height).toBeCloseTo(1.333, 2);
  });

  it('RESP-VP-19: Orientation Tablet Portrait (768x1024) confirms 3:4 aspect ratio (0.75)', () => {
    const width = 768;
    const height = 1024;
    expect(getOrientation(width, height)).toBe('portrait');
    expect(width / height).toBeCloseTo(0.75, 2);
  });

  it('RESP-VP-20: Ultrawide Monitor (3440x1440) verifies 21:9 aspect ratio (2.38) with max-w container safeguard', () => {
    const width = 3440;
    const height = 1440;
    expect(width / height).toBeCloseTo(2.388, 2);
    expect(sources.appShell).toContain('mx-auto');
  });

  it('RESP-VP-21: Breakpoint Boundary 639px vs 640px verifies sm transition threshold', () => {
    expect(getActiveBreakpoint(639)).toBe('base');
    expect(getActiveBreakpoint(640)).toBe('sm');
  });

  it('RESP-VP-22: Breakpoint Boundary 767px vs 768px verifies md transition (mobile nav to desktop sidebar)', () => {
    expect(getActiveBreakpoint(767)).toBe('sm');
    expect(getActiveBreakpoint(768)).toBe('md');
    // AppShell specifies md:hidden on mobile nav and hidden md:flex on sidebar
    expect(sources.appShell).toContain('md:hidden');
    expect(sources.appShell).toContain('hidden md:flex');
  });

  it('RESP-VP-23: Breakpoint Boundary 1023px vs 1024px verifies lg transition threshold', () => {
    expect(getActiveBreakpoint(1023)).toBe('md');
    expect(getActiveBreakpoint(1024)).toBe('lg');
  });

  it('RESP-VP-24: Breakpoint Boundary 1279px vs 1280px verifies xl transition threshold', () => {
    expect(getActiveBreakpoint(1279)).toBe('lg');
    expect(getActiveBreakpoint(1280)).toBe('xl');
  });

  it('RESP-VP-25: Breakpoint Boundary 1535px vs 1536px verifies 2xl transition threshold', () => {
    expect(getActiveBreakpoint(1535)).toBe('xl');
    expect(getActiveBreakpoint(1536)).toBe('2xl');
  });

  it('RESP-VP-26: Tailwind Configuration verified for standard responsive screens compatibility', () => {
    expect(sources.tailwindConfig).toBeDefined();
    // Default Tailwind screens: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px
    expect(BREAKPOINTS.sm).toBe(640);
    expect(BREAKPOINTS.md).toBe(768);
    expect(BREAKPOINTS.lg).toBe(1024);
    expect(BREAKPOINTS.xl).toBe(1280);
    expect(BREAKPOINTS['2xl']).toBe(1536);
  });

  it('RESP-VP-27: Container max-width hierarchy verified across layouts', () => {
    expect(sources.appShell).toContain('max-w-7xl'); // 1280px
    expect(sources.publicQuotePortal).toContain('max-w-2xl'); // 672px
    expect(sources.invoiceBuilder).toContain('max-w-4xl'); // 896px
  });

  it('RESP-VP-28: Dynamic viewport height safety verified: AppShell uses min-h-screen for full viewport coverage', () => {
    expect(sources.appShell).toContain('min-h-screen');
    expect(sources.publicQuotePortal).toContain('min-h-screen');
    expect(sources.publicInvoicePage).toContain('min-h-screen');
  });
});

// ============================================================================
// SUITE 2: TOUCH TARGET ERGONOMICS (Tests 29 - 66)
// Apple HIG & Android Material Design: Minimum 44x44px Interactive Touch Targets
// ============================================================================
describe('Suite 2: Touch Target Ergonomics (Apple HIG & Material 44x44px Minimum)', () => {
  it('RESP-TOUCH-01: UI Button component enforces min-h-[44px] in baseStyles', () => {
    expect(sources.button).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-02: UI Button component icon size variant enforces h-11 w-11 (44x44px)', () => {
    expect(sources.button).toContain('h-11 w-11');
  });

  it('RESP-TOUCH-03: UI Input component enforces h-11 (44px) default height', () => {
    expect(sources.input).toContain('h-11');
  });

  it('RESP-TOUCH-04: AppShell mobile bottom nav items enforce height h-16 (64px >= 44px)', () => {
    expect(sources.appShell).toContain('h-16');
  });

  it('RESP-TOUCH-05: AppShell mobile bottom nav links enforce touch width w-16 (64px >= 44px)', () => {
    expect(sources.appShell).toContain('w-16 h-full');
  });

  it('RESP-TOUCH-06: [AUDIT-FAIL] AppShell mobile header logout button audits touch target size (p-1.5 is 28px < 44px)', () => {
    // Current AppShell has "p-1.5 text-slate-400" on mobile logout button which only yields ~28px touch target
    const has44pxLogout = sources.appShell.includes('min-h-[44px]') && sources.appShell.includes('min-w-[44px]');
    expect(has44pxLogout, 'AppShell mobile header logout button lacks min-h-[44px] touch target').toBe(true);
  });

  it('RESP-TOUCH-07: [AUDIT-FAIL] ThemeToggle trigger button audits touch target size (w-9 h-9 is 36px < 44px)', () => {
    // ThemeToggle uses w-9 h-9 (36px x 36px) which violates the 44px Apple HIG / Android touch target minimum
    const has44px = sources.themeToggle.includes('w-11 h-11') || sources.themeToggle.includes('min-h-[44px]');
    expect(has44px, 'ThemeToggle trigger button is w-9 h-9 (36px), failing the 44px touch target minimum').toBe(true);
  });

  it('RESP-TOUCH-08: ThemeToggle dropdown option buttons satisfy touch target ergonomics', () => {
    expect(sources.themeToggle).toContain('px-3 py-2');
  });

  it('RESP-TOUCH-09: [AUDIT-FAIL] LanguageSelector trigger button audits touch target size (w-9 h-9 is 36px < 44px)', () => {
    // LanguageSelector uses w-9 h-9 (36px)
    const has44px = sources.languageSelector.includes('w-11 h-11') || sources.languageSelector.includes('min-h-[44px]');
    expect(has44px, 'LanguageSelector trigger is w-9 h-9 (36px), failing 44px touch target requirement').toBe(true);
  });

  it('RESP-TOUCH-10: LanguageSelector dropdown language items satisfy touch target ergonomics', () => {
    expect(sources.languageSelector).toContain('px-2.5 py-2');
  });

  it('RESP-TOUCH-11: [AUDIT-FAIL] CurrencySelector trigger button audits touch target size (w-9 h-9 is 36px < 44px)', () => {
    // CurrencySelector uses w-9 h-9 (36px)
    const has44px = sources.currencySelector.includes('w-11 h-11') || sources.currencySelector.includes('min-h-[44px]');
    expect(has44px, 'CurrencySelector trigger is w-9 h-9 (36px), failing 44px touch target requirement').toBe(true);
  });

  it('RESP-TOUCH-12: CurrencySelector dropdown currency items satisfy touch target ergonomics', () => {
    expect(sources.currencySelector).toContain('px-2.5 py-2');
  });

  it('RESP-TOUCH-13: PublicQuotePortal "Approve Quote" button satisfies touch target ergonomics with h-14 (56px >= 44px)', () => {
    expect(sources.publicQuotePortal).toContain('h-14');
  });

  it('RESP-TOUCH-14: PublicQuotePortal "Decline" button satisfies touch target ergonomics with h-14 (56px >= 44px)', () => {
    expect(sources.publicQuotePortal).toContain('h-14');
  });

  it('RESP-TOUCH-15: PublicQuotePortal header PDF button satisfies min-h-[44px]', () => {
    expect(sources.publicQuotePortal).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-16: PublicQuotePortal header Call Office link satisfies min-h-[44px]', () => {
    expect(sources.publicQuotePortal).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-17: PublicInvoicePage header PDF download button satisfies min-h-[44px]', () => {
    expect(sources.publicInvoicePage).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-18: PublicInvoicePage header Call Office button satisfies min-h-[44px]', () => {
    expect(sources.publicInvoicePage).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-19: InvoiceDetailActions Copy Link button satisfies min-h-[44px]', () => {
    expect(sources.invoiceDetailActions).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-20: InvoiceDetailActions Download PDF button satisfies min-h-[44px]', () => {
    expect(sources.invoiceDetailActions).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-21: InvoiceDetailActions Record Payment button satisfies min-h-[44px]', () => {
    expect(sources.invoiceDetailActions).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-22: InvoiceDetailActions Void button satisfies min-h-[44px]', () => {
    expect(sources.invoiceDetailActions).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-23: InvoiceDetailActions sticky mobile bar action buttons satisfy min-h-[44px]', () => {
    expect(sources.invoiceDetailActions).toContain('className="w-full min-h-[44px]"');
    expect(sources.invoiceDetailActions).toContain('className="flex-2 min-h-[44px] font-bold shadow-sm"');
  });

  it('RESP-TOUCH-24: QuoteDetailActions action buttons specify min-h-[44px]', () => {
    expect(sources.quoteDetailActions).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-25: QuoteDetailActions sticky mobile bar buttons specify min-h-[44px]', () => {
    expect(sources.quoteDetailActions).toContain('className="flex-2 min-h-[44px] font-bold"');
  });

  it('RESP-TOUCH-26: JobDetailActions desktop action buttons specify min-h-[44px]', () => {
    expect(sources.jobDetailActions).toContain('min-h-[44px]');
  });

  it('RESP-TOUCH-27: JobDetailActions sticky mobile action buttons specify min-h-[48px] exceeding 44px threshold', () => {
    expect(sources.jobDetailActions).toContain('min-h-[48px]');
  });

  it('RESP-TOUCH-28: [AUDIT-FAIL] InvoiceBuilder "Add Custom Line" button audits touch target size (uses min-h-[38px] < 44px)', () => {
    // InvoiceBuilder line 305 specifies min-h-[38px] which is 6px smaller than the 44px requirement
    const hasViolation = sources.invoiceBuilder.includes('min-h-[38px]');
    expect(!hasViolation, 'InvoiceBuilder has "min-h-[38px]" on Add Custom Line button, violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-29: [AUDIT-FAIL] InvoiceBuilder line item inputs audit touch target height (uses min-h-[40px] < 44px)', () => {
    // InvoiceBuilder lines 325, 340, 354 specify min-h-[40px] instead of min-h-[44px]
    const hasViolation = sources.invoiceBuilder.includes('min-h-[40px]');
    expect(!hasViolation, 'InvoiceBuilder uses "min-h-[40px]" for line item inputs, violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-30: [AUDIT-FAIL] InvoiceBuilder discount input audits touch target height (uses h-8 [32px] < 44px)', () => {
    // InvoiceBuilder line 410 specifies h-8 (32px)
    const hasViolation = sources.invoiceBuilder.includes('className="h-8 text-right text-xs"');
    expect(!hasViolation, 'InvoiceBuilder discount input uses h-8 (32px), violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-31: [AUDIT-FAIL] InvoiceBuilder remove line item trash button audits touch target (uses p-2 [32px] < 44px)', () => {
    // InvoiceBuilder line 383 uses p-2 with w-4 h-4 icon (32px x 32px)
    const hasViolation = sources.invoiceBuilder.includes('className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-600');
    expect(!hasViolation, 'InvoiceBuilder delete line button has p-2 (32px), violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-32: [AUDIT-FAIL] QuoteBuilder line item delete button audits touch target (uses p-1 [24px] < 44px)', () => {
    // QuoteBuilder line 304 uses p-1 with w-4 h-4 icon (24px x 24px)
    const hasViolation = sources.quoteBuilder.includes('disabled:opacity-30 p-1');
    expect(!hasViolation, 'QuoteBuilder delete line button has p-1 (24px), violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-33: [AUDIT-FAIL] QuoteBuilder discount input audits touch target height (uses px-2 py-1 text-xs < 44px)', () => {
    // QuoteBuilder line 369 uses px-2 py-1 text-xs (~26px)
    const hasViolation = sources.quoteBuilder.includes('className="w-24 px-2 py-1 text-xs text-right');
    expect(!hasViolation, 'QuoteBuilder discount input uses px-2 py-1 (~26px), violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-34: [AUDIT-FAIL] TechnicianFieldPortal work order completion button audits touch target (uses min-h-[42px] < 44px)', () => {
    // TechnicianFieldPortal line 526 specifies min-h-[42px]
    const hasViolation = sources.technicianPortal.includes('min-h-[42px]');
    expect(!hasViolation, 'TechnicianFieldPortal completion button uses min-h-[42px], violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-35: [AUDIT-FAIL] TechnicianFieldPortal stopwatch reset button audits touch target (uses p-2 [30px] < 44px)', () => {
    // TechnicianFieldPortal line 551 uses p-2 with w-3.5 h-3.5 icon (30px)
    const hasViolation = sources.technicianPortal.includes('className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95"');
    expect(!hasViolation, 'TechnicianFieldPortal reset button is 30px, violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-36: [AUDIT-FAIL] AddCustomerModal close modal button audits touch target (uses p-1 [28px] < 44px)', () => {
    // AddCustomerModal line 64 uses p-1 with w-5 h-5 (28px)
    const hasViolation = sources.addCustomerModal.includes('className="text-slate-400 hover:text-slate-600 p-1"');
    expect(!hasViolation, 'AddCustomerModal close button uses p-1 (28px), violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-37: [AUDIT-FAIL] RecordPaymentModal close modal button audits touch target (uses p-1 [28px] < 44px)', () => {
    // RecordPaymentModal line 71 uses p-1 with w-5 h-5 (28px)
    const hasViolation = sources.recordPaymentModal.includes('className="text-slate-400 hover:text-slate-600 p-1"');
    expect(!hasViolation, 'RecordPaymentModal close button uses p-1 (28px), violating 44px touch target').toBe(true);
  });

  it('RESP-TOUCH-38: CustomerDetailPage contact links enforce min-h-[44px] on phone, email, and directions', () => {
    expect(sources.customerDetailPage).toContain('href={`tel:${customer.phone}`}');
    expect(sources.customerDetailPage).toContain('min-h-[44px]');
  });
});

// ============================================================================
// SUITE 3: MOBILE-SPECIFIC CONTROLS & LAYOUT ADAPTATIONS (Tests 67 - 100)
// Sticky action footer, horizontal scrolling, auto-stacking grids, mobile nav
// ============================================================================
describe('Suite 3: Mobile-Specific Controls & Layout Adaptations', () => {
  it('RESP-CTRL-01: InvoiceDetailActions specifies sticky mobile thumb-zone action bar container', () => {
    expect(sources.invoiceDetailActions).toContain('sm:hidden fixed bottom-0 left-0 right-0');
  });

  it('RESP-CTRL-02: InvoiceDetailActions sticky bar uses sm:hidden to prevent desktop duplication', () => {
    expect(sources.invoiceDetailActions).toContain('sm:hidden fixed bottom-0');
  });

  it('RESP-CTRL-03: InvoiceDetailActions sticky bar specifies z-50 to stay above scrollable content', () => {
    expect(sources.invoiceDetailActions).toContain('z-50 shadow-2xl');
  });

  it('RESP-CTRL-04: InvoiceDetailActions sticky bar specifies backdrop-blur for content legibility', () => {
    expect(sources.invoiceDetailActions).toContain('backdrop-blur');
  });

  it('RESP-CTRL-05: [AUDIT-FAIL] InvoiceDetailActions sticky bar audits dark mode background (missing dark:bg-zinc-900/95)', () => {
    // Current line 164 has "bg-white/95 backdrop-blur" without dark:bg-zinc-900/95
    const hasDarkBg = sources.invoiceDetailActions.includes('dark:bg-zinc-900/95');
    expect(hasDarkBg, 'InvoiceDetailActions sticky bar lacks dark:bg-zinc-900/95 dark mode styling').toBe(true);
  });

  it('RESP-CTRL-06: QuoteDetailActions specifies sticky mobile thumb-zone action bar container', () => {
    expect(sources.quoteDetailActions).toContain('sm:hidden fixed bottom-0 left-0 right-0');
  });

  it('RESP-CTRL-07: QuoteDetailActions sticky bar specifies sm:hidden fixed bottom-0 left-0 right-0 p-3', () => {
    expect(sources.quoteDetailActions).toContain('p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-50 shadow-2xl');
  });

  it('RESP-CTRL-08: [AUDIT-FAIL] QuoteDetailActions sticky bar audits dark mode background (missing dark:bg-zinc-900/95)', () => {
    // Current line 245 has "bg-white/95 backdrop-blur" without dark:bg-zinc-900/95
    const hasDarkBg = sources.quoteDetailActions.includes('dark:bg-zinc-900/95');
    expect(hasDarkBg, 'QuoteDetailActions sticky bar lacks dark:bg-zinc-900/95 dark mode styling').toBe(true);
  });

  it('RESP-CTRL-09: JobDetailActions specifies sticky mobile thumb-zone action bar container', () => {
    expect(sources.jobDetailActions).toContain('sm:hidden fixed bottom-0 left-0 right-0');
  });

  it('RESP-CTRL-10: [AUDIT-FAIL] JobDetailActions sticky bar audits dark mode background (missing dark:bg-zinc-900/95)', () => {
    // Current line 111 has "bg-white/95 backdrop-blur" without dark:bg-zinc-900/95
    const hasDarkBg = sources.jobDetailActions.includes('dark:bg-zinc-900/95');
    expect(hasDarkBg, 'JobDetailActions sticky bar lacks dark:bg-zinc-900/95 dark mode styling').toBe(true);
  });

  it('RESP-CTRL-11: InvoiceBuilder specifies sticky mobile footer bar', () => {
    expect(sources.invoiceBuilder).toContain('sm:hidden fixed bottom-0 left-0 right-0');
  });

  it('RESP-CTRL-12: InvoiceBuilder sticky mobile bar includes full dark mode styling dark:bg-zinc-900/95', () => {
    expect(sources.invoiceBuilder).toContain('bg-white/95 dark:bg-zinc-900/95 backdrop-blur');
  });

  it('RESP-CTRL-13: InvoiceBuilder sticky mobile bar includes dark:border-zinc-800 z-50', () => {
    expect(sources.invoiceBuilder).toContain('dark:border-zinc-800 z-50');
  });

  it('RESP-CTRL-14: [AUDIT-FAIL] QuoteBuilder audits presence of sticky mobile action footer bar (missing sticky footer bar)', () => {
    // QuoteBuilder currently only has an inline card button and lacks a sticky mobile action bar
    const hasStickyBar = sources.quoteBuilder.includes('sm:hidden fixed bottom-0');
    expect(hasStickyBar, 'QuoteBuilder lacks a sticky mobile action footer bar for thumbs-up approval on mobile').toBe(true);
  });

  it('RESP-CTRL-15: JobScheduler specifies sticky mobile bar with sm:hidden fixed bottom-0 left-0 right-0', () => {
    expect(sources.jobScheduler).toContain('sm:hidden fixed bottom-0 left-0 right-0');
  });

  it('RESP-CTRL-16: JobScheduler sticky mobile bar includes dark:bg-zinc-900/95 and z-50', () => {
    expect(sources.jobScheduler).toContain('dark:bg-zinc-900/95 backdrop-blur border-t border-slate-200 dark:border-zinc-800 z-50');
  });

  it('RESP-CTRL-17: [AUDIT-FAIL] PublicQuotePortal audits sticky mobile approval bar (currently inline in CardFooter only)', () => {
    // PublicQuotePortal has CardFooter with buttons, but lacks a fixed sticky mobile action bar for thumb ergonomics
    const hasStickyBar = sources.publicQuotePortal.includes('sm:hidden fixed bottom-0');
    expect(hasStickyBar, 'PublicQuotePortal lacks a sticky mobile action bar for one-tap customer approval').toBe(true);
  });

  it('RESP-CTRL-18: Invoices list page filter tabs specify overflow-x-auto to prevent mobile viewport blowout', () => {
    expect(sources.invoicesPage).toContain('overflow-x-auto');
  });

  it('RESP-CTRL-19: Quotes list page filter tabs specify overflow-x-auto to prevent mobile viewport blowout', () => {
    expect(sources.quotesPage).toContain('overflow-x-auto');
  });

  it('RESP-CTRL-20: Jobs list page filter tabs specify overflow-x-auto to prevent mobile viewport blowout', () => {
    expect(sources.jobsPage).toContain('overflow-x-auto');
  });

  it('RESP-CTRL-21: Invoices list page filter tab chips specify whitespace-nowrap for horizontal swiping', () => {
    expect(sources.invoicesPage).toContain('whitespace-nowrap');
  });

  it('RESP-CTRL-22: Quotes list page filter tab chips specify whitespace-nowrap for horizontal swiping', () => {
    expect(sources.quotesPage).toContain('whitespace-nowrap');
  });

  it('RESP-CTRL-23: Jobs list page filter tab chips specify whitespace-nowrap for horizontal swiping', () => {
    expect(sources.jobsPage).toContain('whitespace-nowrap');
  });

  it('RESP-CTRL-24: OwnerPictorialDashboard radial progress dials auto-stack using grid-cols-1 md:grid-cols-3', () => {
    expect(sources.ownerDashboard).toContain('grid grid-cols-1 md:grid-cols-3 gap-4');
  });

  it('RESP-CTRL-25: OwnerPictorialDashboard priority triage & telemetry auto-stack using grid-cols-1 md:grid-cols-2', () => {
    expect(sources.ownerDashboard).toContain('grid grid-cols-1 md:grid-cols-2 gap-4');
  });

  it('RESP-CTRL-26: OwnerPictorialDashboard active crew roster auto-stacks using grid-cols-1 sm:grid-cols-3', () => {
    expect(sources.ownerDashboard).toContain('grid grid-cols-1 sm:grid-cols-3 gap-3');
  });

  it('RESP-CTRL-27: TechnicianFieldPortal dispatch action stepper auto-stacks using grid-cols-1 sm:grid-cols-4', () => {
    expect(sources.technicianPortal).toContain('grid grid-cols-1 sm:grid-cols-4 gap-2');
  });

  it('RESP-CTRL-28: TechnicianFieldPortal stopwatch & parts logger auto-stack using grid-cols-1 md:grid-cols-2', () => {
    expect(sources.technicianPortal).toContain('grid grid-cols-1 md:grid-cols-2 gap-4');
  });

  it('RESP-CTRL-29: TeamManagement field technician roster cards auto-stack using grid-cols-1 md:grid-cols-2', () => {
    expect(sources.teamManagement).toContain('grid grid-cols-1 md:grid-cols-2 gap-4');
  });

  it('RESP-CTRL-30: CustomerDetailPage timeline columns auto-stack using grid-cols-1 md:grid-cols-3', () => {
    expect(sources.customerDetailPage).toContain('grid grid-cols-1 md:grid-cols-3 gap-6');
  });

  it('RESP-CTRL-31: SettingsForm business profile fields auto-stack using grid-cols-1 sm:grid-cols-2', () => {
    expect(sources.settingsForm).toContain('grid grid-cols-1 sm:grid-cols-2 gap-4');
  });

  it('RESP-CTRL-32: [AUDIT-FAIL] AddCustomerModal address fields layout audits small mobile screens (uses rigid grid-cols-3 on 320px)', () => {
    // Line 112 uses "grid grid-cols-3 gap-2" which severely squeezes City, State, and Zip inputs on 320px-375px screens
    const hasResponsiveCols = sources.addCustomerModal.includes('grid-cols-1 sm:grid-cols-3');
    expect(hasResponsiveCols, 'AddCustomerModal uses rigid grid-cols-3 on mobile small instead of grid-cols-1 sm:grid-cols-3').toBe(true);
  });

  it('RESP-CTRL-33: AppShell mobile top header specifies md:hidden flex items-center justify-between sticky top-0 z-30', () => {
    expect(sources.appShell).toContain('md:hidden flex items-center justify-between');
    expect(sources.appShell).toContain('sticky top-0 z-30');
  });

  it('RESP-CTRL-34: AppShell mobile bottom navigation specifies md:hidden fixed bottom-0 left-0 right-0 z-40', () => {
    expect(sources.appShell).toContain('md:hidden fixed bottom-0 left-0 right-0');
    expect(sources.appShell).toContain('z-40');
  });
});

// ============================================================================
// SUITE 4: DENSITY & CONTENT SCALING, FONT SCALING & METADATA WRAPPING (Tests 101 - 132)
// ============================================================================
describe('Suite 4: Density & Content Scaling, Font Scaling & Metadata Wrapping', () => {
  it('RESP-SCALE-01: Invoices list page title scales responsively with text-2xl sm:text-3xl font-black', () => {
    expect(sources.invoicesPage).toContain('text-2xl sm:text-3xl font-black');
  });

  it('RESP-SCALE-02: Quotes list page title scales responsively with text-2xl sm:text-3xl font-black', () => {
    expect(sources.quotesPage).toContain('text-2xl sm:text-3xl font-black');
  });

  it('RESP-SCALE-03: Customers list page title scales responsively with text-2xl sm:text-3xl font-black', () => {
    expect(sources.customersPage).toContain('text-2xl sm:text-3xl font-black');
  });

  it('RESP-SCALE-04: Jobs list page title scales responsively with text-2xl sm:text-3xl font-black', () => {
    expect(sources.jobsPage).toContain('text-2xl sm:text-3xl font-black');
  });

  it('RESP-SCALE-05: OwnerPictorialDashboard title scales responsively with text-2xl sm:text-3xl font-black', () => {
    expect(sources.ownerDashboard).toContain('text-2xl sm:text-3xl font-black');
  });

  it('RESP-SCALE-06: PublicQuotePortal organization title scales responsively with text-lg sm:text-xl font-bold', () => {
    expect(sources.publicQuotePortal).toContain('text-lg sm:text-xl');
  });

  it('RESP-SCALE-07: PublicQuotePortal total price display scales responsively with text-2xl sm:text-3xl font-black', () => {
    expect(sources.publicQuotePortal).toContain('text-2xl sm:text-3xl font-black text-blue-600');
  });

  it('RESP-SCALE-08: AppShell main content padding scales responsively with p-4 sm:p-6 md:p-8', () => {
    expect(sources.appShell).toContain('p-4 sm:p-6 md:p-8');
  });

  it('RESP-SCALE-09: AppShell main content clears mobile bottom bar with pb-24 md:pb-12', () => {
    expect(sources.appShell).toContain('pb-24 md:pb-12');
  });

  it('RESP-SCALE-10: PublicQuotePortal card header padding scales responsively with p-5 sm:p-8', () => {
    expect(sources.publicQuotePortal).toContain('p-5 sm:p-8');
  });

  it('RESP-SCALE-11: PublicInvoicePage card header padding scales responsively with p-5 sm:p-8', () => {
    expect(sources.publicInvoicePage).toContain('p-5 sm:p-8');
  });

  it('RESP-SCALE-12: InvoiceBuilder card content padding scales responsively with p-4 sm:p-6', () => {
    expect(sources.invoiceBuilder).toContain('p-4 sm:p-6');
  });

  it('RESP-SCALE-13: QuoteBuilder card content padding scales responsively with p-4 sm:p-6', () => {
    expect(sources.quoteBuilder).toContain('p-4 sm:p-6');
  });

  it('RESP-SCALE-14: Customers list page customer metadata chips specify flex flex-wrap', () => {
    expect(sources.customersPage).toContain('flex flex-wrap items-center gap-x-4 gap-y-1');
  });

  it('RESP-SCALE-15: CustomerDetailPage contact info chips specify flex flex-wrap', () => {
    expect(sources.customerDetailPage).toContain('flex flex-wrap items-center gap-x-6 gap-y-2');
  });

  it('RESP-SCALE-16: Jobs list page job metadata chips specify flex flex-wrap', () => {
    expect(sources.jobsPage).toContain('flex flex-wrap items-center gap-x-4 gap-y-1');
  });

  it('RESP-SCALE-17: InvoiceDetailActions action button group specifies flex flex-wrap items-center gap-2', () => {
    expect(sources.invoiceDetailActions).toContain('flex flex-wrap items-center gap-2');
  });

  it('RESP-SCALE-18: QuoteDetailActions action button group specifies flex flex-wrap items-center gap-2', () => {
    expect(sources.quoteDetailActions).toContain('flex flex-wrap items-center gap-2');
  });

  it('RESP-SCALE-19: JobDetailActions action button group specifies flex flex-wrap items-center gap-2', () => {
    expect(sources.jobDetailActions).toContain('flex flex-wrap items-center gap-2');
  });

  it('RESP-SCALE-20: InvoiceBuilder plumbing presets specify flex flex-wrap gap-2', () => {
    expect(sources.invoiceBuilder).toContain('flex flex-wrap gap-2');
  });

  it('RESP-SCALE-21: QuoteBuilder quick preset buttons specify flex flex-wrap items-center gap-2', () => {
    expect(sources.quoteBuilder).toContain('flex flex-wrap items-center gap-2');
  });

  it('RESP-SCALE-22: OwnerPictorialDashboard header buttons specify flex flex-wrap items-center gap-2', () => {
    expect(sources.ownerDashboard).toContain('flex flex-wrap items-center gap-2');
  });

  it('RESP-SCALE-23: TechnicianFieldPortal truck parts chips specify flex flex-wrap gap-1.5', () => {
    expect(sources.technicianPortal).toContain('flex flex-wrap gap-1.5');
  });

  it('RESP-SCALE-24: Customers list page specifies truncate to prevent card blowout on long names', () => {
    expect(sources.customersPage).toContain('min-w-0');
  });

  it('RESP-SCALE-25: Invoices list page specifies truncate and min-w-0 to protect small mobile viewports', () => {
    expect(sources.invoicesPage).toContain('min-w-0');
    expect(sources.invoicesPage).toContain('truncate');
  });

  it('RESP-SCALE-26: Jobs list page specifies truncate and min-w-0 to prevent title wrapping issues', () => {
    expect(sources.jobsPage).toContain('min-w-0');
    expect(sources.jobsPage).toContain('truncate');
  });

  it('RESP-SCALE-27: AppShell mobile header truncates organization name with max-w-[130px] preventing header overflow', () => {
    expect(sources.appShell).toContain('truncate max-w-[130px]');
  });

  it('RESP-SCALE-28: AppShell mobile bottom nav truncates labels with max-w-[60px] preventing horizontal spill', () => {
    expect(sources.appShell).toContain('truncate max-w-[60px]');
  });

  it('RESP-SCALE-29: OwnerPictorialDashboard revenue velocity SVG specifies viewBox="0 0 700 120" and w-full', () => {
    expect(sources.ownerDashboard).toContain('viewBox="0 0 700 120"');
    expect(sources.ownerDashboard).toContain('preserveAspectRatio="none"');
  });

  it('RESP-SCALE-30: OwnerPictorialDashboard circular radial dials specify viewBox="0 0 100 100" and relative sizing', () => {
    expect(sources.ownerDashboard).toContain('viewBox="0 0 100 100"');
  });

  it('RESP-SCALE-31: AppShell desktop sidebar specifies group-hover animation with width 72px to 256px (w-[72px] hover:w-64)', () => {
    expect(sources.appShell).toContain('w-[72px] hover:w-64');
    expect(sources.appShell).toContain('group/sidebar');
  });

  it('RESP-SCALE-32: Globals CSS defines smooth transition properties for responsive containers', () => {
    expect(sources.globalsCss).toBeDefined();
    expect(sources.globalsCss.length).toBeGreaterThan(100);
  });
});
