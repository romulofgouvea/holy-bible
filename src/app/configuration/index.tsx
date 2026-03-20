import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleText } from '../../components/BibleText';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';

export default function ConfigurationScreen() {
  const { ms } = useResponsive();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BibleText style={[styles.headerTitle, { fontSize: ms(15), color: colors.onPrimary }]}>
          Configurações
        </BibleText>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
          <Feather name="menu" size={ms(22)} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.8} onPress={() => toggleDarkMode()}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Feather name={isDarkMode ? 'moon' : 'sun'} size={ms(20)} color={colors.primary} />
            </View>
            <View style={styles.cardTextContainer}>
              <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.text }]}>
                Modo Escuro
              </BibleText>
              <BibleText style={[styles.cardDesc, { fontSize: ms(13), color: colors.textMuted }]}>
                Ative o tema noturno no app
              </BibleText>
            </View>
            <Switch
              style={{ marginLeft: 8 }}
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primaryContainer }}
              thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="configuration"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 4,
  },
  headerTitle: {
    fontWeight: '700',
    marginHorizontal: 8,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardDesc: {
    lineHeight: 18,
  },
});
