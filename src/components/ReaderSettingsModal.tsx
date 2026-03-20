import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

export function ReaderSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { ms } = useResponsive();
  const { colors, toggleDarkMode } = useTheme();
  const { fontSizeMultiplier, setFontSizeMultiplier, textAlign, setTextAlign, readerTheme, setReaderTheme } = useReaderSettings();

  const handleSetTheme = (theme: 'light' | 'dark' | 'sepia') => {
    setReaderTheme(theme);
    toggleDarkMode(theme === 'dark');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tamanho da Fonte</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setFontSizeMultiplier(Math.max(0.7, fontSizeMultiplier - 0.1))}>
              <BibleText style={[{ fontSize: ms(16), color: colors.text }]}>A-</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => setFontSizeMultiplier(Math.min(2.0, fontSizeMultiplier + 0.1))}>
              <BibleText style={[{ fontSize: ms(20), color: colors.text }]}>A+</BibleText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Alinhamento</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceVariant }]}>
            {['left', 'center', 'right', 'justify'].map((align, idx) => (
              <React.Fragment key={align}>
                <TouchableOpacity style={[styles.actionBtn, textAlign === align && { backgroundColor: colors.primary }]} onPress={() => setTextAlign(align as any)}>
                  <Feather name={`align-${align}` as any} size={ms(18)} color={textAlign === align ? colors.onPrimary : colors.text} />
                </TouchableOpacity>
                {idx < 3 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tema de Leitura</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity style={[styles.actionBtn, readerTheme === 'light' && { backgroundColor: colors.primary }]} onPress={() => handleSetTheme('light')}>
              <BibleText style={[{ color: readerTheme === 'light' ? colors.onPrimary : colors.text, fontWeight: '700' }]}>Claro</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.actionBtn, readerTheme === 'sepia' && { backgroundColor: colors.primary }]} onPress={() => handleSetTheme('sepia')}>
              <BibleText style={[{ color: readerTheme === 'sepia' ? colors.onPrimary : colors.text, fontWeight: '700' }]}>Sépia</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.actionBtn, readerTheme === 'dark' && { backgroundColor: colors.primary }]} onPress={() => handleSetTheme('dark')}>
              <BibleText style={[{ color: readerTheme === 'dark' ? colors.onPrimary : colors.text, fontWeight: '700' }]}>Escuro</BibleText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  container: { position: 'absolute', top: 60, right: 10, width: 280, borderRadius: 16, padding: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, gap: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  actionBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1 },
});
