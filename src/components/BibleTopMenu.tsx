import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
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
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <View style={{
          position: 'absolute',
          top: 50 + insets.top,
          right: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          elevation: 8,
          padding: 8,
          minWidth: 180,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8
        }}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                padding: 12,
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                borderBottomWidth: index < items.length - 1 ? 1 : 0,
                borderBottomColor: colors.surfaceVariant
              }}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Feather name={item.icon} size={ms(18)} color={item.iconColor || colors.primary} />
              <BibleText style={{ fontSize: ms(16), color: item.color || colors.text, fontWeight: '600' }}>
                {item.label}
              </BibleText>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
