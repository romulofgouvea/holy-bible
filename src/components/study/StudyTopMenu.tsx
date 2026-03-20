import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { BibleText } from '../BibleText';

type StudyTopMenuProps = {
  visible: boolean;
  onClose: () => void;
  onExportPDF: () => void;
};

export function StudyTopMenu({ visible, onClose, onExportPDF }: StudyTopMenuProps) {
  const { ms } = useResponsive();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuSheet}>
          <TouchableOpacity style={styles.menuItem} onPress={onExportPDF}>
            <Feather name="file-text" size={ms(18)} color="#008080" />
            <BibleText style={[styles.menuItemText, { fontSize: ms(15) }]}>Exportar PDF</BibleText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuSheet: {
    position: 'absolute',
    top: 56,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    width: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  menuItemText: {
    fontWeight: '600',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
