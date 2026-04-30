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
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>

          <View style={styles.headerArea}>
            <View style={[styles.heartGlow, { backgroundColor: colors.primary + '20' }]} />
            <View style={[styles.heartGlowSmall, { backgroundColor: colors.primary + '40' }]} />
            <View style={[styles.heartCircle, { backgroundColor: colors.primary }]}>
              <Feather name="heart" size={ms(32)} color={colors.onPrimary} />
            </View>
          </View>

          <BibleText style={[styles.title, { color: colors.onSurface, fontSize: ms(22), fontWeight: '800' }]}>
            Apoie este Projeto
          </BibleText>

          <BibleText style={[styles.body, { color: colors.onSurface, fontSize: ms(15), opacity: 0.8 }]}>
            Este aplicativo é gratuito e feito com muito cuidado para levar a Palavra de Deus às suas mãos.
          </BibleText>

          <BibleText style={[styles.bodySmall, { color: colors.textMuted, fontSize: ms(13) }]}>
            Cada contribuição ajuda a manter os servidores e a adicionar novas funcionalidades. 🙏
          </BibleText>

          <View style={[styles.pixCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
            <View style={styles.pixHeader}>
              <View style={[styles.pixIconCircle, { backgroundColor: colors.primary }]}>
                <BibleText style={{ color: colors.onPrimary, fontWeight: '900', fontSize: ms(10) }}>PIX</BibleText>
              </View>
              <BibleText style={[styles.pixLabel, { color: colors.textMuted, fontSize: ms(12), fontWeight: '700' }]}>
                CHAVE (E-MAIL)
              </BibleText>
            </View>

            <View style={styles.pixKeyContainer}>
              <BibleText style={[styles.pixKey, { color: colors.onSurface, fontSize: ms(16), fontWeight: '600' }]} selectable>
                {PIX_KEY}
              </BibleText>
            </View>

            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? '#4CAF50' : colors.primary }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Feather name={copied ? 'check' : 'copy'} size={ms(16)} color={colors.onPrimary} />
              <BibleText style={[styles.copyBtnText, { fontSize: ms(14), color: colors.onPrimary, fontWeight: '700' }]}>
                {copied ? 'Chave Copiada!' : 'Copiar Chave Pix'}
              </BibleText>
            </TouchableOpacity>
          </View>

          <BibleText style={[styles.thanks, { color: colors.primary, fontSize: ms(14), fontWeight: '600', fontStyle: 'italic' }]}>
            Que Deus abençoe você em dobro!
          </BibleText>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <BibleText style={[styles.closeBtnText, { color: colors.onSurface, fontSize: ms(14), fontWeight: '700' }]}>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  headerArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heartGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heartGlowSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  heartCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  bodySmall: {
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  pixCard: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pixIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pixLabel: {
    letterSpacing: 1,
  },
  pixKeyContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  pixKey: {
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyBtnText: {},
  thanks: {
    marginBottom: 24,
    textAlign: 'center',
  },
  closeBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {},
});
