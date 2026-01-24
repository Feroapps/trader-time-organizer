export interface Alarm {
  id: string;
  hourUTC: number;
  minuteUTC: number;
  label: string;
  isFixed: boolean;
  duration: number;
  soundId?: string;
  repeatDays?: number[];
  dateUTC?: string;
  repeatWeekly?: boolean;
  repeatMonthly?: boolean;
}

export type CreateAlarmInput = Omit<Alarm, 'id'>;
