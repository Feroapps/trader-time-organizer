import { getAlarms } from '@/storage/alarmsRepo';
import { playAlarm } from '@/utils/soundPlayer';
import { shouldAlarmTrigger } from '@/utils/marketHours';
import type { Alarm } from '@/types/Alarm';

const CHECK_INTERVAL_MS = 10000;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastTriggeredKey: string | null = null;
let onFixedAlarmTriggered: (() => void) | null = null;

interface UtcTime {
  hours: number;
  minutes: number;
  dayOfWeek: number;
  year: number;
  month: number;
  dayOfMonth: number;
}

function getUtcTime(): UtcTime {
  const now = new Date();
  return {
    hours: now.getUTCHours(),
    minutes: now.getUTCMinutes(),
    dayOfWeek: now.getUTCDay(),
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
    dayOfMonth: now.getUTCDate(),
  };
}

function createTriggerKey(alarmId: string, hours: number, minutes: number, dayOfMonth: number): string {
  return `${alarmId}-${hours}-${minutes}-${dayOfMonth}`;
}

function parseAlarmDate(dateStr: string): { year: number; month: number; day: number; dayOfWeek: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    year,
    month: month - 1,
    day,
    dayOfWeek: date.getUTCDay(),
  };
}

function shouldTriggerAlarmCheck(alarm: Alarm, utcTime: UtcTime): boolean {
  if (!alarm.isEnabled) {
    return false;
  }

  if (alarm.hourUTC !== utcTime.hours || alarm.minuteUTC !== utcTime.minutes) {
    return false;
  }

  // Session Alerts (isFixed=true): use repeatDays array
  if (alarm.isFixed) {
    if (!alarm.repeatDays.includes(utcTime.dayOfWeek)) {
      return false;
    }
    if (!shouldAlarmTrigger(alarm.label, alarm.hourUTC, alarm.repeatDays, utcTime.dayOfWeek, utcTime.hours, alarm.isFixed)) {
      return false;
    }
    return true;
  }

  // User Alerts (isFixed=false): use dateUTC + repeatWeekly/repeatMonthly OR repeatDays
  if (alarm.repeatDays && alarm.repeatDays.length > 0) {
    // User alert with repeatDays
    if (!alarm.repeatDays.includes(utcTime.dayOfWeek)) {
      return false;
    }
    return true;
  }

  // User alert with dateUTC-based scheduling
  if (!alarm.dateUTC) {
    return false;
  }

  const alarmDate = parseAlarmDate(alarm.dateUTC);

  if (alarm.repeatWeekly) {
    if (alarmDate.dayOfWeek !== utcTime.dayOfWeek) {
      return false;
    }
  } else if (alarm.repeatMonthly) {
    if (alarmDate.day !== utcTime.dayOfMonth) {
      return false;
    }
  } else {
    // One-time alarm
    if (
      alarmDate.year !== utcTime.year ||
      alarmDate.month !== utcTime.month ||
      alarmDate.day !== utcTime.dayOfMonth
    ) {
      return false;
    }
  }

  return true;
}

async function checkAlarms(): Promise<void> {
  const utcTime = getUtcTime();
  const alarms = await getAlarms();

  for (const alarm of alarms) {
    if (shouldTriggerAlarmCheck(alarm, utcTime)) {
      const triggerKey = createTriggerKey(alarm.id, utcTime.hours, utcTime.minutes, utcTime.dayOfMonth);
      
      if (lastTriggeredKey !== triggerKey) {
        playAlarm(alarm.duration);
        lastTriggeredKey = triggerKey;
        
        if (alarm.isFixed && onFixedAlarmTriggered) {
          onFixedAlarmTriggered();
        }
      }
    }
  }
}

export function startScheduler(): void {
  if (schedulerInterval !== null) {
    return;
  }

  checkAlarms();
  schedulerInterval = setInterval(checkAlarms, CHECK_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (schedulerInterval === null) {
    return;
  }

  clearInterval(schedulerInterval);
  schedulerInterval = null;
  lastTriggeredKey = null;
}

export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}

export function setFixedAlarmCallback(callback: (() => void) | null): void {
  onFixedAlarmTriggered = callback;
}
