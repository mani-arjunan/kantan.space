export class KantanLanguageService {
  constructor(monaco) {
    this.monaco = monaco;

    this.setupLanguage();
    this.setupTheme();
    this.setupProviders();
  }

  setupLanguage() {
    if (!this.monaco) return;

    this.monaco.languages.register({
      id: 'kantan',
    });

    this.monaco.languages.setMonarchTokensProvider(
      'kantan',
      {
        tokenizer: {
          root: [
            [/notes:\s*(?!\{).*$/, 'comment'],

            [/notes:\s*\{/, 'comment', '@multilineComment'],

            [
              /\b(print|if|repeat|times|is)\b/,
              'keyword',
            ],

            [
              /\[(is equal to|is not equal to|is greater than|is less than|is greater than equal to|is less than equal to)\]/,
              'operator',
            ],

            [
              /"[^"]*"/,
              'string',
            ],

            [
              /\b\d+\b/,
              'number',
            ],

            [
              /[{}]/,
              'delimiter',
            ],
          ],

          multilineComment: [
            [/[^\}]+/, 'comment'],
            [/\}/, 'comment', '@pop'],
          ],
        },
      }
    );
  }

  setupTheme() {
    this.monaco.editor.defineTheme('kantan-theme', {
      base: 'vs-dark',
      inherit: true,

      rules: [

        {
          token: 'comment',
          foreground: '6A9955',
          fontStyle: 'italic',
        },

        {
          token: 'keyword',
          foreground: 'C586C0',
        },

        {
          token: 'operator',
          foreground: 'DCDCAA',
        },

        {
          token: 'string',
          foreground: 'CE9178',
        },

        {
          token: 'number',
          foreground: 'B5CEA8',
        },

        {
          token: 'delimiter',
          foreground: 'FFFFFF',
        },
      ],

      colors: {},
    });
  }

  setupProviders() {
    if (!this.monaco) return;

    this.monaco.languages.registerHoverProvider(
      'kantan',
      {
        provideHover: (model, position) => {

          const word =
            model.getWordAtPosition(position);

          if (!word) return null;

          const docs =
            this.getHoverDocs(word.word);

          if (!docs) return null;

          return {
            range: new this.monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),

            contents: [
              {
                value: docs,
              },
            ],
          };
        },
      }
    );

    this.monaco.languages.registerCompletionItemProvider(
      'kantan',
      {
        triggerCharacters: ['[', '"', ' '],

        provideCompletionItems: (
          model,
          position
        ) => {

          const word =
            model.getWordUntilPosition(position);

          const suggestions =
            this.getSuggestions(position, word);

          return {
            suggestions,
          };
        },
      }
    );
  }

  getSuggestions(position, word) {

    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    return [

      {
        label: 'print',
        kind:
          this.monaco.languages
            .CompletionItemKind.Keyword,

        insertText: `print "$1".`,
        insertTextRules:
          this.monaco.languages
            .CompletionItemInsertTextRule
            .InsertAsSnippet,
        documentation: this.getHoverDocs('print'),
        range,
      },

      {
        label: 'if',
        kind:
          this.monaco.languages
            .CompletionItemKind.Keyword,
        insertText:`if \${1:a} [is equal to] \${2:b} { $0 }`,
        insertTextRules:
          this.monaco.languages
            .CompletionItemInsertTextRule
            .InsertAsSnippet,
        documentation: this.getHoverDocs('if'),
        range,
      },

      {
        label: 'repeat',
        kind:
          this.monaco.languages
            .CompletionItemKind.Keyword,
        insertText: `repeat \${1:3} times {$0}`,
        insertTextRules:
          this.monaco.languages
            .CompletionItemInsertTextRule
            .InsertAsSnippet,
        documentation: this.getHoverDocs('repeat'),
        range,
      },

      {
        label: 'notes',
        kind: this.monaco.languages.CompletionItemKind.Keyword,
        insertText: 'notes: $0',
        insertTextRules:
          this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Single-line comment. Use notes: { } for multi-line.',
        range,
      },

      {
        label: 'notes: { }',
        kind: this.monaco.languages.CompletionItemKind.Keyword,
        insertText: 'notes: {\n\t$0\n}',
        insertTextRules:
          this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Multi-line comment block.',
        range,
      },

      {
        label: '[is equal to]',
        kind:
          this.monaco.languages
            .CompletionItemKind.Operator,
        insertText:'[is equal to]',
        range,
      },

      {
        label: '[is not equal to]',
        kind:
          this.monaco.languages
            .CompletionItemKind.Operator,
        insertText: '[is not equal to]',
        range,
      },

      {
        label: '[is greater than]',
        kind:
          this.monaco.languages
            .CompletionItemKind.Operator,
        insertText: '[is greater than]',
        range,
      },

      {
        label: '[is less than]',
        kind:
          this.monaco.languages
            .CompletionItemKind.Operator,
        insertText: '[is less than]',
        range,
      },

      {
        label: '[is greater than equal to]',
        kind:
          this.monaco.languages
            .CompletionItemKind.Operator,
        insertText: '[is greater than equal to]',
        range,
      },

      {
        label: '[is less than equal to]',
        kind:
          this.monaco.languages
            .CompletionItemKind.Operator,
        insertText: '[is less than equal to]',
        range,
      },
    ];
  }

  getHoverDocs(word) {
    const docs = {
      print:
        'Prints whatever you gave inside "", also supports string interpolation',
      repeat:
        'Repeats the block of statements inside {} given number of times.',
      if:
        'Runs the block statement inside {} if the condition between [] is true.',
      times:
        'Used after repeat.',
      is:
        'Assigning a value to the variable.',
      notes:
        'Comment. Single-line: `notes: your comment`. Multi-line: `notes: { ... }`.',
    };

    return docs[word];
  }

  validate(model) {
    const code = model.getValue();
    const lines = code.split('\n');
    const markers = [];
    let openBraces = 0;
    let inMultilineComment = false;

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.length === 0) return;

      if (inMultilineComment) {
        if (trimmed === '}') inMultilineComment = false;
        return;
      }

      if (/^notes:\s*(?!\{)/.test(trimmed)) return;

      if (/^notes:\s*\{/.test(trimmed)) {
        const afterBrace = trimmed.replace(/^notes:\s*\{/, '');
        if (!afterBrace.includes('}')) inMultilineComment = true;
        return;
      }

      if (trimmed.endsWith('{')) {
        openBraces++;
        return;
      }

      if (trimmed === '}') {
        openBraces--;
      }
    });

    if (openBraces > 0) {
      markers.push({
        severity: this.monaco.MarkerSeverity.Error,
        startLineNumber: lines.length,
        startColumn: 1,
        endLineNumber: lines.length,
        endColumn: 1,
        message: "Missing closing '}'",
        source: 'kantan',
      });
    }

    this.monaco.editor.setModelMarkers(model, 'kantan', markers);
  }
}
