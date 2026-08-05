import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useMemo } from "react";
import { DeviceEventEmitter } from "react-native";
import { STORAGE_KEYS } from "../constants/storage";
import { VerseNote } from "../models";
import { BACKUP_RESTORED_EVENT, writeAutoBackupFile } from "../utils/backup";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useNotes() {
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reloadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      if (raw) {
        const parsed = JSON.parse(raw) as VerseNote[];
        setNotes(parsed.sort((a, b) => b.updatedAt - a.updatedAt));
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    reloadFromStorage();
    const sub = DeviceEventEmitter.addListener(
      BACKUP_RESTORED_EVENT,
      reloadFromStorage,
    );
    return () => sub.remove();
  }, [reloadFromStorage]);

  const persist = useCallback((updated: VerseNote[]) => {
    setNotes(updated);
    AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated)).catch(
      () => {},
    );

    AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP)
      .then((val) => {
        if (val === "true") writeAutoBackupFile().catch(() => {});
      })
      .catch(() => {});
  }, []);

  const saveNote = useCallback(
    (
      abbrev: string,
      chapter: number,
      verse: number,
      text: string,
      verseEnd?: number,
    ) => {
      const trimmedText = text.trim();

      // Find if we already have a note for this specific base verse
      const existingIndex = notes.findIndex(
        (n) =>
          n.abbrev === abbrev && n.chapter === chapter && n.verse === verse,
      );

      let updatedNotes = [...notes];

      if (!trimmedText) {
        // If text is empty, delete the note if it exists
        if (existingIndex !== -1) {
          updatedNotes.splice(existingIndex, 1);
        }
      } else {
        const now = Date.now();
        if (existingIndex !== -1) {
          // Update existing note
          updatedNotes[existingIndex] = {
            ...updatedNotes[existingIndex],
            text: trimmedText,
            verseEnd,
            updatedAt: now,
          };
        } else {
          // Create new note
          const newNote: VerseNote = {
            id: makeId(),
            abbrev,
            chapter,
            verse,
            verseEnd,
            text: trimmedText,
            createdAt: now,
            updatedAt: now,
          };
          updatedNotes.unshift(newNote);
        }
      }

      persist(updatedNotes.sort((a, b) => b.updatedAt - a.updatedAt));
    },
    [notes, persist],
  );

  const deleteNote = useCallback(
    (id: string) => {
      const updatedNotes = notes.filter((n) => n.id !== id);
      persist(updatedNotes);
    },
    [notes, persist],
  );

  // Derived state: map of notes for quick lookup by verse key `${abbrev}-${chapter}-${verse}`
  const notesMap = useMemo(() => {
    const map: Record<string, VerseNote> = {};
    notes.forEach((note) => {
      const key = `${note.abbrev}-${note.chapter}-${note.verse}`;
      map[key] = note;
      // Also map verseEnd range if applicable so each verse in range highlights/resolves
      if (note.verseEnd && note.verseEnd > note.verse) {
        for (let v = note.verse + 1; v <= note.verseEnd; v++) {
          map[`${note.abbrev}-${note.chapter}-${v}`] = note;
        }
      }
    });
    return map;
  }, [notes]);

  return {
    notes,
    notesMap,
    isLoaded,
    saveNote,
    deleteNote,
    reloadFromStorage,
  };
}
