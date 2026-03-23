import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useReaderSettings } from '../../hooks/use-reader-settings';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleText } from '../BibleText';

export type RichTextEditorRef = {
  insertVerseHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  onOpenVersePicker: () => void;
};

export const RichTextEditor = React.forwardRef<RichTextEditorRef, Props>(({ initialHtml, onChange, onOpenVersePicker }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const webIframeRef = useRef<any>(null); // For React Native Web iframe
  const { colors } = useTheme();
  const { ms } = useResponsive();
  const { readerColors } = useReaderSettings();

  const [formatState, setFormatState] = useState<{
    bold?: boolean; italic?: boolean; underline?: boolean;
    justifyLeft?: boolean; justifyCenter?: boolean; justifyRight?: boolean; justifyFull?: boolean;
    insertUnorderedList?: boolean; insertOrderedList?: boolean;
    isTaskList?: boolean;
  }>({});

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

  const execDocumentCmd = (cmd: string, val: string | null = null) => {
    injectToEditor(`window.execCmd('${cmd}', ${val ? `'${val}'` : 'null'}); true;`);
  };

  const changeFontSize = (delta: number) => {
    injectToEditor(`window.changeFontSize(${delta}); true;`);
  };



  useEffect(() => {
    if (!webViewRef.current) return;
    const js = `
      (function() {
        document.body.style.backgroundColor = '${readerColors.background}';
        var editorEl = document.getElementById('editor');
        if (editorEl) {
          editorEl.style.color = '${readerColors.text || colors.text}';
        }
      })();
      true;
    `;
    injectToEditor(js);
  }, [readerColors, colors.text]);

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
          background-color: ${readerColors.background};
          font-family: -apple-system, sans-serif;
          -webkit-touch-callout: none;
        }
        #editor {
          min-height: 100%;
          padding: 16px;
          outline: none;
          font-size: ${ms(16)}px;
          line-height: 1.6;
          color: ${readerColors.text || colors.text};
        }
        font[size="1"] { font-size: 11px; line-height: 1.4; }
        font[size="2"] { font-size: 13px; line-height: 1.5; }
        font[size="3"] { font-size: 16px; line-height: 1.6; }
        font[size="4"] { font-size: 24px; line-height: 1.6; }
        font[size="5"] { font-size: 32px; line-height: 1.6; }
        font[size="6"] { font-size: 48px; line-height: 1.6; }
        font[size="7"] { font-size: 64px; line-height: 1.6; }
        ::selection {
          background-color: rgba(0, 128, 128, 0.3);
        }
        [contenteditable="true"]:empty:before {
          content: attr(placeholder);
          color: #aaa;
          pointer-events: none;
          display: block;
        }
        .bible-verse {
          margin: 16px 0;
          padding: 12px 16px;
          background-color: #f0f9f9;
          border-left: 4px solid #008080;
          border-radius: 8px;
        }
        .bible-verse b, .bible-verse .verse-title {
          color: #008080;
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bible-verse p {
          margin: 0;
          color: #333;
          font-style: italic;
        }
        ul, ol { padding-left: 24px; margin-top: 8px; margin-bottom: 8px; }
        li { margin-bottom: 4px; }
        ul.task-list { list-style: none; padding-left: 28px; }
        ul.task-list li { position: relative; margin-bottom: 8px; }
        ul.task-list li::before {
          content: ''; position: absolute; left: -26px; top: 4px; width: 18px; height: 18px;
          border: 2px solid #008080; border-radius: 4px; background-color: transparent; cursor: pointer; box-sizing: border-box;
        }
        ul.task-list li[data-checked="true"]::before {
          background-color: #008080;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
          background-size: 12px; background-repeat: no-repeat; background-position: center;
        }
        ul.task-list li[data-checked="true"] { text-decoration: line-through; opacity: 0.6; }
        .verse-line { margin-bottom: 10px; display: flex; gap: 8px; }
        .verse-num { font-weight: 800; color: #008080; font-size: 12px; margin-top: 2px; }
        .verse-text { font-style: italic; color: #333; }
      </style>
    </head>
    <body onclick="document.getElementById('editor').focus();" oncontextmenu="return false;">
      <div id="editor" contenteditable="true" placeholder="Comece a escrever seu estudo aqui...">${initialHtml}</div>
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
        
        window.insertHtml = function(html) {
          editor.focus();
          document.execCommand('insertHTML', false, html);
          setTimeout(updateFormatState, 50);
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
          var currentIndex = 2; // Default is size 3 (16px) -> index 2
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
          
          var newSize = newIndex + 1; // Maps index 0..6 to size 1..7
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
          } catch(e) {}
        });

      </script>
    </body>
    </html>
  `, [initialHtml]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar={true} keyboardShouldPersistTaps="always" style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center', paddingRight: 40 }}>
          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: '#e6f3f3', marginRight: 12 }]} onPress={onOpenVersePicker}>
            <Feather name="book-open" size={ms(18)} color="#008080" />
            <BibleText style={{ fontSize: ms(12), color: '#008080', fontWeight: '700', marginLeft: 6 }}>Bíblia</BibleText>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={[styles.rowGroup, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity style={styles.groupBtn} onPress={() => changeFontSize(-1)}>
              <BibleText style={{ fontWeight: '800', fontSize: ms(14), color: colors.text }}>A</BibleText>
              <Feather name="minus" size={ms(14)} color={colors.text} style={{ marginRight: -4 }} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.groupBtn} onPress={() => changeFontSize(1)}>
              <BibleText style={{ fontWeight: '800', fontSize: ms(16), color: colors.text }}>A</BibleText>
              <Feather name="plus" size={ms(14)} color={colors.text} style={{ marginRight: -4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.toolBtn, formatState.bold && styles.toolBtnActive]} onPress={() => execDocumentCmd('bold')}>
            <Feather name="bold" size={ms(18)} color={formatState.bold ? colors.primary : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolBtn, formatState.italic && styles.toolBtnActive]} onPress={() => execDocumentCmd('italic')}>
            <Feather name="italic" size={ms(18)} color={formatState.italic ? colors.primary : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolBtn, formatState.underline && styles.toolBtnActive]} onPress={() => execDocumentCmd('underline')}>
            <Feather name="underline" size={ms(18)} color={formatState.underline ? colors.primary : colors.text} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={[styles.rowGroup, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity style={[styles.groupBtn, formatState.insertUnorderedList && !formatState.isTaskList && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('insertUnorderedList')}>
              <Feather name="list" size={ms(18)} color={formatState.insertUnorderedList && !formatState.isTaskList ? colors.onPrimary : colors.text} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.groupBtn, formatState.isTaskList && { backgroundColor: colors.primary }]} onPress={() => injectToEditor(`window.toggleTaskList(); true;`)}>
              <Feather name="check-square" size={ms(18)} color={formatState.isTaskList ? colors.onPrimary : colors.text} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.groupBtn, formatState.insertOrderedList && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('insertOrderedList')}>
              <BibleText style={{ fontWeight: '800', fontSize: ms(16), color: formatState.insertOrderedList ? colors.onPrimary : colors.text, marginTop: -2 }}>1.</BibleText>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={[styles.rowGroup, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity style={styles.groupBtn} onPress={() => execDocumentCmd('outdent')}>
              <Feather name="arrow-left" size={ms(16)} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.groupBtn} onPress={() => execDocumentCmd('indent')}>
              <Feather name="arrow-right" size={ms(16)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={[styles.rowGroup, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity style={[styles.groupBtn, formatState.justifyLeft && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyLeft')}>
              <Feather name="align-left" size={ms(18)} color={formatState.justifyLeft ? colors.onPrimary : colors.text} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.groupBtn, formatState.justifyCenter && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyCenter')}>
              <Feather name="align-center" size={ms(18)} color={formatState.justifyCenter ? colors.onPrimary : colors.text} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.groupBtn, formatState.justifyRight && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyRight')}>
              <Feather name="align-right" size={ms(18)} color={formatState.justifyRight ? colors.onPrimary : colors.text} />
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.groupBtn, formatState.justifyFull && { backgroundColor: colors.primary }]} onPress={() => execDocumentCmd('justifyFull')}>
              <Feather name="align-justify" size={ms(18)} color={formatState.justifyFull ? colors.onPrimary : colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.colorBtn, { backgroundColor: '#333' }]} onPress={() => execDocumentCmd('foreColor', '#333333')} />
          <TouchableOpacity style={[styles.colorBtn, { backgroundColor: '#008080' }]} onPress={() => execDocumentCmd('foreColor', '#008080')} />
          <TouchableOpacity style={[styles.colorBtn, { backgroundColor: '#e74c3c' }]} onPress={() => execDocumentCmd('foreColor', '#e74c3c')} />
          <TouchableOpacity style={[styles.colorBtn, { backgroundColor: '#2980b9' }]} onPress={() => execDocumentCmd('foreColor', '#2980b9')} />
          <TouchableOpacity style={[styles.colorBtn, { backgroundColor: '#f39c12' }]} onPress={() => execDocumentCmd('foreColor', '#f39c12')} />

        </ScrollView>

        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, opacity: 0.9 }} pointerEvents="none">
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <iframe
          ref={webIframeRef}
          srcDoc={editorHtml}
          style={{ flex: 1, border: 'none', backgroundColor: readerColors.background, width: '100%', minHeight: 600 }}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: editorHtml }}
          originWhitelist={['*']}
          onMessage={onMessage}
          style={{ flex: 1, backgroundColor: readerColors.background }}
          hideKeyboardAccessoryView={true}
          keyboardDisplayRequiresUserAction={false}
          bounces={false}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', height: 48, borderBottomWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, zIndex: 5 },
  toolBtn: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, marginHorizontal: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center', minWidth: 36, height: 36 },
  toolBtnActive: { backgroundColor: 'rgba(0,128,128,0.1)' },
  divider: { width: 1, height: 24, backgroundColor: '#ddd', marginHorizontal: 6 },
  colorBtn: { width: 24, height: 24, borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  rowGroup: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', marginHorizontal: 2 },
  groupBtn: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  innerDivider: { width: 1 },
});
