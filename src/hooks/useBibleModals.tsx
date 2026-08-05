import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Book } from "../data/bible-version";

type ModalType = "version" | "book" | "chapter" | "verse" | "verses" | null;

interface SelectionData {
  version?: string;
  book?: Book;
  chapter?: number;
  verse?: number;
  verses?: number[];
  verseObjects?: { verse: number; text: string }[];
}

interface BibleModalOptions {
  initialStep?: ModalType;
  onSelect?: (selection: SelectionData) => void;
  onConfirm?: (selection: SelectionData) => void;
  skipChapterSelection?: boolean;
  skipVerseSelection?: boolean;
  initialVersion?: string;
  initialBook?: Book;
  initialChapter?: number;
  target?: "read" | "search" | "study";
}

interface BibleModalContextType {
  activeModal: ModalType;
  options: BibleModalOptions;
  openModal: (options: BibleModalOptions) => void;
  closeAll: () => void;
  setActiveModal: (modal: ModalType) => void;

  // Navigation state (separate from global app state, used for the selection flow)
  navVersion: string;
  setNavVersion: (v: string) => void;
  navBook: Book | null;
  setNavBook: (b: Book | null) => void;
  navChapter: number | null;
  setNavChapter: (c: number | null) => void;
}

const BibleModalContext = createContext<BibleModalContextType | undefined>(
  undefined,
);

export function BibleModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [options, setOptions] = useState<BibleModalOptions>({});

  const [navVersion, setNavVersion] = useState<string>("");
  const [navBook, setNavBook] = useState<Book | null>(null);
  const [navChapter, setNavChapter] = useState<number | null>(null);

  const openModal = useCallback((newOptions: BibleModalOptions) => {
    setOptions(newOptions);
    setActiveModal(newOptions.initialStep || "book");
  }, []);

  const closeAll = useCallback(() => {
    setActiveModal(null);
    setNavBook(null);
    setNavChapter(null);
  }, []);

  const value = useMemo(
    () => ({
      activeModal,
      options,
      openModal,
      closeAll,
      setActiveModal,
      navVersion,
      setNavVersion,
      navBook,
      setNavBook,
      navChapter,
      setNavChapter,
    }),
    [
      activeModal,
      options,
      openModal,
      closeAll,
      navVersion,
      navBook,
      navChapter,
    ],
  );

  return (
    <BibleModalContext.Provider value={value}>
      {children}
    </BibleModalContext.Provider>
  );
}

export function useBibleModals() {
  const context = useContext(BibleModalContext);
  if (!context) {
    throw new Error("useBibleModals must be used within a BibleModalProvider");
  }
  return context;
}
