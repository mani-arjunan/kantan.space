export class RustLspService {
  constructor(monaco) {
    this.monaco = monaco;
    this.diagnostics = new Map();
    this.setupProviders();
  }

  setupProviders() {
    if (!this.monaco) return;

    // Register hover provider for type hints
    this.monaco.languages.registerHoverProvider('rust', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const hoverMessage = this.getBasicHint(word.word);
        if (!hoverMessage) return null;

        return {
          range: new this.monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [{ value: hoverMessage }],
        };
      },
    });

    // Register completion provider
    this.monaco.languages.registerCompletionItemProvider('rust', {
      triggerCharacters: ['.', ':', ' '],
      provideCompletionItems: (model, position) => {
        const suggestions = this.getRustCompletions(model, position);
        return {
          suggestions,
          incomplete: false,
        };
      },
    });
  }

  // Basic Rust completions
  getRustCompletions(model, position) {
    const lineText = model.getLineContent(position.lineNumber);
    const word = model.getWordUntilPosition(position);

    const rustKeywords = [
      'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'trait',
      'impl', 'pub', 'priv', 'use', 'mod', 'crate', 'as', 'match', 'if',
      'else', 'loop', 'while', 'for', 'in', 'break', 'continue', 'return',
      'unsafe', 'async', 'await', 'move', 'type', 'where', 'dyn',
    ];

    const suggestions = rustKeywords.map((keyword) => ({
      label: keyword,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: keyword,
      range: {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      },
    }));

    // Add common stdlib suggestions
    if (lineText.includes('use ')) {
      const stdlibItems = ['std', 'std::collections', 'std::io', 'std::fs', 'std::path'];
      stdlibItems.forEach((item) => {
        if (item.includes(word.word)) {
          suggestions.push({
            label: item,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: item,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            },
          });
        }
      });
    }

    return suggestions;
  }

  // Basic type hints
  getBasicHint(word) {
    const hints = {
      'fn': 'fn: declares a function',
      'let': 'let: declares an immutable variable binding',
      'mut': 'mut: declares a mutable variable',
      'String': 'String: A growable, heap-allocated UTF-8 string',
      'Vec': 'Vec<T>: A contiguous growable array type',
      'unwrap': 'unwrap(): Returns the contained value or panics',
      'expect': 'expect(msg): Returns the contained value or panics with message',
      'match': 'match: Pattern matching control flow',
      'println': 'println!: Macro to print to stdout',
    };
    return hints[word];
  }

  // Setup error/warning decorations
  updateDiagnostics(model, errors) {
    if (!this.monaco) return;

    const markers = errors.map((error) => ({
      severity: error.type === 'error' ? this.monaco.MarkerSeverity.Error : this.monaco.MarkerSeverity.Warning,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + error.length,
      message: error.message,
      code: error.code,
      source: 'rust-lsp',
    }));

    this.monaco.editor.setModelMarkers(model, 'rust-lsp', markers);
  }
}
