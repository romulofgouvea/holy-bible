import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';

type ActionItem = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  tint?: string;
};

type ActionsDrawerProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionItem[];
};

export function BibleActionsDrawer({ visible, onClose, title = "Ações", items }: ActionsDrawerProps) {
  const { ms, width } = useResponsive();
  const drawerWidth = Math.min(ms(280), width * 0.75);
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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
          toValue: drawerWidth,
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
  }, [visible, drawerWidth, translateX, backdropOpacity]);

  const renderItem = (item: ActionItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.menuItem,
        { paddingVertical: ms(10), paddingHorizontal: ms(12), borderRadius: ms(12), marginBottom: ms(4) }
      ]}
      onPress={() => {
        onClose();
        setTimeout(item.onPress, 300);
      }}
      activeOpacity={0.7}
    >
      <View style={[
        styles.menuIconWrap,
        { width: ms(40), height: ms(40), borderRadius: ms(12), marginRight: ms(14), backgroundColor: colors.surfaceHighlight }
      ]}>
        <BibleIcon name={item.icon} size={ms(18)} color={item.tint || colors.onSurface} />
      </View>
      <BibleText
        style={[styles.menuLabel, { fontSize: ms(15), color: item.tint || colors.onSurface }]}
        numberOfLines={1}
      >
        {item.label}
      </BibleText>
    </TouchableOpacity>
  );

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }], backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.primary, paddingTop: Math.max(ms(20), insets.top + ms(16)), paddingBottom: ms(20), paddingHorizontal: ms(20) }]}>
            <BibleText style={[styles.drawerTitle, { fontSize: ms(18), color: colors.onPrimary }]} numberOfLines={1}>
              {title}
            </BibleText>
          </View>

          <View style={[styles.menuList, { paddingTop: ms(12), paddingHorizontal: ms(8) }]}>
            {items.map(renderItem)}
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
    right: 0,
    bottom: 0,
    elevation: 24,
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontWeight: '700',
    flex: 1,
  },
});
