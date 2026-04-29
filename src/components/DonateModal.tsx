import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

const PIX_KEY = 'romulo-gouvea@hotmail.com';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DonateModal({ visible, onClose }: Props) {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>

          <View style={[styles.heartCircle, { backgroundColor: '#fce4ec' }]}>
            <Feather name="heart" size={ms(36)} color="#E91E63" />
          </View>

          <BibleText style={[styles.title, { color: colors.text, fontSize: ms(20) }]}>
            Apoie este Projeto
          </BibleText>

          <BibleText style={[styles.body, { color: colors.textMuted, fontSize: ms(14) }]}>
            Este aplicativo é gratuito e feito com muito cuidado para levar a Palavra de Deus às suas mãos. Cada contribuição ajuda a manter e melhorar o app. 🙏
          </BibleText>

          <View style={[styles.pixBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <View style={styles.pixLabelRow}>
              <View style={[styles.pixBadge, { backgroundColor: '#00B894' }]}>
                <BibleText style={styles.pixBadgeText}>PIX</BibleText>
              </View>
              <BibleText style={[styles.pixLabel, { color: colors.textMuted, fontSize: ms(12) }]}>
                Chave (e-mail)
              </BibleText>
            </View>

            <BibleText style={[styles.pixKey, { color: colors.text, fontSize: ms(15) }]} selectable>
              {PIX_KEY}
            </BibleText>

            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? '#00B894' : colors.primary }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Feather name={copied ? 'check' : 'copy'} size={ms(15)} color="#fff" />
              <BibleText style={[styles.copyBtnText, { fontSize: ms(13) }]}>
                {copied ? 'Copiado!' : 'Copiar chave'}
              </BibleText>
            </TouchableOpacity>
          </View>

          <BibleText style={[styles.thanks, { color: colors.textMuted, fontSize: ms(13) }]}>
            Que Deus abençoe você em dobro!
          </BibleText>

          <TouchableOpacity
            style={[styles.closeBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <BibleText style={[styles.closeBtnText, { color: colors.textMuted, fontSize: ms(14) }]}>
              Fechar
            </BibleText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  heartCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  pixBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  pixLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pixBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pixBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },
  pixLabel: {
    fontWeight: '600',
  },
  pixKey: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  thanks: {
    textAlign: 'center',
    fontWeight: '500',
  },
  closeBtn: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },
  closeBtnText: {
    fontWeight: '600',
  },
});
