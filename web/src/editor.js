import {EditorView, keymap} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands';
import {StreamLanguage} from '@codemirror/language';
import {linter, lintGutter} from '@codemirror/lint';
import {oneDark} from '@codemirror/theme-one-dark';

/**
 * Simple WSD StreamLanguage tokenizer for CodeMirror 6.
 */
const wsdLanguage = StreamLanguage.define({
  name: 'wsd',
  token(stream) {
    // Comments
    if (stream.match(/#.*$/)) {
      return 'comment';
    }
    // Arrow operators (before keywords so -->> etc. match first)
    if (stream.match(/<<?--?>>?|<<?->>?|->>?|-->>?|-#|--#/)) {
      return 'operator';
    }
    // Time markers
    if (stream.match(/@[A-Za-z0-9_']+/)) {
      return 'atom';
    }
    // Colon introduces a string to end of line
    if (stream.peek() === ':') {
      stream.next();
      stream.skipToEnd();
      return 'string';
    }
    // Quoted strings
    if (stream.match(/"[^"]*"/)) {
      return 'string';
    }
    // Numbers
    if (stream.match(/-?\d+/)) {
      return 'number';
    }
    // Brackets
    if (stream.match(/[[\]]/)) {
      return 'bracket';
    }
    // Keywords and identifiers
    if (stream.match(/[A-Za-z0-9_']+/)) {
      const word = stream.current();
      const keywords = new Set([
        'advance', 'as', 'block', 'end', 'false', 'loop',
        'note', 'opt', 'participant', 'set', 'title', 'true',
      ]);
      if (keywords.has(word)) {
        return 'keyword';
      }
      return 'variableName';
    }
    stream.next();
    return null;
  },
});

let view = null;
let diagnosticSetter = null;

/**
 * @param {HTMLElement} parent
 * @param {string} initialContent
 * @param {() => void} onChange called (debounced) when content changes
 */
export function setupEditor(parent, initialContent, onChange) {
  const updateListener = EditorView.updateListener.of(update => {
    if (update.docChanged) {
      onChange();
    }
  });

  view = new EditorView({
    state: EditorState.create({
      doc: initialContent,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        wsdLanguage,
        oneDark,
        lintGutter(),
        updateListener,
        EditorView.lineWrapping,
      ],
    }),
    parent,
  });

  return view;
}

export function getContent() {
  return view ? view.state.doc.toString() : '';
}

export function setContent(str) {
  if (!view) {
    return;
  }
  view.dispatch({
    changes: {from: 0, to: view.state.doc.length, insert: str},
  });
}

/**
 * @param {Array<{from: number, to: number, severity: string, message: string}>} diags
 */
export function setDiagnostics(diags) {
  if (diagnosticSetter) {
    diagnosticSetter(diags);
  }
}

/**
 * Returns a linter extension that can be driven externally.
 * Call the returned setter to push new diagnostics.
 *
 * @returns {{extension: import('@codemirror/lint').Extension, setter: Function}}
 */
export function makeExternalLinter() {
  let currentDiags = [];
  let currentView = null;

  const extension = linter(v => {
    currentView = v;
    return currentDiags;
  }, {delay: 0});

  const setter = diags => {
    currentDiags = diags;
    if (currentView) {
      // Force the linter to re-run
      currentView.dispatch({});
    }
  };

  diagnosticSetter = setter;
  return {extension, setter};
}
