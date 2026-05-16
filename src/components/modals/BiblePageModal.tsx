import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
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
  const { ms } = useResponsive();
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

  if (!rendered) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999, opacity: fadeAnim }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <View style={[styles.backdrop, { padding: ms(16) }]}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={onClose} 
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderRadius: ms(16),
                maxWidth: ms(500),
              },
              fullHeight && { height: '90%' }
            ]}
          >
            {header && (
              <View >
                <View style={[styles.contentHeader, { padding: ms(16) }]}>{header}</View>
                <BibleDivider />
              </View>
            )}

            <View style={[styles.contentArea, { flexShrink: 1, flexGrow: fullHeight ? 1 : 0 }]}>
              {children}
            </View>

            {footer && (
              <View >
                <BibleDivider />
                <View style={[styles.contentFooter, { paddingHorizontal: ms(8), paddingVertical: ms(8) }]}>{footer}</View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  contentHeader: {
  },
  contentArea: {
  },
  contentFooter: {
  },
});
