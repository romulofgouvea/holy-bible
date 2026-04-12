import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BibleConfirmModal } from '../../components/BibleConfirmModal';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleText } from '../../components/BibleText';
import { STORAGE_KEYS } from '../../constants/storage';
import { useReaderSettings } from '../../hooks/use-reader-settings';
import { useResponsive } from '../../hooks/use-responsive';
import { useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';

export default function ConfigurationScreen() {
  const { ms } = useResponsive();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { setReaderTheme, readerTheme } = useReaderSettings();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { studies, importBulk } = useStudies();
  const router = useRouter();
  const [autoBackup, setAutoBackup] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; isDanger?: boolean } | null>(null);

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
          const fileName = `backup_estudos_automatico`; // .json added automatically or explicitly handled by OS based on MIME
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
    const nextDark = !isDarkMode;
    toggleDarkMode(nextDark);
    setReaderTheme(nextDark ? 'dark' : 'light');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BibleHeader title="Configurações" onMenuPress={() => setDrawerVisible(true)} />

      <View style={styles.content}>
        <BibleText style={{ marginLeft: 8, marginBottom: 8, fontSize: ms(14), fontWeight: '700', color: colors.textMuted }}>APARÊNCIA</BibleText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.8} onPress={handleToggle}>
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
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primaryContainer }}
              thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>

        <BibleText style={{ marginTop: 24, marginLeft: 8, marginBottom: 8, fontSize: ms(14), fontWeight: '700', color: colors.textMuted }}>GERENCIAMENTO</BibleText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.8} onPress={() => router.push('/configuration/trash' as any)}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Feather name="trash-2" size={ms(20)} color={colors.primary} />
            </View>
            <View style={styles.cardTextContainer}>
              <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.text }]}>
                Lixeira de Estudos
              </BibleText>
              <BibleText style={[styles.cardDesc, { fontSize: ms(13), color: colors.textMuted }]}>
                Gerencie estudos excluídos ou restaure-os
              </BibleText>
            </View>
          </TouchableOpacity>
        </View>

        <BibleText style={{ marginTop: 24, marginLeft: 8, marginBottom: 8, fontSize: ms(14), fontWeight: '700', color: colors.textMuted }}>BACKUP E RESTAURAÇÃO</BibleText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.8} onPress={() => handleToggleAutoBackup(!autoBackup)}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Feather name="save" size={ms(20)} color={colors.primary} />
            </View>
            <View style={styles.cardTextContainer}>
              <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.text }]}>
                Backup Automático
              </BibleText>
              <BibleText style={[styles.cardDesc, { fontSize: ms(13), color: colors.textMuted }]}>
                Salvar estudos na pasta do App
              </BibleText>
            </View>
            <Switch
              style={{ marginLeft: 8 }}
              value={autoBackup}
              onValueChange={handleToggleAutoBackup}
              trackColor={{ false: colors.border, true: colors.primaryContainer }}
              thumbColor={autoBackup ? colors.primary : '#f4f3f4'}
            />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />

          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.8} onPress={handleManualBackup}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Feather name="download" size={ms(20)} color={colors.primary} />
            </View>
            <View style={styles.cardTextContainer}>
              <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.text }]}>
                Exportar Backup
              </BibleText>
              <BibleText style={[styles.cardDesc, { fontSize: ms(13), color: colors.textMuted }]}>
                Salvar ou compartilhar o arquivo de backup
              </BibleText>
            </View>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />

          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.8} onPress={handleImport}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Feather name="upload" size={ms(20)} color={colors.primary} />
            </View>
            <View style={styles.cardTextContainer}>
              <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.text }]}>
                Restaurar do Backup
              </BibleText>
              <BibleText style={[styles.cardDesc, { fontSize: ms(13), color: colors.textMuted }]}>
                Importar arquivo de backup com todos os seus estudos
              </BibleText>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="configuration"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
      />

      <BibleConfirmModal
        visible={!!alertInfo}
        title={alertInfo?.title || ''}
        message={alertInfo?.message || ''}
        confirmText="OK"
        isDanger={alertInfo?.isDanger}
        onConfirm={() => setAlertInfo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 38,
    height: 38,
    borderRadius: 10,
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
