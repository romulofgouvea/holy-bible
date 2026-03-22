import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BibleText } from './BibleText';

export type BibleHeaderProps = {
  title?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onMenuPress?: () => void;
  showMenu?: boolean;
};

export function BibleHeader({ title, leftContent, rightContent, onMenuPress, showMenu = true }: BibleHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showMenu && (
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Feather name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {leftContent ? leftContent : (
          title ? <BibleText style={styles.title}>{title}</BibleText> : null
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 10,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    includeFontPadding: false,
  },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
