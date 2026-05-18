import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';
import { BiblePageModal } from './BiblePageModal';

const PIX_KEY = 'romulo-gouvea@hotmail.com';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DonateModal({ visible, onClose }: Props) {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIconWrap: {
      marginRight: ms(DESIGN.spacing.sm),
    },
    headerTitle: {
      flex: 1,
      fontWeight: '700',
    },
    closeBtn: {
      marginLeft: ms(DESIGN.spacing.sm),
    },
    bodyContent: {
      alignItems: 'center',
      padding: ms(DESIGN.spacing.lg),
    },
    body: {
      textAlign: 'center',
      lineHeight: ms(DESIGN.spacing.xl)
    },
    bodySmall: {
      textAlign: 'center',
      lineHeight: ms(DESIGN.fontSize.xl),
    },
    pixCard: {
      width: '100%',
      borderRadius: ms(DESIGN.borderRadius.xl),
      padding: ms(DESIGN.spacing.lg),
      borderWidth: 1,
    },
    pixHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: ms(DESIGN.spacing.lg),
    },
    pixIconCircle: {
      width: ms(DESIGN.icon.lg),
      height: ms(DESIGN.icon.lg),
      borderRadius: ms(DESIGN.borderRadius.lg),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: ms(DESIGN.spacing.sm),
    },
    pixLabel: {
      letterSpacing: 0.5,
    },
    pixKeyContainer: {
      padding: ms(DESIGN.spacing.lg),
      borderRadius: ms(DESIGN.borderRadius.md),
      marginBottom: ms(DESIGN.spacing.lg),
      alignItems: 'center',
      borderWidth: 1,
    },
    pixKey: {
      textAlign: 'center',
    },
    copyBtn: {
      flexDirection: 'row',
      height: ms(DESIGN.button.height.lg),
      borderRadius: ms(DESIGN.borderRadius.md),
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(DESIGN.spacing.sm),
    },
    thanks: {
      textAlign: 'center',
      marginTop: ms(DESIGN.spacing.sm),
    },
  }), [ms, colors, DESIGN]);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!visible) return null;

  return (
    <BiblePageModal visible={visible} onClose={onClose}
      header={
        <View style={styles.header}>
          <BibleIcon
            name="gift"
            color={colors.primary}
            backgroundColor={colors.primary + '20'}
            style={styles.headerIconWrap}
          />
          <BibleText style={[styles.headerTitle, { fontSize: ms(DESIGN.fontSize.lg), color: colors.primary }]}>Apoie este Projeto</BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + '20'}
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      }>
      <View style={[styles.bodyContent, { gap: ms(DESIGN.spacing.lg) }]}>
        <View style={{ gap: ms(DESIGN.spacing.xs) }}>
          <BibleText style={[styles.body, { color: colors.onSurface, fontSize: ms(DESIGN.fontSize.lg), fontWeight: '600' }]}>
            Este aplicativo é gratuito e feito com muito cuidado para levar a Palavra de Deus às suas mãos.
          </BibleText>

          <BibleText style={[styles.bodySmall, { color: colors.textMuted, fontSize: ms(DESIGN.fontSize.md) }]}>
            Cada contribuição ajuda a manter os servidores e a adicionar novas funcionalidades. 🙏
          </BibleText>
        </View>

        <View style={[styles.pixCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <View style={styles.pixHeader}>
            <View style={[styles.pixIconCircle, { backgroundColor: colors.primary }]}>
              <BibleText style={{ color: colors.onPrimary, fontWeight: '900', fontSize: ms(DESIGN.fontSize.xs) }}>PIX</BibleText>
            </View>
            <BibleText style={[styles.pixLabel, { color: colors.onSurface, fontSize: ms(DESIGN.fontSize.md), fontWeight: '700' }]}>
              CHAVE (E-MAIL)
            </BibleText>
          </View>

          <View style={[styles.pixKeyContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
            <BibleText style={[styles.pixKey, { color: colors.onSurface, fontSize: ms(DESIGN.fontSize.lg), fontWeight: '600' }]} selectable>
              {PIX_KEY}
            </BibleText>
          </View>

          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: copied ? '#4CAF50' : colors.primary }]}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <BibleIcon name={copied ? 'check' : 'copy'} size={ms(DESIGN.spacing.lg)} color={colors.onPrimary} />
            <BibleText style={{ fontSize: ms(DESIGN.fontSize.lg), color: colors.onPrimary, fontWeight: '700' }}>
              {copied ? 'Chave Copiada!' : 'Copiar Chave Pix'}
            </BibleText>
          </TouchableOpacity>
        </View>

        <BibleText style={[styles.thanks, { color: colors.primary, fontSize: ms(DESIGN.fontSize.md), fontWeight: '600' }]}>
          Que Deus abençoe você em dobro!
        </BibleText>
      </View>
    </BiblePageModal>
  );
}
