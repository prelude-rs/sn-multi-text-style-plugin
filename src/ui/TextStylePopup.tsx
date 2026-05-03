import React from 'react';
import {Pressable, Text, View} from 'react-native';
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
  callbacks: TextStylePopupCallbacks;
};

type ChipProps = {
  label: string;
  active: boolean;
  keep?: boolean;
  onPress: () => void;
};

const Chip: React.FC<ChipProps> = ({label, active, keep = false, onPress}) => (
  <Pressable style={[styles.chip, keep && styles.chipKeep, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const Field: React.FC<{labelId: StringId; children: React.ReactNode}> = ({labelId, children}) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldLabelCell}>
      <Text style={styles.fieldLabel}>{t(labelId)}</Text>
    </View>
    <View style={styles.fieldControlCell}>{children}</View>
  </View>
);

const fontLabelFor = (path: string | null): string => {
  const opt = FONT_OPTIONS.find(o => o.path === path);
  if (opt) {
    return t(`font.${opt.id}` as StringId);
  }
  // Custom path coming from the existing text box that's not in our
  // curated list — show its filename so the user knows which font is
  // currently in effect without overwriting.
  if (path) {
    const slash = path.lastIndexOf('/');
    return slash >= 0 ? path.slice(slash + 1) : path;
  }
  return t('font.default');
};

const FontPicker: React.FC<{
  value: StyleValue<string | null>;
  onPick: (path: string | null) => void;
  onKeep: () => void;
}> = ({value, onPick, onKeep}) => (
  <>
    <Chip label={t('font.keep')} active={value === KEEP} keep onPress={onKeep} />
    {FONT_OPTIONS.map(opt => (
      <Chip
        key={opt.id}
        label={t(`font.${opt.id}` as StringId)}
        active={value !== KEEP && value === opt.path}
        onPress={() => onPick(opt.path)}
      />
    ))}
    {/* Surface a custom font path (one not in FONT_OPTIONS) as an
        active read-only chip so the user sees what's currently set
        before deciding whether to overwrite. */}
    {value !== KEEP && value !== null && !FONT_OPTIONS.some(o => o.path === value) ? (
      <Chip label={fontLabelFor(value)} active onPress={() => onPick(value)} />
    ) : null}
  </>
);

const SizeStepper: React.FC<{
  value: StyleValue<number>;
  onChange: (size: number) => void;
  onKeep: () => void;
}> = ({value, onChange, onKeep}) => {
  const isKeep = value === KEEP;
  const display = isKeep ? t('value.keep') : String(value);
  const current = isKeep ? 16 : value;
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
      {isKeep ? (
        <Text style={styles.stepperKeepText}>{display}</Text>
      ) : (
        <Text style={styles.stepperValue}>{display}</Text>
      )}
      <Pressable
        style={[styles.stepperButton, incDisabled && styles.actionButtonDisabled]}
        onPress={incDisabled ? undefined : () => onChange(clampSize(current + SIZE_STEP))}>
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  );
};

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

const Header: React.FC<{onClose: () => void}> = ({onClose}) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{t('dialog.title')}</Text>
    <Pressable style={styles.closeButton} onPress={onClose}>
      <Text style={styles.closeText}>{t('popup.close')}</Text>
    </Pressable>
  </View>
);

export const TextStylePopup: React.FC<TextStylePopupProps> = ({style, selectionCount, callbacks}) => {
  const noop = isStyleNoop(style);
  const noSelection = selectionCount === 0;
  const applyDisabled = noop || noSelection;
  const statusLine = noSelection ? t('status.noTextBoxes') : tFmt('status.selectionCount', {n: selectionCount});

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Header onClose={callbacks.onCancel} />
        <Text style={styles.status}>{statusLine}</Text>

        <Field labelId="field.font">
          <FontPicker value={style.fontPath} onPick={callbacks.onSetFont} onKeep={callbacks.onResetFont} />
        </Field>

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

        {/* Always-rendered slot so toggling the warning doesn't shift
            the dialog vertically. */}
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
