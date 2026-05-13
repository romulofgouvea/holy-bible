import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';

export type BibleTopMenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  iconColor?: string;
};

export type BibleTopMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: BibleTopMenuItem[];
};

export function BibleTopMenu({ visible, onClose, items }: BibleTopMenuProps) {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'transparent' }} activeOpacity={1} onPress={onClose}>
        <View style={{
          position: 'absolute',
          top: ms(52) + insets.top,
          right: ms(16),
          backgroundColor: colors.surface,
          borderRadius: ms(12),
          minWidth: ms(200),

          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                paddingVertical: ms(14),
                paddingHorizontal: ms(16),
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderBottomWidth: index < items.length - 1 ? 1 : 0,
                borderBottomColor: colors.border
              }}
              activeOpacity={0.6}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <View style={{ width: ms(28), alignItems: 'center' }}>
                <BibleIcon name={item.icon} size={ms(18)} color={item.iconColor || colors.primary} />
              </View>
              <BibleText style={{ fontSize: ms(15), color: item.color || colors.onSurface, fontWeight: '700', marginLeft: ms(8) }}>
                {item.label}
              </BibleText>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
