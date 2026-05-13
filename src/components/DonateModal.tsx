import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleBottomSheet } from './BibleBottomSheet';
import { BibleIcon } from './BibleIcon';
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

  if (!visible) return null;

  return (
    <BibleBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.header}>
          <BibleIcon
            name="heart"
            size={ms(16)}
            color={colors.primary}
            backgroundColor={colors.primary + '25'}
            borderRadius={6}
            style={styles.headerIconWrap}
          />
          <BibleText style={[styles.headerTitle, { fontSize: ms(16), color: colors.primary }]}>Apoie este Projeto</BibleText>
          <BibleIcon
            name="x"
            size={ms(16)}
            color={colors.error}
            backgroundColor={colors.surfaceHighlight}
            borderRadius={6}
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.bodyContent}>
          <BibleText style={[styles.body, { color: colors.onSurface, fontSize: ms(14), opacity: 0.8 }]}>
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

            <View style={[styles.pixKeyContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
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

          <BibleText style={[styles.thanks, { color: colors.primary, fontSize: ms(14), fontWeight: '600' }]}>
            Que Deus abençoe você em dobro!
          </BibleText>
        </View>
      </View>
    </BibleBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIconWrap: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  bodyContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  body: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  bodySmall: {
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  pixCard: {
    width: '100%',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pixIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pixLabel: {
    letterSpacing: 0.5,
  },
  pixKeyContainer: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  pixKey: {
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyBtnText: {},
  thanks: {
    textAlign: 'center',
  },
});
