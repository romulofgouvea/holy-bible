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
  const { colors } = useTheme();
  const { ms } = useResponsive();
  const { readerColors } = useReaderSettings();

  const [formatState, setFormatState] = useState<{
    bold?: boolean; italic?: boolean; underline?: boolean;
    justifyLeft?: boolean; justifyCenter?: boolean; justifyRight?: boolean; justifyFull?: boolean;
  }>({});

  React.useImperativeHandle(ref, () => ({
    insertVerseHtml: (html: string) => {
      webViewRef.current?.injectJavaScript(`window.insertHtml(\`${html}\`); true;`);
    }
  }));

  const execDocumentCmd = (cmd: string, val: string | null = null) => {
    if (Platform.OS === 'web') return;
    webViewRef.current?.injectJavaScript(`window.execCmd('${cmd}', ${val ? `'${val}'` : 'null'}); true;`);
  };

  const changeFontSize = (delta: number) => {
    webViewRef.current?.injectJavaScript(`window.changeFontSize(${delta}); true;`);
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
    webViewRef.current.injectJavaScript(js);
  }, [readerColors, colors.text]);

  const onMessage = (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      if (type === 'contentChanged') {
        onChange(data);
      } else if (type === 'formatState') {
        setFormatState(data);
      }
    } catch (e) { }
  };

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
        font[size="1"] { font-size: 11px; line-height: 1.4; } /* H6 */
        font[size="2"] { font-size: 13px; line-height: 1.5; } /* H5 */
        font[size="3"] { font-size: 16px; line-height: 1.6; } /* Normal */
        font[size="4"] { font-size: 18px; line-height: 1.6; } /* H4 */
        font[size="5"] { font-size: 20px; line-height: 1.6; } /* H3 */
        font[size="6"] { font-size: 24px; line-height: 1.6; } /* H2 */
        font[size="7"] { font-size: 32px; line-height: 1.6; } /* H1 */
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
        .bible-verse b {
          color: #008080;
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bible-verse p {
          margin: 0;
          color: #333;
          font-style: italic;
        }
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
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'contentChanged', data: editor.innerHTML }));
          }, 200);
        });

        document.addEventListener('selectionchange', function() {
          let left = document.queryCommandState('justifyLeft');
          let center = document.queryCommandState('justifyCenter');
          let right = document.queryCommandState('justifyRight');
          let full = document.queryCommandState('justifyFull');
          if (!left && !center && !right && !full) {
             left = true;
          }

          const state = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            justifyLeft: left,
            justifyCenter: center,
            justifyRight: right,
            justifyFull: full,
          };
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'formatState', data: state }));
        });

        window.execCmd = function(cmd, value) {
          editor.focus();
          document.execCommand(cmd, false, value);
        };
        
        window.insertHtml = function(html) {
          editor.focus();
          document.execCommand('insertHTML', false, html);
        };

        window.changeFontSize = function(delta) {
          editor.focus();
          let current = document.queryCommandValue('fontSize');
          if (!current || current === '') current = '3';
          let newSize = parseInt(current) + delta;
          if (newSize < 1) newSize = 1;
          if (newSize > 7) newSize = 7;
          document.execCommand('fontSize', false, newSize);
        };


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
              <Feather name="minus" size={ms(14)} color={colors.text} style={{ marginRight: -4 }} />
              <BibleText style={{ fontWeight: '800', fontSize: ms(14), color: colors.text }}>A</BibleText>
            </TouchableOpacity>
            <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.groupBtn} onPress={() => changeFontSize(1)}>
              <Feather name="plus" size={ms(14)} color={colors.text} style={{ marginRight: -4 }} />
              <BibleText style={{ fontWeight: '800', fontSize: ms(16), color: colors.text }}>A</BibleText>
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
        <View style={{ flex: 1, padding: 16 }}>
          <BibleText style={{ color: colors.textMuted }}>O editor rico não é suportado na web.</BibleText>
        </View>
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
