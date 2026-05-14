export default function OutputPanel({ output, error, isRunning, isSuccess, onRun }) {
  return (
    <div className="output-panel">
      <div className="output-header">
        <h3>Output</h3>
        <button onClick={onRun} disabled={isRunning} className="btn-run">
          {isRunning ? 'Running...' : '▶ Run'}
        </button>
      </div>

      <div className="output-content">
        {isRunning && (
          <div className="output-loading">
            <div className="spinner"></div>
            <span>Running...</span>
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
                <div className="output-section-title">Error</div>
                <div className="output-box error">
                  {error || '(empty error)'}
                </div>
              </div>
            )}
          </>
        )}

        {!isRunning && !output && !error && (
          <div className="output-empty">
            Click "Run" to execute your kantan code.
          </div>
        )}
      </div>
    </div>
  );
}
