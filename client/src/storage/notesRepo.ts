import localforage from 'localforage';
import type { Note, CreateNoteInput } from '@/types/Note';

const NOTES_KEY = 'notes';

function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function getNotes(): Promise<Note[]> {
  const notes = await localforage.getItem<Note[]>(NOTES_KEY);
  return notes || [];
}

export async function getNotesByDate(dateUTC: string): Promise<Note[]> {
  const notes = await getNotes();
  return notes.filter((note) => note.dateUTC === dateUTC);
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const notes = await getNotes();
  const newNote: Note = {
    ...input,
    id: generateId(),
  };
  notes.push(newNote);
  await localforage.setItem(NOTES_KEY, notes);
  return newNote;
}

export async function deleteNote(id: string): Promise<boolean> {
  const notes = await getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) {
    return false;
  }
  notes.splice(index, 1);
  await localforage.setItem(NOTES_KEY, notes);
  return true;
}

export async function clearAllNotes(): Promise<void> {
  await localforage.removeItem(NOTES_KEY);
}
