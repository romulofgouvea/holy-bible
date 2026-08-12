import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useMemo } from "react";
import { DeviceEventEmitter } from "react-native";
import { STORAGE_KEYS } from "../constants/storage";
import { SelectedVerse, VerseNote } from "../models";
import { BACKUP_RESTORED_EVENT, writeAutoBackupFile } from "../utils/backup";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useNotes() {
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Unique ID for this instance to prevent redundant reloads
  const hookInstanceId = useMemo(() => Math.random().toString(36).slice(2), []);

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
    const subBackup = DeviceEventEmitter.addListener(
      BACKUP_RESTORED_EVENT,
      reloadFromStorage,
    );

    const subUpdate = DeviceEventEmitter.addListener(
      "NOTES_UPDATED_EVENT",
      (data?: { senderId?: string }) => {
        // Only reload if the update came from another instance
        if (data?.senderId !== hookInstanceId) {
          reloadFromStorage();
        }
      },
    );

    return () => {
      subBackup.remove();
      subUpdate.remove();
    };
  }, [reloadFromStorage, hookInstanceId]);

  const persist = useCallback(
    (updated: VerseNote[]) => {
      setNotes(updated);
      AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated))
        .then(() => {
          // Notify other instances to reload
          DeviceEventEmitter.emit("NOTES_UPDATED_EVENT", {
            senderId: hookInstanceId,
          });
        })
        .catch(() => {});

      AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP)
        .then((val) => {
          if (val === "true") writeAutoBackupFile().catch(() => {});
        })
        .catch(() => {});
    },
    [hookInstanceId],
  );

  const saveNote = useCallback(
    (verses: Omit<SelectedVerse, "text">[], text: string) => {
      if (verses.length === 0) return;

      const trimmedText = text.trim();
      let updatedNotes = [...notes];

      const newVerseKeys = new Set(
        verses.map((v) => `${v.bookAbbrev}-${v.chapter}-${v.verse}`),
      );

      // Find any existing note that shares at least one verse with the new selection
      const existingNoteIndex = updatedNotes.findIndex(
        (note) =>
          note.selectedVerses &&
          Array.isArray(note.selectedVerses) &&
          note.selectedVerses.some((v) =>
            newVerseKeys.has(`${v.bookAbbrev}-${v.chapter}-${v.verse}`),
          ),
      );

      if (!trimmedText) {
        // If text is empty, delete the note if it exists
        if (existingNoteIndex !== -1) {
          updatedNotes.splice(existingNoteIndex, 1);
        }
      } else {
        const now = Date.now();
        if (existingNoteIndex !== -1) {
          // Merge with existing note
          const existingNote = updatedNotes[existingNoteIndex];
          const combinedVerses = [...existingNote.selectedVerses];
          const existingKeys = new Set(
            existingNote.selectedVerses.map(
              (v) => `${v.bookAbbrev}-${v.chapter}-${v.verse}`,
            ),
          );

          verses.forEach((v) => {
            if (!existingKeys.has(`${v.bookAbbrev}-${v.chapter}-${v.verse}`)) {
              combinedVerses.push(v);
            }
          });

          updatedNotes[existingNoteIndex] = {
            ...existingNote,
            selectedVerses: combinedVerses.sort((a, b) =>
              a.chapter !== b.chapter
                ? a.chapter - b.chapter
                : a.verse - b.verse,
            ),
            text: trimmedText,
            updatedAt: now,
          };
        } else {
          // Create new note
          const newNote: VerseNote = {
            id: makeId(),
            selectedVerses: verses.sort((a, b) =>
              a.chapter !== b.chapter
                ? a.chapter - b.chapter
                : a.verse - b.verse,
            ),
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
      if (note.selectedVerses && Array.isArray(note.selectedVerses)) {
        note.selectedVerses.forEach((v) => {
          const key = `${v.bookAbbrev}-${v.chapter}-${v.verse}`;
          map[key] = note;
        });
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
