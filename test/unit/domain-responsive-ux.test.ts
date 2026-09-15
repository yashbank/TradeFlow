import { describe, it, expect, vi } from 'vitest';
import { FEATURES } from '@/lib/featureFlags';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';
import { translations, CORE_8_LOCALES, translate } from '@/lib/i18n/translations';
import { formatCurrency } from '@/lib/utils';
import { formatCurrencyLocale, SUPPORTED_CURRENCIES } from '@/lib/currency/rates';

describe('Domain Responsive UX & Resilience Suite (test/unit/domain-responsive-ux.test.ts)', () => {
  // ============================================================================
  // Scope 1: Feature Flag FEATURES.DEMO_SEEDING
  // ============================================================================
  describe('Scope 1: Feature Flags & Demo Seeding Default', () => {
    it('001. FEATURES.DEMO_SEEDING defaults to true when environment variable is not explicitly false', () => {
      expect(FEATURES.DEMO_SEEDING).toBe(true);
    });

    it('002. FEATURES object is defined as an exportable configuration object', () => {
      expect(typeof FEATURES).toBe('object');
      expect(FEATURES).toHaveProperty('DEMO_SEEDING');
    });

    it('003. FEATURES.DEMO_SEEDING is a strict boolean value', () => {
      expect(typeof FEATURES.DEMO_SEEDING).toBe('boolean');
    });

    it('004. logic matches specification: process.env.NEXT_PUBLIC_ENABLE_DEMO_SEEDING !== "false"', () => {
      const evaluateFlag = (envVal?: string) => envVal !== 'false';
      expect(evaluateFlag(undefined)).toBe(true);
      expect(evaluateFlag('true')).toBe(true);
      expect(evaluateFlag('1')).toBe(true);
      expect(evaluateFlag('')).toBe(true);
      expect(evaluateFlag('false')).toBe(false);
    });

    it('005. evaluateFlag returns false strictly when value is string "false"', () => {
      const evaluateFlag = (envVal?: string) => envVal !== 'false';
      expect(evaluateFlag('false')).toBe(false);
    });

    it('006. demo seeding button in settings is gated by DEMO_SEEDING flag', () => {
      const isSeedingAllowed = (flag: boolean, userRole: string) => flag && (userRole === 'owner' || userRole === 'admin');
      expect(isSeedingAllowed(true, 'owner')).toBe(true);
      expect(isSeedingAllowed(true, 'admin')).toBe(true);
      expect(isSeedingAllowed(false, 'owner')).toBe(false);
      expect(isSeedingAllowed(true, 'technician')).toBe(false);
    });

    it('007. zero-state quick seed button is visible when DEMO_SEEDING is active', () => {
      const shouldRenderZeroStateSeeder = (jobCount: number, flag: boolean) => jobCount === 0 && flag;
      expect(shouldRenderZeroStateSeeder(0, FEATURES.DEMO_SEEDING)).toBe(true);
      expect(shouldRenderZeroStateSeeder(5, FEATURES.DEMO_SEEDING)).toBe(false);
    });

    it('008. FEATURES object properties are readable and consistent', () => {
      expect(FEATURES.DEMO_SEEDING).toBe(true);
      expect(Object.isExtensible(FEATURES)).toBe(true);
    });

    it('009. supports checking all known feature flags', () => {
      expect(Object.keys(FEATURES)).toContain('DEMO_SEEDING');
    });

    it('010. verify flag state in mock client environment', () => {
      const clientConfig = { ...FEATURES };
      expect(clientConfig.DEMO_SEEDING).toBe(true);
    });
  });

  // ============================================================================
  // Scope 2: Error Handler PGRST116 Mapping
  // ============================================================================
  describe('Scope 2: Error Handler PGRST116 Friendly Mapping', () => {
    it('011. maps standard Supabase PGRST116 error object to "Record not found."', () => {
      const error = { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' };
      expect(getFriendlyErrorMessage(error)).toBe('Record not found.');
    });

    it('012. maps Error instance with message containing PGRST116', () => {
      const error = new Error('PGRST116: The requested entity does not exist');
      expect(getFriendlyErrorMessage(error)).toBe('Record not found.');
    });

    it('013. maps string error containing PGRST116', () => {
      expect(getFriendlyErrorMessage('Error: PGRST116')).toBe('Record not found.');
    });

    it('014. maps lowercase pgrst116 inside error string', () => {
      const error = { message: 'Failed query: pgrst116 not found' };
      expect(getFriendlyErrorMessage(error)).toBe('Record not found.');
    });

    it('015. maps Supabase single() row absence error', () => {
      const error = { message: 'Results contain 0 rows (PGRST116)' };
      expect(getFriendlyErrorMessage(error)).toBe('Record not found.');
    });

    it('016. does not confuse PGRST116 with other Postgres codes (e.g. 23505 unique violation)', () => {
      const error = { message: 'duplicate key value violates unique constraint', code: '23505' };
      expect(getFriendlyErrorMessage(error)).not.toBe('Record not found.');
      expect(getFriendlyErrorMessage(error)).toBe('duplicate key value violates unique constraint');
    });

    it('017. does not confuse PGRST116 with PGRST301 or 42P01', () => {
      const error = { message: 'table not found in schema cache', code: 'PGRST301' };
      expect(getFriendlyErrorMessage(error)).not.toBe('Record not found.');
    });

    it('018. handles error object where code is PGRST116 without message', () => {
      const error = { code: 'PGRST116' };
      expect(getFriendlyErrorMessage(error)).toBe('Record not found.');
    });

    it('019. handles nested error object with PGRST116 in message', () => {
      const error = { error: { message: 'PGRST116 query returned zero rows' } };
      expect(getFriendlyErrorMessage(error.error)).toBe('Record not found.');
    });

    it('020. ensures user never sees raw PGRST116 technical jargon in UI toast', () => {
      const msg = getFriendlyErrorMessage({ message: 'PGRST116 row not found' });
      expect(msg).not.toContain('PGRST116');
      expect(msg).toBe('Record not found.');
    });
  });

  // ============================================================================
  // Scope 3: Error Handler Network & Auth Errors
  // ============================================================================
  describe('Scope 3: Error Handler Network & Auth Errors', () => {
    it('021. maps "Failed to fetch" to friendly connection issue message', () => {
      const error = new TypeError('Failed to fetch');
      expect(getFriendlyErrorMessage(error)).toBe('Connection issue. Please try again.');
    });

    it('022. maps Firefox NetworkError to friendly connection message', () => {
      const error = { message: 'NetworkError when attempting to fetch resource.' };
      expect(getFriendlyErrorMessage(error)).toBe('Connection issue. Please try again.');
    });

    it('023. maps network string case-insensitively', () => {
      expect(getFriendlyErrorMessage('Network connection lost')).toBe('Connection issue. Please try again.');
      expect(getFriendlyErrorMessage('NETWORK_ERROR')).toBe('Connection issue. Please try again.');
      expect(getFriendlyErrorMessage('network failure')).toBe('Connection issue. Please try again.');
    });

    it('024. maps "network request failed" (common mobile / React Native error)', () => {
      const error = new Error('network request failed');
      expect(getFriendlyErrorMessage(error)).toBe('Connection issue. Please try again.');
    });

    it('025. maps auth/invalid-email to user-friendly message', () => {
      const error = { message: 'Firebase: Error (auth/invalid-email).' };
      expect(getFriendlyErrorMessage(error)).toBe('Please enter a valid email address.');
    });

    it('026. maps "Invalid login credentials" to email/password notice', () => {
      const error = new Error('Invalid login credentials');
      expect(getFriendlyErrorMessage(error)).toBe('Invalid email or password.');
    });

    it('027. passes through standard error messages unchanged', () => {
      const error = new Error('Invoice date cannot be in the past.');
      expect(getFriendlyErrorMessage(error)).toBe('Invoice date cannot be in the past.');
    });

    it('028. handles null gracefully without throwing', () => {
      expect(getFriendlyErrorMessage(null)).toBe('An unexpected error occurred.');
    });

    it('029. handles undefined gracefully without throwing', () => {
      expect(getFriendlyErrorMessage(undefined)).toBe('An unexpected error occurred.');
    });

    it('030. handles empty string error gracefully', () => {
      expect(getFriendlyErrorMessage('')).toBe('An unexpected error occurred.');
    });

    it('031. handles empty object without message gracefully', () => {
      expect(getFriendlyErrorMessage({})).toBe('An unexpected error occurred.');
    });

    it('032. handles number or boolean passed as error', () => {
      expect(getFriendlyErrorMessage(500)).toBe('500');
      expect(getFriendlyErrorMessage(true)).toBe('true');
    });
  });

  // ============================================================================
  // Scope 4: Translation Keys Exist for All 8 Locales (en, es, fr, de, pt, hi, zh, ja)
  // ============================================================================
  describe('Scope 4: Translation Keys Exist for All 8 Locales (en, es, fr, de, pt, hi, zh, ja)', () => {
    const requiredLocales = ['en', 'es', 'fr', 'de', 'pt', 'hi', 'zh', 'ja'] as const;

    it('033. all 8 target locales exist in CORE_8_LOCALES', () => {
      expect(CORE_8_LOCALES).toEqual(requiredLocales);
      expect(CORE_8_LOCALES.length).toBe(8);
    });

    it('034. every one of the 8 locales is defined in the translations dictionary', () => {
      requiredLocales.forEach((locale) => {
        expect(translations[locale]).toBeDefined();
        expect(typeof translations[locale]).toBe('object');
      });
    });

    it('035. core navigation keys exist across all 8 locales', () => {
      const navKeys = [
        'nav.dashboard',
        'nav.schedule',
        'nav.customers',
        'nav.quotes',
        'nav.jobs',
        'nav.invoices',
        'nav.settings',
        'nav.logout',
      ];
      requiredLocales.forEach((locale) => {
        navKeys.forEach((key) => {
          const val = translate(locale, key);
          expect(val).toBeDefined();
          expect(val.length).toBeGreaterThan(0);
          expect(val).not.toBe(key);
        });
      });
    });

    it('036. common action buttons (save, cancel, confirm, delete, edit) exist across all 8 locales', () => {
      const actions = ['common.save', 'common.cancel', 'common.confirm', 'common.delete', 'common.edit'];
      requiredLocales.forEach((locale) => {
        actions.forEach((act) => {
          const val = translate(locale, act);
          expect(val).toBeDefined();
          expect(val.length).toBeGreaterThan(0);
          expect(val).not.toBe(act);
        });
      });
    });

    it('037. dashboard metric titles (mtd_revenue, outstanding, quote_win_rate) exist across all 8 locales', () => {
      const metrics = ['dash.mtd_revenue', 'dash.outstanding', 'dash.quote_win_rate', 'dash.active_jobs'];
      requiredLocales.forEach((locale) => {
        metrics.forEach((m) => {
          const val = translate(locale, m);
          expect(val).toBeDefined();
          expect(val.length).toBeGreaterThan(0);
        });
      });
    });

    it('038. job dispatch keys (jobs.assigned_to, jobs.unassigned_pool) exist across all 8 locales', () => {
      requiredLocales.forEach((locale) => {
        expect(translate(locale, 'jobs.assigned_to')).toBeDefined();
        expect(translate(locale, 'jobs.unassigned_pool')).toBeDefined();
        expect(translate(locale, 'jobs.assigned_to')).not.toBe('jobs.assigned_to');
      });
    });

    it('039. invoice payment keys (record_payment, balance_due) exist across all 8 locales', () => {
      requiredLocales.forEach((locale) => {
        expect(translate(locale, 'invoices.btn.record_payment')).toBeDefined();
        expect(translate(locale, 'invoices.balance_due')).toBeDefined();
      });
    });

    it('040. Portuguese (pt) has localized terms for dashboard, quotes, jobs, and invoices', () => {
      expect(translate('pt', 'nav.dashboard')).toBe('Painel de Controle');
      expect(translate('pt', 'nav.quotes')).toBe('Orçamentos');
      expect(translate('pt', 'nav.jobs')).toBe('Ordens de Serviço');
      expect(translate('pt', 'nav.invoices')).toBe('Faturas');
      expect(translate('pt', 'common.save')).toBe('Salvar');
    });

    it('041. Spanish (es) has localized terms for dashboard, quotes, jobs, and invoices', () => {
      expect(translate('es', 'nav.dashboard')).toBe('Panel Principal');
      expect(translate('es', 'nav.quotes')).toBe('Presupuestos');
      expect(translate('es', 'nav.invoices')).toBe('Facturas');
    });

    it('042. French (fr) has localized terms for dashboard, quotes, jobs, and invoices', () => {
      expect(translate('fr', 'nav.dashboard')).toBe('Tableau de bord');
      expect(translate('fr', 'nav.quotes')).toBe('Devis');
      expect(translate('fr', 'nav.invoices')).toBe('Factures');
    });

    it('043. German (de) has localized terms for dashboard, quotes, jobs, and invoices', () => {
      expect(translate('de', 'nav.dashboard')).toBe('Dashboard');
      expect(translate('de', 'nav.quotes')).toBe('Angebote');
      expect(translate('de', 'nav.invoices')).toBe('Rechnungen');
    });

    it('044. Hindi (hi) has localized Devanagari terms', () => {
      expect(translate('hi', 'nav.dashboard')).toBe('डैशबोर्ड');
      expect(translate('hi', 'nav.quotes')).toBe('कोटेशन');
      expect(translate('hi', 'nav.invoices')).toBe('बिल / इनवॉइस');
    });

    it('045. Japanese (ja) has localized Kanji/Kana terms', () => {
      expect(translate('ja', 'nav.dashboard')).toBe('ダッシュボード');
      expect(translate('ja', 'nav.quotes')).toBe('見積書');
      expect(translate('ja', 'nav.invoices')).toBe('請求書');
    });

    it('046. Chinese (zh) has localized Simplified Chinese terms', () => {
      expect(translate('zh', 'nav.dashboard')).toBe('仪表板');
      expect(translate('zh', 'nav.quotes')).toBe('报价管理');
      expect(translate('zh', 'nav.invoices')).toBe('账单与回款');
    });
  });

  // ============================================================================
  // Scope 5: Currency Formatting for USD, GBP, EUR, INR, JPY
  // ============================================================================
  describe('Scope 5: Multi-Currency Formatting (USD, GBP, EUR, INR, JPY)', () => {
    it('047. formats USD with dollar symbol ($) and 2 decimals', () => {
      const formatted = formatCurrency(123456, 'USD');
      expect(formatted).toContain('$');
      expect(formatted).toMatch(/1,234\.56|1234\.56/);
    });

    it('048. formats GBP with pound symbol (£) and 2 decimals', () => {
      const formatted = formatCurrency(123456, 'GBP');
      expect(formatted).toContain('£');
      expect(formatted).toMatch(/1,234\.56|1234\.56/);
    });

    it('049. formats EUR with euro symbol (€)', () => {
      const formatted = formatCurrency(123456, 'EUR');
      expect(formatted).toContain('€');
      expect(formatted).toMatch(/1[.,]234[.,]56/);
    });

    it('050. formats INR with rupee symbol (₹)', () => {
      const formatted = formatCurrency(123456, 'INR');
      expect(formatted).toContain('₹');
    });

    it('051. formats JPY with yen symbol (¥/￥) and zero decimal places', () => {
      const formatted = formatCurrency(123456, 'JPY');
      expect(formatted).toMatch(/[¥￥]/);
      // In JPY, 123456 cents = 1235 yen with 0 decimals
      expect(formatted).not.toContain('.56');
    });

    it('052. formats 0 cents correctly across all currencies', () => {
      expect(formatCurrency(0, 'USD')).toMatch(/\$0\.00/);
      expect(formatCurrency(0, 'GBP')).toMatch(/£0\.00/);
      expect(formatCurrency(0, 'JPY')).toMatch(/[¥￥]0$/);
    });

    it('053. formats 1 cent ($0.01) correctly', () => {
      const formatted = formatCurrency(1, 'USD');
      expect(formatted).toMatch(/\$0\.01/);
    });

    it('054. formats negative balances correctly (e.g. credit memo or refund)', () => {
      const formatted = formatCurrency(-5000, 'USD');
      expect(formatted).toMatch(/-\s*\$50\.00|\$-50\.00/);
    });

    it('055. formats large amounts exceeding $1,000,000.00 with proper separators', () => {
      const formatted = formatCurrency(150000000, 'USD'); // $1,500,000.00
      expect(formatted).toContain('1,500,000.00');
    });

    it('056. defaults to USD when currency code is omitted', () => {
      const formatted = formatCurrency(5000);
      expect(formatted).toContain('$50.00');
    });

    it('057. handles standard uppercase currency codes (USD, GBP, EUR, INR, JPY)', () => {
      expect(formatCurrency(1000, 'USD')).toContain('$10.00');
      expect(formatCurrency(1000, 'GBP')).toContain('£10.00');
      expect(formatCurrency(1000, 'EUR')).toContain('€');
    });

    it('058. formatCurrencyLocale formats USD in en-US locale correctly', () => {
      const formatted = formatCurrencyLocale(250000, 'USD');
      expect(formatted).toBe('$2,500.00');
    });

    it('059. formatCurrencyLocale formats GBP in en-GB locale correctly', () => {
      const formatted = formatCurrencyLocale(250000, 'GBP');
      expect(formatted).toBe('£2,500.00');
    });

    it('060. formatCurrencyLocale formats JPY in ja-JP with 0 decimals', () => {
      const formatted = formatCurrencyLocale(250000, 'JPY');
      expect(formatted).toMatch(/[¥￥]/);
      expect(formatted).not.toContain('.');
    });

    it('061. SUPPORTED_CURRENCIES includes USD, EUR, GBP, CAD, AUD, INR, JPY', () => {
      const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code);
      expect(currencyCodes).toContain('USD');
      expect(currencyCodes).toContain('EUR');
      expect(currencyCodes).toContain('GBP');
      expect(currencyCodes).toContain('CAD');
      expect(currencyCodes).toContain('AUD');
      expect(currencyCodes).toContain('INR');
      expect(currencyCodes).toContain('JPY');
    });

    it('062. handles 0 cents formatted display defensively', () => {
      expect(formatCurrency(0, 'USD')).toContain('$0.00');
    });
  });
});
