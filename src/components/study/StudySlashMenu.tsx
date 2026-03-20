import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { Block } from '../../hooks/use-studies';
import { BibleText } from '../BibleText';

export const SLASH_COMMANDS = [
  { type: 'header', label: 'Cabeçalho', icon: 'minus' as const, desc: 'Seção de destaque' },
  { type: 'h1', label: 'Título 1', icon: 'type' as const, desc: 'Título principal' },
  { type: 'h2', label: 'Título 2', icon: 'type' as const, desc: 'Subtítulo' },
  { type: 'verse', label: 'Citação bíblica', icon: 'book-open' as const, desc: 'Citar versículo(s)' },
  { type: 'image', label: 'Imagem', icon: 'image' as const, desc: 'Inserir imagem' },
  { type: 'video', label: 'Link de Vídeo', icon: 'video' as const, desc: 'Link do YouTube' },
];

type StudySlashMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSelectCommand: (type: Block['type']) => void;
};

export function StudySlashMenu({ visible, onClose, onSelectCommand }: StudySlashMenuProps) {
  const { ms, height } = useResponsive();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.bottomSheet, { maxHeight: height * 0.85, backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <View style={[styles.headerIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <Feather name="command" size={ms(18)} color={colors.primary} />
              </View>
              <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary }]}>Comandos</BibleText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtnTop}>
                <Feather name="x" size={ms(22)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {SLASH_COMMANDS.map(cmd => (
                <TouchableOpacity key={cmd.type} activeOpacity={0.7} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={() => onSelectCommand(cmd.type as Block['type'])}>
                  <View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}>
                    <Feather name={cmd.icon} size={ms(18)} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BibleText style={[styles.label, { fontSize: ms(14), color: colors.text }]}>{cmd.label}</BibleText>
                    <BibleText style={[styles.desc, { fontSize: ms(12), color: colors.textMuted }]}>{cmd.desc}</BibleText>
                  </View>
                  <Feather name="chevron-right" size={ms(20)} color={colors.surfaceVariant} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingBottom: 24, elevation: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e6f3f3', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { flex: 1, fontWeight: '700', color: '#008080' },
  closeBtnTop: { padding: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#0080806e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e6f3f3', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { fontWeight: '700', color: '#333' },
  desc: { color: '#777', marginTop: 2 },
});
