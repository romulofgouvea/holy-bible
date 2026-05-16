import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTE_LABELS } from '../../constants/routes';
import { useReaderSettings } from '../../hooks/useReaderSettings';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { impactLight, selectionHaptic } from '../../utils/haptics';
import { BibleDivider } from '../BibleDivider';
import { BibleIcon } from '../BibleIcon';
import { BiblePageModal } from './BiblePageModal';
import { BibleText } from '../BibleText';

export function ReaderSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { ms } = useResponsive();
  const { colors, toggleDarkMode, isDarkMode } = useTheme();
  const { fontSizeMultiplier, setFontSizeMultiplier, textAlign, setTextAlign, readerTheme, setReaderTheme, readerFont, setReaderFont } = useReaderSettings();


  const handleSetTheme = (theme: 'light' | 'dark' | 'sepia') => {
    selectionHaptic();
    setReaderTheme(theme);
    toggleDarkMode(theme === 'dark');
  };

  if (!visible) return null;

  const dividerColor = 'rgba(0,0,0,0.05)';

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      header={
        <>
          <View style={styles.header}>
            <BibleIcon
              name="type"
              size={ms(16)}
              color={colors.primary}
              backgroundColor={colors.primary + '25'}
              style={{ marginRight: 8 }}
            />
            <BibleText style={[styles.title, { fontSize: ms(16), color: colors.primary }]}>{ROUTE_LABELS.APPEARANCE}</BibleText>
            <BibleIcon
              name="x"
              color={colors.error}
              backgroundColor={colors.error + '20'}
              onPress={onClose}
              style={styles.closeBtn}
            />
          </View>
        </>
      }
    >
      <View style={styles.settingsWrapper}>
        {/* Section: Font Size */}
        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tamanho da Fonte</BibleText>
          <View style={[styles.unifiedRow, { backgroundColor: colors.surfaceHighlight }]}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => { impactLight(); setFontSizeMultiplier(Math.max(0.7, fontSizeMultiplier - 0.1)); }}
            >
              <BibleText style={[styles.controlText, { color: colors.onBackground }]}>A-</BibleText>
            </TouchableOpacity>

            <View style={[styles.percentageDisplay, { borderColor: dividerColor }]}>
              <BibleText style={[styles.percentageText, { color: colors.primary }]}>
                {Math.round(fontSizeMultiplier * 100)}%
              </BibleText>
            </View>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => { impactLight(); setFontSizeMultiplier(Math.min(2.0, fontSizeMultiplier + 0.1)); }}
            >
              <BibleText style={[styles.controlText, { color: colors.onBackground }]}>A+</BibleText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Alinhamento</BibleText>
          <View style={[styles.unifiedRow, { backgroundColor: colors.surfaceHighlight }]}>
            {(['left', 'center', 'right', 'justify'] as const).map((align, index) => (
              <React.Fragment key={align}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    textAlign === align && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => { impactLight(); setTextAlign(align); }}
                >
                  <BibleIcon
                    name={`align-${align}` as any}
                    size={ms(18)}
                    color={textAlign === align ? colors.onPrimary : colors.onBackground}
                    containerSize={44}
                  />
                </TouchableOpacity>
                {index < 3 && textAlign !== align && (['left', 'center', 'right', 'justify'] as const)[index + 1] !== textAlign && (
                  <BibleDivider vertical height="60%" color={dividerColor} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tema de Leitura</BibleText>
          <View style={[styles.unifiedRow, { backgroundColor: colors.surfaceHighlight }]}>
            {(['light', 'dark', 'sepia'] as const).map((t, index) => (
              <React.Fragment key={t}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    readerTheme === t && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleSetTheme(t)}
                >
                  <BibleIcon
                    name={t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'coffee'}
                    size={ms(18)}
                    color={readerTheme === t ? colors.onPrimary : colors.onBackground}
                    containerSize={44}
                  />
                </TouchableOpacity>
                {index < 2 && readerTheme !== t && (['light', 'dark', 'sepia'] as const)[index + 1] !== readerTheme && (
                  <BibleDivider vertical height="60%" color={dividerColor} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Fonte</BibleText>
          <View style={[styles.unifiedRow, { backgroundColor: colors.surfaceHighlight }]}>
            {(['poppins', 'monospace'] as const).map((f, index) => (
              <React.Fragment key={f}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    readerFont === f && {
                      backgroundColor: colors.primary
                    }
                  ]}
                  onPress={() => { selectionHaptic(); setReaderFont(f); }}
                >
                  <BibleText style={{
                    fontSize: ms(13),
                    fontWeight: '700',
                    color: readerFont === f ? colors.onPrimary : colors.onBackground,
                    fontFamily: f === 'monospace' ? 'monospace' : undefined
                  }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </BibleText>
                </TouchableOpacity>
                {index < 1 && readerFont !== f && (['poppins', 'monospace'] as const)[index + 1] !== readerFont && (
                  <BibleDivider vertical height="60%" color={dividerColor} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </BiblePageModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 8,
  },
  settingsWrapper: {
    gap: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  unifiedRow: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  controlBtn: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: 16,
    fontWeight: '700',
  },
  percentageDisplay: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
