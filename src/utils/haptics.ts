import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const impactLight = () => {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const impactMedium = () => {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const impactHeavy = () => {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export const selectionHaptic = () => {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync();
};

export const notificationSuccess = () => {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
