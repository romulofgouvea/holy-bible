import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRAWER_ITEMS } from '../constants/routes';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleDivider } from './BibleDivider';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';

type MenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route?: string;
  onPress?: () => void;
  tint?: string;
};

type DrawerMenuProps = {
  visible: boolean;
  activeItem: string;
  onClose: () => void;
  onSelectItem: (key: string) => void;
  onOpenDonate?: () => void;
};

export function BibleDrawerMenu(props: DrawerMenuProps) {
  const { visible, activeItem, onClose, onSelectItem, onOpenDonate } = props;
  const { ms, width } = useResponsive();
  const drawerWidth = Math.min(ms(280), width * 0.72);
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(-1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      translateX.setValue(-drawerWidth);
    }
  }, [drawerWidth]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -drawerWidth,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  const MENU_ITEMS: MenuItem[] = DRAWER_ITEMS;

  const BOTTOM_ITEMS: MenuItem[] = [
    {
      key: 'donate',
      label: 'Apoie o Projeto',
      icon: 'gift',
      tint: colors.primary,
      onPress: onOpenDonate,
    },
  ];

  const handlePress = (item: MenuItem) => {
    onSelectItem(item.key);
    onClose();
    if (item.onPress) {
      setTimeout(() => item.onPress!(), 150);
    } else if (item.route) {
      setTimeout(() => router.push(item.route as any), 150);
    }
  };

  const renderItem = (item: MenuItem) => {
    const isActive = activeItem === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.menuItem,
          { paddingVertical: ms(9), paddingHorizontal: ms(8), borderRadius: ms(12), marginBottom: ms(4) },
          isActive && { backgroundColor: colors.primary + '25' },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.menuIconWrap,
          { width: ms(38), height: ms(38), borderRadius: ms(10), marginRight: ms(12) },
          isActive ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceHighlight },
        ]}>
          <BibleIcon name={item.icon} size={ms(18)} color={isActive ? colors.onPrimary : (item.tint || colors.onSurface)} />
        </View>
        <BibleText
          style={[
            styles.menuLabel,
            { fontSize: ms(15) },
            isActive ? { color: colors.primary, fontWeight: '800' } : { color: item.tint || colors.onSurface },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </BibleText>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }], backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.primary, paddingTop: Math.max(ms(20), insets.top + ms(16)), paddingBottom: ms(20), paddingHorizontal: ms(16) }]}>
            <View style={[styles.drawerLogo, { width: ms(44), height: ms(44), borderRadius: ms(12), marginRight: ms(12), backgroundColor: colors.onPrimary + '25' }]}>
              <BibleIcon name="book" size={ms(21)} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <BibleText style={[styles.drawerTitle, { fontSize: ms(17), color: colors.onPrimary }]} numberOfLines={1}>
                Bíblia Sagrada
              </BibleText>
              <BibleText style={{ fontSize: ms(12), color: colors.onPrimary, opacity: 0.75, marginTop: 2 }}>
                v{require('../../app.json').expo.version}
              </BibleText>
            </View>
          </View>

          <View style={[styles.menuList, { paddingTop: ms(8), paddingHorizontal: ms(8) }]}>
            {MENU_ITEMS.map(renderItem)}
          </View>

          <View style={[styles.bottomSection, { paddingHorizontal: ms(8), paddingBottom: Math.max(ms(16), insets.bottom + ms(8)) }]}>
            <BibleDivider margin={8} />
            {BOTTOM_ITEMS.map(renderItem)}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    elevation: 24,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  drawerLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drawerTitle: {
    flex: 1,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  menuIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuLabel: {
    fontWeight: '600',
    flex: 1,
  },
  bottomSection: {
    gap: 4,
  },
});
