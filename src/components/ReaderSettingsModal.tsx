import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTE_LABELS } from '../constants/routes';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { impactLight, selectionHaptic } from '../utils/haptics';
import { BibleBottomSheet } from './BibleBottomSheet';
import { BibleText } from './BibleText';

export function ReaderSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { ms } = useResponsive();
  const { colors, toggleDarkMode } = useTheme();
  const { fontSizeMultiplier, setFontSizeMultiplier, textAlign, setTextAlign, readerTheme, setReaderTheme, readerFont, setReaderFont } = useReaderSettings();

  const handleSetTheme = (theme: 'light' | 'dark' | 'sepia') => {
    selectionHaptic();
    setReaderTheme(theme);
    toggleDarkMode(theme === 'dark');
  };

  if (!visible) return null;

  return (
    <BibleBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        {/* Header (Exact clone of History Modal) */}
        <View style={styles.header}>
          <View style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '25' }]}>
            <Feather name="type" size={ms(16)} color={colors.primary} />
          </View>
          <BibleText style={[styles.title, { fontSize: ms(16), color: colors.primary }]}>{ROUTE_LABELS.APPEARANCE}</BibleText>
          <TouchableOpacity onPress={onClose} style={[styles.iconBtn, styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
            <Feather name="x" size={ms(16)} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.settingsContent}>
          {/* Section: Font Size */}
          <View style={styles.section}>
            <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tamanho da Fonte</BibleText>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.squareBtn, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => { impactLight(); setFontSizeMultiplier(Math.max(0.7, fontSizeMultiplier - 0.1)); }}
              >
                <BibleText style={[{ fontSize: ms(14), color: colors.onBackground, fontWeight: '800' }]}>A-</BibleText>
              </TouchableOpacity>

              <View style={[styles.previewWrap, { backgroundColor: colors.surfaceHighlight }]}>
                <BibleText style={{ fontSize: ms(16), color: colors.textMuted, fontWeight: '800' }}>{Math.round(fontSizeMultiplier * 100)}%</BibleText>
              </View>

              <TouchableOpacity
                style={[styles.squareBtn, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => { impactLight(); setFontSizeMultiplier(Math.min(2.0, fontSizeMultiplier + 0.1)); }}
              >
                <BibleText style={[{ fontSize: ms(14), color: colors.onBackground, fontWeight: '800' }]}>A+</BibleText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Alignment */}
          <View style={styles.section}>
            <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Alinhamento</BibleText>
            <View style={styles.row}>
              {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                <TouchableOpacity
                  key={align}
                  style={[
                    styles.squareBtn,
                    { backgroundColor: textAlign === align ? colors.primary + '25' : colors.surfaceHighlight }
                  ]}
                  onPress={() => { impactLight(); setTextAlign(align); }}
                >
                  <Feather name={`align-${align}` as any} size={ms(16)} color={textAlign === align ? colors.primary : colors.onBackground} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Theme */}
          <View style={styles.section}>
            <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tema de Leitura</BibleText>
            <View style={styles.themeRow}>
              {(['light', 'dark', 'sepia'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeBtn,
                    { backgroundColor: readerTheme === t ? colors.primary : colors.surfaceHighlight }
                  ]}
                  onPress={() => handleSetTheme(t)}
                >
                  <BibleText style={[styles.btnLabel, { fontSize: ms(16), color: readerTheme === t ? colors.onPrimary : colors.onBackground }]}>
                    {t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Leitura'}
                  </BibleText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Font Family */}
          <View style={styles.section}>
            <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Fonte</BibleText>
            <View style={styles.themeRow}>
              {(['poppins', 'monospace'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.themeBtn,
                    { backgroundColor: readerFont === f ? colors.primary : colors.surfaceHighlight }
                  ]}
                  onPress={() => { selectionHaptic(); setReaderFont(f); }}
                >
                  <BibleText style={[
                    styles.btnLabel,
                    {
                      fontSize: ms(16), color: readerFont === f ? colors.onPrimary : colors.onBackground,
                      fontFamily: f === 'monospace' ? 'monospace' : undefined
                    }
                  ]}>
                    {f === 'poppins' ? 'Poppins' : 'Mono'}
                  </BibleText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </BibleBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconWrap: {
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  settingsContent: {
    gap: 18,
    marginTop: 8,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.7
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  squareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontWeight: '700',
  },
  previewWrap: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
