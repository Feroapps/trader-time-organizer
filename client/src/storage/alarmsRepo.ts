import localforage from 'localforage';
import type { Alarm, CreateAlarmInput } from '@/types/Alarm';
import { fixedAlarms } from '@/data/fixedAlarms';

const ALARMS_KEY = 'alarms';

function generateId(): string {
  return `alarm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function getAlarms(): Promise<Alarm[]> {
  const alarms = await localforage.getItem<Alarm[]>(ALARMS_KEY);
  return alarms || [];
}

export async function seedFixedAlarms(): Promise<Alarm[]> {
  const existingAlarms = await getAlarms();
  
  if (existingAlarms.length > 0) {
    console.log("[Alarms] Alarms already exist, skipping seed");
    return existingAlarms;
  }
  
  console.log("[Alarms] Seeding fixed alarms...");
  const seededAlarms: Alarm[] = [];
  
  for (const fixedAlarm of fixedAlarms) {
    const alarm: Alarm = {
      ...fixedAlarm,
      id: generateId(),
    };
    seededAlarms.push(alarm);
  }
  
  await localforage.setItem(ALARMS_KEY, seededAlarms);
  console.log("[Alarms] Seeded fixed alarms:", seededAlarms);
  return seededAlarms;
}

export async function createAlarm(input: CreateAlarmInput): Promise<Alarm> {
  const alarms = await getAlarms();
  const newAlarm: Alarm = {
    ...input,
    id: generateId(),
  };
  alarms.push(newAlarm);
  await localforage.setItem(ALARMS_KEY, alarms);
  return newAlarm;
}

export async function updateAlarm(updatedAlarm: Alarm): Promise<Alarm | null> {
  const alarms = await getAlarms();
  const index = alarms.findIndex((a) => a.id === updatedAlarm.id);
  if (index === -1) {
    return null;
  }
  alarms[index] = updatedAlarm;
  await localforage.setItem(ALARMS_KEY, alarms);
  return updatedAlarm;
}

export async function toggleAlarm(id: string, isEnabled: boolean): Promise<Alarm | null> {
  const alarms = await getAlarms();
  const alarm = alarms.find((a) => a.id === id);
  if (!alarm) {
    return null;
  }
  alarm.isEnabled = isEnabled;
  await localforage.setItem(ALARMS_KEY, alarms);
  return alarm;
}

export async function deleteAlarm(id: string): Promise<boolean> {
  const alarms = await getAlarms();
  const alarm = alarms.find((a) => a.id === id);
  
  if (!alarm) {
    return false;
  }
  
  if (alarm.isFixed) {
    console.log("[Alarms] Cannot delete fixed alarm:", alarm.label);
    return false;
  }
  
  const filtered = alarms.filter((a) => a.id !== id);
  await localforage.setItem(ALARMS_KEY, filtered);
  return true;
}

export async function clearAllAlarms(): Promise<void> {
  await localforage.removeItem(ALARMS_KEY);
  console.log("[Alarms] Cleared all alarms from storage");
}
