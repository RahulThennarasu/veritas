/**
 * Utilities for working with markdown content in the application
 */

/**
 * Convert a raw analysis object into well-formatted markdown
 * 
 * @param analysis Analysis object or string
 * @returns Formatted markdown string
 */
export function formatAnalysisToMarkdown(analysis: any): string {
    // If analysis is already a string, do basic cleanup
    if (typeof analysis === 'string') {
      return cleanupMarkdown(analysis);
    }
    
    // If analysis is an object with structured sections, format it nicely
    if (typeof analysis === 'object' && analysis !== null) {
      let result = '';
      
      // Format main thesis section
      if (analysis.main_thesis) {
        result += `## Main Thesis\n\n${analysis.main_thesis}\n\n`;
      }
      
      // Format key claims section
      if (analysis.key_claims) {
        result += `## Key Claims\n\n${analysis.key_claims}\n\n`;
      }
      
      // Format evidence quality section
      if (analysis.evidence_quality) {
        result += `## Evidence Quality\n\n${analysis.evidence_quality}\n\n`;
      }
      
      // Format potential biases section
      if (analysis.potential_biases) {
        result += `## Potential Biases\n\n${analysis.potential_biases}\n\n`;
      }
      
      // Format counterarguments section
      if (analysis.counterarguments) {
        result += `## Counterarguments\n\n${analysis.counterarguments}\n\n`;
      }
      
      // Add other sections using their keys as titles
      Object.entries(analysis).forEach(([key, value]) => {
        if (
          key !== 'main_thesis' && 
          key !== 'key_claims' && 
          key !== 'evidence_quality' && 
          key !== 'potential_biases' && 
          key !== 'counterarguments' &&
          typeof value === 'string'
        ) {
          // Format key from snake_case to Title Case
          const formattedKey = key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          result += `## ${formattedKey}\n\n${value}\n\n`;
        }
      });
      
      return cleanupMarkdown(result);
    }
    
    // Fallback: stringify the object
    return cleanupMarkdown(JSON.stringify(analysis, null, 2));
  }
  
  /**
   * Clean up markdown text with various improvements
   * 
   * @param text Raw markdown text
   * @returns Cleaned and enhanced markdown
   */
  export function cleanupMarkdown(text: string): string {
    if (!text) return '';
    
    let cleaned = text;
    
    // Ensure proper line breaks between sections
    cleaned = cleaned.replace(/([^\n])(#{1,3})/g, '$1\n\n$2');
    
    // Ensure proper spacing after list markers
    cleaned = cleaned.replace(/^(\s*[-*])[^\s]/gm, '$1 ');
    
    // Fix consecutive line breaks (more than 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Add line break before lists if needed
    cleaned = cleaned.replace(/([^\n])(\n\s*[-*])/g, '$1\n$2');
    
    // Replace "-" list items with "* " for better rendering
    cleaned = cleaned.replace(/^(\s*)-\s+/gm, '$1* ');
    
    // Enhance "This claim is accurate/inaccurate" patterns
    cleaned = cleaned.replace(
      /^(This claim is (accurate|correct|true).*?:)(.*)$/gm,
      '**$1** $3'
    );
    
    cleaned = cleaned.replace(
      /^(This claim is (inaccurate|misleading|false|incorrect).*?:)(.*)$/gm,
      '**$1** $3'
    );
    
    // Replace URLs with proper markdown links if they're not already
    cleaned = cleaned.replace(
      /((?:https?:\/\/)[^\s"<>]+)/g,
      '[$1]($1)'
    );
    
    // Avoid duplicate markdown links (already formatted URLs)
    cleaned = cleaned.replace(
      /\[\[(.*?)\]\((.*?)\)\]\((.*?)\)/g,
      '[$1]($2)'
    );
    
    // Bold important concepts with single asterisks (except links)
    cleaned = cleaned.replace(
      /(?<!\*|\[|.*\]\()([A-Z][A-Za-z\s]{2,}[A-Za-z])(?!.*\]|\*)/g,
      '**$1**'
    );
    
    return cleaned;
  }
  
  /**
   * Takes a message with raw text claims and enhances them with visual markers
   * 
   * @param message Original message text
   * @returns Enhanced message with visual formatting
   */
  export function enhanceClaimsInMessage(message: string): string {
    if (!message) return '';
    
    let enhanced = message;
    
    // Add checkmark to accurate claims
    enhanced = enhanced.replace(
      /^(This claim is (accurate|correct|true).*?)$/gm,
      '✅ $1'
    );
    
    // Add X mark to inaccurate claims
    enhanced = enhanced.replace(
      /^(This claim is (inaccurate|misleading|false|incorrect).*?)$/gm,
      '❌ $1'
    );
    
    // Highlight statements with contexts
    enhanced = enhanced.replace(
      /\b(in context|context is important|with context|lacks context)\b/gi,
      '**$1**'
    );
    
    return enhanced;
  }
  
  /**
   * Formats a message for display with consistent structure
   * 
   * @param message Original message text
   * @returns Formatted message text with enhanced structure
   */
  export function formatMessageForDisplay(message: string): string {
    if (!message) return '';
    
    // First apply the claim enhancements
    let formatted = enhanceClaimsInMessage(message);
    
    // Look for patterns like "Main Thesis: " and convert to headers
    formatted = formatted.replace(
      /^(MAIN THESIS|KEY CLAIMS|EVIDENCE QUALITY|POTENTIAL BIASES|COUNTERARGUMENTS):(.*)$/gim,
      '### $1:$2'
    );
    
    // Make sure list items are properly formatted for markdown
    formatted = formatted.replace(
      /^(-|\*) /gm,
      '* '
    );
    
    // Convert any URLs to links
    formatted = formatted.replace(
      /\b(https?:\/\/[^\s]+)\b/g,
      '[$1]($1)'
    );
    
    return formatted;
  }