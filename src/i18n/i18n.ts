// Localised UI chrome for the text-style popup + the firmware-visible
// button name. Two locale-bag shapes:
//   - STRINGS (StringId → string): used by the React UI via `t(id)`
//   - LASSO_BUTTON_NAME / PLUGIN_NAME maps: serialised as
//     JSON-encoded {locale: name} for the firmware to render.

export type StringId =
  | 'dialog.title'
  | 'field.font'
  | 'field.size'
  | 'field.bold'
  | 'field.italic'
  | 'field.align'
  | 'font.keep'
  | 'font.default'
  | 'font.serif'
  | 'font.sans'
  | 'font.mono'
  | 'align.left'
  | 'align.center'
  | 'align.right'
  | 'value.keep'
  | 'value.on'
  | 'value.off'
  | 'action.apply'
  | 'action.cancel'
  | 'status.selectionCount'
  | 'status.noTextBoxes'
  | 'warning.noChange'
  | 'warning.allMixed'
  | 'popup.close';

const STRINGS: Record<string, Partial<Record<StringId, string>>> = {
  en: {
    'dialog.title': 'Text Style',
    'field.font': 'Font',
    'field.size': 'Size',
    'field.bold': 'Bold',
    'field.italic': 'Italic',
    'field.align': 'Align',
    'font.keep': 'Keep current',
    'font.default': 'Default',
    'font.serif': 'Serif',
    'font.sans': 'Sans',
    'font.mono': 'Mono',
    'align.left': 'Left',
    'align.center': 'Center',
    'align.right': 'Right',
    'value.keep': 'Keep',
    'value.on': 'On',
    'value.off': 'Off',
    'action.apply': 'Apply',
    'action.cancel': 'Cancel',
    'status.selectionCount': '{n} text boxes selected',
    'status.noTextBoxes': 'No text boxes in selection',
    'warning.noChange': 'Pick at least one attribute to change',
    'warning.allMixed': 'Selection has mixed values — pick to unify',
    'popup.close': 'Close',
  },
  zh_CN: {
    'dialog.title': '文本样式',
    'field.font': '字体',
    'field.size': '字号',
    'field.bold': '粗体',
    'field.italic': '斜体',
    'field.align': '对齐',
    'font.keep': '保持原样',
    'font.default': '默认',
    'font.serif': '衬线',
    'font.sans': '无衬线',
    'font.mono': '等宽',
    'align.left': '左对齐',
    'align.center': '居中',
    'align.right': '右对齐',
    'value.keep': '保持',
    'value.on': '开',
    'value.off': '关',
    'action.apply': '应用',
    'action.cancel': '取消',
    'status.selectionCount': '已选 {n} 个文本框',
    'status.noTextBoxes': '所选区域没有文本框',
    'warning.noChange': '请至少选择一项属性进行修改',
    'warning.allMixed': '选区包含不同样式——请选择以统一',
    'popup.close': '关闭',
  },
  zh_TW: {
    'dialog.title': '文字樣式',
    'field.font': '字型',
    'field.size': '字級',
    'field.bold': '粗體',
    'field.italic': '斜體',
    'field.align': '對齊',
    'font.keep': '保持原樣',
    'font.default': '預設',
    'font.serif': '襯線',
    'font.sans': '無襯線',
    'font.mono': '等寬',
    'align.left': '靠左',
    'align.center': '置中',
    'align.right': '靠右',
    'value.keep': '保持',
    'value.on': '開',
    'value.off': '關',
    'action.apply': '套用',
    'action.cancel': '取消',
    'status.selectionCount': '已選 {n} 個文字框',
    'status.noTextBoxes': '選取範圍內無文字框',
    'warning.noChange': '請至少選擇一項屬性修改',
    'warning.allMixed': '選取樣式不一致——請選擇以統一',
    'popup.close': '關閉',
  },
  ja: {
    'dialog.title': 'テキストスタイル',
    'field.font': 'フォント',
    'field.size': 'サイズ',
    'field.bold': '太字',
    'field.italic': '斜体',
    'field.align': '揃え',
    'font.keep': '現状維持',
    'font.default': 'デフォルト',
    'font.serif': '明朝',
    'font.sans': 'ゴシック',
    'font.mono': '等幅',
    'align.left': '左揃え',
    'align.center': '中央揃え',
    'align.right': '右揃え',
    'value.keep': '維持',
    'value.on': 'オン',
    'value.off': 'オフ',
    'action.apply': '適用',
    'action.cancel': 'キャンセル',
    'status.selectionCount': '{n} 個のテキストボックスを選択中',
    'status.noTextBoxes': '選択範囲にテキストボックスがありません',
    'warning.noChange': '変更する属性を1つ以上選んでください',
    'warning.allMixed': '選択内容が混在しています——選択して統一',
    'popup.close': '閉じる',
  },
  th: {
    'dialog.title': 'สไตล์ข้อความ',
    'field.font': 'แบบอักษร',
    'field.size': 'ขนาด',
    'field.bold': 'ตัวหนา',
    'field.italic': 'ตัวเอียง',
    'field.align': 'จัดแนว',
    'font.keep': 'คงเดิม',
    'font.default': 'ค่าเริ่มต้น',
    'font.serif': 'Serif',
    'font.sans': 'Sans',
    'font.mono': 'Mono',
    'align.left': 'ซ้าย',
    'align.center': 'กึ่งกลาง',
    'align.right': 'ขวา',
    'value.keep': 'คงไว้',
    'value.on': 'เปิด',
    'value.off': 'ปิด',
    'action.apply': 'ใช้',
    'action.cancel': 'ยกเลิก',
    'status.selectionCount': 'เลือกแล้ว {n} กล่องข้อความ',
    'status.noTextBoxes': 'ไม่มีกล่องข้อความในส่วนที่เลือก',
    'warning.noChange': 'เลือกอย่างน้อยหนึ่งคุณสมบัติเพื่อแก้ไข',
    'warning.allMixed': 'ค่าผสมในส่วนที่เลือก — เลือกเพื่อให้สม่ำเสมอ',
    'popup.close': 'ปิด',
  },
  nl: {
    'dialog.title': 'Tekststijl',
    'field.font': 'Lettertype',
    'field.size': 'Grootte',
    'field.bold': 'Vet',
    'field.italic': 'Cursief',
    'field.align': 'Uitlijnen',
    'font.keep': 'Huidige behouden',
    'font.default': 'Standaard',
    'font.serif': 'Serif',
    'font.sans': 'Sans',
    'font.mono': 'Mono',
    'align.left': 'Links',
    'align.center': 'Midden',
    'align.right': 'Rechts',
    'value.keep': 'Behouden',
    'value.on': 'Aan',
    'value.off': 'Uit',
    'action.apply': 'Toepassen',
    'action.cancel': 'Annuleren',
    'status.selectionCount': '{n} tekstvakken geselecteerd',
    'status.noTextBoxes': 'Geen tekstvakken in selectie',
    'warning.noChange': 'Kies minstens één attribuut om te wijzigen',
    'warning.allMixed': 'Gemengde waarden — kies om te uniformeren',
    'popup.close': 'Sluiten',
  },
  de: {
    'dialog.title': 'Textstil',
    'field.font': 'Schriftart',
    'field.size': 'Größe',
    'field.bold': 'Fett',
    'field.italic': 'Kursiv',
    'field.align': 'Ausrichtung',
    'font.keep': 'Aktuelle behalten',
    'font.default': 'Standard',
    'font.serif': 'Serif',
    'font.sans': 'Sans',
    'font.mono': 'Mono',
    'align.left': 'Links',
    'align.center': 'Mitte',
    'align.right': 'Rechts',
    'value.keep': 'Behalten',
    'value.on': 'Ein',
    'value.off': 'Aus',
    'action.apply': 'Anwenden',
    'action.cancel': 'Abbrechen',
    'status.selectionCount': '{n} Textfelder ausgewählt',
    'status.noTextBoxes': 'Keine Textfelder in der Auswahl',
    'warning.noChange': 'Mindestens ein Attribut zum Ändern wählen',
    'warning.allMixed': 'Gemischte Werte — wählen zum Vereinheitlichen',
    'popup.close': 'Schließen',
  },
};

