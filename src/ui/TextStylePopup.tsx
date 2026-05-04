import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {
  FONT_OPTIONS,
  KEEP,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_STEP,
  clampSize,
  isStyleNoop,
  type Align,
  type Bold,
  type Italic,
  type StyleValue,
  type TextStyle,
} from '../core/textStyle';
import {styles} from './styles';
import {t, tFmt, type StringId} from '../i18n/i18n';

export type TextStylePopupCallbacks = {
  onSetFont: (path: string | null) => void;
  onResetFont: () => void;
  onSetSize: (size: number) => void;
  onResetSize: () => void;
  onSetBold: (bold: Bold) => void;
  onResetBold: () => void;
  onSetItalic: (italic: Italic) => void;
  onResetItalic: () => void;
  onSetAlign: (align: Align) => void;
  onResetAlign: () => void;
  onApply: () => void;
  onCancel: () => void;
};

export type TextStylePopupProps = {
  style: TextStyle;
  selectionCount: number;
  selectionFonts: ReadonlyArray<string | null>;
  callbacks: TextStylePopupCallbacks;
};

// Extract the display name from a font path: '/system/fonts/Dolce.ttf' → 'Dolce'
const fontDisplayName = (path: string | null): string => {
  if (path === null) return t('font.default');
  const filename = path.split('/').pop() ?? path;
  return filename.replace(/\.[^.]+$/, '');
};

// Best-effort fontFamily for RN: strip the path and extension.
// Works for user fonts (e.g. Dolce.ttf → 'Dolce'); system fonts with
// weight suffixes (Roboto-Regular.ttf) may not resolve — acceptable fallback.
const fontFamilyFor = (path: string | null): string | undefined => {
  if (path === null) return undefined;
  const filename = path.split('/').pop() ?? '';
  const name = filename.replace(/\.[^.]+$/, '');
  return name || undefined;
};

// Merge FONT_OPTIONS + any extra paths from the current selection.
const buildFontRows = (selectionFonts: ReadonlyArray<string | null>): Array<string | null> => {
  const seen = new Set<string | null>();
  const list: Array<string | null> = [];
  for (const opt of FONT_OPTIONS) {
    seen.add(opt.path);
    list.push(opt.path);
  }
  for (const path of selectionFonts) {
    if (!seen.has(path)) {
      seen.add(path);
      list.push(path);
    }
  }
  return list;
};

// ─── Font list ─────────────────────────────────────────────────────────────

