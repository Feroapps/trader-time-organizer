export type { Alarm, CreateAlarmInput } from './Alarm';

export interface UserSettings {
  localTimezone: string;
  use24HourFormat: boolean;
  soundEnabled: boolean;
}
