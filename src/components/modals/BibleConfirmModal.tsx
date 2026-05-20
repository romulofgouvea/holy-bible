import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleButton } from '../BibleButton';
import { BibleDivider } from '../BibleDivider';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  icon?: keyof typeof Feather.glyphMap;
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
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { ms, DESIGN } = useResponsive();
  const { colors, isDarkMode } = useTheme();
  const messageColor = isDarkMode ? 'rgba(255, 255, 255, 0.82)' : 'rgba(28, 30, 33, 0.78)';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const accentColor = isDanger ? colors.error : colors.primary;
  const headerIcon = icon ?? (isDanger ? 'alert-triangle' : 'help-circle');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: ms(DESIGN.spacing.lg),
    },
    dialog: {
      width: '100%',
      maxWidth: ms(DESIGN.maxWidth.sm),
      borderRadius: ms(DESIGN.borderRadius.lg),
      borderWidth: 1,
      overflow: 'hidden',
      elevation: 10,
      shadowOffset: { width: 0, height: ms(DESIGN.spacing.xs) },
      shadowOpacity: 0.25,
      shadowRadius: ms(DESIGN.borderRadius.md),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(DESIGN.spacing.md),
      padding: ms(DESIGN.spacing.lg),
    },
    headerText: {
      flex: 1,
      fontWeight: '800',
    },
    body: {
      padding: ms(DESIGN.spacing.lg),
    },
    message: {
      lineHeight: ms(DESIGN.fontSize.xl),
    },
    footer: {
      padding: ms(DESIGN.spacing.lg),
      gap: ms(DESIGN.spacing.sm),
    },
    actionsRow: {
      flexDirection: 'row',
      gap: ms(DESIGN.spacing.sm),
    },
    actionBtn: {
      flex: 1,
    },
  }), [ms, DESIGN]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim, backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              }],
              backgroundColor: colors.background,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.header}>
            <BibleIcon
              name={headerIcon}
              color={accentColor}
              backgroundColor={accentColor + '18'}
              containerSize={DESIGN.icon.xl}
              borderRadius={DESIGN.borderRadius.md}
            />
            <BibleText style={[styles.headerText, { fontSize: ms(DESIGN.fontSize.lg), color: colors.onBackground }]}>
              {title}
            </BibleText>
          </View>

          <BibleDivider />

          <View style={styles.body}>
            <BibleText style={[styles.message, { fontSize: ms(DESIGN.fontSize.md), color: messageColor }]}>
              {message}
            </BibleText>
          </View>

          <BibleDivider />

          <View style={styles.footer}>
            {onCancel ? (
              <View style={styles.actionsRow}>
                <BibleButton
                  label={cancelText}
                  variant="outline"
                  style={styles.actionBtn}
                  onPress={onCancel}
                />
                <BibleButton
                  label={confirmText}
                  variant="primary"
                  style={styles.actionBtn}
                  onPress={onConfirm}
                />
              </View>
            ) : (
              <BibleButton
                label={confirmText}
                variant="primary"
                onPress={onConfirm}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
