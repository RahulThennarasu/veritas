import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../App.css';

// This component will properly render markdown in system messages
const MarkdownMessage = ({ content }) => {
  // Function to enhance plain text to markdown for better formatting
  const enhanceFormatting = (text) => {
    if (!text) return '';
    
    let enhancedText = text;
    
    // Replace "This claim is accurate/inaccurate:" with formatted headers
    enhancedText = enhancedText.replace(
      /^(This claim is (accurate|correct|true).*?)$/gm,
      '✅ **$1**'
    );
    
    enhancedText = enhancedText.replace(
      /^(This claim is (inaccurate|misleading|false|incorrect).*?)$/gm,
      '❌ **$1**'
    );
    
    // Replace section headers (UPPERCASE followed by colon) with markdown headers
    enhancedText = enhancedText.replace(
      /^([A-Z][A-Z\s]+):(.*)$/gm,
      '### $1:$2'
    );
    
    // Ensure list items are properly formatted with markdown bullets
    enhancedText = enhancedText.replace(
      /^- (.*)$/gm,
      '* $1'
    );
    
    return enhancedText;
  };

  return (
    <div className="markdown-message">
      <ReactMarkdown 
        children={enhanceFormatting(content)}
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({node, ...props}) => <h3 className="message-section-header" {...props} />,
          strong: ({node, ...props}) => <strong className="message-strong" {...props} />,
          p: ({node, ...props}) => <p className="message-paragraph" {...props} />,
          ul: ({node, ...props}) => <ul className="message-list" {...props} />,
          li: ({node, ...props}) => <li className="message-list-item" {...props} />
        }}
      />
    </div>
  );
};

export default MarkdownMessage;