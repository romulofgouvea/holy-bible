import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { BibleDivider } from '../BibleDivider';

type BibleBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  animated?: boolean;
  resizable?: boolean;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function BibleBottomSheet({ visible, onClose, children, header, footer, animated = true, resizable }: BibleBottomSheetProps) {
  const isResizable = resizable !== undefined ? resizable : animated;
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const insets = useSafeAreaInsets();

  const snapPoints = {
    half: SCREEN_HEIGHT * 0.7,
    full: SCREEN_HEIGHT * 0.95,
  };

  const animatedHeight = useRef(new Animated.Value(snapPoints.half)).current;
  const currentHeight = useRef(snapPoints.half);

  useEffect(() => {
    if (visible) {
      currentHeight.current = snapPoints.half;
      animatedHeight.setValue(snapPoints.half);
    }
  }, [visible, animatedHeight, snapPoints.half]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > ms(DESIGN.spacing.sm);
      },
      onPanResponderMove: (_, gestureState) => {
        let newHeight = currentHeight.current - gestureState.dy;
        if (newHeight > snapPoints.full) newHeight = snapPoints.full + (newHeight - snapPoints.full) * 0.1;
        animatedHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const draggedDown = gestureState.dy > ms(DESIGN.spacing.giant);
        const draggedUp = gestureState.dy < -ms(DESIGN.spacing.giant);

        let targetHeight = currentHeight.current;

        if (currentHeight.current === snapPoints.half) {
          if (gestureState.dy < -ms(DESIGN.spacing.giant) || gestureState.vy < -0.5) {
            targetHeight = snapPoints.full;
          } else if (gestureState.dy > ms(DESIGN.layout.settingsIconOffset) || gestureState.vy > 0.5) {
            return onClose();
          } else {
            targetHeight = snapPoints.half;
          }
        } else {
          if (gestureState.dy > ms(DESIGN.layout.settingsIconOffset) || gestureState.vy > 0.5) {
            if (gestureState.dy > ms(200) || gestureState.vy > 1.5) return onClose();
            targetHeight = snapPoints.half;
          } else {
            targetHeight = snapPoints.full;
          }
        }

        currentHeight.current = targetHeight;
        Animated.spring(animatedHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      },
    })
  ).current;

  const styles = useMemo(() => StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
      width: '100%',
      borderTopLeftRadius: ms(DESIGN.borderRadius.xl),
      borderTopRightRadius: ms(DESIGN.borderRadius.xl),
      elevation: 24,
      shadowOffset: { width: 0, height: ms(-DESIGN.spacing.xs) },
      shadowOpacity: 0.15,
      shadowRadius: ms(DESIGN.borderRadius.lg),
    },
    modalHandle: {
      width: ms(DESIGN.spacing.giant),
      height: ms(DESIGN.spacing.xs),
      borderRadius: ms(DESIGN.borderRadius.xs),
      alignSelf: 'center',
      marginTop: ms(DESIGN.spacing.md),
      marginBottom: ms(DESIGN.spacing.md),
    },
    handleContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: ms(DESIGN.spacing.lg),
    },
  }), [ms, colors, DESIGN]);

  return (
    <Modal visible={visible} animationType={animated ? "slide" : "none"} transparent onRequestClose={onClose}>
      <View style={styles.modalContainer} testID="bible-bottom-sheet-container">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View testID="bible-bottom-sheet" style={[
          styles.bottomSheet,
          {
            height: isResizable ? animatedHeight : undefined,
            maxHeight: snapPoints.full,
            backgroundColor: colors.background,
            paddingBottom: Math.max(ms(DESIGN.spacing.sm), insets.bottom + ms(DESIGN.spacing.sm)),
            shadowColor: colors.shadow
          }
        ]}>
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
          >
            {isResizable && (
              <View {...panResponder.panHandlers} style={styles.handleContainer}>
                <View style={[styles.modalHandle, { backgroundColor: colors.primary }]} />
              </View>
            )}
            {header && (
              <View style={{ paddingTop: ms(DESIGN.spacing.lg) }}>
                <View style={styles.content}>{header}</View>
                <BibleDivider margin={ms(DESIGN.spacing.md)} />
              </View>
            )}
            <View style={[styles.content, { flex: 1 }]}>
              {children}
            </View>
            {footer && (
              <View style={{ paddingBottom: ms(DESIGN.spacing.xs) }}>
                <BibleDivider margin={ms(DESIGN.spacing.xs)} />
                <View style={styles.content}>{footer}</View>
              </View>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
