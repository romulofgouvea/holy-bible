import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/use-theme';
import { BibleDivider } from './BibleDivider';

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
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
      });
    }
  }, [visible, fadeAnim]);

  if (!rendered) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999, opacity: fadeAnim }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
                fullHeight && { height: '90%' }
              ]}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              {header && (
                <View >
                  <View style={styles.contentHeader}>{header}</View>
                  <BibleDivider />
                </View>
              )}

              <View style={[styles.contentHeader, { flexShrink: 1, flexGrow: fullHeight ? 1 : 0 }]}>
                {children}
              </View>

              {footer && (
                <View >
                  <BibleDivider />
                  <View style={styles.contentFooter}>{footer}</View>
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  contentHeader: {
    padding: 16
  },
  contentFooter: {
    paddingHorizontal: 8,
    paddingVertical: 8
  },
});
