import localforage from 'localforage';
import type { Alarm, CreateAlarmInput } from '@/types/Alarm';

const ALARMS_KEY = 'alarms';

function generateId(): string {
  return `alarm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function getAlarms(): Promise<Alarm[]> {
  const alarms = await localforage.getItem<Alarm[]>(ALARMS_KEY);
  return alarms || [];
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
  const filtered = alarms.filter((a) => a.id !== id);
  if (filtered.length === alarms.length) {
    return false;
  }
  await localforage.setItem(ALARMS_KEY, filtered);
  return true;
}
