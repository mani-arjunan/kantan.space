import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function QuestionList({ sections = {}, selectedExercise, onSelectExercise, isShowingDocs = false, onSelectSection = null, completedExercises = [] }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Expand the section with the current/first incomplete exercise, but collapse all when showing docs
  useEffect(() => {
    const sectionKeys = Object.keys(sections);
    if (isShowingDocs) {
      // Collapse all sections when showing docs
      setExpandedSections({});
    } else if (selectedExercise) {
      // Always expand the section containing the selected exercise
      setExpandedSections({ [selectedExercise.section]: true });
    } else if (sectionKeys.length > 0 && Object.keys(expandedSections).length === 0) {
      // Fallback: expand first section if no exercise selected yet
      setExpandedSections({ [sectionKeys[0]]: true });
    }
  }, [sections, isShowingDocs, selectedExercise]);

  // Toggle section expansion
  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Filter exercises based on search term
  const filteredSections = useMemo(() => {
    const result = {};

    Object.entries(sections).forEach(([sectionName, files]) => {
      const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sectionName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredFiles.length > 0) {
        result[sectionName] = filteredFiles;
      }
    });

    return result;
  }, [sections, searchTerm]);

  return (
    <div className="question-panel">

      <div className="question-list">
        {Object.entries(filteredSections).length === 0 ? (
          <div className="no-exercises">No exercises found</div>
        ) : (
          Object.entries(filteredSections).map(([sectionName, exercises]) => (
            <div key={sectionName} className="section-group">
              <div
                className={`section-header ${
                  isShowingDocs && selectedExercise?.section === sectionName ? 'active' : ''
                }`}
                onClick={() => {
                  if (isShowingDocs && onSelectSection) {
                    onSelectSection(sectionName);
                  } else if (!isShowingDocs) {
                    toggleSection(sectionName);
                  }
                }}
              >
                {!isShowingDocs && (
                  <span className="section-icon">
                    {expandedSections[sectionName] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                )}
                <span className="section-name">{sectionName}</span>
                {!isShowingDocs && (
                  <span className="section-count">{exercises.length}</span>
                )}
              </div>

              {!isShowingDocs && expandedSections[sectionName] && (
                <div className="exercises-list">
                  {exercises.map((exercise, idx) => (
                    <div
                      key={idx}
                      className={`exercise-item ${
                        selectedExercise?.section === sectionName &&
                        selectedExercise?.name === exercise.name
                          ? 'active'
                          : ''
                      } ${completedExercises.includes(`${sectionName}/${exercise.name}`) ? 'completed' : ''}`}
                      onClick={() =>
                        onSelectExercise({
                          section: sectionName,
                          name: exercise.name,
                          files: exercise.files,
                        })
                      }
                    >
                      <span className="exercise-name">{exercise.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
