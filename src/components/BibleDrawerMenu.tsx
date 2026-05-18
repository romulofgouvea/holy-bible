import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRAWER_ITEMS } from '../constants/routes';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
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
  const { ms, width, DESIGN } = useResponsive();
  const drawerWidth = Math.min(ms(280), width * 0.72);
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      elevation: 24,
      shadowOffset: { width: ms(4), height: 0 },
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
      gap: ms(DESIGN.spacing.xs),
    },
  }), [ms, colors, DESIGN]);

  const [isModalVisible, setIsModalVisible] = useState(visible);
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
      setIsModalVisible(true);
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
        setIsModalVisible(false);
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
          { paddingVertical: ms(9), paddingHorizontal: ms(DESIGN.spacing.sm), borderRadius: ms(DESIGN.borderRadius.md), marginBottom: ms(4) },
          isActive && { backgroundColor: colors.primary + '25' },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.menuIconWrap,
          { width: ms(38), height: ms(38), borderRadius: ms(DESIGN.fontSize.xs), marginRight: ms(DESIGN.spacing.md) },
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
    <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }], backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.primary, paddingTop: Math.max(ms(DESIGN.fontSize.xxl), insets.top + ms(DESIGN.spacing.lg)), paddingBottom: ms(DESIGN.fontSize.xxl), paddingHorizontal: ms(DESIGN.spacing.lg) }]}>
            <View style={[styles.drawerLogo, { width: ms(44), height: ms(44), borderRadius: ms(DESIGN.borderRadius.md), marginRight: ms(DESIGN.spacing.md), backgroundColor: colors.onPrimary + '25' }]}>
              <BibleIcon name="book" size={ms(21)} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <BibleText style={[styles.drawerTitle, { fontSize: ms(17), color: colors.onPrimary }]} numberOfLines={1}>
                Bíblia Sagrada
              </BibleText>
              <BibleText style={{ fontSize: ms(DESIGN.spacing.md), color: colors.onPrimary, opacity: 0.75, marginTop: ms(2) }}>
                v{require('../../app.json').expo.version}
              </BibleText>
            </View>
          </View>

          <View style={[styles.menuList, { paddingTop: ms(DESIGN.spacing.sm), paddingHorizontal: ms(DESIGN.spacing.sm) }]}>
            {MENU_ITEMS.map(renderItem)}
          </View>

          <View style={[styles.bottomSection, { paddingHorizontal: ms(DESIGN.spacing.sm), paddingBottom: Platform.OS === 'ios' ? Math.max(ms(DESIGN.spacing.lg), insets.bottom + ms(DESIGN.spacing.sm)) : 0 }]}>
            <BibleDivider />
            {BOTTOM_ITEMS.map(renderItem)}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}