const LASSO_BUTTON_NAME: Record<string, string> = {
  en: 'Text Style',
  zh_CN: '文本样式',
  zh_TW: '文字樣式',
  ja: 'テキストスタイル',
  th: 'สไตล์ข้อความ',
  nl: 'Tekststijl',
  de: 'Textstil',
};

const PLUGIN_NAME: Record<string, string> = {
  en: 'Multi Text Style',
  zh_CN: '批量文本样式',
  zh_TW: '批次文字樣式',
  ja: 'テキスト一括スタイル',
  th: 'จัดสไตล์ข้อความหลายกล่อง',
  nl: 'Meervoudige tekststijl',
  de: 'Mehrfach-Textstil',
};

const FALLBACK_LOCALE = 'en';

const normaliseLocale = (raw: string): string => {
  const swap = raw.replace('-', '_');
  if (STRINGS[swap]) {
    return swap;
  }
  const lang = swap.split('_')[0] ?? FALLBACK_LOCALE;
  if (STRINGS[lang]) {
    return lang;
  }
  if (swap.startsWith('zh') && STRINGS.zh_TW) {
    return 'zh_TW';
  }
  return FALLBACK_LOCALE;
};

export const detectLocale = (): string => {
  try {
    if (typeof Intl !== 'undefined' && Intl.Collator) {
      const resolved = new Intl.Collator().resolvedOptions().locale;
      if (resolved) {
        return normaliseLocale(resolved);
      }
    }
  } catch {
    // fall through
  }
  return FALLBACK_LOCALE;
};

const LOCALE = detectLocale();

export const t = (id: StringId, locale: string = LOCALE): string => {
  const resolved = normaliseLocale(locale);
  return STRINGS[resolved]?.[id] ?? STRINGS[FALLBACK_LOCALE]?.[id] ?? String(id);
};

export const tFmt = (id: StringId, vars: Record<string, string | number>, locale: string = LOCALE): string => {
  const template = t(id, locale);
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
};

export const localizedLassoButtonName = (): string => JSON.stringify(LASSO_BUTTON_NAME);
export const localizedPluginName = (): string => JSON.stringify(PLUGIN_NAME);

export const __testing__ = {
  STRINGS,
  LASSO_BUTTON_NAME,
  PLUGIN_NAME,
  normaliseLocale,
};
