import { COLOR_THEMES, ColorThemeKey } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BibleConfirmModal } from '../../components/BibleConfirmModal';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleSwitch } from '../../components/BibleSwitch';
import { BibleText } from '../../components/BibleText';
import { DonateModal } from '../../components/DonateModal';
import { SettingsItem } from '../../components/SettingsItem';
import { ThemedIcon } from '../../components/ThemedIcon';
import { ROUTES, ROUTE_LABELS } from '../../constants/routes';
import { STORAGE_KEYS } from '../../constants/storage';
import { useReaderSettings } from '../../hooks/use-reader-settings';
import { useResponsive } from '../../hooks/use-responsive';
import { useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';
import { impactLight, selectionHaptic } from '../../utils/haptics';

const COLOR_THEME_OPTIONS = Object.entries(COLOR_THEMES).map(([key, value]) => ({
  key,
  ...value
}));

export default function ConfigurationScreen() {
  const { ms } = useResponsive();
  const { isDarkMode, toggleDarkMode, colors, colorTheme, setColorTheme, hapticsEnabled, toggleHaptics } = useTheme();
  const { setReaderTheme, readerTheme } = useReaderSettings();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { studies, importBulk } = useStudies();
  const router = useRouter();
  const [autoBackup, setAutoBackup] = useState(false);
  const [donateVisible, setDonateVisible] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; isDanger?: boolean } | null>(null);
  const [clearCacheConfirmVisible, setClearCacheConfirmVisible] = useState(false);

  const handleClearCache = async () => {
    try {
      const keysToKeep = [STORAGE_KEYS.AUTO_BACKUP, STORAGE_KEYS.AUTO_BACKUP_FILE_URI];
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(k => !keysToKeep.includes(k as any));
      await AsyncStorage.multiRemove(keysToRemove);
      setClearCacheConfirmVisible(false);
      setAlertInfo({ title: 'Limpar Histórico', message: 'Histórico limpo com sucesso.' });
    } catch (e) {
      console.error('Failed to clear cache', e);
      setAlertInfo({ title: 'Erro', message: 'Não foi possível limpar o histórico.', isDanger: true });
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP).then(val => {
      setAutoBackup(val === 'true');
    });
  }, []);

  const handleToggleAutoBackup = async (val: boolean) => {
    if (!val) {
      setAutoBackup(false);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, 'false');
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const permissions = await (FileSystem as any).StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileName = `backup_estudos_automatico`;
          const fileUri = await (FileSystem as any).StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/json');

          await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_FILE_URI, fileUri);
          await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, 'true');
          setAutoBackup(true);

          if (studies.length > 0) {
            try {
              await (FileSystem as any).writeAsStringAsync(fileUri, JSON.stringify(studies, null, 2));
            } catch (e) { }
          }
          setAlertInfo({ title: 'Sucesso', message: 'Backup automático configurado para a pasta escolhida!' });
        } else {
          setAutoBackup(false);
          await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, 'false');
        }
      } catch (e) {
        setAutoBackup(false);
        await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, 'false');
        setAlertInfo({ title: 'Erro', message: 'Não foi possível configurar a pasta de backup.', isDanger: true });
      }
    } else {
      setAutoBackup(true);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, 'true');
      if (Platform.OS !== 'web' && studies.length > 0) {
        try {
          const path = `${(FileSystem as any).documentDirectory}backup_estudos_automatico.json`;
          await (FileSystem as any).writeAsStringAsync(path, JSON.stringify(studies, null, 2));
        } catch (e) { }
      }
    }
  };

  const handleManualBackup = async () => {
    try {
      if (studies.length === 0) {
        setAlertInfo({ title: 'Aviso', message: 'Não há estudos para exportar.' });
        return;
      }
      const json = JSON.stringify(studies, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `backup_estudos_biblia_${new Date().getTime()}.json`; a.click();
      } else if (Platform.OS === 'android') {
        const permissions = await (FileSystem as any).StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileName = `backup_estudos_${new Date().getTime()}`;
          const fileUri = await (FileSystem as any).StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/json');
          await (FileSystem as any).writeAsStringAsync(fileUri, json);
          setAlertInfo({ title: 'Sucesso', message: 'Backup exportado e salvo na pasta escolhida com sucesso!' });
        }
      } else {
        const path = `${(FileSystem as any).documentDirectory}backup_estudos_${new Date().getTime()}.json`;
        await (FileSystem as any).writeAsStringAsync(path, json);
        await Sharing.shareAsync(path, { mimeType: 'application/json' });
      }
    } catch (err) {
      setAlertInfo({ title: 'Erro', message: 'Não foi possível criar o arquivo de backup.', isDanger: true });
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      let raw = '';
      if (Platform.OS === 'web' && (result.assets[0] as any).file) {
        raw = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText((result.assets[0] as any).file);
        });
      } else if (Platform.OS === 'web') {
        raw = await fetch(result.assets[0].uri).then(r => r.text());
      } else {
        raw = await (FileSystem as any).readAsStringAsync(result.assets[0].uri);
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setAlertInfo({ title: 'Erro', message: 'Formato de arquivo inválido. É esperado um backup de múltiplos estudos (Array). Se você está tentando importar um único estudo antigo, crie um novo e cole os dados.', isDanger: true });
        return;
      }

      const importedCount = importBulk(parsed);
      setAlertInfo({
        title: 'Restauração Concluída',
        message: `${importedCount} estudo(s) restaurado(s) com sucesso.\n\n(${parsed.length - importedCount} ignorados pois já existem no app.)`
      });
    } catch (err) {
      console.log('Import err', err);
      setAlertInfo({ title: 'Erro', message: 'Não foi possível tratar o arquivo de restauração.', isDanger: true });
    }
  };

  const handleToggle = () => {
    impactLight();
    const nextDark = !isDarkMode;
    toggleDarkMode(nextDark);
    setReaderTheme(nextDark ? 'dark' : 'light');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BibleHeader title={ROUTE_LABELS[ROUTES.CONFIGURATION]} onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BibleText style={{ marginLeft: 8, marginBottom: 8, fontSize: ms(14), fontWeight: '700', color: colors.textMuted }}>APARÊNCIA</BibleText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <SettingsItem
            label="Modo Escuro"
            description="Ative o tema noturno no app"
            icon={isDarkMode ? 'moon' : 'sun'}
            onPress={handleToggle}
            rightElement={
              <BibleSwitch
                value={isDarkMode}
                onValueChange={handleToggle}
              />
            }
          />

          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />

          <SettingsItem
            label="Vibração"
            description="Feedback tátil ao tocar nos itens"
            icon="smartphone"
            onPress={() => toggleHaptics()}
            rightElement={
              <BibleSwitch
                value={hapticsEnabled}
                onValueChange={toggleHaptics}
              />
            }
          />

          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />

          <View style={[styles.cardHeader, { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemedIcon name="droplet" />
              <View style={styles.cardTextContainer}>
                <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.onBackground }]}>
                  Cor do Aplicativo
                </BibleText>
                <BibleText style={[styles.cardDesc, { fontSize: ms(13), color: colors.textMuted }]}>
                  Escolha a paleta de cores do app
                </BibleText>
              </View>
            </View>

            <View style={styles.swatchGrid}>
              {COLOR_THEME_OPTIONS.map((theme) => {
                const isActive = colorTheme === theme.key;
                const swatchColor = theme.swatch;
                return (
                  <TouchableOpacity
                    key={theme.key}
                    activeOpacity={0.8}
                    onPress={() => {
                      selectionHaptic();
                      setColorTheme(theme.key as ColorThemeKey);
                    }}
                    style={[
                      styles.swatchItem,
                      {
                        borderColor: isActive ? swatchColor : colors.border,
                        backgroundColor: isActive ? swatchColor + '15' : colors.surfaceHighlight
                      },
                      isActive && { borderWidth: 2, borderColor: swatchColor },
                    ]}
                  >
                    <View style={[styles.swatchDot, { backgroundColor: swatchColor }]}>
                      {isActive && (
                        <Feather name="check" size={ms(14)} color={colors.onPrimary} />
                      )}
                    </View>
                    <BibleText style={[
                      styles.swatchLabel,
                      { fontSize: ms(11), color: isActive ? swatchColor : colors.textMuted },
                      isActive && { fontWeight: '800' },
                    ]}>
                      {theme.label}
                    </BibleText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <BibleText style={{ marginTop: 24, marginLeft: 8, marginBottom: 8, fontSize: ms(14), fontWeight: '700', color: colors.textMuted }}>GERENCIAMENTO</BibleText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <SettingsItem
            label="Lixeira de Estudos"
            description="Gerencie estudos excluídos ou restaure-os"
            icon="trash-2"
            onPress={() => router.push(ROUTES.TRASH as any)}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
          <SettingsItem
            label="Limpar Histórico"
            description="Remove posição salva"
            icon="trash"
            onPress={() => setClearCacheConfirmVisible(true)}
          />
        </View>

        <BibleText style={{ marginTop: 24, marginLeft: 8, marginBottom: 8, fontSize: ms(14), fontWeight: '700', color: colors.textMuted }}>BACKUP E RESTAURAÇÃO</BibleText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <SettingsItem
            label="Backup Automático"
            description="Salvar estudos na pasta do App"
            icon="save"
            onPress={() => handleToggleAutoBackup(!autoBackup)}
            rightElement={
              <BibleSwitch
                value={autoBackup}
                onValueChange={handleToggleAutoBackup}
              />
            }
          />

          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />

          <SettingsItem
            label="Exportar Backup"
            description="Salvar ou compartilhar o arquivo de backup"
            icon="download"
            onPress={handleManualBackup}
          />

          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />

          <SettingsItem
            label="Restaurar do Backup"
            description="Importar arquivo de backup com todos os seus estudos"
            icon="upload"
            onPress={handleImport}
          />
        </View>
      </ScrollView>

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="configuration"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
        onOpenDonate={() => { setDrawerVisible(false); setTimeout(() => setDonateVisible(true), 250); }}
      />

      <BibleConfirmModal
        visible={clearCacheConfirmVisible}
        title="Limpar Histórico"
        message="Tem certeza? Isso removerá sua posição de leitura salva."
        confirmText="Limpar"
        isDanger
        onConfirm={handleClearCache}
        onCancel={() => setClearCacheConfirmVisible(false)}
      />

      <BibleConfirmModal
        visible={!!alertInfo}
        title={alertInfo?.title || ''}
        message={alertInfo?.message || ''}
        confirmText="OK"
        isDanger={alertInfo?.isDanger}
        onConfirm={() => setAlertInfo(null)}
      />

      <DonateModal visible={donateVisible} onClose={() => setDonateVisible(false)} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
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

  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    rowGap: 10,
    width: '100%',
  },
  swatchItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    width: '31.5%',
    minHeight: 80,
  },
  swatchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
