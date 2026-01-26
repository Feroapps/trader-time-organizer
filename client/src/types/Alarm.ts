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
}

export type CreateAlarmInput = Omit<Alarm, 'id'>;
