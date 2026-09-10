import { describe, it, expect } from 'vitest';
import {
  translate,
  translations,
  SUPPORTED_LANGUAGES,
  type SupportedLocale,
} from '@/lib/i18n/translations';

describe('Multi-Language i18n Translation Engine (test/unit/i18n.test.ts)', () => {
  const expectedLocales: SupportedLocale[] = [
    'en-US',
    'en-GB',
    'es',
    'fr',
    'de',
    'hi',
    'ja',
    'zh',
  ];

  it('QA-I18N-01: Verifies all 8 required global locales are registered with flags and regions', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expectedLocales.forEach((loc) => {
      expect(codes).toContain(loc);
    });

    // Check flag emojis
    const us = SUPPORTED_LANGUAGES.find((l) => l.code === 'en-US');
    const uk = SUPPORTED_LANGUAGES.find((l) => l.code === 'en-GB');
    const es = SUPPORTED_LANGUAGES.find((l) => l.code === 'es');
    const fr = SUPPORTED_LANGUAGES.find((l) => l.code === 'fr');
    const de = SUPPORTED_LANGUAGES.find((l) => l.code === 'de');
    const hi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
    const ja = SUPPORTED_LANGUAGES.find((l) => l.code === 'ja');
    const zh = SUPPORTED_LANGUAGES.find((l) => l.code === 'zh');

    expect(us?.flag).toBe('🇺🇸');
    expect(uk?.flag).toBe('🇬🇧');
    expect(es?.flag).toBe('🇪🇸');
    expect(fr?.flag).toBe('🇫🇷');
    expect(de?.flag).toBe('🇩🇪');
    expect(hi?.flag).toBe('🇮🇳');
    expect(ja?.flag).toBe('🇯🇵');
    expect(zh?.flag).toBe('🇨🇳');
  });

  it('QA-I18N-02: Verifies core navigation & dashboard dictionary completeness across all 8 languages', () => {
    const criticalKeys = [
      'nav.dashboard',
      'nav.quotes',
      'nav.jobs',
      'nav.invoices',
      'nav.customers',
      'nav.settings',
      'nav.logout',
      'dash.title',
      'dash.mtd_revenue',
      'dash.outstanding',
      'dash.quote_win_rate',
      'dash.btn.new_quote',
      'dash.btn.schedule_job',
      'dash.btn.new_invoice',
      'quotes.btn.approve',
      'jobs.btn.start',
      'invoices.btn.record_payment',
    ];

    expectedLocales.forEach((locale) => {
      const dict = translations[locale];
      expect(dict, `Dictionary missing for locale: ${locale}`).toBeDefined();

      criticalKeys.forEach((key) => {
        expect(dict[key], `Missing translation key "${key}" in locale "${locale}"`).toBeDefined();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('QA-I18N-03: Parameter interpolation replaces named placeholders', () => {
    // Test custom dynamic template string
    const templateWithParams = 'Hello {name}, you have {count} jobs';
    const fakeKey = 'test.greeting';
    (translations['en-US'] as any)[fakeKey] = templateWithParams;

    const result = translate('en-US', fakeKey, { name: 'Dave', count: 5 });
    expect(result).toBe('Hello Dave, you have 5 jobs');

    // Clean up
    delete (translations['en-US'] as any)[fakeKey];
  });

  // Edge Cases
  describe('Edge Cases (Expert Human QA)', () => {
    it('QA-I18N-EC01: Graceful fallback to en-US when key is missing in target language', () => {
      // Temporarily inject a key only in en-US
      (translations['en-US'] as any)['test.only_in_en'] = 'English Only Text';

      const translated = translate('fr', 'test.only_in_en');
      expect(translated).toBe('English Only Text');

      delete (translations['en-US'] as any)['test.only_in_en'];
    });

    it('QA-I18N-EC02: Returns key verbatim when key does not exist in any dictionary', () => {
      const missingKey = 'nonexistent.random.key.404';
      const result = translate('ja', missingKey);
      expect(result).toBe(missingKey);
    });

    it('QA-I18N-EC03: Handles invalid/unknown locale string by falling back to en-US', () => {
      const result = translate('unknown-locale' as any, 'nav.dashboard');
      expect(result).toBe('Dashboard');
    });

    it('QA-I18N-EC04: Safely handles non-ASCII characters, Hindi Devanagari, Japanese Kanji, Chinese Hanzi', () => {
      const hi = translate('hi', 'nav.dashboard');
      expect(hi).toBe('डैशबोर्ड');

      const ja = translate('ja', 'nav.dashboard');
      expect(ja).toBe('ダッシュボード');

      const zh = translate('zh', 'nav.dashboard');
      expect(zh).toBe('仪表板');

      const es = translate('es', 'nav.dashboard');
      expect(es).toBe('Panel Principal');

      const de = translate('de', 'nav.dashboard');
      expect(de).toBe('Dashboard');

      const fr = translate('fr', 'nav.dashboard');
      expect(fr).toBe('Tableau de bord');
    });

    it('QA-I18N-EC05: Parameter interpolation with zero and empty string values', () => {
      const fakeKey = 'test.counter';
      (translations['en-US'] as any)[fakeKey] = 'Count: {count}, Tag: {tag}';

      const result = translate('en-US', fakeKey, { count: 0, tag: '' });
      expect(result).toBe('Count: 0, Tag: ');

      delete (translations['en-US'] as any)[fakeKey];
    });
  });
});
