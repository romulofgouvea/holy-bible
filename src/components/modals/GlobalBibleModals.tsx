import React, { useMemo } from 'react';
import { useBible } from '../../hooks/useBible';
import { useBibleModals } from '../../hooks/useBibleModals';
import { useResponsive } from '../../hooks/useResponsive';
import { selectionHaptic } from '../../utils/haptics';
import { BibleBookModal } from './BibleBookModal';
import { BibleNumberModal } from './BibleNumberModal';
import { BibleVersionModal } from './BibleVersionModal';
import { StudyVerseSelectModal } from './StudyVerseSelectModal';
import { getBibleData } from '../../data';

export function GlobalBibleModals() {
  const { 
    activeModal, 
    closeAll, 
    options, 
    setActiveModal,
    navVersion,
    setNavVersion,
    navBook,
    setNavBook,
    navChapter,
    setNavChapter
  } = useBibleModals();
  
  const { 
    version: globalVersion,
    currentBook: globalBook,
    chapter: globalChapter,
    verse: globalVerse,
    versionBooks: globalVersionBooks
  } = useBible();

  const { ms } = useResponsive();

  // Initialize navVersion if it's empty
  React.useEffect(() => {
    if (!navVersion && globalVersion) {
      setNavVersion(globalVersion);
    }
  }, [globalVersion, navVersion]);

  const versionBooks = useMemo(() => {
    if (navVersion && navVersion !== globalVersion) {
      return getBibleData(navVersion);
    }
    return globalVersionBooks;
  }, [navVersion, globalVersion, globalVersionBooks]);

  const activeBook = navBook || globalBook;
  const activeChapterCount = activeBook?.chapters?.length || 0;
  const activeChapterNumbers = useMemo(() => Array.from({ length: activeChapterCount }, (_, i) => i + 1), [activeChapterCount]);

  const activeVerses = useMemo(() => {
    const ch = navChapter || globalChapter;
    const chapters = activeBook?.chapters || [];
    const versesInChapter = chapters[ch - 1] || [];
    return versesInChapter.map((text, i) => ({ verse: i + 1, text }));
  }, [activeBook, navChapter, globalChapter]);

  const activeVerseNumbers = useMemo(() => Array.from({ length: activeVerses.length }, (_, i) => i + 1), [activeVerses]);

  const isShowingCurrentBook = !navBook || navBook.abbrev === globalBook?.abbrev;
  const highlightedChapter = isShowingCurrentBook ? globalChapter : undefined;
  const isShowingCurrentChapter = isShowingCurrentBook && (!navChapter || navChapter === globalChapter);
  const highlightedVerse = isShowingCurrentChapter ? globalVerse : undefined;

  return (
    <>
      <BibleVersionModal
        visible={activeModal === 'version'}
        currentVersionSigla={navVersion || globalVersion}
        onClose={closeAll}
        onSelect={(v) => {
          selectionHaptic();
          setNavVersion(v.sigla);
          if (options.onSelect) {
            options.onSelect({ version: v.sigla });
          }
          if (activeModal === 'version' && !options.initialStep) {
             setActiveModal('book');
          } else {
             closeAll();
          }
        }}
      />
      <BibleBookModal
        visible={activeModal === 'book'}
        onClose={closeAll}
        books={versionBooks}
        currentBookAbbrev={isShowingCurrentBook ? globalBook?.abbrev : undefined}
        versionSigla={(navVersion || globalVersion).toUpperCase()}
        showVersionPill={true}
        onVersionPress={() => setActiveModal('version')}
        onSelect={(bookNameOrAbbrev) => {
          selectionHaptic();
          const selectedBookObj = versionBooks.find(b => b.abbrev === bookNameOrAbbrev || b.name === bookNameOrAbbrev) || null;
          setNavBook(selectedBookObj);
          setNavChapter(null);
          setActiveModal('chapter');
        }}
      />
      <BibleNumberModal
        visible={activeModal === 'chapter'}
        onClose={closeAll}
        onBack={() => setActiveModal('book')}
        title={activeBook?.name || 'Capítulos'}
        footerText="capítulos"
        iconName="list"
        items={activeChapterNumbers}
        currentItem={highlightedChapter}
        onSelect={(num) => {
          selectionHaptic();
          setNavChapter(num);
          if (options.skipVerseSelection) {
            if (options.onSelect) {
              options.onSelect({ 
                version: navVersion || globalVersion,
                book: activeBook,
                chapter: num
              });
            }
            closeAll();
          } else if (activeModal === 'chapter' && options.initialStep === 'book' && options.onConfirm) {
            // If we came from book selection and have a confirm callback, we probably want multiple verses
            setActiveModal('verses');
          } else {
            setActiveModal('verse');
          }
        }}
      />
      <BibleNumberModal
        visible={activeModal === 'verse'}
        onClose={closeAll}
        onBack={() => setActiveModal('chapter')}
        title={activeBook?.name ? `${activeBook.name} ${navChapter || globalChapter}` : 'Versículos'}
        footerText="versículos"
        iconName="hash"
        items={activeVerseNumbers}
        currentItem={highlightedVerse}
        onSelect={(num) => {
          selectionHaptic();
          if (options.onSelect) {
            options.onSelect({
              version: navVersion || globalVersion,
              book: activeBook,
              chapter: navChapter || globalChapter,
              verse: num
            });
          }
          closeAll();
        }}
      />
      <StudyVerseSelectModal
        visible={activeModal === 'verses'}
        onClose={closeAll}
        onBack={() => setActiveModal('chapter')}
        bookName={activeBook?.name || ''}
        chapter={navChapter || globalChapter}
        verses={activeVerses}
        onConfirm={(verses) => {
          if (options.onConfirm) {
            const verseObjects = verses.map(n => activeVerses.find(v => v.verse === n)!).filter(Boolean);
            options.onConfirm({
              version: navVersion || globalVersion,
              book: activeBook,
              chapter: navChapter || globalChapter,
              verses,
              verseObjects
            });
          }
          closeAll();
        }}
      />
    </>
  );
}