const FontList: React.FC<{
  value: StyleValue<string | null>;
  selectionFonts: ReadonlyArray<string | null>;
  onPick: (path: string | null) => void;
  onKeep: () => void;
}> = ({value, selectionFonts, onPick, onKeep}) => {
  const rows = buildFontRows(selectionFonts);
  return (
    <View style={styles.fontListOuter}>
      <ScrollView style={styles.fontListScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {/* Keep-current row */}
        <Pressable
          style={[styles.fontRow, value === KEEP && styles.fontRowSelected]}
          onPress={onKeep}>
          <Text style={[styles.fontRowText, styles.fontRowKeepText]}>{t('font.keep')}</Text>
        </Pressable>
        {rows.map((path, i) => {
          const label = fontDisplayName(path);
          const ff = fontFamilyFor(path);
          const isSelected = value !== KEEP && value === path;
          return (
            <Pressable
              key={i}
              style={[styles.fontRow, isSelected && styles.fontRowSelected]}
              onPress={() => onPick(path)}>
              <Text
                style={[
                  styles.fontRowText,
                  ff ? {fontFamily: ff} : undefined,
                  isSelected && styles.fontRowTextSelected,
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Size stepper ──────────────────────────────────────────────────────────

const SizeStepper: React.FC<{
  value: StyleValue<number>;
  onChange: (size: number) => void;
  onKeep: () => void;
}> = ({value, onChange, onKeep}) => {
  const isKeep = value === KEEP;
  const current = isKeep ? 28 : (value as number);
  const decDisabled = !isKeep && current <= SIZE_MIN;
  const incDisabled = !isKeep && current >= SIZE_MAX;
  return (
    <View style={styles.stepperRow}>
      <Chip label={t('value.keep')} active={isKeep} keep onPress={onKeep} />
      <Pressable
        style={[styles.stepperButton, decDisabled && styles.actionButtonDisabled]}
        onPress={decDisabled ? undefined : () => onChange(clampSize(current - SIZE_STEP))}>
        <Text style={styles.stepperButtonText}>−</Text>
      </Pressable>
      <Text style={isKeep ? styles.stepperKeepText : styles.stepperValue}>
        {isKeep ? '—' : String(current)}
      </Text>
      <Pressable
        style={[styles.stepperButton, incDisabled && styles.actionButtonDisabled]}
        onPress={incDisabled ? undefined : () => onChange(clampSize(current + SIZE_STEP))}>
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  );
};

// ─── Shared chip ───────────────────────────────────────────────────────────

type ChipProps = {label: string; active: boolean; keep?: boolean; onPress: () => void};
const Chip: React.FC<ChipProps> = ({label, active, keep = false, onPress}) => (
  <Pressable style={[styles.chip, keep && styles.chipKeep, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

// ─── Tristate (Keep / Off / On) ────────────────────────────────────────────

const TristateToggle: React.FC<{
  value: StyleValue<0 | 1>;
  onSet: (v: 0 | 1) => void;
  onKeep: () => void;
}> = ({value, onSet, onKeep}) => (
  <>
    <Chip label={t('value.keep')} active={value === KEEP} keep onPress={onKeep} />
    <Chip label={t('value.off')} active={value === 0} onPress={() => onSet(0)} />
    <Chip label={t('value.on')} active={value === 1} onPress={() => onSet(1)} />
  </>
);

// ─── Align picker ──────────────────────────────────────────────────────────

const AlignPicker: React.FC<{
  value: StyleValue<Align>;
  onSet: (a: Align) => void;
  onKeep: () => void;
}> = ({value, onSet, onKeep}) => (
  <>
    <Chip label={t('value.keep')} active={value === KEEP} keep onPress={onKeep} />
    <Chip label={t('align.left')} active={value === 0} onPress={() => onSet(0)} />
    <Chip label={t('align.center')} active={value === 1} onPress={() => onSet(1)} />
    <Chip label={t('align.right')} active={value === 2} onPress={() => onSet(2)} />
  </>
);

// ─── Field row wrapper ─────────────────────────────────────────────────────

const Field: React.FC<{labelId: StringId; children: React.ReactNode}> = ({labelId, children}) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldLabelCell}>
      <Text style={styles.fieldLabel}>{t(labelId)}</Text>
    </View>
    <View style={styles.fieldControlCell}>{children}</View>
  </View>
);

// ─── Header ────────────────────────────────────────────────────────────────

const Header: React.FC<{onClose: () => void}> = ({onClose}) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{t('dialog.title')}</Text>
    <Pressable style={styles.closeButton} onPress={onClose}>
      <Text style={styles.closeText}>{t('popup.close')}</Text>
    </Pressable>
  </View>
);

// ─── Root ──────────────────────────────────────────────────────────────────

export const TextStylePopup: React.FC<TextStylePopupProps> = ({
  style,
  selectionCount,
  selectionFonts,
  callbacks,
}) => {
  const noop = isStyleNoop(style);
  const noSelection = selectionCount === 0;
  const applyDisabled = noop || noSelection;
  const statusLine = noSelection
    ? t('status.noTextBoxes')
    : tFmt('status.selectionCount', {n: selectionCount});

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Header onClose={callbacks.onCancel} />
        <Text style={styles.status}>{statusLine}</Text>

        {/* Font — full-width list below the label */}
        <View style={styles.fontSection}>
          <Text style={styles.fieldLabel}>{t('field.font')}</Text>
          <FontList
            value={style.fontPath}
            selectionFonts={selectionFonts}
            onPick={callbacks.onSetFont}
            onKeep={callbacks.onResetFont}
          />
        </View>

        <Field labelId="field.size">
          <SizeStepper value={style.fontSize} onChange={callbacks.onSetSize} onKeep={callbacks.onResetSize} />
        </Field>

        <Field labelId="field.bold">
          <TristateToggle value={style.bold} onSet={callbacks.onSetBold} onKeep={callbacks.onResetBold} />
        </Field>

        <Field labelId="field.italic">
          <TristateToggle value={style.italic} onSet={callbacks.onSetItalic} onKeep={callbacks.onResetItalic} />
        </Field>

        <Field labelId="field.align">
          <AlignPicker value={style.align} onSet={callbacks.onSetAlign} onKeep={callbacks.onResetAlign} />
        </Field>

        <View style={styles.warningSpacer}>
          {noop && !noSelection ? <Text style={styles.warning}>{t('warning.noChange')}</Text> : null}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.actionButton,
              !applyDisabled && styles.actionButtonPrimary,
              applyDisabled && styles.actionButtonDisabled,
            ]}
            onPress={applyDisabled ? undefined : callbacks.onApply}>
            <Text
              style={[
                styles.actionButtonText,
                !applyDisabled && styles.actionButtonTextPrimary,
                applyDisabled && styles.actionButtonTextDisabled,
              ]}>
              {t('action.apply')}
            </Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={callbacks.onCancel}>
            <Text style={styles.actionButtonText}>{t('action.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
