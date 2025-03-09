import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom renderers for specific markdown elements
            strong: ({node, ...props}) => <span className="bold-text" {...props} />,
            h1: ({node, ...props}) => <h1 className="markdown-heading-1" {...props} />,
            h2: ({node, ...props}) => <h2 className="markdown-heading-2" {...props} />,
            h3: ({node, ...props}) => <h3 className="markdown-heading-3" {...props} />,
            ul: ({node, ...props}) => <ul className="markdown-list" {...props} />,
            li: ({node, ...props}) => <li className="markdown-list-item" {...props} />,
            p: ({node, ...props}) => <p className="markdown-paragraph" {...props} />
          }}
        >
          {analysis}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default AnalysisDisplay;