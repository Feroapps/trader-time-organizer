import localforage from 'localforage';
import type { Alarm, CreateAlarmInput } from '@/types/Alarm';
import { fixedAlarms } from '@/data/fixedAlarms';
import { scheduleAlarmNotification, cancelAlarmNotification } from '@/utils/nativeNotifications';

const ALARMS_KEY = 'alarms';

function generateId(): string {
  return `alarm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getSessionAlertId(index: number): string {
  return `session_alert_${index + 1}`;
}

export async function getAlarms(): Promise<Alarm[]> {
  const alarms = await localforage.getItem<Alarm[]>(ALARMS_KEY);
  return alarms || [];
}

async function migrateToStableIds(existingAlarms: Alarm[]): Promise<Alarm[]> {
  let needsSave = false;
  const migratedAlarms = [...existingAlarms];
  
  for (let i = 0; i < fixedAlarms.length; i++) {
    const stableId = getSessionAlertId(i);
    const fixedAlarmData = fixedAlarms[i];
    
    const existingByStableId = migratedAlarms.find(a => a.id === stableId);
    if (existingByStableId) {
      continue;
    }
    
    const existingByLabel = migratedAlarms.find(
      a => a.isFixed && a.label === fixedAlarmData.label
    );
    
    if (existingByLabel && existingByLabel.id !== stableId) {
      const oldId = existingByLabel.id;
      existingByLabel.id = stableId;
      needsSave = true;
      console.log(`[Alarms] Migrated session alert "${fixedAlarmData.label}" from ${oldId} to ${stableId}`);
    } else if (!existingByLabel) {
      const newAlarm: Alarm = {
        ...fixedAlarmData,
        id: stableId,
      };
      migratedAlarms.push(newAlarm);
      needsSave = true;
      console.log(`[Alarms] Added missing session alert "${fixedAlarmData.label}" with ${stableId}`);
    }
  }
  
  if (needsSave) {
    await localforage.setItem(ALARMS_KEY, migratedAlarms);
  }
  
  return migratedAlarms;
}

export async function seedFixedAlarms(): Promise<Alarm[]> {
  const existingAlarms = await getAlarms();
  
  if (existingAlarms.length > 0) {
    return await migrateToStableIds(existingAlarms);
  }
  
  const seededAlarms: Alarm[] = [];
  
  for (let i = 0; i < fixedAlarms.length; i++) {
    const alarm: Alarm = {
      ...fixedAlarms[i],
      id: getSessionAlertId(i),
    };
    seededAlarms.push(alarm);
  }
  
  await localforage.setItem(ALARMS_KEY, seededAlarms);
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
  
  if (newAlarm.isEnabled) {
    await scheduleAlarmNotification(newAlarm);
  }
  
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
  
  if (updatedAlarm.isEnabled) {
    scheduleAlarmNotification(updatedAlarm);
  } else {
    cancelAlarmNotification(updatedAlarm.id, !updatedAlarm.isFixed);
  }
  
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
  
  if (isEnabled) {
    scheduleAlarmNotification(alarm);
  } else {
    cancelAlarmNotification(alarm.id, !alarm.isFixed);
  }
  
  return alarm;
}

export async function deleteAlarm(id: string): Promise<boolean> {
  const alarms = await getAlarms();
  const alarm = alarms.find((a) => a.id === id);
  
  if (!alarm) {
    return false;
  }
  
  if (alarm.isFixed) {
    return false;
  }
  
  cancelAlarmNotification(id, true);
  
  const filtered = alarms.filter((a) => a.id !== id);
  await localforage.setItem(ALARMS_KEY, filtered);
  return true;
}

export async function clearAllAlarms(): Promise<void> {
  await localforage.removeItem(ALARMS_KEY);
}
