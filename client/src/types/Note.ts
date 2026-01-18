export interface Note {
  id: string;
  dateUTC: string;
  timeUTC: string;
  text: string;
}

export type CreateNoteInput = Omit<Note, 'id'>;
