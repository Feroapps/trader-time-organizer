export interface Alarm {
  id: string;
  label: string;
  utcHour: number;
  utcMinute: number;
  enabled: boolean;
}

export interface UserSettings {
  localTimezone: string;
  use24HourFormat: boolean;
  soundEnabled: boolean;
}
