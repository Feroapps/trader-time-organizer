export interface MarketStatus {
  isOpen: boolean;
  reason: 'open' | 'saturday' | 'sunday_before_sydney';
  utcDay: number;
  utcHour: number;
}

export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  // Saturday: fully closed
  if (utcDay === 6) {
    return { isOpen: false, reason: 'saturday', utcDay, utcHour };
  }
  
  // Sunday before 21:00 UTC: closed until Sydney opens
  if (utcDay === 0 && utcHour < 21) {
    return { isOpen: false, reason: 'sunday_before_sydney', utcDay, utcHour };
  }

  // Sunday 21:00+ and Monday-Friday: market open
  return { isOpen: true, reason: 'open', utcDay, utcHour };
}

export function shouldAlarmTrigger(
  alarmLabel: string,
  alarmHourUTC: number,
  alarmRepeatDays: number[],
  utcDay: number,
  utcHour: number
): boolean {
  const status = getMarketStatus();

  // Special case: Sydney session alarm at Sunday 21:00 UTC
  if (alarmLabel === "Start of Sydney session" && utcDay === 0 && utcHour === 21) {
    return true;
  }

  // All other alarms suppressed when market closed
  if (!status.isOpen) {
    return false;
  }

  return true;
}
