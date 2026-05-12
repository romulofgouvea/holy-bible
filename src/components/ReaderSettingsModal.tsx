import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { impactLight, selectionHaptic } from '../utils/haptics';
import { BibleConfirmModal } from './BibleConfirmModal';
import { BibleText } from './BibleText';

export function ReaderSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { ms } = useResponsive();
  const { colors, toggleDarkMode } = useTheme();
  const { fontSizeMultiplier, setFontSizeMultiplier, textAlign, setTextAlign, readerTheme, setReaderTheme, readerFont, setReaderFont } = useReaderSettings();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleSetTheme = (theme: 'light' | 'dark' | 'sepia') => {
    selectionHaptic();
    setReaderTheme(theme);
    toggleDarkMode(theme === 'dark');
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.clear();
      setConfirmVisible(false);
      onClose();
      // Optionally reload app or show toast
      if (Platform.OS === 'web') {
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to clear cache', e);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
      </TouchableWithoutFeedback>
      <View style={[styles.container, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tamanho da Fonte</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceHighlight }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { impactLight(); setFontSizeMultiplier(Math.max(0.7, fontSizeMultiplier - 0.1)); }}>
              <BibleText style={[{ fontSize: ms(16), color: colors.onSurface, fontWeight: '700' }]}>A-</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => { impactLight(); setFontSizeMultiplier(Math.min(2.0, fontSizeMultiplier + 0.1)); }}>
              <BibleText style={[{ fontSize: ms(20), color: colors.onSurface, fontWeight: '700' }]}>A+</BibleText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Alinhamento</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceHighlight }]}>
            {['left', 'center', 'right', 'justify'].map((align, idx) => (
              <React.Fragment key={align}>
                <TouchableOpacity style={[styles.actionBtn, textAlign === align && { backgroundColor: colors.primary }]} onPress={() => { impactLight(); setTextAlign(align as any); }}>
                  <Feather name={`align-${align}` as any} size={ms(18)} color={textAlign === align ? colors.onPrimary : colors.onSurface} />
                </TouchableOpacity>
                {idx < 3 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Tema de Leitura</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceHighlight }]}>
            <TouchableOpacity style={[styles.actionBtn, readerTheme === 'light' && { backgroundColor: colors.primary }]} onPress={() => handleSetTheme('light')}>
              <BibleText style={[{ color: readerTheme === 'light' ? colors.onPrimary : colors.onSurface, fontWeight: '700' }]}>Claro</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.actionBtn, readerTheme === 'dark' && { backgroundColor: colors.primary }]} onPress={() => handleSetTheme('dark')}>
              <BibleText style={[{ color: readerTheme === 'dark' ? colors.onPrimary : colors.onSurface, fontWeight: '700' }]}>Escuro</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.actionBtn, readerTheme === 'sepia' && { backgroundColor: colors.primary }]} onPress={() => handleSetTheme('sepia')}>
              <BibleText style={[{ color: readerTheme === 'sepia' ? colors.onPrimary : colors.onSurface, fontWeight: '700' }]}>Leitura</BibleText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Fonte</BibleText>
          <View style={[styles.row, { backgroundColor: colors.surfaceHighlight }]}>
            <TouchableOpacity style={[styles.actionBtn, readerFont === 'poppins' && { backgroundColor: colors.primary }]} onPress={() => { selectionHaptic(); setReaderFont('poppins'); }}>
              <BibleText style={[{ color: readerFont === 'poppins' ? colors.onPrimary : colors.onSurface, fontWeight: '700' }]}>Poppins</BibleText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.actionBtn, readerFont === 'monospace' && { backgroundColor: colors.primary }]} onPress={() => { selectionHaptic(); setReaderFont('monospace'); }}>
              <BibleText style={[{ color: readerFont === 'monospace' ? colors.onPrimary : colors.onSurface, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>Mono</BibleText>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.clearBtn, { backgroundColor: colors.surfaceHighlight }]} 
            onPress={() => setConfirmVisible(true)}
          >
            <Feather name="trash-2" size={ms(16)} color={colors.error} />
            <BibleText style={[styles.clearBtnText, { color: colors.error, marginLeft: 8 }]}>Limpar Cache</BibleText>
          </TouchableOpacity>
        </View>

        <BibleConfirmModal
          visible={confirmVisible}
          title="Limpar Cache"
          message="Tem certeza que deseja limpar todo o cache e dados salvos? Isso removerá históricos, favoritos e configurações."
          confirmText="Limpar Tudo"
          isDanger
          onConfirm={handleClearCache}
          onCancel={() => setConfirmVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  container: { position: 'absolute', top: 60, right: 10, width: 280, borderRadius: 16, padding: 16, elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, gap: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  actionBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
