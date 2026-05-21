import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';
import { ActiveBiblePlan } from '../models';
import { BiblePlanMonth, BiblePlanTemplate } from '../models/BiblePlanModels';
import { BACKUP_RESTORED_EVENT, writeAutoBackupFile } from '../utils/backup';

const BIBLE_PLANS_KEY = STORAGE_KEYS.READING_PLAN + '_bible_plans';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function dayKey(monthNumber: number, day: number): string {
  return `${monthNumber}-${day}`;
}

function parsePlans(raw: string | null): ActiveBiblePlan[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useBiblePlan() {
  const [activePlans, setActivePlans] = useState<ActiveBiblePlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reloadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BIBLE_PLANS_KEY);
      setActivePlans(parsePlans(raw));
    } catch {
      setActivePlans([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    reloadFromStorage();
    const sub = DeviceEventEmitter.addListener(BACKUP_RESTORED_EVENT, reloadFromStorage);
    return () => sub.remove();
  }, [reloadFromStorage]);

  const persist = useCallback((updated: ActiveBiblePlan[]) => {
    setActivePlans(updated);
    AsyncStorage.setItem(BIBLE_PLANS_KEY, JSON.stringify(updated)).catch(() => {});
    AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP).then(val => {
      if (val === 'true') writeAutoBackupFile().catch(() => {});
    }).catch(() => {});
  }, []);

  const createBiblePlan = useCallback((template: BiblePlanTemplate): ActiveBiblePlan => {
    const newPlan: ActiveBiblePlan = {
      id: makeId(),
      templateId: template.id,
      title: template.title,
      startedAt: Date.now(),
      completedDays: {},
    };
    persist([...activePlans, newPlan]);
    return newPlan;
  }, [activePlans, persist]);

  const toggleDay = useCallback((planId: string, monthNumber: number, day: number) => {
    const key = dayKey(monthNumber, day);
    persist(activePlans.map(p => {
      if (p.id !== planId) return p;
      const existing = p.completedDays[key];
      const updated = { ...p.completedDays };
      if (existing?.isCompleted) {
        delete updated[key];
      } else {
        updated[key] = { isCompleted: true, completedAt: Date.now() };
      }
      return { ...p, completedDays: updated };
    }));
  }, [activePlans, persist]);

  const isDayCompleted = useCallback((plan: ActiveBiblePlan, monthNumber: number, day: number): boolean => {
    return !!plan.completedDays[dayKey(monthNumber, day)]?.isCompleted;
  }, []);

  const getDayCompletedAt = useCallback((plan: ActiveBiblePlan, monthNumber: number, day: number): number | undefined => {
    return plan.completedDays[dayKey(monthNumber, day)]?.completedAt;
  }, []);

  const removeBiblePlan = useCallback((planId: string) => {
    persist(activePlans.filter(p => p.id !== planId));
  }, [activePlans, persist]);

  const clearAllBiblePlans = useCallback(() => {
    persist([]);
  }, [persist]);

  const updateStartDate = useCallback((planId: string, timestamp: number) => {
    persist(activePlans.map(p =>
      p.id !== planId ? p : { ...p, startedAt: timestamp }
    ));
  }, [activePlans, persist]);

  const getBiblePlanStats = useCallback((plan: ActiveBiblePlan, months: BiblePlanMonth[]) => {
    const totalDays = months.reduce((acc, m) => acc + m.days.length, 0);
    const completedCount = Object.values(plan.completedDays).filter(d => d.isCompleted).length;
    const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
    
    const startMidnight = new Date(plan.startedAt).setHours(0, 0, 0, 0);
    const nowMidnight = new Date().setHours(0, 0, 0, 0);
    const elapsedDays = Math.floor((nowMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;
    
    const differenceDays = completedCount - elapsedDays;
    const delayDays = differenceDays < 0 ? Math.abs(differenceDays) : 0;
    const aheadDays = differenceDays > 0 ? differenceDays : 0;

    const expectedEndMs = startMidnight + ((totalDays - 1) * 24 * 60 * 60 * 1000);
    const estimatedEndMs = nowMidnight + ((totalDays - completedCount) * 24 * 60 * 60 * 1000);

    return {
      totalDays,
      completedCount,
      progressPercent,
      elapsed: elapsedDays,
      delayDays,
      aheadDays,
      expectedEndMs,
      estimatedEndMs,
      startedAt: plan.startedAt,
    };
  }, []);

  return {
    activePlans,
    isLoaded,
    createBiblePlan,
    toggleDay,
    isDayCompleted,
    getDayCompletedAt,
    removeBiblePlan,
    clearAllBiblePlans,
    updateStartDate,
    getBiblePlanStats,
    reloadFromStorage,
  };
}
