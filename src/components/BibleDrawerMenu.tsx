import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../constants/routes';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
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

  const MENU_ITEMS: MenuItem[] = [
    { key: 'bible', label: 'Bíblia', icon: 'book-open', route: ROUTES.BIBLE },
    { key: 'studies', label: 'Estudos', icon: 'edit-3', route: ROUTES.STUDIES },
    { key: 'search', label: 'Pesquisar', icon: 'search', route: ROUTES.SEARCH },
    { key: 'configuration', label: 'Configurações', icon: 'settings', route: ROUTES.CONFIGURATION },
  ];

  const BOTTOM_ITEMS: MenuItem[] = [
    {
      key: 'donate',
      label: 'Fazer uma Doação',
      icon: 'heart',
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
    const tintColor = item.tint || colors.primary;
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.menuItem,
          { paddingVertical: ms(9), paddingHorizontal: ms(8), borderRadius: ms(10), marginBottom: ms(4) },
          isActive && { backgroundColor: colors.primary },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.menuIconWrap,
          { width: ms(38), height: ms(38), borderRadius: ms(10), marginRight: ms(10) },
          isActive ? { backgroundColor: colors.onPrimary } : { backgroundColor: colors.surfaceHighlight },
        ]}>
          <Feather name={item.icon} size={ms(18)} color={isActive ? colors.primary : (item.tint || colors.onSurface)} />
        </View>
        <BibleText
          style={[
            styles.menuLabel,
            { fontSize: ms(15) },
            isActive ? { color: colors.onPrimary, fontWeight: '800' } : { color: item.tint || colors.onSurface },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </BibleText>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={modalVisible} transparent animationType="none">
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }], backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.primary, paddingTop: Math.max(ms(20), insets.top + ms(16)), paddingBottom: ms(20), paddingHorizontal: ms(16) }]}>
            <View style={[styles.drawerLogo, { width: ms(38), height: ms(38), borderRadius: ms(10), marginRight: ms(10), backgroundColor: colors.surfaceHighlight }]}>
              <Feather name="book" size={ms(19)} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <BibleText style={[styles.drawerTitle, { fontSize: ms(17), color: colors.onPrimary }]} numberOfLines={1}>
                Bíblia Sagrada
              </BibleText>
              <BibleText style={{ fontSize: ms(12), color: colors.onPrimary, opacity: 0.75, marginTop: -2 }}>
                v{require('../../package.json').version}
              </BibleText>
            </View>
          </View>

          <View style={[styles.menuList, { paddingTop: ms(8), paddingHorizontal: ms(8) }]}>
            {MENU_ITEMS.map(renderItem)}
          </View>

          <View style={[styles.bottomSection, { paddingHorizontal: ms(8), paddingBottom: Math.max(ms(16), insets.bottom + ms(8)) }]}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
  divider: {
    height: 1,
    marginBottom: 8,
  },
  versionRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontWeight: '600',
  },
});
