import React from 'react';
import MarkdownFormatter from './MarkdownFormatter.tsx';

interface AnalysisDisplayProps {
  analysis: string;
  loading: boolean;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, loading }) => {
  if (loading) {
    return <div className="analysis-loading">Analyzing content...</div>;
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="analysis-container">
      <h3>Analysis Results</h3>
      <div className="markdown-content">
        <MarkdownFormatter content={analysis} variant="analysis" />
      </div>
    </div>
  );
};

export default AnalysisDisplay;