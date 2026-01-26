import { Capacitor, registerPlugin } from '@capacitor/core';

interface UserAlarmPlugin {
  scheduleAlarm(options: {
    alarmId: string;
    label: string;
    triggerTimeMs: number;
    snoozeMinutes: number;
    soundId: string;
  }): Promise<{ success: boolean; alarmId: string }>;
  
  cancelAlarm(options: { alarmId: string }): Promise<{ success: boolean; alarmId: string }>;
  
  stopCurrentAlarm(): Promise<{ success: boolean }>;
  
  canScheduleExactAlarms(): Promise<{ canSchedule: boolean }>;
}

const UserAlarm = registerPlugin<UserAlarmPlugin>('UserAlarm');

export async function scheduleUserAlarmNative(
  alarmId: string,
  label: string,
  triggerTime: Date,
  snoozeMinutes: number,
  soundId: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }
  
  try {
    const result = await UserAlarm.scheduleAlarm({
      alarmId,
      label,
      triggerTimeMs: triggerTime.getTime(),
      snoozeMinutes,
      soundId,
    });
    console.log(`[UserAlarm] Scheduled: ${alarmId} at ${triggerTime.toISOString()}`);
    return result.success;
  } catch (e) {
    console.error(`[UserAlarm] Failed to schedule ${alarmId}:`, e);
    return false;
  }
}

export async function cancelUserAlarmNative(alarmId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }
  
  try {
    const result = await UserAlarm.cancelAlarm({ alarmId });
    console.log(`[UserAlarm] Cancelled: ${alarmId}`);
    return result.success;
  } catch (e) {
    console.error(`[UserAlarm] Failed to cancel ${alarmId}:`, e);
    return false;
  }
}

export async function stopCurrentAlarmNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }
  
  try {
    const result = await UserAlarm.stopCurrentAlarm();
    console.log('[UserAlarm] Stopped current alarm');
    return result.success;
  } catch (e) {
    console.error('[UserAlarm] Failed to stop current alarm:', e);
    return false;
  }
}

export async function canScheduleExactAlarmsNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return true;
  }
  
  try {
    const result = await UserAlarm.canScheduleExactAlarms();
    return result.canSchedule;
  } catch (e) {
    console.error('[UserAlarm] Failed to check exact alarm permission:', e);
    return false;
  }
}

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}
