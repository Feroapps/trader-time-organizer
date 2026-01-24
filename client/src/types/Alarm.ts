export interface Alarm {
  id: string;
  dateUTC: string;
  hourUTC: number;
  minuteUTC: number;
  repeatWeekly: boolean;
  repeatMonthly: boolean;
  repeatDays?: number[];
  label: string;
  isFixed: boolean;
  duration: number;
  soundId?: string;
}

export type CreateAlarmInput = Omit<Alarm, 'id'>;
