import {__testing__, localizedLassoButtonName, localizedPluginName, t, tFmt} from '../src/i18n/i18n';

const {STRINGS, LASSO_BUTTON_NAME, PLUGIN_NAME, normaliseLocale} = __testing__;

describe('i18n — STRINGS coverage', () => {
  const englishKeys = Object.keys(STRINGS.en ?? {});
  const locales = Object.keys(STRINGS);

  it('every locale defines every string id (no orphan placeholders in shipped UI)', () => {
    for (const locale of locales) {
      const bag = STRINGS[locale]!;
      const missing = englishKeys.filter(k => !(k in bag));
      expect({locale, missing}).toEqual({locale, missing: []});
    }
  });
});

describe('i18n — locale normalisation', () => {
  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    ['zh-CN', 'zh_CN'],
    ['zh_TW', 'zh_TW'],
    ['ja-JP', 'ja'],
    ['xx', 'en'],
    ['zh-HK', 'zh_TW'], // Falls back to traditional within the zh family.
  ])('normaliseLocale(%s) => %s', (input, expected) => {
    expect(normaliseLocale(input)).toBe(expected);
  });
});

describe('i18n — t', () => {
  it('returns the string for the resolved locale', () => {
    expect(t('action.apply', 'en')).toBe('Apply');
    expect(t('action.apply', 'zh_CN')).toBe('应用');
  });
  it('falls back to English when the locale lacks the id', () => {
    expect(t('action.apply', 'xx')).toBe('Apply');
  });
});

describe('i18n — tFmt', () => {
  it('substitutes named placeholders', () => {
    expect(tFmt('status.selectionCount', {n: 3}, 'en')).toBe('3 text boxes selected');
    expect(tFmt('status.selectionCount', {n: 5}, 'zh_CN')).toBe('已选 5 个文本框');
  });
  it('leaves unmatched placeholders intact', () => {
    expect(tFmt('status.selectionCount', {} as any, 'en')).toBe('{n} text boxes selected');
  });
});

describe('i18n — firmware-facing JSON-encoded names', () => {
  it('localizedLassoButtonName parses back to the button-name map', () => {
    expect(JSON.parse(localizedLassoButtonName())).toEqual(LASSO_BUTTON_NAME);
  });
  it('localizedPluginName parses back to the plugin-name map', () => {
    expect(JSON.parse(localizedPluginName())).toEqual(PLUGIN_NAME);
  });
  it('all locales in PLUGIN_NAME also have a button-name (matching set)', () => {
    expect(Object.keys(PLUGIN_NAME).sort()).toEqual(Object.keys(LASSO_BUTTON_NAME).sort());
  });
});
