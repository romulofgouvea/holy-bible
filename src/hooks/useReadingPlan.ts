import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';
import { ReadingPlan, ReadingPlanDay } from '../models';
import { PlanTemplate } from '../data/readingPlans';
import { BACKUP_RESTORED_EVENT, writeAutoBackupFile } from '../utils/backup';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parsePlansFromRaw(raw: string | null): ReadingPlan[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useReadingPlan() {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reloadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.READING_PLAN);
      setPlans(parsePlansFromRaw(raw));
    } catch {
      setPlans([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    reloadFromStorage();
    const sub = DeviceEventEmitter.addListener(BACKUP_RESTORED_EVENT, reloadFromStorage);
    return () => sub.remove();
  }, [reloadFromStorage]);

  const persist = useCallback((updated: ReadingPlan[]) => {
    setPlans(updated);
    AsyncStorage.setItem(STORAGE_KEYS.READING_PLAN, JSON.stringify(updated)).catch(() => {});
    AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP).then(val => {
      if (val === 'true') writeAutoBackupFile().catch(() => {});
    }).catch(() => {});
  }, []);

  const createPlan = useCallback((template: PlanTemplate): ReadingPlan => {
    const days: ReadingPlanDay[] = template.days.map((item, index) => {
      const isArray = Array.isArray(item);
      const entries = isArray ? item : item.entries;
      const group = isArray ? undefined : item.group;
      const label = isArray ? undefined : item.label;

      return {
        day: index + 1,
        entries,
        isCompleted: false,
        group,
        label,
      };
    });
    const newPlan: ReadingPlan = {
      id: makeId(),
      templateId: template.id,
      title: template.title,
      totalDays: template.totalDays,
      startedAt: Date.now(),
      days,
    };
    persist([...plans, newPlan]);
    return newPlan;
  }, [plans, persist]);

  const markDayCompleted = useCallback((planId: string, day: number) => {
    persist(plans.map(p =>
      p.id !== planId ? p : {
        ...p,
        days: p.days.map(d =>
          d.day === day ? { ...d, isCompleted: true, completedAt: Date.now() } : d
        ),
      }
    ));
  }, [plans, persist]);

  const markDayUncompleted = useCallback((planId: string, day: number) => {
    persist(plans.map(p =>
      p.id !== planId ? p : {
        ...p,
        days: p.days.map(d =>
          d.day === day ? { ...d, isCompleted: false, completedAt: undefined } : d
        ),
      }
    ));
  }, [plans, persist]);

  const removePlan = useCallback((planId: string) => {
    persist(plans.filter(p => p.id !== planId));
  }, [plans, persist]);

  const clearAllPlans = useCallback(() => {
    persist([]);
  }, [persist]);

  const getPlanStats = useCallback((plan: ReadingPlan) => {
    const completedCount = plan.days.filter(d => d.isCompleted).length;
    const progressPercent = Math.round((completedCount / plan.totalDays) * 100);
    const elapsed = Math.floor((Date.now() - plan.startedAt) / (1000 * 60 * 60 * 24));
    const todayDayNumber = Math.min(elapsed + 1, plan.totalDays);
    const todayDay = plan.days.find(d => d.day === todayDayNumber) ?? null;
    const delayDays = Math.max(0, elapsed - completedCount);
    return { 
      completedCount, 
      progressPercent, 
      todayDayNumber, 
      todayDay, 
      delayDays, 
      startedAt: plan.startedAt 
    };
  }, []);

  return {
    plans,
    isLoaded,
    createPlan,
    markDayCompleted,
    markDayUncompleted,
    removePlan,
    clearAllPlans,
    getPlanStats,
    reloadFromStorage,
  };
}
