import { getAlarms } from '@/storage/alarmsRepo';
import type { Alarm } from '@/types/Alarm';

const CHECK_INTERVAL_MS = 30000; // 30 seconds
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastTriggeredKey: string | null = null;

function getUtcTime(): { hours: number; minutes: number; dayOfWeek: number } {
  const now = new Date();
  return {
    hours: now.getUTCHours(),
    minutes: now.getUTCMinutes(),
    dayOfWeek: now.getUTCDay(),
  };
}

function createTriggerKey(alarmId: string, hours: number, minutes: number): string {
  return `${alarmId}-${hours}-${minutes}`;
}

function shouldTriggerAlarm(alarm: Alarm, utcTime: { hours: number; minutes: number; dayOfWeek: number }): boolean {
  if (!alarm.isEnabled) {
    return false;
  }

  if (alarm.hourUTC !== utcTime.hours || alarm.minuteUTC !== utcTime.minutes) {
    return false;
  }

  if (!alarm.repeatDays.includes(utcTime.dayOfWeek)) {
    return false;
  }

  return true;
}

async function checkAlarms(): Promise<void> {
  const utcTime = getUtcTime();
  const alarms = await getAlarms();

  for (const alarm of alarms) {
    if (shouldTriggerAlarm(alarm, utcTime)) {
      const triggerKey = createTriggerKey(alarm.id, utcTime.hours, utcTime.minutes);
      
      if (lastTriggeredKey !== triggerKey) {
        const timeStr = `${alarm.hourUTC.toString().padStart(2, '0')}:${alarm.minuteUTC.toString().padStart(2, '0')} UTC`;
        console.log(`ALARM TRIGGERED: ${alarm.label} (${timeStr})`);
        lastTriggeredKey = triggerKey;
      }
    }
  }
}

export function startScheduler(): void {
  if (schedulerInterval !== null) {
    console.log('[Scheduler] Already running');
    return;
  }

  console.log('[Scheduler] Starting alarm scheduler (30s interval)');
  checkAlarms();
  schedulerInterval = setInterval(checkAlarms, CHECK_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (schedulerInterval === null) {
    console.log('[Scheduler] Not running');
    return;
  }

  console.log('[Scheduler] Stopping alarm scheduler');
  clearInterval(schedulerInterval);
  schedulerInterval = null;
  lastTriggeredKey = null;
}

export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
