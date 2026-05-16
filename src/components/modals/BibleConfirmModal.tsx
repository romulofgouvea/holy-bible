import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleText } from '../BibleText';

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
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <BibleText style={[styles.title, { fontSize: ms(18), color: colors.onSurface, fontWeight: '700' }]}>{title}</BibleText>
          <BibleText style={[styles.message, { fontSize: ms(15), color: colors.textMuted, marginTop: 8 }]}>{message}</BibleText>
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHighlight }]} onPress={onCancel}>
                <BibleText style={[styles.cancelText, { fontSize: ms(15), color: colors.onSurface }]}>{cancelText}</BibleText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, { backgroundColor: isDanger ? colors.error : colors.primary }]} onPress={onConfirm}>
              <BibleText style={[styles.confirmText, { fontSize: ms(15), color: isDanger ? colors.onError : colors.onPrimary, fontWeight: '700' }]}>{confirmText}</BibleText>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
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
  cancelText: {
    fontWeight: '600',
  },
  confirmText: {
    fontWeight: '700',
  },
});
