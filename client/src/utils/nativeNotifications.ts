import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import type { Alarm } from '@/types/Alarm';
import { getAlarms } from '@/storage/alarmsRepo';
import { migrateSoundId } from '@/utils/soundLibrary';
import { getSelectedSoundId } from '@/utils/soundLibrary';
import { scheduleUserAlarmNative, cancelUserAlarmNative, isAndroidNative, isIOSNative, canScheduleExactAlarmsNative } from '@/utils/userAlarmPlugin';

const SOUND_CHANNEL_MAP: Record<string, { channelId: string; name: string; sound: string }> = {
  original: { channelId: 'alerts_original_v2', name: 'Alerts - Original', sound: 'alert_original' },
  classic: { channelId: 'alerts_classic_v2', name: 'Alerts - Classic', sound: 'alert_classic' },
  chime: { channelId: 'alerts_chime_v2', name: 'Alerts - Chime', sound: 'alert_chime' },
  bell: { channelId: 'alerts_bell_v2', name: 'Alerts - Bell', sound: 'alert_bell' },
  ping: { channelId: 'alerts_ping_v2', name: 'Alerts - Ping', sound: 'alert_ping' },
  tone: { channelId: 'alerts_tone_v2', name: 'Alerts - Tone', sound: 'alert_tone' },
  custom: { channelId: 'alerts_custom_v2', name: 'Alerts - Custom', sound: '' },
};

const PAST_TOLERANCE_MS = 3000;

function getChannelIdForSound(soundId: string): string {
  return SOUND_CHANNEL_MAP[soundId]?.channelId || SOUND_CHANNEL_MAP.original.channelId;
}

