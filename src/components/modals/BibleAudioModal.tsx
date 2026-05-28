import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, GestureResponderEvent, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { AudioService, RunpodStatus } from '../../services/AudioService';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';

type BibleAudioModalProps = {
  visible: boolean;
  version: string;
  abbrev: string;
  chapter: number;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
};

const GENERATION_LABELS: Record<RunpodStatus, string> = {
  IN_QUEUE: 'Na fila de geração...',
  IN_PROGRESS: 'Gerando áudio...',
  COMPLETED: 'Carregando...',
  FAILED: 'Falha ao gerar.',
};

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const;
type SpeedOption = typeof SPEED_OPTIONS[number];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BibleAudioModal(props: BibleAudioModalProps) {
  const { visible, version, abbrev, chapter, onClose } = props;
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<RunpodStatus | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [trackWidth, setTrackWidth] = useState(0);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const insets = useSafeAreaInsets();
  const hiddenY = ms(DESIGN.layout.settingsIconOffset * 3);
  const translateY = useRef(new Animated.Value(hiddenY)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : hiddenY,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible, hiddenY]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
  }, []);

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleSeek = (event: GestureResponderEvent) => {
    if (!status.isLoaded || duration <= 0 || trackWidth <= 0) return;
    const { locationX } = event.nativeEvent;
    const ratio = Math.max(0, Math.min(locationX / trackWidth, 1));
    const seekTime = ratio * duration;
    player.seekTo(seekTime);
  };

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(speed);
    const nextSpeed = SPEED_OPTIONS[(currentIndex + 1) % SPEED_OPTIONS.length];
    setSpeed(nextSpeed);
    player.shouldCorrectPitch = true;
    player.setPlaybackRate(nextSpeed, 'high');
  };

  const playVerse = async (index: number, urls: string[]) => {
    if (index >= urls.length) {
      setIsPlaying(false);
      setCurrentVerseIndex(0);
      return;
    }

    setCurrentVerseIndex(index);
    const url = urls[index];

    try {
      let playUri = url;

      try {
        const filename = url.split('?')[0].split('/').pop() || `audio-${index}.mp3`;
        const localUri = `${FileSystem.documentDirectory}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
          playUri = localUri;
        } else {
          await FileSystem.downloadAsync(url, localUri);
          playUri = localUri;
        }
      } catch {
        playUri = url;
      }

      player.replace(playUri);
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(speed, 'high');
      player.play();
    } catch {
      props.onShowToast?.('Erro ao reproduzir o áudio.', 'warning');
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (status.didJustFinish && isPlaying) {
      playVerse(currentVerseIndex + 1, audioUrls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const loadAudio = async () => {
    setIsLoading(true);
    setGenerationStatus(null);
    try {
      const urls = await AudioService.getAudio({
        version,
        abbrev,
        chapter,
        onGenerationStatus: (s) => setGenerationStatus(s),
      });
      if (Array.isArray(urls) && urls.length > 0) {
        setAudioUrls(urls);
        setIsPlaying(true);
        playVerse(0, urls);
      }
    } catch {
      props.onShowToast?.('Erro ao buscar o áudio.', 'warning');
    } finally {
      setIsLoading(false);
      setGenerationStatus(null);
    }
  };

  useEffect(() => {
    setAudioUrls([]);
    setCurrentVerseIndex(0);
    setIsPlaying(false);
    setGenerationStatus(null);
    player.pause();
  }, [version, abbrev, chapter]);

  const handlePlayPause = () => {
    if (isLoading) return;
    if (audioUrls.length === 0) {
      loadAudio();
    } else if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (status.isLoaded) {
        player.shouldCorrectPitch = true;
        player.setPlaybackRate(speed, 'high');
        player.play();
      } else {
        playVerse(currentVerseIndex, audioUrls);
      }
    }
  };

  const hasProgress = audioUrls.length > 0 && duration > 0;

  const ICON_SIZE = ms(DESIGN.icon.xl);

  const styles = useMemo(() => StyleSheet.create({
    bar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: ms(DESIGN.spacing.md),
      margin: ms(DESIGN.spacing.md),
      borderRadius: ms(DESIGN.borderRadius.md),
      borderWidth: 1,
      elevation: 24,
      shadowOffset: { width: 0, height: ms(6) },
      shadowOpacity: 0.25,
      shadowRadius: ms(16),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(DESIGN.spacing.sm),
    },
    iconBtn: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ms(DESIGN.borderRadius.sm),
      alignItems: 'center',
      justifyContent: 'center',
    },
    speedText: {
      fontSize: ms(DESIGN.fontSize.xs),
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.2,
    },
    progressWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: ms(DESIGN.spacing.xs),
    },
    progressTrack: {
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: colors.border,
      overflow: 'visible',
    },
    progressFill: {
      height: '100%',
      borderRadius: ms(3),
      backgroundColor: colors.primary,
    },
    progressThumb: {
      position: 'absolute',
      top: ms(-5),
      width: ms(16),
      height: ms(16),
      borderRadius: ms(8),
      backgroundColor: colors.primary,
      marginLeft: ms(-8),
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: ms(2) },
      shadowOpacity: 0.5,
      shadowRadius: ms(4),
    },
  }), [ms, colors, DESIGN, ICON_SIZE]);

  if (!visible && audioUrls.length === 0 && !isLoading) return null;


  return (
    <Animated.View style={[styles.bar, {
      transform: [{ translateY }],
      backgroundColor: colors.background,
      padding: ms(DESIGN.spacing.sm),
      borderColor: colors.border,
      shadowColor: colors.primary,
    }]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.75 : 1 }]}
          onPress={handlePlayPause}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <BibleIcon
            name={isLoading ? 'loader' : isPlaying ? 'pause' : 'play'}
            color={colors.onPrimary}
            style={{ marginLeft: (!isLoading && !isPlaying) ? ms(2) : 0 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surfaceHighlight, borderWidth: 1, borderColor: colors.border }]}
          onPress={cycleSpeed}
          disabled={!status.isLoaded}
          activeOpacity={0.7}
        >
          <BibleText style={styles.speedText}>{speed}x</BibleText>
        </TouchableOpacity>

        <View
          style={styles.progressWrap}
          onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => hasProgress}
          onResponderGrant={handleSeek}
          onResponderMove={handleSeek}
        >
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }]}
            />
            {hasProgress && (
              <Animated.View
                style={[styles.progressThumb, {
                  left: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }]}
              />
            )}
          </View>
        </View>

        <BibleIcon
          name="x"
          color={colors.error}
          backgroundColor={colors.error + '20'}
          containerSize={DESIGN.icon.xl}
          onPress={() => {
            player.pause();
            setIsPlaying(false);
            onClose();
          }}
        />
      </View>
    </Animated.View>
  );
}

