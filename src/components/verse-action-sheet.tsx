import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Modal, Share, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';

type VerseActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  verse: { chapter: number; verse: number; text: string; bookName: string } | null;
  isHighlighted: boolean;
  onToggleHighlight: () => void;
};

export function VerseActionSheet(props: VerseActionSheetProps) {
  const { visible, onClose, verse, isHighlighted, onToggleHighlight } = props;
  const { ms } = useResponsive();

  if (!visible || !verse) return null;

  const fullText = `${verse.bookName} ${verse.chapter}:${verse.verse}\n\n"${verse.text}"`;

  const onCopy = async () => {
    await Clipboard.setStringAsync(fullText);
    onClose();
  };

  const onShare = async () => {
    try {
      await Share.share({ message: fullText });
    } catch (e) { }
    onClose();
  };

  const handleToggle = () => {
    onToggleHighlight();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={[styles.title, { fontSize: ms(18) }]}>
                {verse.bookName} {verse.chapter}:{verse.verse}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={ms(24)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.options}>
              <TouchableOpacity style={styles.option} onPress={onShare}>
                <Feather name="share-2" size={ms(22)} color="#008080" />
                <Text style={[styles.optionText, { fontSize: ms(16) }]}>Compartilhar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={onCopy}>
                <Feather name="copy" size={ms(22)} color="#008080" />
                <Text style={[styles.optionText, { fontSize: ms(16) }]}>Copiar Texto</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={handleToggle}>
                <Feather name="bookmark" size={ms(22)} color={isHighlighted ? "#ff6b6b" : "#008080"} />
                <Text style={[styles.optionText, { fontSize: ms(16) }]}>
                  {isHighlighted ? 'Remover Marcação' : 'Marcar Versículo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '800',
    color: '#333',
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  optionText: {
    fontWeight: '700',
    color: '#333',
  },
});
