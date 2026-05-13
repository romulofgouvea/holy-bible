import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, PanResponder, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/use-theme';

type BibleBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function BibleBottomSheet({ visible, onClose, children }: BibleBottomSheetProps) {
  const { colors } = useTheme();
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
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        let newHeight = currentHeight.current - gestureState.dy;
        if (newHeight > snapPoints.full) newHeight = snapPoints.full + (newHeight - snapPoints.full) * 0.1;
        animatedHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const draggedDown = gestureState.dy > 40;
        const draggedUp = gestureState.dy < -40;

        let targetHeight = currentHeight.current;

        if (currentHeight.current === snapPoints.half) {
          if (gestureState.dy < -40 || gestureState.vy < -0.5) {
            targetHeight = snapPoints.full;
          } else if (gestureState.dy > 60 || gestureState.vy > 0.5) {
            return onClose();
          } else {
            targetHeight = snapPoints.half;
          }
        } else {
          if (gestureState.dy > 60 || gestureState.vy > 0.5) {
            if (gestureState.dy > 200 || gestureState.vy > 1.5) return onClose();
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

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer} testID="bible-bottom-sheet-container">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View testID="bible-bottom-sheet" style={[
          styles.bottomSheet,
          {
            height: animatedHeight,
            backgroundColor: colors.background,
            paddingBottom: Math.max(8, insets.bottom + 8),
            shadowColor: colors.shadow
          }
        ]}>
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={[styles.modalHandle, { backgroundColor: colors.primary }]} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 8,
    elevation: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  handleContainer: {
    width: '100%',
    paddingTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
