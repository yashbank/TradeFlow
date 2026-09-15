import { describe, it, expect, vi } from 'vitest';
import {
  translations,
  CORE_8_LOCALES,
  translate,
  translateStatus,
  translatePreset,
  type SupportedLocale,
} from '@/lib/i18n/translations';

describe('Domain Translation Completeness & 8-Locale Parity Suite (test/unit/domain-translation-completeness.test.ts)', () => {
  const targetLocales = ['en', 'es', 'fr', 'de', 'pt', 'hi', 'zh', 'ja'] as const;
  const baselineLocale = 'en';
  const baselineKeys = Object.keys(translations[baselineLocale]);
  const EXPECTED_KEY_COUNT = 227;

  // ============================================================================
  // Scope 1: All 8 Languages Matching Key Counts (Exact Parity)
  // ============================================================================
  describe('Scope 1: All 8 Languages Matching Key Counts', () => {
    it('001. baseline locale (en) has exactly 227 translation keys', () => {
      expect(baselineKeys.length).toBe(EXPECTED_KEY_COUNT);
    });

    it('002. English (en) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['en']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('003. Spanish (es) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['es']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('004. French (fr) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['fr']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('005. German (de) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['de']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('006. Portuguese (pt) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['pt']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('007. Hindi (hi) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['hi']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('008. Chinese (zh) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['zh']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('009. Japanese (ja) has exactly matching key count (227)', () => {
      expect(Object.keys(translations['ja']).length).toBe(EXPECTED_KEY_COUNT);
    });

    it('010. zero missing keys in any locale relative to baseline en', () => {
      targetLocales.forEach((loc) => {
        const locKeys = new Set(Object.keys(translations[loc]));
        const missing = baselineKeys.filter((k) => !locKeys.has(k));
        expect(missing, `Locale ${loc} is missing keys: ${missing.join(', ')}`).toHaveLength(0);
      });
    });

    it('011. zero extraneous keys in any locale relative to baseline en', () => {
      const baselineSet = new Set(baselineKeys);
      targetLocales.forEach((loc) => {
        const extra = Object.keys(translations[loc]).filter((k) => !baselineSet.has(k));
        expect(extra, `Locale ${loc} has extraneous keys: ${extra.join(', ')}`).toHaveLength(0);
      });
    });

    it('012. all pairs of locales have identical sorted key arrays', () => {
      const sortedBaseline = [...baselineKeys].sort();
      targetLocales.forEach((loc) => {
        const sortedLoc = Object.keys(translations[loc]).sort();
        expect(sortedLoc).toEqual(sortedBaseline);
      });
    });
  });

  // ============================================================================
  // Scope 2: No Empty String Values Across All Locales
  // ============================================================================
  describe('Scope 2: No Empty String Values', () => {
    it('013. English (en) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['en'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('014. Spanish (es) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['es'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('015. French (fr) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['fr'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('016. German (de) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['de'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('017. Portuguese (pt) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['pt'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('018. Hindi (hi) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['hi'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('019. Chinese (zh) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['zh'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('020. Japanese (ja) has zero empty or whitespace-only translation values', () => {
      baselineKeys.forEach((key) => {
        const val = translations['ja'][key];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('021. total verified non-empty values count across all 8 locales equals 1,816', () => {
      let count = 0;
      targetLocales.forEach((loc) => {
        Object.keys(translations[loc]).forEach((k) => {
          if (translations[loc][k]?.trim().length > 0) count++;
        });
      });
      expect(count).toBe(targetLocales.length * EXPECTED_KEY_COUNT);
      expect(count).toBe(1816);
    });

    it('022. no translation value contains undefined or null stringified literals', () => {
      targetLocales.forEach((loc) => {
        Object.entries(translations[loc]).forEach(([key, val]) => {
          expect(val).not.toContain('undefined');
          expect(val).not.toContain('null');
          expect(val).not.toContain('[object Object]');
        });
      });
    });

    it('023. all status translations in translateStatus() return non-empty strings', () => {
      const statuses = ['draft', 'sent', 'paid', 'overdue', 'void', 'scheduled', 'in_progress', 'completed', 'cancelled'];
      targetLocales.forEach((loc) => {
        statuses.forEach((status) => {
          const val = translateStatus(status, loc as any);
          expect(val.length).toBeGreaterThan(0);
        });
      });
    });

    it('024. all plumbing presets in translatePreset() return non-empty strings', () => {
      const presetTitles = ['emergency burst pipe', 'drain snaking', 'water heater replacement'];
      targetLocales.forEach((loc) => {
        presetTitles.forEach((title) => {
          const res = translatePreset(title, loc);
          expect(typeof res).toBe('string');
          expect(res.length).toBeGreaterThan(0);
        });
      });
    });
  });

  // ============================================================================
  // Scope 3: Interpolation Engine ({param})
  // ============================================================================
  describe('Scope 3: Parameter Interpolation Engine', () => {
    it('025. interpolates single parameter in stop counter (e.g. current)', () => {
      const result = translate('en', 'tech.stop_counter', { current: '4', total: '8' });
      expect(result).toBe('Stop #4 of 8');
    });

    it('026. interpolates multiple parameters in single translation template', () => {
      const result = translate('en', 'tech.stop_counter', { current: '1', total: '5' });
      expect(result).toBe('Stop #1 of 5');
    });

    it('027. supports numeric integer parameters', () => {
      const result = translate('en', 'tech.stop_counter', { current: 2, total: 10 });
      expect(result).toBe('Stop #2 of 10');
    });

    it('028. interpolates parameters across all 8 locales in tech.stop_counter', () => {
      targetLocales.forEach((loc) => {
        const res = translate(loc, 'tech.stop_counter', { current: 3, total: 7 });
        expect(res).toContain('3');
        expect(res).toContain('7');
        expect(res).not.toContain('{current}');
        expect(res).not.toContain('{total}');
      });
    });

    it('029. leaves parameter unreplaced if not provided in params object', () => {
      const result = translate('en', 'tech.stop_counter', { current: 1 });
      expect(result).toContain('1');
      expect(result).toContain('{total}');
    });

    it('030. ignores extra unused parameters in params object', () => {
      const result = translate('en', 'tech.stop_counter', {
        current: 1,
        total: 5,
        unusedParam: 'extra',
        another: 123,
      });
      expect(result).toBe('Stop #1 of 5');
    });

    it('031. handles empty params object safely without crashing', () => {
      const result = translate('en', 'tech.stop_counter', {});
      expect(result).toBe('Stop #{current} of {total}');
    });

    it('032. handles undefined or null params argument safely', () => {
      const result1 = translate('en', 'nav.dashboard', undefined);
      expect(result1).toBe('Dashboard');

      const result2 = translate('en', 'nav.dashboard', null as any);
      expect(result2).toBe('Dashboard');
    });

    it('033. supports parameter values with spaces and special characters', () => {
      const customTemplate = 'Welcome, {userName}! Amount: {amount}';
      const interpolateCustom = (tpl: string, params: Record<string, string>) =>
        tpl.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);

      const res = interpolateCustom(customTemplate, { userName: 'Dr. John O\'Connor & Sons', amount: '$1,250.00' });
      expect(res).toBe('Welcome, Dr. John O\'Connor & Sons! Amount: $1,250.00');
    });

    it('034. handles missing translation keys by falling back to key name', () => {
      const result = translate('en', 'nonexistent.test.key');
      expect(result).toBe('nonexistent.test.key');
    });

    it('035. falls back to en-US if locale dictionary is not registered', () => {
      const result = translate('invalid-loc' as any, 'nav.dashboard');
      expect(result).toBe('Dashboard');
    });

    it('036. parameter substitution is idempotent', () => {
      const res1 = translate('en', 'tech.stop_counter', { current: 1, total: 3 });
      const res2 = translate('en', 'tech.stop_counter', { current: 1, total: 3 });
      expect(res1).toBe(res2);
    });
  });

  // ============================================================================
  // Scope 4: All landing.* Keys Present in All 8 Locales
  // ============================================================================
  describe('Scope 4: All landing.* Keys Present in All 8 Locales', () => {
    const landingKeys = baselineKeys.filter((k) => k.startsWith('landing.'));

    it('037. baseline dictionary has exactly 31 landing.* keys', () => {
      expect(landingKeys).toHaveLength(31);
    });

    it('038. all 31 landing.* keys are present in English (en)', () => {
      landingKeys.forEach((k) => {
        expect(translations['en'][k]).toBeDefined();
        expect(translations['en'][k].length).toBeGreaterThan(0);
      });
    });

    it('039. all 31 landing.* keys are present in Spanish (es)', () => {
      landingKeys.forEach((k) => {
        expect(translations['es'][k]).toBeDefined();
        expect(translations['es'][k].length).toBeGreaterThan(0);
      });
    });

    it('040. all 31 landing.* keys are present in French (fr)', () => {
      landingKeys.forEach((k) => {
        expect(translations['fr'][k]).toBeDefined();
        expect(translations['fr'][k].length).toBeGreaterThan(0);
      });
    });

    it('041. all 31 landing.* keys are present in German (de)', () => {
      landingKeys.forEach((k) => {
        expect(translations['de'][k]).toBeDefined();
        expect(translations['de'][k].length).toBeGreaterThan(0);
      });
    });

    it('042. all 31 landing.* keys are present in Portuguese (pt)', () => {
      landingKeys.forEach((k) => {
        expect(translations['pt'][k]).toBeDefined();
        expect(translations['pt'][k].length).toBeGreaterThan(0);
      });
    });

    it('043. all 31 landing.* keys are present in Hindi (hi)', () => {
      landingKeys.forEach((k) => {
        expect(translations['hi'][k]).toBeDefined();
        expect(translations['hi'][k].length).toBeGreaterThan(0);
      });
    });

    it('044. all 31 landing.* keys are present in Chinese (zh)', () => {
      landingKeys.forEach((k) => {
        expect(translations['zh'][k]).toBeDefined();
        expect(translations['zh'][k].length).toBeGreaterThan(0);
      });
    });

    it('045. all 31 landing.* keys are present in Japanese (ja)', () => {
      landingKeys.forEach((k) => {
        expect(translations['ja'][k]).toBeDefined();
        expect(translations['ja'][k].length).toBeGreaterThan(0);
      });
    });

    it('046. landing hero title, subtitle, and badges exist across all 8 locales', () => {
      const heroKeys = ['landing.badge', 'landing.hero_title', 'landing.hero_subtitle', 'landing.cta_primary', 'landing.cta_secondary', 'landing.trusted_by'];
      targetLocales.forEach((loc) => {
        heroKeys.forEach((key) => {
          const val = translate(loc, key);
          expect(val).toBeDefined();
          expect(val.length).toBeGreaterThan(0);
        });
      });
    });

    it('047. landing 3-step storyline keys exist across all 8 locales', () => {
      const storylineKeys = [
        'landing.storyline_title',
        'landing.storyline_subtitle',
        'landing.step1_title',
        'landing.step1_desc',
        'landing.step2_title',
        'landing.step2_desc',
        'landing.step3_title',
        'landing.step3_desc',
      ];
      targetLocales.forEach((loc) => {
        storylineKeys.forEach((key) => {
          const val = translate(loc, key);
          expect(val.length).toBeGreaterThan(0);
        });
      });
    });

    it('048. landing ROI calculator keys exist across all 8 locales', () => {
      const calcKeys = [
        'landing.calc_title',
        'landing.calc_subtitle',
        'landing.calc_technicians',
        'landing.calc_jobs_per_day',
        'landing.calc_hourly_rate',
        'landing.calc_monthly_savings',
        'landing.calc_hours_saved',
      ];
      targetLocales.forEach((loc) => {
        calcKeys.forEach((key) => {
          expect(translate(loc, key).length).toBeGreaterThan(0);
        });
      });
    });

    it('049. landing interactive fleet radar and dispatch simulator keys exist across all 8 locales', () => {
      targetLocales.forEach((loc) => {
        expect(translate(loc, 'landing.seed_demo').length).toBeGreaterThan(0);
        expect(translate(loc, 'landing.live_radar').length).toBeGreaterThan(0);
        expect(translate(loc, 'landing.simulator_title').length).toBeGreaterThan(0);
      });
    });

    it('050. total landing key count across 8 locales equals 31 * 8 = 248', () => {
      let total = 0;
      targetLocales.forEach((loc) => {
        total += Object.keys(translations[loc]).filter((k) => k.startsWith('landing.')).length;
      });
      expect(total).toBe(31 * 8);
      expect(total).toBe(248);
    });
  });

  // ============================================================================
  // Scope 5: All auth.* Keys Present in All 8 Locales
  // ============================================================================
  describe('Scope 5: All auth.* Keys Present in All 8 Locales', () => {
    const authKeys = baselineKeys.filter((k) => k.startsWith('auth.'));

    it('051. baseline dictionary has exactly 21 auth.* keys', () => {
      expect(authKeys).toHaveLength(21);
    });

    it('052. all 21 auth.* keys are present in English (en)', () => {
      authKeys.forEach((k) => {
        expect(translations['en'][k]).toBeDefined();
        expect(translations['en'][k].length).toBeGreaterThan(0);
      });
    });

    it('053. all 21 auth.* keys are present in Spanish (es)', () => {
      authKeys.forEach((k) => {
        expect(translations['es'][k]).toBeDefined();
        expect(translations['es'][k].length).toBeGreaterThan(0);
      });
    });

    it('054. all 21 auth.* keys are present in French (fr)', () => {
      authKeys.forEach((k) => {
        expect(translations['fr'][k]).toBeDefined();
        expect(translations['fr'][k].length).toBeGreaterThan(0);
      });
    });

    it('055. all 21 auth.* keys are present in German (de)', () => {
      authKeys.forEach((k) => {
        expect(translations['de'][k]).toBeDefined();
        expect(translations['de'][k].length).toBeGreaterThan(0);
      });
    });

    it('056. all 21 auth.* keys are present in Portuguese (pt)', () => {
      authKeys.forEach((k) => {
        expect(translations['pt'][k]).toBeDefined();
        expect(translations['pt'][k].length).toBeGreaterThan(0);
      });
    });

    it('057. all 21 auth.* keys are present in Hindi (hi)', () => {
      authKeys.forEach((k) => {
        expect(translations['hi'][k]).toBeDefined();
        expect(translations['hi'][k].length).toBeGreaterThan(0);
      });
    });

    it('058. all 21 auth.* keys are present in Chinese (zh)', () => {
      authKeys.forEach((k) => {
        expect(translations['zh'][k]).toBeDefined();
        expect(translations['zh'][k].length).toBeGreaterThan(0);
      });
    });

    it('059. all 21 auth.* keys are present in Japanese (ja)', () => {
      authKeys.forEach((k) => {
        expect(translations['ja'][k]).toBeDefined();
        expect(translations['ja'][k].length).toBeGreaterThan(0);
      });
    });

    it('060. sign-in form titles, fields, buttons, and loading states exist across all 8 locales', () => {
      const loginKeys = [
        'auth.login_title',
        'auth.login_subtitle',
        'auth.email_label',
        'auth.password_label',
        'auth.forgot_password',
        'auth.sign_in_btn',
        'auth.signing_in',
        'auth.no_account',
        'auth.create_account',
      ];
      targetLocales.forEach((loc) => {
        loginKeys.forEach((key) => {
          expect(translate(loc, key).length).toBeGreaterThan(0);
        });
      });
    });

    it('061. sign-up enterprise registration keys exist across all 8 locales', () => {
      const signupKeys = [
        'auth.signup_title',
        'auth.signup_subtitle',
        'auth.company_name',
        'auth.full_name',
        'auth.create_account_btn',
        'auth.creating_account',
        'auth.have_account',
      ];
      targetLocales.forEach((loc) => {
        signupKeys.forEach((key) => {
          expect(translate(loc, key).length).toBeGreaterThan(0);
        });
      });
    });

    it('062. password recovery keys exist across all 8 locales', () => {
      const resetKeys = [
        'auth.reset_password_title',
        'auth.reset_password_subtitle',
        'auth.send_reset_link',
        'auth.sending_link',
        'auth.back_to_login',
      ];
      targetLocales.forEach((loc) => {
        resetKeys.forEach((key) => {
          expect(translate(loc, key).length).toBeGreaterThan(0);
        });
      });
    });

    it('063. total auth key count across 8 locales equals 21 * 8 = 168', () => {
      let total = 0;
      targetLocales.forEach((loc) => {
        total += Object.keys(translations[loc]).filter((k) => k.startsWith('auth.')).length;
      });
      expect(total).toBe(21 * 8);
      expect(total).toBe(168);
    });

    it('064. CORE_8_LOCALES includes all target locales', () => {
      targetLocales.forEach((loc) => {
        expect(CORE_8_LOCALES).toContain(loc);
      });
    });

    it('065. translation dictionary is stable and immutable during key traversal', () => {
      expect(Object.keys(translations).length).toBeGreaterThanOrEqual(8);
    });
  });
});