function getNextOccurrence(alarm: Alarm): Date | null {
  const now = new Date();
  const nowUTC = new Date(now.toISOString());
  const days = Array.isArray(alarm.repeatDays) ? alarm.repeatDays : [];

  if (alarm.isFixed || days.length > 0) {
    const currentDayOfWeek = nowUTC.getUTCDay();
    const currentHour = nowUTC.getUTCHours();
    const currentMinute = nowUTC.getUTCMinutes();

    for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
      const checkDay = (currentDayOfWeek + daysAhead) % 7;

      if (days.includes(checkDay)) {
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

const SESSION_ALERT_ID_BASE = 900000;
const SESSION_ALERT_ID_MAX = 900100;

function alarmIdToNotificationId(alarmId: string): number {
  const sessionMatch = alarmId.match(/^session_alert_(\d+)$/);
  if (sessionMatch) {
    const offset = parseInt(sessionMatch[1], 10);
    return SESSION_ALERT_ID_BASE + offset;
  }

  let hash = 0;
  for (let i = 0; i < alarmId.length; i++) {
    const char = alarmId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let result = Math.abs(hash) % 2147483647;

  if (result >= SESSION_ALERT_ID_BASE && result <= SESSION_ALERT_ID_MAX) {
    result = result + SESSION_ALERT_ID_MAX + 1;
  }

  return result;
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
  console.log(`[Notifications] ===== scheduleAlarmNotification ENTERED =====`);
  console.log(`[Notifications] Alarm ID: ${alarm.id}`);
  console.log(`[Notifications] Label: ${alarm.label}`);
  console.log(`[Notifications] isFixed: ${alarm.isFixed}`);
  console.log(`[Notifications] isEnabled: ${alarm.isEnabled}`);
  console.log(`[Notifications] isNativePlatform: ${Capacitor.isNativePlatform()}`);
  console.log(`[Notifications] Platform: ${Capacitor.getPlatform()}`);

  if (!Capacitor.isNativePlatform()) {
    console.log(`[Notifications] NOT native platform - returning`);
    return;
  }

  if (!alarm.isEnabled) {
    console.log(`[Notifications] Alarm disabled - cancelling (isUserAlarm: ${!alarm.isFixed})`);
    await cancelAlarmNotification(alarm.id, !alarm.isFixed);
    return;
  }

  const nextOccurrence = getNextOccurrence(alarm);

  if (!nextOccurrence) {
    console.log(`[Notifications] No future occurrence for alarm: ${alarm.label}`);
    return;
  }

  const triggerTimeMs = nextOccurrence.getTime();
  const now = Date.now();
  const deltaMs = triggerTimeMs - now;

  console.log(`[Notifications] Current time (ms): ${now}`);
  console.log(`[Notifications] Current time (ISO): ${new Date(now).toISOString()}`);
  console.log(`[Notifications] Trigger time (ms): ${triggerTimeMs}`);
  console.log(`[Notifications] Trigger time (ISO): ${nextOccurrence.toISOString()}`);
  console.log(`[Notifications] Time until trigger (ms): ${deltaMs}`);
  console.log(`[Notifications] Time until trigger (sec): ${Math.round(deltaMs / 1000)}`);

  if (deltaMs <= -PAST_TOLERANCE_MS) {
    console.error(`[Notifications] ERROR: Trigger time is in the PAST beyond tolerance! delta=${deltaMs}ms tolerance=${PAST_TOLERANCE_MS}ms`);
    return;
  }

  const soundId = migrateSoundId(alarm.soundId);
  console.log(`[Notifications] Sound ID: ${soundId}`);


  await cancelAlarmNotification(alarm.id, !alarm.isFixed);

  // Fixed trading sessions are handled by native exact scheduling (FixedSessionScheduler).
  // Prevent duplicate notifications on Android.
  if (alarm.isFixed && isAndroidNative()) {
    console.log('[Notifications] Skipping fixed session scheduling in TS (Android native handles it).');
    return;
  }

  if (!alarm.isFixed && isAndroidNative()) {
  console.log('[Notifications] ===== SCHEDULING USER ALARM VIA ANDROID NATIVE =====');

  const soundId = getSelectedSoundId();

  const success = await scheduleUserAlarmNative(
    alarm.id,
    alarm.label,
    nextOccurrence,
    soundId
  );

  console.log(`[Notifications] scheduleUserAlarmNative returned: ${success}`);
  console.log('[Notifications] User alarm scheduled via AlarmManager');
  return;
}

  if (!alarm.isFixed && isIOSNative()) {
    await scheduleIOSUserAlarm(alarm, nextOccurrence, soundId);
    return;
  }

  const notificationId = alarmIdToNotificationId(alarm.id);
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
        smallIcon: 'ic_stat_session',
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

async function scheduleIOSUserAlarm(alarm: Alarm, triggerTime: Date, soundId: string): Promise<void> {
  const baseId = alarmIdToNotificationId(alarm.id);

  try {
    await LocalNotifications.cancel({ 
      notifications: [
        { id: baseId },
        { id: baseId + 1 },
        { id: baseId + 2 },
        { id: baseId + 3 },
      ] 
    });
  } catch (e) {
    // Ignore cancel errors
  }

  const channelId = getChannelIdForSound(soundId);

  const actionTypeId = 'USER_ALARM_ACTIONS';
  const deepLinkUrl = `tradertime://alarm?alarmId=${alarm.id}`;

  const notifications = [
    {
      id: baseId,
      title: 'Trader Time Alert',
      body: alarm.label,
      schedule: {
        at: triggerTime,
        allowWhileIdle: true,
      },
      channelId: channelId,
      actionTypeId: actionTypeId,
      extra: {
        alarmId: alarm.id,
        isUserAlarm: true,
        reminderIndex: 0,
        deepLink: deepLinkUrl,
      },
    },
    {
      id: baseId + 1,
      title: 'Trader Time Alert - Reminder',
      body: alarm.label,
      schedule: {
        at: new Date(triggerTime.getTime() + 30000),
        allowWhileIdle: true,
      },
      channelId: channelId,
      actionTypeId: actionTypeId,
      extra: {
        alarmId: alarm.id,
        isUserAlarm: true,
        reminderIndex: 1,
        deepLink: deepLinkUrl,
      },
    },
    {
      id: baseId + 2,
      title: 'Trader Time Alert - Reminder',
      body: alarm.label,
      schedule: {
        at: new Date(triggerTime.getTime() + 60000),
        allowWhileIdle: true,
      },
      channelId: channelId,
      actionTypeId: actionTypeId,
      extra: {
        alarmId: alarm.id,
        isUserAlarm: true,
        reminderIndex: 2,
        deepLink: deepLinkUrl,
      },
    },
    {
      id: baseId + 3,
      title: 'Trader Time Alert - Final Reminder',
      body: alarm.label,
      schedule: {
        at: new Date(triggerTime.getTime() + 90000),
        allowWhileIdle: true,
      },
      channelId: channelId,
      actionTypeId: actionTypeId,
      extra: {
        alarmId: alarm.id,
        isUserAlarm: true,
        reminderIndex: 3,
        deepLink: deepLinkUrl,
      },
    },
  ];

  try {
    await LocalNotifications.schedule({ notifications });
    console.log(`[Notifications] iOS user alarm scheduled with reminders: ${alarm.label}`);
  } catch (e) {
    console.error(`[Notifications] Failed to schedule iOS user alarm ${alarm.label}:`, e);
  }
}

export async function cancelAlarmNotification(alarmId: string, isUserAlarm: boolean = false): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  if (isUserAlarm && isAndroidNative()) {
    await cancelUserAlarmNative(alarmId);
  }

  const notificationId = alarmIdToNotificationId(alarmId);

  try {
    // iOS user alarms schedule multiple local notifications (baseId..baseId+3)
    const idsToCancel =
      isUserAlarm && isIOSNative()
        ? [notificationId, notificationId + 1, notificationId + 2, notificationId + 3]
        : [notificationId];

    await LocalNotifications.cancel({
      notifications: idsToCancel.map((id) => ({ id })),
    });

    console.log(`[Notifications] Cancelled notification for alarm: ${alarmId}`);
  } catch (e) {
    console.error(`[Notifications] Failed to cancel notification:`, e);
  }
}

export async function rescheduleAllAlarms(): Promise<void> {
  console.log(`[Notifications] ===== rescheduleAllAlarms ENTERED =====`);
  console.log(`[Notifications] isNativePlatform: ${Capacitor.isNativePlatform()}`);
  console.log(`[Notifications] Platform: ${Capacitor.getPlatform()}`);

  if (!Capacitor.isNativePlatform()) {
    console.log(`[Notifications] NOT native platform - returning`);
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  console.log(`[Notifications] hasPermission: ${hasPermission}`);

  if (!hasPermission) {
    console.warn('[Notifications] No permission, cannot schedule alarms');
    return;
  }

  const alarms = await getAlarms();
  console.log(`[Notifications] Total alarms in storage: ${alarms.length}`);

  const enabledAlarms = alarms.filter(a => a.isEnabled);
  console.log(`[Notifications] Enabled alarms: ${enabledAlarms.length}`);

  for (const alarm of enabledAlarms) {
    console.log(`[Notifications] Processing alarm: ${alarm.id} - ${alarm.label} (isFixed: ${alarm.isFixed})`);
    await scheduleAlarmNotification(alarm);
  }

  console.log(`[Notifications] ===== rescheduleAllAlarms COMPLETED - ${enabledAlarms.length} alarms processed =====`);
}

export async function checkExactAlarmPermission(): Promise<{ granted: boolean; needsUserAction: boolean }> {
  if (!isAndroidNative()) {
    return { granted: true, needsUserAction: false };
  }

  const canSchedule = await canScheduleExactAlarmsNative();

  if (!canSchedule) {
    console.warn('[Notifications] Exact alarm permission not granted');
    return { granted: false, needsUserAction: true };
  }

  return { granted: true, needsUserAction: false };
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!isAndroidNative()) {
    return;
  }

  try {
    const { App } = await import('@capacitor/app');
    const appInfo = await App.getInfo();
    const packageName = appInfo.id;

    const exactAlarmUrl = `intent:#Intent;action=android.settings.REQUEST_SCHEDULE_EXACT_ALARM;S.android.provider.extra.APP_PACKAGE=${packageName};end`;
    window.location.href = exactAlarmUrl;
  } catch (e) {
    console.error('[Notifications] Failed to open exact alarm settings:', e);

    try {
      window.location.href = 'intent:#Intent;action=android.settings.REQUEST_SCHEDULE_EXACT_ALARM;end';
    } catch (e2) {
      console.error('[Notifications] Fallback also failed:', e2);
    }
  }
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

  const hasPermission = await requestNotificationPermissions();
  console.log('[Notifications] Permission granted:', hasPermission);

  if (!hasPermission) {
    console.warn('[Notifications] No permission – abort initialization');
    return;
  }

  await createNotificationChannels();
  await rescheduleAllAlarms();
  }

  await createNotificationChannels();
  await rescheduleAllAlarms();

  LocalNotifications.addListener('localNotificationReceived', async (notification) => {
    console.log('[Notifications] Received:', notification);

    if (notification.extra?.alarmId && !notification.extra?.isUserAlarm) {
      const alarms = await getAlarms();
      const alarm = alarms.find(a => a.id === notification.extra.alarmId);
      if (alarm && alarm.isEnabled && alarm.isFixed) {
        setTimeout(() => scheduleAlarmNotification(alarm), 1000);
      }
    }
  });

  LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
    console.log('[Notifications] Action performed:', action);

    const alarmId = action.notification.extra?.alarmId;
    const isUserAlarm = action.notification.extra?.isUserAlarm;

    if (alarmId && isUserAlarm) {
      const alarmPath = `/alarm?alarmId=${alarmId}`;

      if (isIOSNative()) {
        window.location.hash = alarmPath;
        setTimeout(() => {
          if (!window.location.hash.includes('alarm')) {
            window.location.href = window.location.origin + '/#' + alarmPath;
          }
        }, 100);
      } else {
        const deepLink = action.notification.extra?.deepLink;
        if (deepLink) {
          window.location.href = deepLink;
        }
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

    const notificationSettingsUrl = `intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=${packageName};end`;

    try {
      window.location.href = notificationSettingsUrl;
      return;
    } catch (e1) {
      console.warn('[Notifications] APP_NOTIFICATION_SETTINGS failed:', e1);
    }

    try {
      const appDetailsUrl = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${packageName};end`;
      window.location.href = appDetailsUrl;
      return;
    } catch (e2) {
      console.warn('[Notifications] APPLICATION_DETAILS_SETTINGS failed:', e2);
    }

    try {
      const generalSettingsUrl = `intent:#Intent;action=android.settings.SETTINGS;end`;
      window.location.href = generalSettingsUrl;
      return;
    } catch (e3) {
      console.warn('[Notifications] General settings fallback failed:', e3);
    }

  } catch (e) {
    console.warn('[Notifications] Could not open Android notification settings:', e);
  }
}

export async function openAndroidAlarmSoundSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    const alarmSoundUrl = `intent:#Intent;action=android.intent.action.RINGTONE_PICKER;i.android.intent.extra.ringtone.TYPE=4;end`;
    window.location.href = alarmSoundUrl;
  } catch (e) {
    console.warn('[Notifications] Could not open Android alarm sound settings:', e);
  }
}

export async function openAndroidBatteryOptimizationSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  const tryIntent = (intentUrl: string): boolean => {
    try {
      window.location.href = intentUrl;
      return true;
    } catch {
      return false;
    }
  };

  try {
    const { App } = await import('@capacitor/app');
    const appInfo = await App.getInfo();
    const pkg = appInfo.id;

    const intents = [
      `intent:#Intent;action=android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS;data=package:${pkg};end`,
      `intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end`,
      `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${pkg};end`,
      `intent:#Intent;action=android.settings.BATTERY_SAVER_SETTINGS;end`,
      `intent:#Intent;action=android.settings.SETTINGS;end`,
    ];

    for (const url of intents) {
      if (tryIntent(url)) return;
    }
  } catch (e) {
    console.warn('[Notifications] Could not open battery optimization settings:', e);
  }
}

export function isAndroidPlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}
