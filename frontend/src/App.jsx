import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';
import OutputPanel from './components/OutputPanel';
import { KantanLanguageService } from './services/kantanLanguage';
import { API_ENDPOINTS } from './config';

const DEFAULT_CODE = `name is "Manikandan".
age is 27.

a is 10.
b is 20.
c is a + b.

print "Value of A => {a}".
print "Value of B => {b}".
print "Value of C = A + B => {c}".

if c [is equal to] 30 {
    print "Hellooo!! C is 30".
}

repeat 3 times {
    print "OUTER LOOP".
    repeat 2 times {
      print "INNER LOOP".
    }
}
`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60); // % width
  const langServiceRef = useRef(null);
  const editorRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    if (!langServiceRef.current) {
      langServiceRef.current = new KantanLanguageService(monaco);
    }
    monaco.editor.setModelLanguage(editor.getModel(), 'kantan');
    monaco.editor.setTheme('kantan-theme');
    langServiceRef.current.validate(editor.getModel());
  };

  const handleEditorChange = (value) => {
    setCode(value ?? '');
    const editor = editorRef.current;
    if (editor && langServiceRef.current) {
      langServiceRef.current.validate(editor.getModel());
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setError('');
    setOutput('');
    setIsSuccess(false);

    try {
      const response = await fetch(API_ENDPOINTS.EXECUTE_CODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if(response.status === 429) {
        setError(`Rate limit error, try again after 5seconds!!`);
        setIsRunning(false);
        return;
      }
      const data = await response.json();

      if (data.success) {
        setOutput(data.output);
        setIsSuccess(true);
      } else {
        setError(data.error || 'Unknown error');
        if (data.output) setOutput(data.output);
      }
    } catch (err) {
      setError(`Failed to connect to server: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = editorWidth;
    const containerWidth = e.currentTarget.parentElement.getBoundingClientRect().width;

    const onMove = (moveEvent) => {
      const diffPct = ((moveEvent.clientX - startX) / containerWidth) * 100;
      const next = Math.max(30, Math.min(80, startPct + diffPct));
      setEditorWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h2>Kantan <span className="app-subtitle">簡単 — a simple language</span></h2>
        <a href="https://github.com/mani-arjunan/kantan#" target="_blank" rel="noreferrer" className="btn-docs">
          Docs
        </a>
      </header>

      <div className="app-container">
        <div className="panel-center" style={{ width: `${editorWidth}%` }}>
          <div className="editor-panel">
            <div className="editor-header">
              <h3>Code</h3>
            </div>
            <div className="editor-wrapper">
              <Editor
                height="100%"
                defaultLanguage="kantan"
                value={code}
                onMount={handleEditorMount}
                onChange={handleEditorChange}
                theme="kantan-theme"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  fontFamily: 'Fira Code, monospace',
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        </div>

        <div className="resize-divider" onMouseDown={handleDividerDrag} />

        <div className="panel-right" style={{ width: `${100 - editorWidth}%` }}>
          <OutputPanel
            output={output}
            error={error}
            isRunning={isRunning}
            isSuccess={isSuccess}
            onRun={handleRunCode}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
