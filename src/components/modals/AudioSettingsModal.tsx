import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AUDIO_VOICES } from "../../constants/audioVoices";
import { useAudioSettings } from "../../hooks/useAudioSettings";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../hooks/useTheme";
import { selectionHaptic } from "../../utils/haptics";
import { BibleIcon } from "../BibleIcon";
import { BibleText } from "../BibleText";
import { BiblePageModal } from "./BiblePageModal";

export function AudioSettingsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();
  const { selectedVoice, setSelectedVoice } = useAudioSettings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          padding: ms(DESIGN.spacing.lg),
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
        },
        title: {
          flex: 1,
          fontWeight: "700",
        },
        settingsWrapper: {
          gap: ms(DESIGN.spacing.lg),
        },
        section: {
          gap: ms(DESIGN.fontSize.xs),
        },
        sectionTitle: {
          fontSize: ms(DESIGN.fontSize.xs),
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 1,
          opacity: 0.6,
        },
        unifiedRow: {
          flexDirection: "row",
          height: ms(DESIGN.height.md),
          borderRadius: ms(DESIGN.borderRadius.md),
          alignItems: "center",
          overflow: "hidden",
        },
        segmentBtn: {
          flex: 1,
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [ms, DESIGN],
  );

  if (!visible) return null;

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      header={
        <View style={styles.header}>
          <BibleIcon
            name="headphones"
            size={ms(DESIGN.spacing.lg)}
            color={colors.primary}
            backgroundColor={colors.primary + "25"}
            style={{ marginRight: ms(DESIGN.spacing.sm) }}
          />
          <BibleText
            style={[
              styles.title,
              { fontSize: ms(DESIGN.spacing.lg), color: colors.primary },
            ]}
          >
            Áudio
          </BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + "20"}
            onPress={onClose}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.settingsWrapper}>
          <View style={styles.section}>
            <BibleText
              style={[styles.sectionTitle, { color: colors.textMuted }]}
            >
              Narrador
            </BibleText>
            <View
              style={[
                styles.unifiedRow,
                { backgroundColor: colors.surfaceHighlight },
              ]}
            >
              {AUDIO_VOICES.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => {
                    selectionHaptic();
                    setSelectedVoice(v.id);
                  }}
                  style={[
                    styles.segmentBtn,
                    selectedVoice === v.id && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <BibleText
                    style={{
                      fontSize: ms(DESIGN.fontSize.md),
                      fontWeight: "700",
                      color:
                        selectedVoice === v.id
                          ? colors.onPrimary
                          : colors.onBackground,
                    }}
                  >
                    {v.name}
                  </BibleText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </BiblePageModal>
  );
}
