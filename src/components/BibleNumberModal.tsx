import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { BibleGridBlock } from './BibleGridBlock';
import { BibleText } from './BibleText';

type BibleNumberModalProps = {
  visible: boolean;
  onClose: () => void;
  items: number[];
  title: string;
  iconName: keyof typeof Feather.glyphMap;
  onSelect: (item: number) => void;
};

export function BibleNumberModal({ visible, onClose, items, title, iconName, onSelect }: BibleNumberModalProps) {
  const { ms, height, width } = useResponsive();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={onClose} id="bible-number-backdrop">
        <TouchableWithoutFeedback>
          <View style={[styles.bottomSheet, { height: height * 0.85 }]} id="bible-number-sheet">
            <View style={styles.header}>
              <View style={styles.headerIconWrap}>
                <Feather name={iconName} size={ms(18)} color="#008080" />
              </View>
              <BibleText style={[styles.title, { fontSize: ms(18) }]}>{title}</BibleText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={ms(18)} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              <View style={styles.gridContainer}>
                {items.map((item) => {
                  const numCols = width > 600 ? 6 : 4;
                  const itemWidthPercentage = (100 / numCols) - 2;
                  return (
                    <BibleGridBlock
                      key={item}
                      title={item}
                      widthPercentage={itemWidthPercentage}
                      onPress={() => {
                        onSelect(item);
                      }}
                    />
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.divider} />

            <View style={styles.footer}>
              <View style={styles.countPill}>
                <BibleText style={styles.countNumber}>{items.length}</BibleText>
                <BibleText style={styles.countText}> {`${title.toLowerCase()}`}</BibleText>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 8,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 8 },
  headerIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e6f3f3', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { flex: 1, fontWeight: '700', color: '#008080' },
  closeBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdeded', borderRadius: 8, marginLeft: 12 },
  list: { paddingHorizontal: 16, flexGrow: 1, gap: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  footer: { paddingTop: 4 },
  countPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#0080806e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  countNumber: { fontWeight: '800', color: '#666', fontSize: 13 },
  countText: { color: '#666', fontWeight: '600', fontSize: 13 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
});
