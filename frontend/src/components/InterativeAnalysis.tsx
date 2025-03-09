import React, { useState, useEffect, useRef, JSX, useCallback } from 'react';
import './InteractiveAnalysis.css';
import axios from 'axios';

interface HighlightData {
  text: string;
  startIndex: number;
  endIndex: number;
  color: string;
  id: string;
  type: 'user' | 'system' | 'ai';
  note?: string;
  tags?: string[];
}

interface SourceData {
  url: string;
  title?: string;
  reliability?: 'high' | 'medium' | 'low';
}

interface AnalysisSummary {
  key: string;
  content: string;
}

interface InteractiveAnalysisProps {
  analysis: string;
  sources: string[] | SourceData[];
  onAnalysisShare?: (data: { text: string, highlights: HighlightData[] }) => void;
  enableAI?: boolean;
}

const InteractiveAnalysis: React.FC<InteractiveAnalysisProps> = ({ 
  analysis, 
  sources, 
  onAnalysisShare,
  enableAI = true,
}) => {
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [shareTooltip, setShareTooltip] = useState<boolean>(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(['Important', 'Question', 'Incorrect', 'Follow-up']);
  const [newTag, setNewTag] = useState<string>('');
  const [showTagInput, setShowTagInput] = useState<boolean>(false);
  const [highlightTags, setHighlightTags] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<AnalysisSummary[]>([]);
  const [viewMode, setViewMode] = useState<'full' | 'summary'>('full');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<number>(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(16);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareTarget, setCompareTarget] = useState<string>('');
  const [undoStack, setUndoStack] = useState<HighlightData[][]>([]);
  const [redoStack, setRedoStack] = useState<HighlightData[][]>([]);
  
  const analysisRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Save history for undo/redo
  const saveToHistory = useCallback((newHighlights: HighlightData[]) => {
    setUndoStack(prev => [...prev, highlights]);
    setRedoStack([]);
    setHighlights(newHighlights);
  }, [highlights]);

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, -1);
      
      setRedoStack(prev => [...prev, highlights]);
      setUndoStack(newUndoStack);
      setHighlights(previous);
    }
  }, [undoStack, highlights]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      
      setUndoStack(prev => [...prev, highlights]);
      setRedoStack(newRedoStack);
      setHighlights(next);
    }
  }, [redoStack, highlights]);

  // Auto-detect claims on component mount
  useEffect(() => {
    if (!analysis) return;
    
    // Regular expressions to find different types of claims
    const detectPatterns = [
      {
        regex: /(This claim is (inaccurate|misleading|vague|false)[^.]*\.)/gi,
        color: '#0d47a1',
        type: 'system'
      },
      {
        regex: /(This claim is (correct|true|right|accurate)[^.]*\.)/gi,
        color: '#2196f3',
        type: 'system'
      },
      {
        regex: /(This (statement|assertion) (lacks context|requires clarification)[^.]*\.)/gi,
        color: '#fb8c00',
        type: 'system'
      },
      {
        regex: /(Key finding:|Primary conclusion:)/gi,
        color: '#6a1b9a',
        type: 'system'
      }
    ];
    
    const systemHighlights: HighlightData[] = [];
    
    detectPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(analysis)) !== null) {
        const text = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + text.length;
        
        systemHighlights.push({
          text,
          startIndex,
          endIndex,
          color: pattern.color,
          id: `sys-${startIndex}`,
          type: pattern.type as 'system'
        });
      }
    });
    
    setHighlights(systemHighlights);
  }, [analysis]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y for redo
      if (((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) || 
          ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      
      // Cmd/Ctrl+F for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearching(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      
      // Escape to cancel operations
      if (e.key === 'Escape') {
        setShowColorPicker(false);
        setActiveNote(null);
        setIsSearching(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
      setSelectedText('');
      setSelectionRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedContent = selection.toString().trim();
    
    if (!selectedContent || !analysisRef.current) {
      setSelectedText('');
      setSelectionRange(null);
      return;
    }

    const analysisElement = analysisRef.current;
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(analysisElement);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + selectedContent.length;

    setSelectedText(selectedContent);
    setSelectionRange({ start, end });
    setShowColorPicker(true);
    setHighlightTags([]);
  };

  const addHighlight = (color: string) => {
    if (!selectionRange || !selectedText) return;

    const newHighlight: HighlightData = {
      text: selectedText,
      startIndex: selectionRange.start,
      endIndex: selectionRange.end,
      color,
      id: `user-${Date.now()}`,
      type: 'user',
      tags: highlightTags.length > 0 ? [...highlightTags] : undefined
    };

    const newHighlights = [...highlights, newHighlight];
    saveToHistory(newHighlights);
    
    setSelectedText('');
    setSelectionRange(null);
    setShowColorPicker(false);
    setHighlightTags([]);
  };

  const removeHighlight = (id: string) => {
    const newHighlights = highlights.filter(highlight => highlight.id !== id);
    saveToHistory(newHighlights);
    setActiveNote(null);
  };

  const addNoteToHighlight = (id: string) => {
    if (noteText.trim()) {
      const newHighlights = highlights.map(highlight => 
        highlight.id === id 
          ? { ...highlight, note: noteText } 
          : highlight
      );
      
      saveToHistory(newHighlights);
      setNoteText('');
      setActiveNote(null);
    }
  };

  const addTagToHighlight = (id: string, tag: string) => {
    const highlight = highlights.find(h => h.id === id);
    
    if (highlight) {
      const currentTags = highlight.tags || [];
      
      if (!currentTags.includes(tag)) {
        const newHighlights = highlights.map(h => 
          h.id === id 
            ? { ...h, tags: [...currentTags, tag] } 
            : h
        );
        
        saveToHistory(newHighlights);
      }
    }
  };

  const removeTagFromHighlight = (id: string, tag: string) => {
    const newHighlights = highlights.map(highlight => {
      if (highlight.id === id && highlight.tags) {
        return {
          ...highlight,
          tags: highlight.tags.filter(t => t !== tag)
        };
      }
      return highlight;
    });
    
    saveToHistory(newHighlights);
  };

  const addCustomTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const toggleTagSelection = (tag: string) => {
    setHighlightTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleSearch = () => {
    if (!searchTerm.trim() || !analysisRef.current) return;
    
    const text = analysis.toLowerCase();
    const term = searchTerm.toLowerCase();
    let count = 0;
    let index = -1;
    
    while ((index = text.indexOf(term, index + 1)) !== -1) {
      count++;
    }
    
    setSearchResults(count);
    setCurrentSearchIndex(count > 0 ? 1 : 0);
    
    if (count > 0) {
      // Highlight the first result
      const firstIndex = text.indexOf(term);
      const searchHighlight: HighlightData = {
        text: analysis.substring(firstIndex, firstIndex + term.length),
        startIndex: firstIndex,
        endIndex: firstIndex + term.length,
        color: '#ffeb3b80', // Yellow with transparency
        id: 'search-highlight',
        type: 'system'
      };
      
      // Keep only non-search highlights
      const filteredHighlights = highlights.filter(h => !h.id.startsWith('search-'));
      setHighlights([...filteredHighlights, searchHighlight]);
      
      // Scroll to the highlight
      setTimeout(() => {
        const highlightEl = document.getElementById('search-highlight');
        if (highlightEl) {
          highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults === 0) return;
    
    const text = analysis.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    let newIndex = direction === 'next' 
      ? (currentSearchIndex % searchResults) + 1
      : ((currentSearchIndex - 2 + searchResults) % searchResults) + 1;
    
    setCurrentSearchIndex(newIndex);
    
    // Find the nth occurrence
    let index = -1;
    for (let i = 0; i < newIndex; i++) {
      index = text.indexOf(term, index + 1);
    }
    
    if (index !== -1) {
      const searchHighlight: HighlightData = {
        text: analysis.substring(index, index + term.length),
        startIndex: index,
        endIndex: index + term.length,
        color: '#ffeb3b80', // Yellow with transparency
        id: 'search-highlight',
        type: 'system'
      };
      
      // Keep only non-search highlights
      const filteredHighlights = highlights.filter(h => !h.id.startsWith('search-'));
      setHighlights([...filteredHighlights, searchHighlight]);
      
      // Scroll to the highlight
      setTimeout(() => {
        const highlightEl = document.getElementById('search-highlight');
        if (highlightEl) {
          highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const generateAISummary = async () => {
    if (!enableAI) return;
    
    setAiAnalysisLoading(true);
    
    try {
      const response = await axios.post(
        "http://127.0.0.1:5005/analyze", 
        { statement: analysis },
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
      
      console.log("Backend Response:", response.data);
      
      // Check if the response has the expected structure
      if (!response.data || !response.data.analysis) {
        throw new Error('Invalid response format from API');
      }
      
      // Assuming the API returns a structured analysis with sections
      const analysisData = response.data.analysis;
      
      // Create a properly structured summary
      const aiSummary: AnalysisSummary[] = [];
      
      // Check if the response is an object with sections
      if (typeof analysisData === 'object' && analysisData !== null) {
        // If API returns structured data with sections
        if (analysisData.main_thesis) aiSummary.push({ key: 'main_thesis', content: analysisData.main_thesis });
        if (analysisData.key_claims) aiSummary.push({ key: 'key_claims', content: analysisData.key_claims });
        if (analysisData.evidence_quality) aiSummary.push({ key: 'evidence_quality', content: analysisData.evidence_quality });
        if (analysisData.potential_biases) aiSummary.push({ key: 'potential_biases', content: analysisData.potential_biases });
        if (analysisData.counterarguments) aiSummary.push({ key: 'counterarguments', content: analysisData.counterarguments });
      } else if (typeof analysisData === 'string') {
        // If API returns a single string, use it as main_thesis and generate placeholders for other sections
        aiSummary.push({ key: 'main_thesis', content: analysisData });
        
        // Extract potential sections from the text (simplified approach)
        const sentences = analysisData.split('. ');
        const keyClaims = sentences.filter(s => 
          s.toLowerCase().includes('claim') || 
          s.toLowerCase().includes('argue') || 
          s.toLowerCase().includes('assert')
        ).join('. ');
        
        const evidenceRelated = sentences.filter(s => 
          s.toLowerCase().includes('evidence') || 
          s.toLowerCase().includes('support') || 
          s.toLowerCase().includes('data')
        ).join('. ');
        
        const biasRelated = sentences.filter(s => 
          s.toLowerCase().includes('bias') || 
          s.toLowerCase().includes('skew') || 
          s.toLowerCase().includes('perspective')
        ).join('. ');
        
        // Add extracted sections if available, otherwise use placeholders
        aiSummary.push({ 
          key: 'key_claims', 
          content: keyClaims || 'Key claims extracted from the analysis.'
        });
        
        aiSummary.push({ 
          key: 'evidence_quality', 
          content: evidenceRelated || 'Evidence quality assessment from the analysis.'
        });
        
        aiSummary.push({ 
          key: 'potential_biases', 
          content: biasRelated || 'Potential biases identified in the analysis.'
        });
        
        aiSummary.push({ 
          key: 'counterarguments', 
          content: 'Counterarguments or alternative perspectives that could be considered.'
        });
      }
  
      setAiSummary(aiSummary);
      
      // Automatically switch to summary view if we successfully got analysis
      if (aiSummary.length > 0) {
        setViewMode('summary');
      }
      
    } catch (error) {
      console.error("Full error details:", error.response ? error.response.data : error);
      
      // Fallback to mock data if API fails
      const mockSummary = [
        { key: 'main_thesis', content: 'The document primarily argues that...' },
        { key: 'key_claims', content: 'The main claims include...' },
        { key: 'evidence_quality', content: 'The evidence presented is...' },
        { key: 'potential_biases', content: 'Potential biases include...' },
        { key: 'counterarguments', content: 'Counter perspectives not addressed include...' }
      ];
      
      setAiSummary(mockSummary);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const handleShare = () => {
    // Prepare sharing data
    let textToCopy = "Analysis with highlights:\n\n";
    textToCopy += analysis + "\n\n";
    
    if (highlights.length > 0) {
      textToCopy += "Highlights:\n";
      highlights
        .filter(h => !h.id.startsWith('search-'))
        .forEach((highlight, index) => {
          const highlightType = 
            highlight.type === 'system' ? 'System-detected' : 
            highlight.type === 'ai' ? 'AI-detected' : 
            'User-highlighted';
          
          textToCopy += `${index + 1}. ${highlightType}: "${highlight.text}"\n`;
          
          if (highlight.tags && highlight.tags.length > 0) {
            textToCopy += `   Tags: ${highlight.tags.join(', ')}\n`;
          }
          
          if (highlight.note) {
            textToCopy += `   Note: ${highlight.note}\n`;
          }
        });
    }
    
    // If we have a callback function, use it
    if (onAnalysisShare) {
      onAnalysisShare({
        text: textToCopy,
        highlights: highlights.filter(h => !h.id.startsWith('search-'))
      });
    }
    
    // Otherwise copy to clipboard
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
      })
      .catch(err => console.error('Failed to copy text:', err));
  };

  const handleCompareTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCompareTarget(e.target.value);
  };

  const performTextComparison = () => {
    if (!compareTarget.trim()) return;
    
    // This would be more sophisticated in a real implementation
    // For now, find matching text segments
    const minMatchLength = 5; // Minimum length of text to match
    
    const analysisLower = analysis.toLowerCase();
    const targetLower = compareTarget.toLowerCase();
    
    // Find matching segments
    const aiHighlights: HighlightData[] = [];
    
    for (let i = 0; i < analysisLower.length - minMatchLength; i++) {
      const segment = analysisLower.substring(i, i + minMatchLength);
      
      if (targetLower.includes(segment)) {
        // Find the full match
        let startIndex = i;
        let endIndex = i + minMatchLength;
        
        // Extend forward
        while (
          endIndex < analysisLower.length && 
          targetLower.includes(analysisLower.substring(i, endIndex + 1))
        ) {
          endIndex++;
        }
        
        // Skip overlapping segments
        const text = analysis.substring(startIndex, endIndex);
        
        // Check if this segment overlaps with any existing highlight
        const overlaps = aiHighlights.some(h => 
          (startIndex >= h.startIndex && startIndex < h.endIndex) ||
          (endIndex > h.startIndex && endIndex <= h.endIndex) ||
          (startIndex <= h.startIndex && endIndex >= h.endIndex)
        );
        
        if (!overlaps && text.trim().length >= minMatchLength) {
          aiHighlights.push({
            text,
            startIndex,
            endIndex,
            color: 'rgb(161, 33, 33)', // Purple with transparency
            id: `ai-match-${startIndex}`,
            type: 'ai',
            tags: ['Match Found']
          });
          
          // Skip to the end of this match
          i = endIndex - 1;
        }
      }
    }
    
    // Keep non-AI highlights and add the new ones
    const filteredHighlights = highlights.filter(h => h.type !== 'ai');
    saveToHistory([...filteredHighlights, ...aiHighlights]);
    
    setIsComparing(false);
  };

  // Create HTML with highlights overlaid on the text
  const renderHighlightedText = () => {
    if (!analysis) return null;
    
    // If we're in summary mode and have AI summary, show that instead
    if (viewMode === 'summary' && aiSummary.length > 0) {
      return (
        <div className="ai-summary">
          {aiSummary.map((item) => (
            <div key={item.key} className="summary-item">
              <h3>{item.key.replace('_', ' ').toUpperCase()}</h3>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      );
    }
    
    let result: JSX.Element[] = [];
    let currentIndex = 0;
    
    // Filter highlights if we have a filter tag
    const visibleHighlights = filterTag 
      ? highlights.filter(h => h.tags?.includes(filterTag) || h.id.startsWith('search-'))
      : highlights;
    
    // Sort highlights by start index
    const sortedHighlights = [...visibleHighlights]
      .sort((a, b) => a.startIndex - b.startIndex);
    
    for (const highlight of sortedHighlights) {
      // Add text before the highlight
      if (currentIndex < highlight.startIndex) {
        result.push(
          <span key={`text-${currentIndex}`}>
            {analysis.substring(currentIndex, highlight.startIndex)}
          </span>
        );
      }
      
      // Add the highlighted text
      result.push(
        <span 
          key={highlight.id}
          id={highlight.id}
          style={{ 
            backgroundColor: highlight.color,
            position: 'relative',
            padding: '2px 0',
            borderRadius: '2px',
            cursor: highlight.type === 'user' || highlight.type === 'ai' ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (highlight.type === 'user' || highlight.type === 'ai') {
              setActiveNote(activeNote === highlight.id ? null : highlight.id);
            }
          }}
        >
          {analysis.substring(highlight.startIndex, highlight.endIndex)}
          
          {(highlight.type === 'user' || highlight.type === 'ai') && (
            <span 
              className="highlight-actions"
              onClick={(e) => {
                e.stopPropagation();
                removeHighlight(highlight.id);
              }}
              title="Remove highlight"
            >
              ✕
            </span>
          )}
          
          {highlight.tags && highlight.tags.length > 0 && (
            <div className="highlight-tags">
              {highlight.tags.map(tag => (
                <span 
                  key={`${highlight.id}-${tag}`} 
                  className="tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTagFromHighlight(highlight.id, tag);
                  }}
                >
                  {tag} ✕
                </span>
              ))}
            </div>
          )}
          
          {highlight.note && (
            <span className="note-indicator" title={highlight.note}>📝</span>
          )}
          
          {activeNote === highlight.id && (
            <div className="note-popup">
              {!highlight.note ? (
                <>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="tag-selection">
                    {tags.map(tag => (
                      <span 
                        key={tag}
                        className={`selectable-tag ${highlight.tags?.includes(tag) ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (highlight.tags?.includes(tag)) {
                            removeTagFromHighlight(highlight.id, tag);
                          } else {
                            addTagToHighlight(highlight.id, tag);
                          }
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {!showTagInput && (
                      <span 
                        className="add-tag-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTagInput(true);
                        }}
                      >
                        + Add Tag
                      </span>
                    )}
                    {showTagInput && (
                      <div className="new-tag-input" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="New tag..."
                        />
                        <button onClick={addCustomTag}>Add</button>
                      </div>
                    )}
                  </div>
                  <div className="note-actions">
                    <button onClick={() => addNoteToHighlight(highlight.id)}>Save</button>
                    <button onClick={() => setActiveNote(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="existing-note">
                    <p>{highlight.note}</p>
                  </div>
                  <div className="note-actions">
                    <button onClick={() => {
                      setNoteText(highlight.note || '');
                      const newHighlights = highlights.map(h => 
                        h.id === highlight.id ? { ...h, note: undefined } : h
                      );
                      saveToHistory(newHighlights);
                    }}>Edit</button>
                    <button onClick={() => setActiveNote(null)}>Close</button>
                  </div>
                </>
              )}
            </div>
          )}
        </span>
      );
      
      currentIndex = highlight.endIndex;
    }
    
    // Add any remaining text
    if (currentIndex < analysis.length) {
      result.push(
        <span key={`text-${currentIndex}`}>
          {analysis.substring(currentIndex)}
        </span>
      );
    }
    
    return result;
  };

  // Determine if the source data is the simple string array or enhanced objects
  const normalizedSources: SourceData[] = sources.map(source => {
    if (typeof source === 'string') {
      return { url: source };
    }
    return source as SourceData;
  });

  return (
    <div className={`interactive-analysis ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="analysis-header">
        <h2>Analysis</h2>
        
        <div className="analysis-toolbar">
          {/* View Mode Selector */}
          {enableAI && aiSummary.length > 0 && (
            <div className="view-selector">
              <button 
                className={viewMode === 'full' ? 'active' : ''}
                onClick={() => setViewMode('full')}
              >
                Full Text
              </button>
              <button 
                className={viewMode === 'summary' ? 'active' : ''}
                onClick={() => setViewMode('summary')}
              >
                AI Summary
              </button>
            </div>
          )}
          
          {/* Search Toggle */}
          <button 
            className={`toolbar-button ${isSearching ? 'active' : ''}`}
            onClick={() => {
              setIsSearching(!isSearching);
              if (!isSearching) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            title="Search (Ctrl+F)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          
          {/* Tag Filter */}
          <div className="dropdown">
            <button className="toolbar-button" title="Filter by tag">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
            <div className="dropdown-content">
              <div className="tag-menu">
                <div 
                  className={`filter-option ${filterTag === null ? 'active' : ''}`}
                  onClick={() => setFilterTag(null)}
                >
                  Show All
                </div>
                {tags.map(tag => (
                  <div 
                    key={tag}
                    className={`filter-option ${filterTag === tag ? 'active' : ''}`}
                    onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Settings */}
          <div className="dropdown">
            <button className="toolbar-button" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            <div className="dropdown-content">
              <div className="settings-menu">
                <div className="setting-item">
                  <span>Dark Mode</span>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={isDarkMode} 
                      onChange={() => setIsDarkMode(!isDarkMode)} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <span>Font Size</span>
                  <div className="font-size-controls">
                    <button 
                      onClick={() => setFontSize(Math.max(12, fontSize - 2))} 
                      disabled={fontSize <= 12}
                    >
                      -
                    </button>
                    <span>{fontSize}px</span>
                    <button 
                      onClick={() => setFontSize(Math.min(24, fontSize + 2))} 
                      disabled={fontSize >= 24}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Undo/Redo */}
          <button 
            className="toolbar-button" 
            onClick={handleUndo} 
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h10a5 5 0 0 1 5 5v4h-5"></path>
              <path d="M3 10l5-5"></path>
              <path d="M3 10l5 5"></path>
            </svg>
          </button>
          <button 
            className="toolbar-button" 
            onClick={handleRedo} 
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10H11a5 5 0 0 0-5 5v4h5"></path>
              <path d="M21 10l-5-5"></path>
              <path d="M21 10l-5 5"></path>
            </svg>
          </button>
          
          {/* Compare Text */}
          <button 
            className={`toolbar-button ${isComparing ? 'active' : ''}`}
            onClick={() => setIsComparing(!isComparing)}
            title="Compare with text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="8" height="16" rx="1"></rect>
              <rect x="14" y="4" width="8" height="16" rx="1"></rect>
            </svg>
          </button>
          
          {/* Share */}
          <button 
            className="toolbar-button"
            onClick={handleShare}
            title="Share or export"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            {shareTooltip && <span className="tooltip">Copied to clipboard!</span>}
          </button>
          
          {/* AI Analysis (if enabled) */}
          {enableAI && (
            <button 
              className={`toolbar-button ai-button ${showAIPanel ? 'active' : ''}`}
              onClick={() => {
                setShowAIPanel(!showAIPanel);
                if (!aiSummary.length && !showAIPanel) {
                  generateAISummary();
                }
              }}
              title="AI Analysis"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a4 4 0 0 0-4 4v2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-4V6a4 4 0 0 0-4-4z"></path>
                <path d="M8 16v-4"></path>
                <path d="M12 16v-8"></path>
                <path d="M16 16v-4"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Search Bar (shown when isSearching is true) */}
      {isSearching && (
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
              if (e.key === 'Escape') {
                setIsSearching(false);
              }
            }}
          />
          <button onClick={handleSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          {searchResults > 0 && (
            <div className="search-navigation">
              <span>{currentSearchIndex} of {searchResults}</span>
              <button onClick={() => navigateSearch('prev')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button onClick={() => navigateSearch('next')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
          <button onClick={() => setIsSearching(false)} className="close-search">
            ✕
          </button>
        </div>
      )}
      
      {/* Compare Panel (shown when isComparing is true) */}
      {isComparing && (
        <div className="compare-panel">
          <textarea
            placeholder="Paste text to compare with this analysis..."
            value={compareTarget}
            onChange={handleCompareTextChange}
          />
          <div className="compare-actions">
            <button onClick={performTextComparison}>Find Matches</button>
            <button onClick={() => setIsComparing(false)}>Cancel</button>
          </div>
        </div>
      )}
      
      {/* AI Analysis Panel (shown when showAIPanel is true) */}
      {showAIPanel && (
        <div className="ai-panel">
          <h3>AI Analysis</h3>
          {aiAnalysisLoading ? (
            <div className="loading-spinner">Loading analysis...</div>
          ) : aiSummary.length > 0 ? (
            <div className="ai-insights">
              {aiSummary.map((item) => (
                <div key={item.key} className="insight-item">
                  <h4>{item.key.replace('_', ' ').toUpperCase()}</h4>
                  <p>{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={generateAISummary} className="generate-button">
              Generate Analysis
            </button>
          )}
        </div>
      )}
      
      <div className="analysis-content">
        {/* Main Analysis Text with Highlights */}
        <div 
          ref={analysisRef}
          className="analysis-text" 
          onMouseUp={handleTextSelection}
          style={{ fontSize: `${fontSize}px` }}
        >
          {renderHighlightedText()}
        </div>
        
        {/* Sources Panel */}
        <div className="sources-panel">
          <h3>Sources</h3>
          <ul className="source-list">
            {normalizedSources.map((source, index) => (
              <li key={index} className="source-item">
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title || source.url}
                </a>
                {source.reliability && (
                  <span className={`reliability ${source.reliability}`}>
                    {source.reliability.charAt(0).toUpperCase() + source.reliability.slice(1)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Color Picker for Highlighting */}
      {showColorPicker && selectedText && (
        <div className="color-picker">
          <div className="selected-text-preview">{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}</div>
          
          <div className="tag-selection-highlighted">
            {tags.map(tag => (
              <span 
                key={tag}
                className={`selectable-tag ${highlightTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTagSelection(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="color-options">
            <button 
              style={{ backgroundColor: '#ffeb3b' }} 
              onClick={() => addHighlight('#ffeb3b')}
              title="Yellow"
            />
            <button 
              style={{ backgroundColor: '#4caf50' }} 
              onClick={() => addHighlight('#4caf50')}
              title="Green"
            />
            <button 
              style={{ backgroundColor: '#f44336' }} 
              onClick={() => addHighlight('#f44336')}
              title="Red"
            />
            <button 
              style={{ backgroundColor: '#2196f3' }} 
              onClick={() => addHighlight('#2196f3')}
              title="Blue"
            />
            <button 
              style={{ backgroundColor: '#9c27b0' }} 
              onClick={() => addHighlight('#9c27b0')}
              title="Purple"
            />
            <button 
              style={{ backgroundColor: '#ff9800' }} 
              onClick={() => addHighlight('#ff9800')}
              title="Orange"
            />
          </div>
          
          <button className="close-color-picker" onClick={() => setShowColorPicker(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveAnalysis;