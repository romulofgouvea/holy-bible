import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "../constants/storage";
import { getBiblePlanTemplate } from "../data/bible-plan/biblePlanRegistry";
import { useBiblePlan } from "./useBiblePlan";

const NOTIFICATION_IDENTIFIER = "reading-plan-daily-reminder";
const ANDROID_CHANNEL_ID = "reading-plan";
const DEFAULT_TIME = "08:00";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return {
    hour: Number.isFinite(h) ? h : 8,
    minute: Number.isFinite(m) ? m : 0,
  };
}

export function useReadingPlanNotifications() {
  const { activePlans, getBiblePlanStats } = useBiblePlan();
  const [enabled, setEnabledState] = useState(false);
  const [time, setTimeState] = useState(DEFAULT_TIME);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Lembrete de leitura",
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [savedEnabled, savedTime] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.READING_PLAN_NOTIFICATIONS_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.READING_PLAN_NOTIFICATION_TIME),
        ]);
        setEnabledState(savedEnabled === "true");
        if (savedTime) setTimeState(savedTime);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setEnabled = useCallback(async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        setEnabledState(false);
        await AsyncStorage.setItem(
          STORAGE_KEYS.READING_PLAN_NOTIFICATIONS_ENABLED,
          "false",
        );
        return;
      }
    }
    setEnabledState(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_PLAN_NOTIFICATIONS_ENABLED,
      String(value),
    );
  }, []);

  const setTime = useCallback(async (value: string) => {
    setTimeState(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_PLAN_NOTIFICATION_TIME,
      value,
    );
  }, []);

  const hasActivePlan = useMemo(() => {
    return activePlans.some((plan) => {
      const template = getBiblePlanTemplate(plan.templateId);
      if (!template) return false;
      const stats = getBiblePlanStats(plan, template.months);
      return !stats.isPaused && !stats.isCompleted;
    });
  }, [activePlans, getBiblePlanStats]);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      await Notifications.cancelScheduledNotificationAsync(
        NOTIFICATION_IDENTIFIER,
      ).catch(() => {});

      if (!enabled || !hasActivePlan) return;

      const { hour, minute } = parseTime(time);
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDENTIFIER,
        content: {
          title: "Plano de Leitura",
          body: "Hora da sua leitura bíblica!",
          data: { route: "/reading-plan" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: ANDROID_CHANNEL_ID,
        },
      }).catch(() => {});
    })();
  }, [isLoaded, enabled, hasActivePlan, time]);

  return {
    isLoaded,
    enabled,
    time,
    setEnabled,
    setTime,
  };
}
