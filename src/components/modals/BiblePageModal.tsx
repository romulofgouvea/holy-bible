import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleDivider } from '../BibleDivider';

type BiblePageModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  fullHeight?: boolean;
};

export function BiblePageModal({ visible, onClose, children, header, footer, fullHeight }: BiblePageModalProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();

  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '100%',
      maxHeight: '90%',
      overflow: 'hidden',
      elevation: 10,
      shadowOffset: { width: 0, height: ms(DESIGN.spacing.xs) },
      shadowOpacity: 0.3,
      shadowRadius: ms(DESIGN.borderRadius.md),
    },
  }), [ms, colors, DESIGN]);

  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
      });
    }
  }, [visible, fadeAnim]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      onCloseRef.current();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [visible]);

  if (!rendered) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999, opacity: fadeAnim }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, { padding: ms(DESIGN.spacing.lg), backgroundColor: colors.overlay }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderRadius: ms(DESIGN.borderRadius.lg),
                maxWidth: ms(DESIGN.maxWidth.md),
                shadowColor: colors.shadow,
              },
              fullHeight && { height: '90%' }
            ]}
          >
            {header && (
              <View >
                <View style={{ padding: ms(DESIGN.spacing.lg) }}>{header}</View>
                <BibleDivider />
              </View>
            )}

            <View style={{ flexShrink: 1, flexGrow: fullHeight ? 1 : 0 }}>
              {children}
            </View>

            {footer && (
              <View >
                <BibleDivider />
                <View style={{ paddingHorizontal: ms(DESIGN.spacing.sm), paddingVertical: ms(DESIGN.spacing.sm) }}>{footer}</View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
