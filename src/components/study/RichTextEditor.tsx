import { COLOR_THEMES, COMMON_COLORS, getSupportColors, VERSE_HIGHLIGHTS } from '@/constants/colors';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useReaderSettings } from '../../hooks/use-reader-settings';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { impactLight, selectionHaptic } from '../../utils/haptics';
import { BibleDivider } from '../BibleDivider';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';

export type RichTextEditorRef = {
  insertVerseHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  onOpenVersePicker: () => void;
  showToolbar?: boolean;
  readonly?: boolean;
};

export const RichTextEditor = React.forwardRef<RichTextEditorRef, Props>(({ initialHtml, onChange, onOpenVersePicker, showToolbar = true, readonly = false }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const webIframeRef = useRef<any>(null);
  const { colors: themeColors, colorTheme, isDarkMode } = useTheme();
  const { ms } = useResponsive();
  const { readerColors, readerTheme, readerFontFamily } = useReaderSettings();


  const colors = useMemo(() => {
    if (readerTheme === 'sepia') {
      const active = Object.entries(COLOR_THEMES).map(([key, value]) => ({ key, ...value }))
        .find(t => t.key === colorTheme) ?? COLOR_THEMES.teal;
      return {
        ...active.light,
        ...getSupportColors(active.light, false),
        ...COMMON_COLORS
      };
    }
    return themeColors;
  }, [readerTheme, themeColors, colorTheme]);

  const [formatState, setFormatState] = useState<{
    bold?: boolean; italic?: boolean; underline?: boolean;
    justifyLeft?: boolean; justifyCenter?: boolean; justifyRight?: boolean; justifyFull?: boolean;
    insertUnorderedList?: boolean; insertOrderedList?: boolean;
    isTaskList?: boolean;
    hiliteColor?: string;
    fontSize?: string;
  }>({});

  const execDocumentCmd = (cmd: string, value?: string) => {
    selectionHaptic();
    injectToEditor(`window.execCmd('${cmd}', ${value ? `'${value}'` : 'null'}); true;`);
  };

  const changeFontSize = (delta: number) => {
    impactLight();
    injectToEditor(`window.changeFontSize(${delta}); true;`);
  };

  const applyHighlight = (color: string) => {
    selectionHaptic();

    execDocumentCmd('hiliteColor', color);
  };

  const injectToEditor = (script: string) => {
    if (Platform.OS === 'web') {
      if (webIframeRef.current?.contentWindow) {
        webIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'eval', code: script }), '*');
      }
    } else {
      webViewRef.current?.injectJavaScript(script);
    }
  };

  React.useImperativeHandle(ref, () => ({
    insertVerseHtml: (html: string) => {
      injectToEditor(`window.insertHtml(\`${html.replace(/`/g, '\\`')}\`); true;`);
    }
  }));

  useEffect(() => {
    if (!webViewRef.current && Platform.OS !== 'web') return;
    const js = `
      (function() {
        document.body.style.backgroundColor = '${colors.background}';
        var editorEl = document.getElementById('editor');
        if (editorEl) {
          editorEl.style.color = '${readerColors.onBackground || colors.onBackground}';
          editorEl.style.backgroundColor = '${colors.background}';
          editorEl.style.fontFamily = "${readerFontFamily === 'Poppins_400Regular' ? "'Poppins_400Regular', sans-serif" : readerFontFamily}";
        }
      })();
      true;
    `;
    injectToEditor(js);
  }, [readerColors, colors, readerFontFamily]);

  const onMessage = (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent ? event.nativeEvent.data : event.data);
      if (type === 'contentChanged') {
        onChange(data);
      } else if (type === 'formatState') {
        setFormatState(data);
      }
    } catch (e) { }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }
  }, [onChange]);

  const editorHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        html, body {
          margin: 0; padding: 0; 
          height: 100%;
          background-color: ${colors.surface};
          font-family: -apple-system, sans-serif;
        }
        #editor {
          min-height: 100%;
          padding: 16px;
          padding-bottom: 120px;
          outline: none;
          font-size: ${ms(16)}px;
          line-height: 1.6;
          color: ${readerColors.onBackground || colors.onBackground};
          background-color: ${colors.background};
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
        font[size="1"] { font-size: 11px; line-height: 1.4; }
        font[size="2"] { font-size: 13px; line-height: 1.5; }
        font[size="3"] { font-size: 16px; line-height: 1.6; }
        font[size="4"] { font-size: 24px; line-height: 1.6; }
        font[size="5"] { font-size: 32px; line-height: 1.6; }
        font[size="6"] { font-size: 48px; line-height: 1.6; }
        font[size="7"] { font-size: 64px; line-height: 1.6; }
        ::selection {
          background-color: ${colors.primary};
        }
        [contenteditable="true"]:empty:before {
          content: attr(placeholder);
          color: ${colors.textMuted};
          pointer-events: none;
          display: block;
        }
        .bible-verse {
          position: relative;
          margin: 16px 0;
          padding: 12px 16px;
          background-color: ${colors.primary}15;
          border-left: 4px solid ${colors.primary};
          border-radius: 8px;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          user-select: text;
          cursor: default;
        }
        .remove-verse-btn {
          position: absolute;
          top: 0;
          right: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${colors.primary};
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          user-select: none;
          z-index: 100;
          opacity: 0.5;
        }
        .bible-verse b, .bible-verse .verse-title {
          color: ${colors.primary};
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bible-verse p {
          margin: 0;
          color: ${colors.onSurface};
          font-style: italic;
        }
        ul, ol { padding-left: 24px; margin-top: 8px; margin-bottom: 8px; }
        li { margin-bottom: 4px; }
        ul.task-list { list-style: none; padding-left: 28px; }
        ul.task-list li { position: relative; margin-bottom: 8px; }
        ul.task-list li::before {
          content: ''; position: absolute; left: -26px; top: 4px; width: 18px; height: 18px;
          border: 2px solid ${colors.primary}; border-radius: 4px; background-color: transparent; cursor: pointer; box-sizing: border-box;
        }
        ul.task-list li[data-checked="true"]::before {
          background-color: ${colors.primary};
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
          background-size: 12px; background-repeat: no-repeat; background-position: center;
        }
        ul.task-list li[data-checked="true"] { text-decoration: line-through; opacity: 0.6; }
        .verse-line { margin-bottom: 10px; display: flex; gap: 8px; align-items: flex-start; }
        .verse-num { font-weight: 800; color: ${colors.primary}; font-size: 12px; margin-top: 2px; min-width: 24px; text-align: right; flex-shrink: 0; white-space: nowrap; }
        .verse-text { font-style: italic; color: ${colors.onSurface}; flex: 1; }
        ${readonly ? '.remove-verse-btn { display: none !important; }' : ''}
      </style>
    </head>
    <body onclick="document.getElementById('editor').focus();">
      <div id="editor" contenteditable="${readonly ? 'false' : 'true'}" placeholder="Comece a escrever seu estudo aqui...">${initialHtml}</div>
      <script>
        const editor = document.getElementById('editor');
        let debounceTimer;
        
        editor.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const msg = JSON.stringify({ type: 'contentChanged', data: editor.innerHTML });
            if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
            else window.parent.postMessage(msg, '*');
          }, 200);
        });

        function updateFormatState() {
          let left = document.queryCommandState('justifyLeft');
          let center = document.queryCommandState('justifyCenter');
          let right = document.queryCommandState('justifyRight');
          let full = document.queryCommandState('justifyFull');
          if (!left && !center && !right && !full) {
             left = true;
          }

          let isTask = false;
          let sel1 = window.getSelection();
          if (sel1 && sel1.rangeCount > 0 && sel1.anchorNode) {
             let node = sel1.anchorNode;
             let li = node.nodeType === 3 ? node.parentNode.closest('li') : (node.closest ? node.closest('li') : null);
             if (li && li.closest('ul.task-list')) isTask = true;
          }

          const state = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            justifyLeft: left,
            justifyCenter: center,
            justifyRight: right,
            justifyFull: full,
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
            isTaskList: isTask,
            hiliteColor: document.queryCommandValue('hiliteColor'),
            fontSize: document.queryCommandValue('fontSize'),
          };
          const msg = JSON.stringify({ type: 'formatState', data: state });
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
          else window.parent.postMessage(msg, '*');
        }

        document.addEventListener('selectionchange', updateFormatState);

        window.execCmd = function(cmd, value) {
          editor.focus();
          
          let sel = window.getSelection();
          let node = sel && sel.rangeCount > 0 ? sel.anchorNode : null;
          let li = node ? (node.nodeType === 3 ? node.parentNode : node).closest('li') : null;
          let ul = li ? li.closest('ul.task-list') : null;

          if (cmd === 'insertUnorderedList' && ul) {
            ul.classList.remove('task-list');
          } else if (cmd === 'insertOrderedList' && ul) {
            ul.classList.remove('task-list');
            document.execCommand(cmd, false, value);
          } else {
            document.execCommand(cmd, false, value);
          }
          
          setTimeout(updateFormatState, 50);
        };
        
        function ensureTrailingParagraph() {
          var last = editor.lastElementChild;
          if (!last || last.nodeName !== 'P' || last.innerHTML === '' || last.innerHTML === '<br>') return;
          var p = document.createElement('p');
          p.innerHTML = '<br>';
          editor.appendChild(p);
        }

        function moveCursorToTrailingParagraph() {
          ensureTrailingParagraph();
          var last = editor.lastElementChild;
          if (!last) return;
          var range = document.createRange();
          range.setStart(last, 0);
          range.collapse(true);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          editor.focus();
        }

        var guardObserver = new MutationObserver(function() {
          var last = editor.lastElementChild;
          if (last && last.nodeName !== 'P') {
            var p = document.createElement('p');
            p.innerHTML = '<br>';
            editor.appendChild(p);
          }
          document.querySelectorAll('.bible-verse').forEach(el => {
            if (el.getAttribute('contenteditable') !== 'false') {
              el.setAttribute('contenteditable', 'false');
            }
          });
        });
        guardObserver.observe(editor, { childList: true, subtree: true });

        function forceReadOnly() {
          document.querySelectorAll('.bible-verse').forEach(el => {
            el.setAttribute('contenteditable', 'false');
          });
        }
        setTimeout(forceReadOnly, 100);
        setTimeout(forceReadOnly, 500);

        ensureTrailingParagraph();

        window.insertHtml = function(html) {
          const sel = window.getSelection();
          const isInEditor = sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode);
          
          if (!isInEditor) {
            moveCursorToTrailingParagraph();
          } else {
            editor.focus();
          }

          document.execCommand('insertHTML', false, html);
          setTimeout(function() {
            if (!isInEditor) {
              moveCursorToTrailingParagraph();
            } else {
              // Try to move cursor to the P that was just inserted after the block
              const sel2 = window.getSelection();
              if (sel2.rangeCount > 0) {
                const node = sel2.anchorNode;
                const container = node.nodeType === 3 ? node.parentNode : node;
                if (container.nodeName !== 'P') {
                   // Fallback to end if we are stuck
                   moveCursorToTrailingParagraph();
                }
              }
            }
            updateFormatState();
          }, 80);
        };

        window.changeFontSize = function(delta) {
          editor.focus();
          
          var selection = window.getSelection();
          if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
          
          var node = selection.anchorNode;
          var parent = node.nodeType === 3 ? node.parentNode : node;
          var currentSizeStr = window.getComputedStyle(parent).fontSize;
          var px = parseInt(currentSizeStr) || 16;
          
          var sizes = [11, 13, 16, 24, 32, 48, 64];
          var currentIndex = 2;
          var minDiff = Infinity;
          for (var i = 0; i < sizes.length; i++) {
              var diff = Math.abs(sizes[i] - px);
              if (diff < minDiff) { 
                 minDiff = diff; 
                 currentIndex = i; 
              }
          }
          
          var newIndex = currentIndex + delta;
          if (newIndex < 0) newIndex = 0;
          if (newIndex > 6) newIndex = 6;
          
          var newSize = newIndex + 1;
          document.execCommand('fontSize', false, newSize);
        };

        window.toggleTaskList = function() {
          editor.focus();
          let sel = window.getSelection();
          if (!sel.rangeCount) return;
          let node = sel.anchorNode;
          let li = node ? (node.nodeType === 3 ? node.parentNode : node).closest('li') : null;
          
          if (li) {
             let ul = li.closest('ul');
             if (ul) {
               ul.classList.toggle('task-list');
             } else {
               let ol = li.closest('ol');
               if (ol) {
                  document.execCommand('insertOrderedList', false, null); 
                  document.execCommand('insertUnorderedList', false, null); 
                  setTimeout(window.toggleTaskList, 50); 
                  return;
               }
             }
          } else {
             document.execCommand('insertUnorderedList', false, null);
             setTimeout(() => {
               let sel2 = window.getSelection();
               let node2 = sel2.anchorNode;
               let li2 = node2 ? (node2.nodeType === 3 ? node2.parentNode : node2).closest('li') : null;
               if (li2) {
                 let ul2 = li2.closest('ul');
                 if (ul2) ul2.classList.add('task-list');
                 updateFormatState();
               }
             }, 50);
             return;
          }
          setTimeout(updateFormatState, 50);
        };

        document.addEventListener('click', function(e) {
          let block = e.target.closest('.bible-verse');
          let insertBefore = false;
          
          // Check for click on editor background near any block
          if (e.target === editor) {
            const y = e.clientY;
            const blocks = document.querySelectorAll('.bible-verse');
            let closest = null;
            let minDist = Infinity;
            
            for (let b of blocks) {
              const rect = b.getBoundingClientRect();
              const dTop = Math.abs(y - rect.top);
              const dBottom = Math.abs(y - rect.bottom);
              if (dTop < minDist) { minDist = dTop; closest = b; insertBefore = true; }
              if (dBottom < minDist) { minDist = dBottom; closest = b; insertBefore = false; }
            }
            
            if (closest && minDist < 50) {
              block = closest;
            }
          }

          if (block && !e.target.classList.contains('remove-verse-btn')) {
            const targetEl = insertBefore ? block.previousElementSibling : block.nextElementSibling;
            
            if (!targetEl || targetEl.nodeName !== 'P') {
              var p = document.createElement('p');
              p.innerHTML = '<br>';
              if (insertBefore) block.parentNode.insertBefore(p, block);
              else block.parentNode.insertBefore(p, block.nextSibling);
              
              const range = document.createRange();
              const sel = window.getSelection();
              range.setStart(p, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);

              const msg = JSON.stringify({ type: 'contentChanged', data: editor.innerHTML });
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
              else window.parent.postMessage(msg, '*');
            } else {
              const range = document.createRange();
              const sel = window.getSelection();
              range.setStart(targetEl, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }

          if (e.target.classList.contains('remove-verse-btn')) {
            let block = e.target.closest('.bible-verse');
            if (block) {
                block.remove();
                const msg = JSON.stringify({ type: 'contentChanged', data: editor.innerHTML });
                if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
                else window.parent.postMessage(msg, '*');
            }
            return;
          }

          let li = e.target.closest ? e.target.closest('ul.task-list li') : null;
          if (!li) return;
          let rect = li.getBoundingClientRect();
          if (e.clientX < rect.left + 8 && e.clientX > rect.left - 40) {
              let checked = li.getAttribute('data-checked') === 'true';
              if (checked) li.removeAttribute('data-checked');
              else li.setAttribute('data-checked', 'true');
              
              e.preventDefault();
              
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                const msg = JSON.stringify({ type: 'contentChanged', data: editor.innerHTML });
                if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
                else window.parent.postMessage(msg, '*');
              }, 100);
          }
        });

        editor.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' || e.key === 'Delete') {
            let sel = window.getSelection();
            if (sel && sel.isCollapsed) {
              let node = sel.anchorNode;
              if (!node) return;
              let container = node.nodeType === 3 ? node.parentNode : node;
              let blockParent = (container.closest ? container.closest('p, div, li') : null) || container;
              
              if (e.key === 'Backspace' && sel.anchorOffset === 0) {
                if (blockParent.previousElementSibling && blockParent.previousElementSibling.classList.contains('bible-verse')) {
                  // If paragraph is empty, allow deleting the paragraph itself
                  if (blockParent.textContent.trim() === '' && !blockParent.querySelector('img')) {
                    const toFocus = blockParent.previousElementSibling.previousElementSibling;
                    blockParent.remove();
                    if (toFocus) {
                      const range = document.createRange();
                      const sel = window.getSelection();
                      range.selectNodeContents(toFocus);
                      range.collapse(false);
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }
                    e.preventDefault();
                    return;
                  }
                  // If not empty, just prevent merging with the block
                  e.preventDefault();
                  return;
                }
              }

              if (e.key === 'Delete') {
                if (blockParent.nextElementSibling && blockParent.nextElementSibling.classList.contains('bible-verse')) {
                   const range = sel.getRangeAt(0);
                   const postRange = document.createRange();
                   postRange.selectNodeContents(blockParent);
                   postRange.setStart(range.endContainer, range.endOffset);
                   if (postRange.toString().trim().length === 0) {
                      e.preventDefault();
                      return;
                   }
                }
              }
            }
          }
          if (e.key === 'Enter') {
             let sel = window.getSelection();
             let li = sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode).closest('ul.task-list li') : null;
             
             if (li) {
                 setTimeout(() => {
                    let newSel = window.getSelection();
                    let newLi = newSel.anchorNode ? (newSel.anchorNode.nodeType === 3 ? newSel.anchorNode.parentNode : newSel.anchorNode).closest('ul.task-list li') : null;
                    if (newLi && newLi !== li) {
                       newLi.removeAttribute('data-checked');
                    }
                 }, 10);
             }
          }
        });

        window.addEventListener('message', function(event) {
          try {
            var msg = JSON.parse(event.data);
            if (msg.type === 'eval') {
              eval(msg.code);
            }
          } catch(e) { }
        });

      </script>
    </body>
    </html>
  `, [initialHtml]);

  return (
    <View style={{ flex: 1 }}>
      {showToolbar && !readonly && (
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: 8, paddingRight: 48, alignItems: 'center' }}>
            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.groupBtn, { backgroundColor: colors.primary }, Platform.select({ web: { outlineStyle: 'none' } as any, default: {} })]}
                onPress={onOpenVersePicker}
                activeOpacity={0.7}
              >
                <BibleIcon name="book-open" color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            <BibleDivider vertical height={20} margin={8} />

            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.groupBtn} onPress={() => changeFontSize(1)}>
                <BibleText style={{ fontWeight: '800', fontSize: ms(16), color: colors.onSurface, marginRight: 2 }}>A</BibleText>
                <BibleIcon name="plus" color={colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={styles.groupBtn} onPress={() => changeFontSize(-1)}>
                <BibleText style={{ fontWeight: '800', fontSize: ms(12), color: colors.onSurface, marginRight: 2 }}>A</BibleText>
                <BibleIcon name="minus" color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <BibleDivider vertical height={20} margin={8} />

            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.groupBtn, formatState.bold && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('bold')}>
                <BibleIcon name="bold" color={formatState.bold ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.italic && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('italic')}>
                <BibleIcon name="italic" color={formatState.italic ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.underline && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('underline')}>
                <BibleIcon name="underline" color={formatState.underline ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
            </View>

            <BibleDivider vertical height={20} margin={8} />

            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.groupBtn, formatState.insertUnorderedList && !formatState.isTaskList && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('insertUnorderedList')}>
                <BibleIcon name="list" color={formatState.insertUnorderedList && !formatState.isTaskList ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.isTaskList && { backgroundColor: colors.primary }]} onPress={() => injectToEditor(`window.toggleTaskList(); true;`)}>
                <BibleIcon name="check-square" color={formatState.isTaskList ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.insertOrderedList && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('insertOrderedList')}>
                <BibleIcon name="list" color={formatState.insertOrderedList ? colors.onPrimary : colors.onSurface} />
                <BibleText style={{ fontSize: ms(10), color: formatState.insertOrderedList ? colors.primary : colors.onSurface, position: 'absolute', right: 6, bottom: 6, fontWeight: '800' }}>1.</BibleText>
              </TouchableOpacity>
            </View>

            <BibleDivider vertical height={20} margin={8} />

            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.groupBtn} onPress={() => execDocumentCmd('outdent')}>
                <BibleIcon name="arrow-left" color={colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={styles.groupBtn} onPress={() => execDocumentCmd('indent')}>
                <BibleIcon name="arrow-right" color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <BibleDivider vertical height={20} margin={8} />

            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.groupBtn, formatState.justifyLeft && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyLeft')}>
                <BibleIcon name="align-left" color={formatState.justifyLeft ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.justifyCenter && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyCenter')}>
                <BibleIcon name="align-center" color={formatState.justifyCenter ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.justifyRight && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyRight')}>
                <BibleIcon name="align-right" color={formatState.justifyRight ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
              <BibleDivider vertical height={"60%"} />
              <TouchableOpacity style={[styles.groupBtn, formatState.justifyFull && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyFull')}>
                <BibleIcon name="align-justify" color={formatState.justifyFull ? colors.onPrimary : colors.onSurface} />
              </TouchableOpacity>
            </View>

            <BibleDivider vertical height={20} margin={8} />

            <View style={[styles.rowGroup, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              {VERSE_HIGHLIGHTS.map((h, i) => (
                <React.Fragment key={h.id}>
                  <TouchableOpacity
                    style={[styles.groupBtn, { width: ms(38) }]}
                    onPress={() => applyHighlight(h.hex)}
                  >
                    <View style={{ width: ms(20), height: ms(20), borderRadius: ms(10), backgroundColor: h.hex, borderWidth: 1, borderColor: colors.border }} />
                  </TouchableOpacity>
                  <BibleDivider vertical height={"60%"} />
                </React.Fragment>
              ))}
              <TouchableOpacity
                style={[styles.groupBtn, { width: ms(38) }]}
                onPress={() => applyHighlight('transparent')}
              >
                <View style={{ width: ms(20), height: ms(20), borderRadius: ms(10), borderWidth: 1.5, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: ms(16), height: 1.5, backgroundColor: colors.textMuted, transform: [{ rotate: '45deg' }] }} />
                </View>
              </TouchableOpacity>
            </View>

          </ScrollView>

          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, left: 0, backgroundColor: colors.surface, opacity: 0.8 }} />
            <BibleIcon name="chevron-right" color={colors.primary} size={ms(14)} />
          </View>
        </View>
      )}

      {Platform.OS === 'web' ? (
        <iframe
          ref={webIframeRef}
          srcDoc={editorHtml}
          style={{ flex: 1, border: 'none', backgroundColor: colors.surface, width: '100%', minHeight: 600 }}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: editorHtml }}
          originWhitelist={['*']}
          onMessage={onMessage}
          style={{ flex: 1, backgroundColor: colors.surface }}
          hideKeyboardAccessoryView={true}
          keyboardDisplayRequiresUserAction={false}
          bounces={false}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    height: 52,
    borderBottomWidth: 1,
    zIndex: 5,
    // Soft shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rowGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    marginVertical: 6,
  },
  groupBtn: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
