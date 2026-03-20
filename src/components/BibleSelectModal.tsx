import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { BibleText } from './BibleText';

type SelectModalProps<T> = {
  visible: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  hideSearch?: boolean;
};

export const BibleSelectModal = React.memo(function BibleSelectModal<T>(props: SelectModalProps<T>) {
  const { visible, onClose, title, placeholder, value, onChangeText, items, itemKey, renderItem, onSelect, hideSearch } = props;
  const { width, ms, s } = useResponsive();
  const numColumns = width > 600 ? 6 : 4;
  const itemWidth = `${100 / numColumns - 2}%`;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContentBig}>
            <View style={styles.modalHeader}>
              <BibleText style={[styles.modalTitle, { fontSize: ms(20) }]}>{title}</BibleText>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={ms(24)} color="#333" />
              </TouchableOpacity>
            </View>

            {!hideSearch && (
              <View style={styles.searchContainer}>
                <Feather name="search" size={ms(20)} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { fontSize: ms(16) }]}
                  placeholder={placeholder}
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChangeText}
                  underlineColorAndroid="transparent"
                />
              </View>
            )}

            <ScrollView contentContainerStyle={styles.modalGrid} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <TouchableOpacity
                  key={itemKey(item)}
                  activeOpacity={0.6}
                  style={[styles.gridItem, { width: itemWidth as any }]}
                  onPress={() => onSelect(item)}
                >
                  {renderItem(item)}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}) as <T>(props: SelectModalProps<T>) => React.ReactElement;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentBig: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
    ...({ outlineStyle: 'none' } as any),
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    paddingBottom: 20,
  },
  gridItem: {
    aspectRatio: 1,
    backgroundColor: '#008080',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
