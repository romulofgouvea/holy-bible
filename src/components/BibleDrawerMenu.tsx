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
  route: string;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'bible', label: 'Bíblia', icon: 'book-open', route: ROUTES.BIBLE },
  { key: 'studies', label: 'Estudos', icon: 'edit-3', route: ROUTES.STUDIES },
  { key: 'configuration', label: 'Configurações', icon: 'settings', route: ROUTES.CONFIGURATION },
];

type DrawerMenuProps = {
  visible: boolean;
  activeItem: string;
  onClose: () => void;
  onSelectItem: (key: string) => void;
};

export function BibleDrawerMenu(props: DrawerMenuProps) {
  const { visible, activeItem, onClose, onSelectItem } = props;
  const { ms, width } = useResponsive();
  const drawerWidth = Math.min(ms(280), width * 0.72);
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Initialize with -1000 so it starts off-screen and updates gracefully.
  const translateX = useRef(new Animated.Value(-1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Sync translation to dynamic drawerWidth
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

  return (
    <Modal visible={modalVisible} transparent animationType="none">
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }], backgroundColor: colors.surface }]}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.primary, paddingTop: Math.max(ms(20), insets.top + ms(16)), paddingBottom: ms(20), paddingHorizontal: ms(20) }]}>
            <View style={[styles.drawerLogo, { width: ms(38), height: ms(38), borderRadius: ms(10), marginRight: ms(10) }]}>
              <Feather name="book" size={ms(19)} color={colors.onPrimary} />
            </View>
            <BibleText style={[styles.drawerTitle, { fontSize: ms(17), color: colors.onPrimary }]}>Bíblia Sagrada</BibleText>
          </View>

          <View style={[styles.menuList, { paddingTop: ms(8), paddingHorizontal: ms(8) }]}>
            {MENU_ITEMS.map((item) => {
              const isActive = activeItem === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, { paddingVertical: ms(9), paddingHorizontal: ms(8), borderRadius: ms(10), marginBottom: ms(6) }, isActive && { backgroundColor: colors.primaryContainer }]}
                  onPress={() => {
                    onSelectItem(item.key);
                    onClose();
                    setTimeout(() => router.push(item.route as any), 150);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconWrap, { width: ms(38), height: ms(38), borderRadius: ms(10), marginRight: ms(10) }, isActive && { backgroundColor: colors.primary }, !isActive && { backgroundColor: colors.surfaceVariant }]}>
                    <Feather name={item.icon} size={ms(18)} color={isActive ? colors.onPrimary : colors.textMuted} />
                  </View>
                  <BibleText style={[styles.menuLabel, { fontSize: ms(15) }, isActive ? { color: colors.onPrimaryContainer, fontWeight: '800' } : { color: colors.text }]}>
                    {item.label}
                  </BibleText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.drawerFooter]}>
            <BibleText style={[styles.footerText, { fontSize: ms(12) }]}>{require('../../package.json').version}</BibleText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008080',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 20,
    gap: 10,
  },
  drawerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  menuList: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: '#e6f3f3',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapActive: {
    backgroundColor: '#c8e6e6',
  },
  menuLabel: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  menuLabelActive: {
    color: '#008080',
    fontWeight: '800',
  },
  drawerFooter: {
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    color: '#bbb',
    fontWeight: '600',
  },
});
