import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BibleHeader } from "../components/BibleHeader";
import { BibleListCard } from "../components/BibleListCard";
import { BibleText } from "../components/BibleText";
import { ALIASES, BibleVersionInfo } from "../data/bible-version";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { ROUTES } from "../constants/routes";
import { handleSmartBack } from "../utils/navigation";

const LANGUAGE_LABELS: Record<string, string> = {
  pt: "Português",
  en: "Inglês",
};
const LANGUAGE_ORDER = ["pt", "en"];

export default function DownloadsScreen() {
  const { ms, DESIGN } = useResponsive();
  const pathname = usePathname();
  const router = useRouter();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        list: {
          padding: ms(DESIGN.spacing.lg),
        },
        languageGroup: {
          gap: ms(DESIGN.spacing.sm),
          marginBottom: ms(DESIGN.spacing.sm),
        },
        groupLabelRow: {
          flexDirection: "row",
          alignItems: "center",
          marginVertical: ms(DESIGN.spacing.xs),
          gap: ms(DESIGN.spacing.xs),
        },
        groupLabel: {
          fontWeight: "700",
          letterSpacing: 0.5,
        },
        groupLabelLine: {
          flex: 1,
          height: 1,
        },
      }),
    [ms, DESIGN],
  );

  const groupedVersions = useMemo(() => {
    const groups = new Map<string, BibleVersionInfo[]>();
    ALIASES.forEach((item) => {
      const language = item.language || "pt";
      if (!groups.has(language)) groups.set(language, []);
      groups.get(language)!.push(item);
    });
    return LANGUAGE_ORDER.filter((language) => groups.has(language)).map(
      (language) => ({
        language,
        label: LANGUAGE_LABELS[language] || language.toUpperCase(),
        versions: groups.get(language)!,
      }),
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BibleHeader
        title="Downloads"
        showMenu={false}
        showBack={true}
        onBack={() => handleSmartBack(pathname)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {groupedVersions.map((group) => (
          <View key={group.language}>
            <View style={styles.groupLabelRow}>
              <View
                style={[
                  styles.groupLabelLine,
                  { backgroundColor: colors.border },
                ]}
              />
              <BibleText
                style={[
                  styles.groupLabel,
                  { color: colors.textMuted, fontSize: ms(DESIGN.fontSize.xs) },
                ]}
              >
                {group.label.toUpperCase()}
              </BibleText>
              <View
                style={[
                  styles.groupLabelLine,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>
            <View style={styles.languageGroup}>
              {group.versions.map((item) => (
                <BibleListCard
                  key={item.sigla}
                  title={item.name}
                  pillText={item.sigla}
                  onPress={() =>
                    router.push(ROUTES.DOWNLOADS_BOOKS(item.sigla) as any)
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
