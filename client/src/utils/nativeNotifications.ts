import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import type { Alarm } from '@/types/Alarm';
import { getAlarms } from '@/storage/alarmsRepo';

const NOTIFICATION_CHANNEL_ID = 'trader_alerts';

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
  
  const soundId = alarm.soundId || 'original';
  let soundFile: string;
  if (soundId === 'original') {
    soundFile = 'original.mp3';
  } else {
    soundFile = soundId.replace(/-/g, '_') + '.wav';
  }
  
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
        sound: soundFile,
        channelId: NOTIFICATION_CHANNEL_ID,
        extra: {
          alarmId: alarm.id,
        },
      },
    ],
  };
  
  try {
    await LocalNotifications.schedule(scheduleOptions);
    console.log(`[Notifications] Scheduled: ${alarm.label} at ${nextOccurrence.toISOString()}`);
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

export async function createNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Trader Alerts',
      description: 'Trading session and custom alerts',
      importance: 5,
      visibility: 1,
      sound: 'original.mp3',
      vibration: true,
      lights: true,
    });
    console.log('[Notifications] Channel created');
  } catch (e) {
    console.error('[Notifications] Failed to create channel:', e);
  }
}

export async function initializeNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  await createNotificationChannel();
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
