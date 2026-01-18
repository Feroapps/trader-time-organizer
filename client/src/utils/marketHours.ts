export interface MarketStatus {
  isOpen: boolean;
  reason: 'open' | 'saturday' | 'sunday_before_sydney' | 'friday_after_close';
  utcDay: number;
  utcHour: number;
}

export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  if (utcDay === 6) {
    return { isOpen: false, reason: 'saturday', utcDay, utcHour };
  }
  
  if (utcDay === 0 && utcHour < 21) {
    return { isOpen: false, reason: 'sunday_before_sydney', utcDay, utcHour };
  }
  
  if (utcDay === 5 && utcHour >= 21) {
    return { isOpen: false, reason: 'friday_after_close', utcDay, utcHour };
  }

  return { isOpen: true, reason: 'open', utcDay, utcHour };
}

export function logMarketStatus(status: MarketStatus): void {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (!status.isOpen) {
    console.log(`[Market] ${dayNames[status.utcDay]} ${status.utcHour}:xx UTC - MARKET CLOSED (${status.reason})`);
  } else {
    console.log(`[Market] ${dayNames[status.utcDay]} ${status.utcHour}:xx UTC - MARKET OPEN`);
  }
}

export function shouldAlarmTrigger(
  alarmLabel: string,
  alarmHourUTC: number,
  alarmRepeatDays: number[],
  utcDay: number,
  utcHour: number
): boolean {
  const status = getMarketStatus();

  if (alarmLabel === "Start of Sydney session" && utcDay === 0 && utcHour === 21) {
    console.log(`[Market] Sunday 21:00 UTC - Sydney session alarm ACTIVE`);
    return true;
  }

  if (!status.isOpen) {
    console.log(`[Market] Alarm "${alarmLabel}" SUPPRESSED - market closed (${status.reason})`);
    return false;
  }

  return true;
}

export function logWeekendLogicApplied(): void {
  console.log("WEEKEND_LOGIC_APPLIED");
}
