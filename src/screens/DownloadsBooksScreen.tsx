import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, usePathname } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { BibleDivider } from "../components/BibleDivider";
import { BibleHeader } from "../components/BibleHeader";
import { BibleIcon } from "../components/BibleIcon";
import { BibleSkeleton } from "../components/BibleSkeleton";
import { BibleText } from "../components/BibleText";
import { BibleConfirmModal } from "../components/modals/BibleConfirmModal";
import { SettingsItem } from "../components/SettingsItem";
import { ALIASES } from "../data/bible-version";
import { useDownloads } from "../hooks/useDownloads";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { BookDownloadSummary } from "../models";
import { handleSmartBack } from "../utils/navigation";

function formatSize(bytes: number): string {
  if (bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function DownloadsBooksScreen() {
  const { ms, DESIGN } = useResponsive();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { version } = useLocalSearchParams<{ version: string }>();
  const selectedVersion = (version || "").toUpperCase();
  const isWeb = Platform.OS === "web";

  const [deleteTarget, setDeleteTarget] = useState<
    { type: "book"; abbrev: string; name: string } | { type: "version" } | null
  >(null);

  const {
    isLoaded,
    summaries,
    totalSizeBytes,
    downloadingBook,
    bookProgress,
    queuedAbbrevs,
    queueCount,
    isBusy,
    failedAbbrevs,
    failedBookCount,
    failedChapterCount,
    enqueueBook,
    downloadAllBooks,
    retryFailedBooks,
    cancelAll,
    deleteBook,
    deleteVersion,
  } = useDownloads(selectedVersion);

  const versionInfo = useMemo(
    () => ALIASES.find((v) => v.sigla === selectedVersion),
    [selectedVersion],
  );

  const totals = useMemo(() => {
    let downloadedChapters = 0;
    let totalChapters = 0;
    for (const s of summaries) {
      downloadedChapters += s.downloadedChapters;
      totalChapters += s.totalChapters;
    }
    return { downloadedChapters, totalChapters };
  }, [summaries]);

  const isFullyDownloaded =
    summaries.length > 0 && totals.downloadedChapters === totals.totalChapters;

  const downloadingBookName = useMemo(
    () => summaries.find((s) => s.abbrev === downloadingBook)?.name ?? "",
    [summaries, downloadingBook],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        card: {
          borderRadius: ms(DESIGN.borderRadius.lg),
          borderWidth: 1,
          overflow: "hidden",
          elevation: 1,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: ms(DESIGN.spacing.sm),
          marginHorizontal: ms(DESIGN.spacing.lg),
          marginBottom: ms(DESIGN.spacing.md),
          marginTop: -ms(DESIGN.spacing.xs),
          paddingVertical: ms(DESIGN.spacing.sm),
          paddingHorizontal: ms(DESIGN.spacing.md),
          borderRadius: ms(DESIGN.borderRadius.md),
          borderLeftWidth: ms(3),
        },
        sectionLabel: {
          marginTop: ms(DESIGN.spacing.xl),
          marginLeft: ms(DESIGN.spacing.sm),
          marginBottom: ms(DESIGN.spacing.sm),
          fontSize: ms(DESIGN.fontSize.md),
          fontWeight: "700",
        },
        bookCard: {
          flexDirection: "row",
          alignItems: "center",
          gap: ms(DESIGN.spacing.md),
          paddingHorizontal: ms(DESIGN.spacing.lg),
          paddingVertical: ms(DESIGN.spacing.md),
          marginBottom: ms(DESIGN.spacing.sm),
          borderRadius: ms(DESIGN.borderRadius.lg),
          borderWidth: 1,
        },
        bookText: { flex: 1, gap: ms(DESIGN.spacing.tiny) },
        bookTitle: { fontWeight: "700" },
      }),
    [ms, DESIGN],
  );

  const dividerStyle = {
    marginLeft: ms(DESIGN.layout.settingsIconOffset),
  };

  const listHeader = (
    <View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <SettingsItem
          icon="hard-drive"
          label="Armazenamento"
          description={
            totals.totalChapters > 0
              ? `${totals.downloadedChapters} de ${totals.totalChapters} capítulos baixados`
              : "Nenhum áudio baixado"
          }
          rightElement={
            <BibleText
              style={{
                fontSize: ms(DESIGN.fontSize.md),
                fontWeight: "700",
                color: colors.textMuted,
              }}
            >
              {formatSize(totalSizeBytes)}
            </BibleText>
          }
        />

        {!isWeb && !isFullyDownloaded && (
          <>
            <BibleDivider style={dividerStyle} />
            <SettingsItem
              icon="download-cloud"
              label="Baixar todos os livros"
              description="Adiciona os livros restantes à fila de download"
              onPress={() => downloadAllBooks()}
            />
          </>
        )}

        {!isWeb && isBusy && (
          <>
            <BibleDivider style={dividerStyle} />
            <SettingsItem
              icon="x"
              label="Cancelar downloads"
              description="Interrompe a fila de download atual"
              isDanger
              onPress={() => cancelAll()}
            />
          </>
        )}

        {!isWeb && totalSizeBytes > 0 && (
          <>
            <BibleDivider style={dividerStyle} />
            <SettingsItem
              icon="trash-2"
              label="Excluir todos os áudios"
              description="Remove os áudios baixados desta versão"
              isDanger
              onPress={() => setDeleteTarget({ type: "version" })}
            />
          </>
        )}
      </View>

      {isWeb && (
        <BibleText
          style={{
            marginTop: ms(DESIGN.spacing.md),
            marginHorizontal: ms(DESIGN.spacing.sm),
            fontSize: ms(DESIGN.fontSize.sm),
            color: colors.textMuted,
          }}
        >
          Downloads para uso offline não estão disponíveis na versão web. Use o
          app instalado no celular.
        </BibleText>
      )}

      {!isWeb && isBusy && (
        <View
          style={[
            styles.statusRow,
            {
              marginTop: ms(DESIGN.spacing.md),
              backgroundColor: colors.primary + "12",
              borderLeftColor: colors.primary,
            },
          ]}
        >
          <ActivityIndicator color={colors.primary} size="small" />
          <BibleText
            style={{
              flex: 1,
              fontSize: ms(DESIGN.fontSize.md),
              fontWeight: "600",
              color: colors.onSurface,
            }}
            numberOfLines={2}
          >
            {downloadingBook
              ? `Baixando ${downloadingBookName || downloadingBook} • ${bookProgress.completed}/${bookProgress.total} capítulos`
              : "Preparando download..."}
            {queueCount > 0
              ? `\n${queueCount} ${queueCount === 1 ? "livro" : "livros"} na fila`
              : ""}
          </BibleText>
        </View>
      )}

      {!isWeb && !isBusy && failedBookCount > 0 && (
        <Pressable
          onPress={() => retryFailedBooks()}
          style={[
            styles.statusRow,
            {
              marginTop: ms(DESIGN.spacing.md),
              backgroundColor: colors.error + "12",
              borderLeftColor: colors.error,
            },
          ]}
        >
          <BibleIcon
            name="alert-triangle"
            color={colors.error}
            containerSize={ms(DESIGN.icon.md)}
          />
          <BibleText
            style={{
              flex: 1,
              fontSize: ms(DESIGN.fontSize.md),
              fontWeight: "600",
              color: colors.onSurface,
            }}
            numberOfLines={2}
          >
            {`Falha ao baixar ${failedChapterCount} ${
              failedChapterCount === 1 ? "capítulo" : "capítulos"
            } em ${failedBookCount} ${
              failedBookCount === 1 ? "livro" : "livros"
            }.\nToque para tentar novamente`}
          </BibleText>
        </Pressable>
      )}

      <BibleText style={[styles.sectionLabel, { color: colors.textMuted }]}>
        LIVROS
      </BibleText>
    </View>
  );

  const renderBook = ({ item }: { item: BookDownloadSummary }) => {
    const isComplete =
      item.totalChapters > 0 && item.downloadedChapters === item.totalChapters;
    const isDownloadingThis = downloadingBook === item.abbrev;
    const isQueued = queuedAbbrevs.has(item.abbrev);
    const isPending = isDownloadingThis || isQueued;
    const isFailed =
      !isComplete && !isPending && failedAbbrevs.has(item.abbrev);

    return (
      <View
        style={[
          styles.bookCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.bookText}>
          <BibleText
            style={[
              styles.bookTitle,
              { fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </BibleText>
          <BibleText
            style={{
              fontSize: ms(DESIGN.fontSize.sm),
              color: isComplete
                ? colors.success
                : isFailed
                  ? colors.error
                  : colors.textMuted,
            }}
          >
            {isDownloadingThis
              ? `Baixando ${bookProgress.completed}/${bookProgress.total}...`
              : isQueued
                ? "Na fila..."
                : isComplete
                  ? "Baixado"
                  : isFailed
                    ? `Falha • ${item.downloadedChapters}/${item.totalChapters} capítulos`
                    : `${item.downloadedChapters}/${item.totalChapters} capítulos`}
          </BibleText>
        </View>

        {isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : isComplete ? (
          <BibleIcon
            name="check-circle"
            color={colors.success}
            backgroundColor={colors.success + "15"}
            containerSize={ms(DESIGN.icon.lg)}
            borderRadius={ms(DESIGN.borderRadius.md)}
            onPress={() =>
              setDeleteTarget({
                type: "book",
                abbrev: item.abbrev,
                name: item.name,
              })
            }
          />
        ) : (
          <BibleIcon
            name={isFailed ? "refresh-cw" : "download"}
            color={isFailed ? colors.error : colors.primary}
            backgroundColor={(isFailed ? colors.error : colors.primary) + "15"}
            containerSize={ms(DESIGN.icon.lg)}
            borderRadius={ms(DESIGN.borderRadius.md)}
            onPress={isWeb ? undefined : () => enqueueBook(item.abbrev)}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BibleHeader
        title={versionInfo?.name ?? selectedVersion}
        showMenu={false}
        showBack={true}
        onBack={() => handleSmartBack(pathname)}
      />

      {!isLoaded ? (
        <BibleSkeleton />
      ) : (
        <FlashList
          data={summaries}
          keyExtractor={(item) => item.abbrev}
          ListHeaderComponent={listHeader}
          // @ts-ignore
          estimatedItemSize={ms(DESIGN.layout.settingsIconOffset)}
          renderItem={renderBook}
          contentContainerStyle={{
            padding: ms(DESIGN.spacing.lg),
            paddingBottom: ms(DESIGN.layout.listPaddingBottom),
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BibleConfirmModal
        visible={!!deleteTarget}
        title="Excluir Áudios"
        message={
          deleteTarget?.type === "book"
            ? `Deseja excluir os áudios baixados de ${deleteTarget.name}?`
            : isBusy
              ? `Há downloads em andamento para ${versionInfo?.name ?? selectedVersion}. Deseja parar a fila e excluir todos os áudios baixados?`
              : `Deseja excluir todos os áudios baixados de ${versionInfo?.name ?? selectedVersion}?`
        }
        confirmText="Excluir"
        isDanger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.type === "book") {
            deleteBook(deleteTarget.abbrev);
          } else if (deleteTarget?.type === "version") {
            cancelAll();
            deleteVersion();
          }
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}
