import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

export function BibleConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { ms } = useResponsive();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <BibleText style={[styles.title, { fontSize: ms(18), color: colors.text }]}>{title}</BibleText>
          <BibleText style={[styles.message, { fontSize: ms(15), color: colors.textMuted }]}>{message}</BibleText>
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceVariant }]} onPress={onCancel}>
                <BibleText style={[styles.cancelText, { fontSize: ms(15), color: colors.text }]}>{cancelText}</BibleText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, { backgroundColor: isDanger ? '#e74c3c' : colors.primary }]} onPress={onConfirm}>
              <BibleText style={[styles.confirmText, { fontSize: ms(15), color: isDanger ? '#fff' : colors.onPrimary }]}>{confirmText}</BibleText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  message: {
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5',
  },
  confirmBtn: {
    backgroundColor: '#e74c3c',
  },
  cancelText: {
    fontWeight: '600',
    color: '#555',
  },
  confirmText: {
    fontWeight: '700',
    color: '#fff',
  },
});
