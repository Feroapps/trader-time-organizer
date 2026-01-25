import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import type { Alarm } from '@/types/Alarm';
import { getAlarms } from '@/storage/alarmsRepo';
import { migrateSoundId } from '@/utils/soundLibrary';

const SOUND_CHANNEL_MAP: Record<string, { channelId: string; name: string; sound: string }> = {
  original: { channelId: 'alerts_original_v2', name: 'Alerts - Original', sound: 'alert_original' },
  classic: { channelId: 'alerts_classic_v2', name: 'Alerts - Classic', sound: 'alert_classic' },
  chime: { channelId: 'alerts_chime_v2', name: 'Alerts - Chime', sound: 'alert_chime' },
  bell: { channelId: 'alerts_bell_v2', name: 'Alerts - Bell', sound: 'alert_bell' },
  ping: { channelId: 'alerts_ping_v2', name: 'Alerts - Ping', sound: 'alert_ping' },
  tone: { channelId: 'alerts_tone_v2', name: 'Alerts - Tone', sound: 'alert_tone' },
  custom: { channelId: 'alerts_custom_v2', name: 'Alerts - Custom', sound: '' },
};

function getChannelIdForSound(soundId: string): string {
  return SOUND_CHANNEL_MAP[soundId]?.channelId || SOUND_CHANNEL_MAP.original.channelId;
}

function getNextOccurrence(alarm: Alarm): Date | null {
  const now = new Date();
  const nowUTC = new Date(now.toISOString());
  
  if (alarm.isFixed || (alarm.repeatDays && alarm.repeatDays.length > 0)) {
    const currentDayOfWeek = nowUTC.getUTCDay();
    const currentHour = nowUTC.getUTCHours();
    const currentMinute = nowUTC.getUTCMinutes();
    
    for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
      const checkDay = (currentDayOfWeek + daysAhead) % 7;
      
      if (alarm.repeatDays.includes(checkDay)) {
        if (daysAhead === 0) {
          if (currentHour > alarm.hourUTC || 
              (currentHour === alarm.hourUTC && currentMinute >= alarm.minuteUTC)) {
            continue;
          }
        }
        
        const targetDate = new Date(nowUTC);
        targetDate.setUTCDate(targetDate.getUTCDate() + daysAhead);
        targetDate.setUTCHours(alarm.hourUTC, alarm.minuteUTC, 0, 0);
        return targetDate;
      }
    }
    return null;
  }
  
  if (alarm.dateUTC) {
    const [year, month, day] = alarm.dateUTC.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, alarm.hourUTC, alarm.minuteUTC, 0, 0));
    
    if (alarm.repeatWeekly) {
      while (targetDate <= nowUTC) {
        targetDate.setUTCDate(targetDate.getUTCDate() + 7);
      }
      return targetDate;
    }
    
    if (alarm.repeatMonthly) {
      while (targetDate <= nowUTC) {
        targetDate.setUTCMonth(targetDate.getUTCMonth() + 1);
      }
      return targetDate;
    }
    
    if (targetDate > nowUTC) {
      return targetDate;
    }
  }
  
  return null;
}

function alarmIdToNotificationId(alarmId: string): number {
  let hash = 0;
  for (let i = 0; i < alarmId.length; i++) {
    const char = alarmId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2147483647;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  
  try {
    const permStatus = await LocalNotifications.checkPermissions();
    
    if (permStatus.display === 'granted') {
      return true;
    }
    
    if (permStatus.display === 'denied') {
      console.warn('[Notifications] Permission denied');
      return false;
    }
    
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (e) {
    console.error('[Notifications] Permission request failed:', e);
    return false;
  }
}

export async function scheduleAlarmNotification(alarm: Alarm): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  if (!alarm.isEnabled) {
    await cancelAlarmNotification(alarm.id);
    return;
  }
  
  const nextOccurrence = getNextOccurrence(alarm);
  if (!nextOccurrence) {
    console.log(`[Notifications] No future occurrence for alarm: ${alarm.label}`);
    return;
  }
  
  const notificationId = alarmIdToNotificationId(alarm.id);
  
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  } catch (e) {
    // Ignore cancel errors
  }
  
  const soundId = migrateSoundId(alarm.soundId);
  const channelId = getChannelIdForSound(soundId);
  
  const scheduleOptions: ScheduleOptions = {
    notifications: [
      {
        id: notificationId,
        title: 'Trader Time Alert',
        body: alarm.label,
        schedule: {
          at: nextOccurrence,
          allowWhileIdle: true,
        },
        channelId: channelId,
        extra: {
          alarmId: alarm.id,
        },
      },
    ],
  };
  
  try {
    await LocalNotifications.schedule(scheduleOptions);
    console.log(`[Notifications] Scheduled: ${alarm.label} at ${nextOccurrence.toISOString()} on channel ${channelId}`);
  } catch (e) {
    console.error(`[Notifications] Failed to schedule ${alarm.label}:`, e);
  }
}

export async function cancelAlarmNotification(alarmId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  const notificationId = alarmIdToNotificationId(alarmId);
  
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    console.log(`[Notifications] Cancelled notification for alarm: ${alarmId}`);
  } catch (e) {
    console.error(`[Notifications] Failed to cancel notification:`, e);
  }
}

export async function rescheduleAllAlarms(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('[Notifications] No permission, cannot schedule alarms');
    return;
  }
  
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (e) {
    console.warn('[Notifications] Failed to clear pending notifications:', e);
  }
  
  const alarms = await getAlarms();
  
  for (const alarm of alarms) {
    if (alarm.isEnabled) {
      await scheduleAlarmNotification(alarm);
    }
  }
  
  console.log(`[Notifications] Rescheduled ${alarms.filter(a => a.isEnabled).length} alarms`);
}

export async function createNotificationChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  for (const [soundId, config] of Object.entries(SOUND_CHANNEL_MAP)) {
    try {
      if (config.sound) {
        await LocalNotifications.createChannel({
          id: config.channelId,
          name: config.name,
          description: `Trading alerts with ${soundId} sound`,
          importance: 5 as const,
          visibility: 1 as const,
          vibration: true,
          lights: true,
          sound: config.sound,
        });
      } else {
        await LocalNotifications.createChannel({
          id: config.channelId,
          name: config.name,
          description: `Trading alerts - choose sound in Android settings`,
          importance: 5 as const,
          visibility: 1 as const,
          vibration: true,
          lights: true,
        });
      }
      console.log(`[Notifications] Channel created: ${config.channelId}`);
    } catch (e) {
      console.log(`[Notifications] Channel ${config.channelId} may already exist`);
    }
  }
}

export async function initializeNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  await createNotificationChannels();
  await rescheduleAllAlarms();
  
  LocalNotifications.addListener('localNotificationReceived', async (notification) => {
    console.log('[Notifications] Received:', notification);
    
    if (notification.extra?.alarmId) {
      const alarms = await getAlarms();
      const alarm = alarms.find(a => a.id === notification.extra.alarmId);
      if (alarm && alarm.isEnabled) {
        setTimeout(() => scheduleAlarmNotification(alarm), 1000);
      }
    }
  });
}

export async function openAndroidNotificationSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }
  
  try {
    const { App } = await import('@capacitor/app');
    const appInfo = await App.getInfo();
    const packageName = appInfo.id;
    
    const intentUrl = `intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=${packageName};end`;
    
    window.location.href = intentUrl;
  } catch (e) {
    console.warn('[Notifications] Could not open Android notification settings:', e);
  }
}

export function isAndroidPlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}
