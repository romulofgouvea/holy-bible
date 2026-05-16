import React, { useMemo } from 'react';
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
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: ms(DESIGN.spacing.xl),
    },
    dialog: {
      borderRadius: ms(DESIGN.borderRadius.lg),
      padding: ms(DESIGN.spacing.xl),
      width: '100%',
      maxWidth: ms(DESIGN.maxWidth.sm),
      elevation: 8,
      shadowOffset: { width: 0, height: ms(DESIGN.spacing.xs) },
      shadowOpacity: 0.15,
      shadowRadius: ms(DESIGN.borderRadius.sm),
    },
    title: {
      fontWeight: '800',
      marginBottom: ms(DESIGN.spacing.xs),
    },
    message: {
      lineHeight: ms(DESIGN.spacing.xl),
      marginBottom: ms(DESIGN.spacing.lg),
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: ms(DESIGN.spacing.md),
    },
    btn: {
      paddingVertical: ms(DESIGN.spacing.sm),
      paddingHorizontal: ms(DESIGN.spacing.lg),
      borderRadius: ms(DESIGN.borderRadius.md),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontWeight: '600',
    },
    confirmText: {
      fontWeight: '700',
    },
  }), [ms, colors, DESIGN]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <BibleText style={[styles.title, { fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface, fontWeight: '700' }]}>{title}</BibleText>
          <BibleText style={[styles.message, { fontSize: ms(DESIGN.fontSize.md), color: colors.textMuted, marginTop: ms(DESIGN.spacing.xs) }]}>{message}</BibleText>
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHighlight }]} onPress={onCancel}>
                <BibleText style={[styles.cancelText, { fontSize: ms(DESIGN.fontSize.md), color: colors.onSurface }]}>{cancelText}</BibleText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, { backgroundColor: isDanger ? colors.error : colors.primary }]} onPress={onConfirm}>
              <BibleText style={[styles.confirmText, { fontSize: ms(DESIGN.fontSize.md), color: isDanger ? colors.onError : colors.onPrimary, fontWeight: '700' }]}>{confirmText}</BibleText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
