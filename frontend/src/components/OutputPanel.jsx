export default function OutputPanel({ output, error, isRunning, isSuccess }) {
  return (
    <div className="output-panel">
      <div className="output-header">
        <h3>Output</h3>
      </div>

      <div className="output-content">

        {isRunning && (
          <div className="output-loading">
            <div className="spinner"></div>
            <span>Running code...</span>
          </div>
        )}

        {!isRunning && (output || error) && (
          <>
            {output && (
              <div className="output-section">
                <div className="output-section-title">Program Output</div>
                <div className={`output-box ${isSuccess ? 'success' : ''}`}>
                  {output || '(empty output)'}
                </div>
              </div>
            )}

            {error && (
              <div className="output-section">
                <div className="output-section-title">Compilation/Runtime Error</div>
                <div className="output-box error">
                  {error || '(empty error)'}
                </div>
              </div>
            )}
          </>
        )}

        {!isRunning && !output && !error && (
          <div className="output-empty">
            Click "Run Code" to see the output here
          </div>
        )}
      </div>
    </div>
  );
}
