import {StyleSheet} from 'react-native';

// E-Ink palette: black ink, white background, thick borders. Matches
// the chrome of the alignment plugin so the toolset feels coherent.

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    minWidth: 560,
    maxWidth: 660,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },

  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    textAlign: 'center',
  },

  // Font section: label above the scrollable list.
  fontSection: {
    marginBottom: 12,
  },
  fontListOuter: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    height: 220,
  },
  fontListScroll: {
    height: 220,
  },
  fontRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  fontRowSelected: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    margin: 2,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  fontRowText: {
    fontSize: 22,
    color: '#000000',
  },
  fontRowTextSelected: {
    color: '#000000',
  },
  fontRowKeepText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#666666',
  },

  // Field row: label on the left, control(s) on the right.
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabelCell: {
    width: 90,
    paddingRight: 12,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  fieldControlCell: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // A "chip" — used for font picker, align picker, and the keep/on/off
  // toggles. Active state is filled black, inactive is white outline.
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: '#000000',
  },
  chipKeep: {
    borderStyle: 'dashed',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  chipTextActive: {
    color: '#ffffff',
  },

  // Size stepper: − value + buttons.
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    width: 60,
    textAlign: 'center',
  },
  stepperKeepText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666666',
    fontStyle: 'italic',
    minWidth: 60,
    textAlign: 'center',
  },

  warning: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  warningSpacer: {
    minHeight: 22,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minWidth: 160,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#000000',
  },
  actionButtonDisabled: {
    borderColor: '#999999',
    backgroundColor: '#eeeeee',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
  actionButtonTextDisabled: {
    color: '#999999',
  },
});
