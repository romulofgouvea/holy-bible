import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

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
};

export const SelectModal = React.memo(function SelectModal<T>(props: SelectModalProps<T>) {
  const { visible, onClose, title, placeholder, value, onChangeText, items, itemKey, renderItem, onSelect } = props;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContentBig}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TextInput style={styles.searchInput} placeholder={placeholder} value={value} onChangeText={onChangeText} />
            <ScrollView contentContainerStyle={styles.modalGrid}>
              {items.map((item) => (
                <TouchableOpacity key={itemKey(item)} style={styles.gridItem} onPress={() => onSelect(item)}>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentBig: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  gridItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#008080',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
});
