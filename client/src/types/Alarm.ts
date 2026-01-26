export interface Alarm {
  id: string;
  hourUTC: number;
  minuteUTC: number;
  label: string;
  isFixed: boolean;
  duration: number;
  soundId?: string;
  
  // For Session Alerts (isFixed=true): fires on ALL days in repeatDays array
  repeatDays: number[];
  isEnabled: boolean;
  
  // For User Alerts (isFixed=false): date-based scheduling
  dateUTC?: string;
  repeatWeekly?: boolean;
  repeatMonthly?: boolean;
  
  // For User Alerts (isFixed=false): snooze duration in minutes (default 60)
  snoozeMinutes?: number;
}

export type CreateAlarmInput = Omit<Alarm, 'id'>;

// Valid snooze options for user-created alerts
export const SNOOZE_OPTIONS = [60, 120, 180] as const;
export const DEFAULT_SNOOZE_MINUTES = 60;
