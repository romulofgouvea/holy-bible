import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';

type StudyBlockToolbarProps = {
  isFirst: boolean;
  isLast: boolean;
  onAddAfter: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onClose: () => void;
  onOpenCommands: () => void;
};

export function StudyBlockToolbar({
  isFirst, isLast, onAddAfter, onMoveUp, onMoveDown, onDelete, onClose, onOpenCommands
}: StudyBlockToolbarProps) {
  const { ms } = useResponsive();
  return (
    <View style={styles.wrapper} pointerEvents="box-none" {...({ onMouseDown: (e: any) => e.preventDefault() } as any)}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={onOpenCommands}>
          <Feather name="command" size={ms(16)} color="#008080" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.toolBtn} onPress={onAddAfter}>
          <Feather name="plus" size={ms(16)} color="#008080" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.toolBtn} onPress={onMoveUp} disabled={isFirst}>
          <Feather name="arrow-up" size={ms(16)} color={isFirst ? '#ddd' : '#008080'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={onMoveDown} disabled={isLast}>
          <Feather name="arrow-down" size={ms(16)} color={isLast ? '#ddd' : '#008080'} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.toolBtn} onPress={onDelete}>
          <Feather name="trash-2" size={ms(16)} color="#e74c3c" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.toolBtn} onPress={onClose}>
          <Feather name="x" size={ms(16)} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 4,
    right: 4,
    alignItems: 'center',
    zIndex: 100,
  },
  toolbar: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 4,
    elevation: 10,
    shadowColor: '#008080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f4f4',
  },
  toolBtn: {
    padding: 8,
    borderRadius: 8,
  },
  divider: {
    width: 20,
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 2,
  }
});
