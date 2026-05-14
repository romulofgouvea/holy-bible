import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { STORAGE_KEYS } from '../../constants/storage';
import { ALIASES, BibleVersionInfo } from '../../data';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleCountPill } from '../BibleCountPill';
import { BibleDivider } from '../BibleDivider';
import { BibleGridBlock } from '../BibleGridBlock';
import { BibleIcon } from '../BibleIcon';
import { BibleListCard } from '../BibleListCard';
import { BibleText } from '../BibleText';

type BibleVersionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (version: BibleVersionInfo) => void;
  currentVersionSigla?: string;
};

export function BibleVersionModal({ visible, onClose, onSelect, currentVersionSigla }: BibleVersionModalProps) {
  const { ms, height, width } = useResponsive();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const scrollViewRef = React.useRef<ScrollView>(null);
  const hasScrolledRef = React.useRef(false);

  React.useEffect(() => {
    if (visible) {
      hasScrolledRef.current = false;
      setSearchQuery('');
      AsyncStorage.getItem(STORAGE_KEYS.VIEW_MODE_VERSION).then(val => {
        if (val === 'list' || val === 'grid') setViewMode(val);
      }).catch(() => { });
    }
  }, [visible]);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    AsyncStorage.setItem(STORAGE_KEYS.VIEW_MODE_VERSION, mode).catch(() => { });
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredVersions = useMemo(() => {
    const query = normalize(searchQuery.trim());
    if (!query) return ALIASES;
    return ALIASES.filter((item) => normalize(item.name).includes(query) || normalize(item.sigla).includes(query));
  }, [searchQuery]);

  const handleSelect = (item: BibleVersionInfo) => {
    onSelect(item);
    setSearchQuery('');
  };

  if (!visible) return null;

  return (
    <View style={styles.container} testID="bible-version-modal">
      <View style={styles.header} testID="bible-version-header">
        <BibleIcon
          name="book-open"
          color={colors.primary}
          backgroundColor={colors.primary + '20'}
          style={{ marginRight: 8 }}
        />
        <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]}>Versões</BibleText>
        <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={[styles.iconBtn, styles.headerActionSpacing, { backgroundColor: colors.surfaceHighlight }]}>
          <BibleIcon name="search" size={ms(16)} color={isSearchVisible ? colors.primary : colors.onSurface} />
        </TouchableOpacity>
        <View style={[styles.viewToggles, { backgroundColor: colors.surfaceHighlight }]}>
          <TouchableOpacity onPress={() => handleSetViewMode('grid')} style={[styles.toggleBtn, viewMode === 'grid' && { backgroundColor: colors.surface }]}>
            <BibleIcon name="grid" size={ms(16)} color={viewMode === 'grid' ? colors.primary : colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSetViewMode('list')} style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.surface }]}>
            <BibleIcon name="list" size={ms(16)} color={viewMode === 'list' ? colors.primary : colors.onSurface} />
          </TouchableOpacity>
        </View>
        <BibleIcon
          name="x"
          color={colors.error}
          backgroundColor={colors.error + '20'}
          onPress={onClose}
          style={styles.headerActionSpacing}
        />
      </View>

      {isSearchVisible && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]} testID="bible-version-search-container">
          <BibleIcon name="search" size={ms(16)} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { fontSize: ms(14), color: colors.onSurface }]}
            placeholder="Pesquisar versão..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
          />
        </View>
      )}

      <BibleDivider margin={8} />

      <ScrollView testID="bible-version-list" ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} bounces={true} overScrollMode="always" keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {viewMode === 'list' ? (
          filteredVersions.map((item) => {
            const isSelected = item.sigla === currentVersionSigla;
            return (
              <View
                key={item.sigla}
                onLayout={isSelected ? (e) => {
                  if (!hasScrolledRef.current && visible && !searchQuery) {
                    hasScrolledRef.current = true;
                    const y = Math.max(0, e.nativeEvent.layout.y - 18);
                    scrollViewRef.current?.scrollTo({ y, animated: false });
                  }
                } : undefined}
              >
                <BibleListCard
                  title={item.name}
                  pillText={item.sigla}
                  isSelected={isSelected}
                  onPress={() => handleSelect(item)}
                />
              </View>
            );
          })
        ) : (
          <View style={styles.gridContainer}>
            {filteredVersions.map((item) => {
              const availableWidth = width - 32;
              const numCols = Math.max(4, Math.floor(availableWidth / ms(72)));
              const itemWidth = ((availableWidth - (numCols - 1) * 8) / numCols) - 0.01;
              const isSelected = item.sigla === currentVersionSigla;
              return (
                <View
                  key={item.sigla}
                  onLayout={isSelected ? (e) => {
                    if (!hasScrolledRef.current && visible && !searchQuery) {
                      hasScrolledRef.current = true;
                      const y = Math.max(0, e.nativeEvent.layout.y - 18);
                      scrollViewRef.current?.scrollTo({ y, animated: false });
                    }
                  } : undefined}
                >
                  <BibleGridBlock
                    title={item.sigla}
                    exactWidth={itemWidth}
                    isSelected={isSelected}
                    onPress={() => handleSelect(item)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BibleDivider margin={8} />

      <BibleCountPill
        count={filteredVersions.length}
        label="versão"
        labelPlural="versões"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionSpacing: {
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...({ outlineStyle: 'none' } as any),
  },
  list: { flexGrow: 1, gap: 8 },
  viewToggles: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, padding: 3, gap: 2, marginLeft: 8, height: 32 },
  toggleBtn: { width: 26, height: 26, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
});
