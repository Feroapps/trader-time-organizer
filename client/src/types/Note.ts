export interface Note {
  id: string;
  dateUTC: string;
  timeUTC: string;
  text: string;
  imageData?: string;
  createdAt: string;
}

export type CreateNoteInput = Omit<Note, 'id'>;
