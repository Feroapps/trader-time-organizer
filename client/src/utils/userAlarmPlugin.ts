import { Capacitor, registerPlugin } from '@capacitor/core';

interface UserAlarmPlugin {
  scheduleAlarm(options: {
    alarmId: string;
    label: string;
    triggerTimeMs: number;
    soundId: string;
  }): Promise<{ success: boolean; alarmId: string }>;
  
  cancelAlarm(options: { alarmId: string }): Promise<{ success: boolean; alarmId: string }>;
  
  stopCurrentAlarm(): Promise<{ success: boolean }>;
  
  canScheduleExactAlarms(): Promise<{ canSchedule: boolean }>;

  openAndroidSettings(options: { action: string; useAppPackage?: boolean; intExtras?: Record<string, number> }): Promise<{ success: boolean; error?: string }>;
}

const UserAlarm = registerPlugin<UserAlarmPlugin>('UserAlarm');

const PAST_TOLERANCE_MS = 3000;

export async function scheduleUserAlarmNative(
  alarmId: string,
  label: string,
  triggerTime: Date,
  soundId: string
): Promise<boolean> {
  const triggerTimeMs = triggerTime.getTime();
  const now = Date.now();
  
  console.log(`[UserAlarm] ===== scheduleUserAlarmNative ENTERED =====`);
  console.log(`[UserAlarm] alarmId: ${alarmId}`);
  console.log(`[UserAlarm] label: ${label}`);
  console.log(`[UserAlarm] triggerTimeMs: ${triggerTimeMs}`);
  console.log(`[UserAlarm] triggerTime (ISO): ${triggerTime.toISOString()}`);
  console.log(`[UserAlarm] now (ms): ${now}`);
  console.log(`[UserAlarm] now (ISO): ${new Date(now).toISOString()}`);
  console.log(`[UserAlarm] delta (sec): ${Math.round((triggerTimeMs - now) / 1000)}`);
  console.log(`[UserAlarm] soundId: ${soundId}`);
  console.log(`[UserAlarm] isNativePlatform: ${Capacitor.isNativePlatform()}`);
  console.log(`[UserAlarm] platform: ${Capacitor.getPlatform()}`);
  
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    console.log(`[UserAlarm] NOT Android native - returning false`);
    return false;
  }
  
  const deltaMs = triggerTimeMs - now;
  if (deltaMs <= -PAST_TOLERANCE_MS) {
    console.error(`[UserAlarm] ERROR: Trigger time is in the PAST beyond tolerance! delta=${deltaMs}ms tolerance=${PAST_TOLERANCE_MS}ms`);
    return false;
  }
  
  try {
    console.log(`[UserAlarm] Calling UserAlarm.scheduleAlarm...`);
    const result = await UserAlarm.scheduleAlarm({
      alarmId,
      label,
      triggerTimeMs,
      soundId,
    });
    console.log(`[UserAlarm] Result: success=${result.success}, alarmId=${result.alarmId}`);
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

export async function openAndroidSettingsNative(action: string, useAppPackage: boolean = false, intExtras?: Record<string, number>): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }

  try {
    const result = await UserAlarm.openAndroidSettings({ action, useAppPackage, intExtras });
    return result.success;
  } catch (e) {
    console.warn(`[UserAlarm] openAndroidSettings failed for action: ${action}`, e);
    return false;
  }
}

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}
