import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { Block, makeBlock } from '../../hooks/use-studies';

type StudyBlockToolbarProps = {
  isFirst: boolean;
  isLast: boolean;
  onAddAfter: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onClose: () => void;
  onOpenCommands: () => void;
  onGoToBible?: () => void;
};

export function useBlockActions(
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>,
  blockRefs: React.MutableRefObject<Record<string, TextInput | null>>
) {
  const moveBlock = (blockId: string, dir: 'up' | 'down') => {
    Keyboard.dismiss();
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const deleteBlock = (blockId: string) => {
    Keyboard.dismiss();
    setBlocks(prev => {
      if (prev.length <= 1) return [makeBlock('paragraph')];
      return prev.filter(b => b.id !== blockId);
    });
  };

  const addBlockAfter = (blockId: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      const nb = makeBlock('paragraph');
      const next = [...prev];
      next.splice(idx + 1, 0, nb);
      setTimeout(() => blockRefs.current[nb.id]?.focus(), 80);
      return next;
    });
  };

  return { moveBlock, deleteBlock, addBlockAfter };
}

export function StudyBlockToolbar({
  isFirst, isLast, onAddAfter, onMoveUp, onMoveDown, onDelete, onClose, onOpenCommands, onGoToBible
}: StudyBlockToolbarProps) {
  const { ms } = useResponsive();
  return (
    <View style={styles.wrapper} pointerEvents="box-none" {...({ onMouseDown: (e: any) => e.preventDefault() } as any)}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={onOpenCommands}>
          <Feather name="command" size={ms(16)} color="#008080" />
        </TouchableOpacity>
        {onGoToBible && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.toolBtn} onPress={onGoToBible}>
              <Feather name="book-open" size={ms(16)} color="#008080" />
            </TouchableOpacity>
          </>
        )}
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
