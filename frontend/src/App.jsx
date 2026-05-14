import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';
import QuestionList from './components/QuestionList';
import OutputPanel from './components/OutputPanel';
import Celebration from './components/Celebration';
import { RustLspService } from './services/rustLsp';
import { API_ENDPOINTS } from './config';

function App() {
  const [sections, setSections] = useState({});
  const [sectionReadmes, setSectionReadmes] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(300);
  const [isLoading, setIsLoading] = useState(true);
  const [showReadme, setShowReadme] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const containerRef = useRef(null);
  const lspServiceRef = useRef(null);

  // Load completed exercises from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('completed_exercises');
    if (saved) {
      setCompletedExercises(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (editorInstance && !lspServiceRef.current) {
      // Initialize LSP service with Monaco
      if (window.monaco) {
        lspServiceRef.current = new RustLspService(window.monaco);
      }
    }
  }, [editorInstance]);

  // Fetch exercises from backend
  useEffect(() => {
    const fetchExercisesData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_ENDPOINTS.FETCH_EXERCISES);
        if (!response.ok) throw new Error('Failed to fetch exercises');
        const data = await response.json();

        // Load completed exercises from localStorage
        const saved = localStorage.getItem('completed_exercises');
        const completed = saved ? JSON.parse(saved) : [];

        // Transform API data to section-wise format
        const transformedSections = {};
        const readmesMap = {};

        Object.entries(data).forEach(([sectionName, exerciseFiles]) => {
          // Skip non-section entries
          if (typeof exerciseFiles !== 'object') {
            return;
          }

          // Extract README for this section
          if (exerciseFiles['README.md']) {
            readmesMap[sectionName] = exerciseFiles['README.md'];
          }

          // Extract the exercise name (folder name)
          const exerciseMap = {};

          Object.entries(exerciseFiles).forEach(([filename, content]) => {
            // Skip README files
            if (filename === 'README.md') {
              return;
            }

            // Extract exercise name from filename (e.g., "intro1.rs" -> "intro1")
            const exerciseName = filename.split('.')[0];

            if (!exerciseMap[exerciseName]) {
              exerciseMap[exerciseName] = {
                name: exerciseName,
                files: {}
              };
            }

            exerciseMap[exerciseName].files[filename] = content;
          });

          transformedSections[sectionName] = Object.values(exerciseMap);
        });

        setSections(transformedSections);
        setSectionReadmes(readmesMap);
        setCompletedExercises(completed);

        // Auto-select first incomplete exercise
        if (Object.keys(transformedSections).length > 0) {
          let exerciseSelected = false;

          // Try to find first incomplete exercise
          for (const sectionName of Object.keys(transformedSections)) {
            for (const exercise of transformedSections[sectionName]) {
              const exerciseKey = `${sectionName}/${exercise.name}`;
              if (!completed.includes(exerciseKey)) {
                handleExerciseSelect({
                  section: sectionName,
                  name: exercise.name,
                  files: exercise.files
                });
                exerciseSelected = true;
                break;
              }
            }
            if (exerciseSelected) break;
          }

          // If all exercises completed, select first one
          if (!exerciseSelected) {
            const firstSection = Object.keys(transformedSections)[0];
            const firstExercise = transformedSections[firstSection][0];
            handleExerciseSelect({
              section: firstSection,
              name: firstExercise.name,
              files: firstExercise.files
            });
          }
        }
      } catch (err) {
        console.error('Error fetching exercises:', err);
        setError('Failed to load exercises from server. Please check if backend is running.');
        setSections({});
        setSelectedExercise(null);
        setCode('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercisesData();
  }, []);

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);

    // Try to find the .rs file from the exercise files
    const rsFile = Object.entries(exercise.files).find(
      ([filename]) => filename.endsWith('.rs')
    );

    if (rsFile) {
      setCode(rsFile[1]); // Set code content
    } else {
      setCode('// No Rust file found in this exercise');
    }

    setOutput('');
    setError('');
    setIsSuccess(false);
  };

  const handleSelectSection = (sectionName) => {
    // Select first exercise of the section
    if (sections[sectionName] && sections[sectionName].length > 0) {
      const firstExercise = sections[sectionName][0];
      handleExerciseSelect({
        section: sectionName,
        name: firstExercise.name,
        files: firstExercise.files
      });
    }
  };

  const handlePreviousExercise = () => {
    const sectionKeys = Object.keys(sections);
    const currentSectionIdx = sectionKeys.indexOf(selectedExercise.section);
    const currentExercises = sections[selectedExercise.section];
    const currentExerciseIdx = currentExercises.findIndex(
      (ex) => ex.name === selectedExercise.name
    );

    // Try previous exercise in same section
    if (currentExerciseIdx > 0) {
      const prevExercise = currentExercises[currentExerciseIdx - 1];
      handleExerciseSelect({
        section: selectedExercise.section,
        name: prevExercise.name,
        files: prevExercise.files
      });
    } else if (currentSectionIdx > 0) {
      // Move to last exercise in previous section
      const prevSection = sectionKeys[currentSectionIdx - 1];
      const lastExercise = sections[prevSection][sections[prevSection].length - 1];
      handleExerciseSelect({
        section: prevSection,
        name: lastExercise.name,
        files: lastExercise.files
      });
    }
  };

  const handleNextExercise = () => {
    const sectionKeys = Object.keys(sections);
    const currentSectionIdx = sectionKeys.indexOf(selectedExercise.section);
    const currentExercises = sections[selectedExercise.section];
    const currentExerciseIdx = currentExercises.findIndex(
      (ex) => ex.name === selectedExercise.name
    );

    // Try next exercise in same section
    if (currentExerciseIdx < currentExercises.length - 1) {
      const nextExercise = currentExercises[currentExerciseIdx + 1];
      handleExerciseSelect({
        section: selectedExercise.section,
        name: nextExercise.name,
        files: nextExercise.files
      });
    } else if (currentSectionIdx < sectionKeys.length - 1) {
      // Move to first exercise in next section
      const nextSection = sectionKeys[currentSectionIdx + 1];
      const firstExercise = sections[nextSection][0];
      handleExerciseSelect({
        section: nextSection,
        name: firstExercise.name,
        files: firstExercise.files
      });
    }
  };

  const canGoToPrevious = () => {
    if (!selectedExercise) return false;
    const sectionKeys = Object.keys(sections);
    const currentSectionIdx = sectionKeys.indexOf(selectedExercise.section);
    const currentExercises = sections[selectedExercise.section];
    const currentExerciseIdx = currentExercises.findIndex(
      (ex) => ex.name === selectedExercise.name
    );
    return currentExerciseIdx > 0 || currentSectionIdx > 0;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setError('');
    setOutput('');

    try {
      const response = await fetch(API_ENDPOINTS.EXECUTE_CODE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output);
        setIsSuccess(true);
        setError('');

        // Mark exercise as completed on successful execution
        const exerciseKey = `${selectedExercise.section}/${selectedExercise.name}`;
        if (!completedExercises.includes(exerciseKey)) {
          const updatedCompleted = [...completedExercises, exerciseKey];
          setCompletedExercises(updatedCompleted);
          localStorage.setItem('completed_exercises', JSON.stringify(updatedCompleted));
        }
      } else {
        setError(data.error || 'Unknown error');
        setIsSuccess(false);
        if (data.output) {
          setOutput(data.output);
        }
      }
    } catch (err) {
      setError(`Failed to connect to server: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (selectedExercise) {
      const rsFile = Object.entries(selectedExercise.files).find(
        ([filename]) => filename.endsWith('.rs')
      );
      if (rsFile) {
        setCode(rsFile[1]);
      }
    }
    setOutput('');
    setError('');
  };


  // If backend is unavailable, show only error screen
  if (error && Object.keys(sections).length === 0 && !isLoading) {
    return (
      <div className="app">
        <header className="app-header">
          <h2>Rustlings on Web</h2>
        </header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          <div>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Backend Server Unavailable</p>
            <p>Cannot load exercises from server</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Celebration isVisible={isSuccess} onNext={handleNextExercise} />

      <header className="app-header">
        <h2>Rustlings on Web</h2>
        {selectedExercise && (
          <p>{selectedExercise.section} / {selectedExercise.name}</p>
        )}
        {selectedExercise && sectionReadmes[selectedExercise.section] && (
          <button
            onClick={() => setShowReadme(!showReadme)}
            className="btn-readme"
            title="Toggle README documentation"
          >
            {showReadme ? 'Hide' : 'Show'} Docs
          </button>
        )}
      </header>

      <div className="app-container" ref={containerRef}>
        {/* Left Panel - Sections & Exercises */}
        <div className="panel-left" style={{ width: `${leftWidth}px`, minWidth: '150px', maxWidth: '400px' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading exercises...
            </div>
          ) : (
            <QuestionList
              sections={sections}
              selectedExercise={selectedExercise}
              onSelectExercise={handleExerciseSelect}
              isShowingDocs={showReadme}
              onSelectSection={handleSelectSection}
              completedExercises={completedExercises}
            />
          )}
        </div>

        {/* Left Resize Handle */}
        <div
          className="resize-divider"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = leftWidth;

            const handleMouseMove = (moveEvent) => {
              const diff = moveEvent.clientX - startX;
              const newWidth = Math.max(150, Math.min(400, startWidth + diff));
              setLeftWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Center Panel - Editor or README */}
        <div className="panel-center" style={{ flex: 1, minWidth: '400px' }}>
          <div className="editor-panel">
              <div className="editor-wrapper">
                {showReadme && selectedExercise && sectionReadmes[selectedExercise.section] ? (
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={sectionReadmes[selectedExercise.section]}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: 'Fira Code, monospace',
                    wordWrap: 'on',
                    readOnly: true,
                  }}
                />
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage="rust"
                  value={code}
                  onChange={(value) => setCode(value)}
                  theme="vs-dark"
                  onMount={setEditorInstance}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: 'Fira Code, monospace',
                    wordWrap: 'on',
                    quickSuggestionsDelay: 300,
                    quickSuggestions: {
                      other: true,
                      comments: false,
                      strings: false,
                    },
                  }}
                />
              )}
              </div>
              {!showReadme && (
                <div className="editor-actions">
                  <button onClick={handleRunCode} disabled={isRunning} className="btn-run">
                    {isRunning ? 'Running...' : '▶ Run Code'}
                  </button>
                  <button onClick={handleReset} className="btn-reset">
                    Reset
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handlePreviousExercise}
                      disabled={!canGoToPrevious()}
                      className="btn-nav"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={handleNextExercise}
                      className="btn-nav btn-nav-next"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Right Resize Handle */}
        <div
          className="resize-divider"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = rightWidth;

            const handleMouseMove = (moveEvent) => {
              const diff = startX - moveEvent.clientX;
              const newWidth = Math.max(200, Math.min(500, startWidth + diff));
              setRightWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Right Panel - Output */}
        <div className="panel-right" style={{ width: `${rightWidth}px`, minWidth: '200px', maxWidth: '500px' }}>
          <OutputPanel
            output={output}
            error={error}
            isRunning={isRunning}
            isSuccess={isSuccess}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
