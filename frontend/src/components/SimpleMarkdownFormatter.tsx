import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// This component will be used inside InteractiveAnalysis to format text
const SimpleMarkdownFormatter = ({ text }) => {
  // Pre-process to enhance markdown formatting
  const preprocessText = (content) => {
    if (!content) return '';
    
    let enhancedText = content;
    
    // Convert "This claim is accurate/inaccurate:" patterns to markdown headings
    enhancedText = enhancedText.replace(
      /^(This claim is (accurate|correct|true).*?)$/gm,
      '**✅ $1**'
    );
    
    enhancedText = enhancedText.replace(
      /^(This claim is (inaccurate|misleading|false|incorrect).*?)$/gm,
      '**❌ $1**'
    );
    
    // Convert potential section headers to markdown headings
    enhancedText = enhancedText.replace(
      /^(MAIN THESIS|KEY CLAIMS|EVIDENCE QUALITY|POTENTIAL BIASES|COUNTERARGUMENTS):/gm,
      '### $1:'
    );
    
    // Ensure bullet points are properly formatted
    // If lines start with "- " but are not in a proper markdown list
    enhancedText = enhancedText.replace(
      /^- (.+)$/gm,
      '* $1'
    );
    
    return enhancedText;
  };

  return (
    <ReactMarkdown
      children={preprocessText(text)}
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom rendering for markdown elements
        h3: ({node, ...props}) => (
          <h3 style={{
            color: '#2196F3',
            fontSize: '16px',
            fontWeight: 600,
            marginTop: '16px',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(33, 150, 243, 0.3)',
            paddingBottom: '4px'
          }} {...props} />
        ),
        strong: ({node, ...props}) => (
          <strong style={{
            fontWeight: 600
          }} {...props} />
        ),
        p: ({node, children, ...props}) => {
          // Check if paragraph contains claim markers
          const content = children ? children.toString() : '';
          
          if (content.includes('✅')) {
            return (
              <p style={{
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderLeft: '3px solid #4CAF50',
                padding: '8px 12px',
                borderRadius: '0 4px 4px 0',
                marginBottom: '8px'
              }} {...props} />
            );
          } else if (content.includes('❌')) {
            return (
              <p style={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderLeft: '3px solid #F44336',
                padding: '8px 12px',
                borderRadius: '0 4px 4px 0',
                marginBottom: '8px'
              }} {...props} />
            );
          }
          
          return <p style={{marginBottom: '12px'}} {...props} />;
        },
        ul: ({node, ...props}) => (
          <ul style={{
            marginTop: '8px',
            marginBottom: '12px',
            paddingLeft: '24px'
          }} {...props} />
        ),
        li: ({node, ...props}) => (
          <li style={{
            marginBottom: '6px'
          }} {...props} />
        ),
      }}
    />
  );
};

export default SimpleMarkdownFormatter;