import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ROUTES } from '../constants/routes';
import { useResponsive } from '../hooks/use-responsive';
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
];

type DrawerMenuProps = {
  visible: boolean;
  activeItem: string;
  onClose: () => void;
  onSelectItem: (key: string) => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(240, SCREEN_WIDTH * 0.72);

export function BibleDrawerMenu(props: DrawerMenuProps) {
  const { visible, activeItem, onClose, onSelectItem } = props;
  const { ms } = useResponsive();
  const router = useRouter();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    if (visible) hasBeenVisible.current = true;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: visible ? 0 : DRAWER_WIDTH,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible && !hasBeenVisible.current) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerLogo}>
            <Feather name="book" size={ms(19)} color="#fff" />
          </View>
          <BibleText style={[styles.drawerTitle, { fontSize: ms(17) }]}>Bíblia Sagrada</BibleText>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = activeItem === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => {
                  onSelectItem(item.key);
                  onClose();
                  router.push(item.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, isActive && styles.menuIconWrapActive]}>
                  <Feather name={item.icon} size={ms(18)} color={isActive ? '#008080' : '#666'} />
                </View>
                <BibleText style={[styles.menuLabel, { fontSize: ms(15) }, isActive && styles.menuLabelActive]}>
                  {item.label}
                </BibleText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.drawerFooter}>
          <BibleText style={[styles.footerText, { fontSize: ms(11) }]}>Stevanini</BibleText>
        </View>
      </Animated.View>
    </View>
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
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
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
    width: 34,
    height: 34,
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
    width: 30,
    height: 30,
    borderRadius: 8,
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
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    color: '#bbb',
    fontWeight: '600',
  },
});
