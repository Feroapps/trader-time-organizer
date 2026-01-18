export type { Alarm, CreateAlarmInput } from './Alarm';
export type { Note, CreateNoteInput } from './Note';

export interface UserSettings {
  localTimezone: string;
  use24HourFormat: boolean;
  soundEnabled: boolean;
}
