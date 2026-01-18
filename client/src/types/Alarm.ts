export interface Alarm {
  id: string;
  hourUTC: number;
  minuteUTC: number;
  repeatDays: number[];
  label: string;
  isEnabled: boolean;
  isFixed: boolean;
  duration: number;
}

export type CreateAlarmInput = Omit<Alarm, 'id'>;
