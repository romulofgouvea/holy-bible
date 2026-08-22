import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, usePathname } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BibleDivider } from "../components/BibleDivider";
import { BibleHeader } from "../components/BibleHeader";
import { BibleIcon } from "../components/BibleIcon";
import { BibleSkeleton } from "../components/BibleSkeleton";
import { BibleText } from "../components/BibleText";
import { BibleConfirmModal } from "../components/modals/BibleConfirmModal";
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
    isBulkDownloading,
    bulkBookProgress,
    isOtherVersionDownloading,
    downloadBook,
    downloadAllBooks,
    cancelDownload,
    deleteBook,
    deleteVersion,
  } = useDownloads(selectedVersion);

  const versionInfo = useMemo(
    () => ALIASES.find((v) => v.sigla === selectedVersion),
    [selectedVersion],
  );

  const isFullyDownloaded = useMemo(
    () =>
      summaries.length > 0 &&
      summaries.every((s) => s.downloadedChapters === s.totalChapters),
    [summaries],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        summaryBar: {
          marginHorizontal: ms(DESIGN.spacing.lg),
          marginTop: ms(DESIGN.spacing.md),
          marginBottom: ms(DESIGN.spacing.md),
          padding: ms(DESIGN.spacing.lg),
          borderRadius: ms(DESIGN.borderRadius.lg),
          borderWidth: 1,
          gap: ms(DESIGN.spacing.sm),
        },
        summaryRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        actionsRow: {
          flexDirection: "row",
          gap: ms(DESIGN.spacing.sm),
        },
        actionBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: ms(DESIGN.spacing.xs),
          paddingVertical: ms(DESIGN.spacing.sm),
          borderRadius: ms(DESIGN.borderRadius.md),
          borderWidth: 1,
        },
        listContent: {
          paddingHorizontal: ms(DESIGN.spacing.lg),
          paddingBottom: ms(DESIGN.layout.listPaddingBottom),
        },
        card: {
          marginBottom: ms(DESIGN.spacing.sm),
          borderRadius: ms(DESIGN.borderRadius.lg),
          overflow: "hidden",
          borderWidth: 1,
        },
        cardContent: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: ms(DESIGN.spacing.md),
          paddingVertical: ms(DESIGN.spacing.md),
          gap: ms(DESIGN.spacing.md),
        },
        cardText: { flex: 1, gap: ms(DESIGN.spacing.tiny) },
        cardTitle: { fontWeight: "700" },
      }),
    [ms, DESIGN],
  );

  const renderBook = ({ item }: { item: BookDownloadSummary }) => {
    const isComplete =
      item.totalChapters > 0 && item.downloadedChapters === item.totalChapters;
    const isDownloadingThis = downloadingBook === item.abbrev;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardContent}>
          <BibleIcon
            name={isComplete ? "check-circle" : "book-open"}
            color={isComplete ? colors.success : colors.primary}
            backgroundColor={
              (isComplete ? colors.success : colors.primary) + "15"
            }
            containerSize={ms(DESIGN.icon.xl)}
            borderRadius={ms(DESIGN.borderRadius.md)}
          />
          <View style={styles.cardText}>
            <BibleText
              style={[
                styles.cardTitle,
                { fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </BibleText>
            <BibleText
              style={{
                fontSize: ms(DESIGN.fontSize.sm),
                color: colors.textMuted,
              }}
            >
              {isDownloadingThis
                ? `Baixando ${bookProgress.completed}/${bookProgress.total}...`
                : `${item.downloadedChapters}/${item.totalChapters} capítulos`}
            </BibleText>
          </View>

          {isDownloadingThis ? (
            <ActivityIndicator color={colors.primary} />
          ) : isComplete ? (
            <BibleIcon
              name="trash-2"
              color={colors.error}
              backgroundColor={colors.error + "15"}
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
              name="download"
              color={colors.primary}
              backgroundColor={colors.primary + "15"}
              containerSize={ms(DESIGN.icon.lg)}
              borderRadius={ms(DESIGN.borderRadius.md)}
              onPress={
                isWeb ||
                isBulkDownloading ||
                !!downloadingBook ||
                isOtherVersionDownloading
                  ? undefined
                  : () => downloadBook(item.abbrev)
              }
            />
          )}
        </View>
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

      <View
        style={[
          styles.summaryBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryRow}>
          <BibleText
            style={{
              fontSize: ms(DESIGN.fontSize.md),
              color: colors.onSurface,
            }}
          >
            {versionInfo?.name ?? selectedVersion}
          </BibleText>
          <BibleText
            style={{
              fontSize: ms(DESIGN.fontSize.md),
              color: colors.textMuted,
            }}
          >
            {formatSize(totalSizeBytes)}
          </BibleText>
        </View>

        {isBulkDownloading && (
          <BibleText
            style={{
              fontSize: ms(DESIGN.fontSize.sm),
              color: colors.textMuted,
            }}
          >
            {downloadingBook
              ? `Livro ${bulkBookProgress.completed + 1}/${bulkBookProgress.total} — ${downloadingBook}: ${bookProgress.completed}/${bookProgress.total} capítulos`
              : "Preparando download..."}
          </BibleText>
        )}

        {isWeb && (
          <BibleText
            style={{
              fontSize: ms(DESIGN.fontSize.sm),
              color: colors.textMuted,
            }}
          >
            Downloads para uso offline não estão disponíveis na versão web. Use
            o app instalado no celular.
          </BibleText>
        )}

        {!isWeb && isOtherVersionDownloading && (
          <BibleText
            style={{
              fontSize: ms(DESIGN.fontSize.sm),
              color: colors.textMuted,
            }}
          >
            Aguarde a conclusão do download em andamento de outra versão.
          </BibleText>
        )}

        {!isWeb && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isBulkDownloading
                    ? colors.error + "15"
                    : colors.primary + "15",
                  borderColor: isBulkDownloading
                    ? colors.error
                    : colors.primary,
                },
              ]}
              onPress={() =>
                isBulkDownloading ? cancelDownload() : downloadAllBooks()
              }
              disabled={
                !isBulkDownloading &&
                (isFullyDownloaded || isOtherVersionDownloading)
              }
              activeOpacity={0.8}
            >
              <BibleIcon
                name={isBulkDownloading ? "x" : "download-cloud"}
                size={ms(DESIGN.fontSize.lg)}
                color={isBulkDownloading ? colors.error : colors.primary}
              />
              <BibleText
                style={{
                  fontSize: ms(DESIGN.fontSize.md),
                  fontWeight: "700",
                  color: isBulkDownloading ? colors.error : colors.primary,
                }}
              >
                {isBulkDownloading
                  ? "Cancelar"
                  : isFullyDownloaded
                    ? "Bíblia completa"
                    : "Baixar tudo"}
              </BibleText>
            </TouchableOpacity>

            {totalSizeBytes > 0 && !isBulkDownloading && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.error + "15",
                    borderColor: colors.error,
                  },
                ]}
                onPress={() => setDeleteTarget({ type: "version" })}
                activeOpacity={0.8}
              >
                <BibleIcon
                  name="trash-2"
                  size={ms(DESIGN.fontSize.lg)}
                  color={colors.error}
                />
                <BibleText
                  style={{
                    fontSize: ms(DESIGN.fontSize.md),
                    fontWeight: "700",
                    color: colors.error,
                  }}
                >
                  Excluir tudo
                </BibleText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <BibleDivider />

      {!isLoaded ? (
        <BibleSkeleton />
      ) : (
        <FlashList
          data={summaries}
          keyExtractor={(item) => item.abbrev}
          // @ts-ignore
          estimatedItemSize={ms(DESIGN.layout.settingsIconOffset * 1.15)}
          renderItem={renderBook}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BibleConfirmModal
        visible={!!deleteTarget}
        title="Excluir Áudios"
        message={
          deleteTarget?.type === "book"
            ? `Deseja excluir os áudios baixados de ${deleteTarget.name}?`
            : `Deseja excluir todos os áudios baixados de ${versionInfo?.name ?? selectedVersion}?`
        }
        confirmText="Excluir"
        isDanger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.type === "book") {
            deleteBook(deleteTarget.abbrev);
          } else if (deleteTarget?.type === "version") {
            deleteVersion();
          }
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}
