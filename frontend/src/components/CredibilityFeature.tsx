import React, { useState, useEffect, useRef, JSX } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './CredibilityFeature.css';

// Define types for our data structures
interface Source {
  domain: string;
  url: string;
  credibility: 'high' | 'medium' | 'low' | string;
  appearance: number;
  bias: string;
  factChecked: string;
  lastUpdated: string;
}

interface Domain {
  name: string;
  count: number;
  credibility: string;
  bias: string;
  factChecked: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface CredibilityScore {
  score: string;
  description: string;
  recommendations: string;
}

interface BiasAnalysis {
  description: string;
  impact: string;
}

interface SourceDetails {
  name: string;
  fullName: string;
  description: string;
  credibilityScore: CredibilityScore;
  biasAnalysis: BiasAnalysis;
  factCheckingPolicy: string;
  transparencyRating: string;
  recentControversies: string[];
  expertOpinions: string[];
}

interface CredibilityFeatureProps {
  activeChatId?: string | null;
  statements?: string[];
  analysisSourceUrls?: string[];
}

// Credibility component that can be added to your sidebar or as a modal
const CredibilityFeature: React.FC<CredibilityFeatureProps> = ({ analysisSourceUrls = [], activeChatId, statements = [] }) => {
  const [showCredibility, setShowCredibility] = useState<boolean>(false);
  const [credibilityData, setCredibilityData] = useState<Source[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [sourceDetails, setSourceDetails] = useState<SourceDetails | null>(null);
  const [domainScores, setDomainScores] = useState<ChartData[]>([]);
  
  // Pop-out related state
  const [isPoppedOut, setIsPoppedOut] = useState<boolean>(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 450, height: 500 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  
  // Reference to the panel element
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Colors for credibility scores
  const COLORS: Record<string, string> = {
    high: '#0d47a1',
    medium: '#2196f3',  // Switched from '#64b5f6'
    low: '#64b5f6',     // Switched from '#2196f3'
    unknown: '#9e9e9e',
  };
  
  // Fetch credibility data when activeChatId changes or when feature is opened
  useEffect(() => {
    if (showCredibility && activeChatId) {
      fetchCredibilityData(activeChatId);
    }
  }, [activeChatId, showCredibility]);
  
  // Simulated function to fetch credibility data
  const fetchCredibilityData = async (chatId: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // If we have real sources, use them; otherwise, use dummy data
      const sourcesData = analysisSourceUrls.length > 0 
        ? processRealSources(analysisSourceUrls)
        : generateDummySourcesData();
        
      const domains = extractDomains(sourcesData);
      setDomainScores(calculateDomainScores(domains));
      setCredibilityData(sourcesData);
    } catch (error) {
      console.error('Error fetching credibility data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processRealSources = (urls: string[]): Source[] => {
    return urls.map(url => {
      try {
        // Extract domain from URL
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        return {
          domain: domain,
          url: url,
          credibility: determineDomainCredibility(domain),
          appearance: 1,
          bias: determineDomainBias(domain),
          factChecked: isDomainFactChecked(domain) ? 'Yes' : 'No',
          lastUpdated: getCurrentDate(),
        };
      } catch (e) {
        // If URL parsing fails, use the string as is
        const domain = url.replace(/^https?:\/\//, '').split('/')[0];
        return {
          domain: domain || url,
          url: url.startsWith('http') ? url : `https://${url}`,
          credibility: determineDomainCredibility(domain),
          appearance: 1,
          bias: determineDomainBias(domain),
          factChecked: isDomainFactChecked(domain) ? 'Yes' : 'No',
          lastUpdated: getCurrentDate(),
        };
      }
    });
  };

  const determineDomainCredibility = (domain: string): string => {
    // Domains with high credibility
    const highCredibilityDomains = [
      'wikipedia.org', 'nytimes.com', 'wsj.com', 'reuters.com', 
      'apnews.com', 'bbc.com', 'nature.com', 'science.org', 
      'nejm.org', 'ieee.org', 'acm.org', 'nih.gov', 'cdc.gov'
    ];
    
    // Domains with medium credibility
    const mediumCredibilityDomains = [
      'medium.com', 'vox.com', 'theatlantic.com', 'forbes.com',
      'businessinsider.com', 'time.com', 'cnn.com', 'foxnews.com',
      'washingtonpost.com', 'huffpost.com'
    ];
    
    // Domains with low credibility
    const lowCredibilityDomains = [
      'infowars.com', 'breitbart.com', 'dailykos.com', 'buzzfeed.com',
      'naturalnews.com', 'zerohedge.com'
    ];
    
    // Check if domain is in any of the lists
    if (highCredibilityDomains.some(d => domain.includes(d))) return 'high';
    if (mediumCredibilityDomains.some(d => domain.includes(d))) return 'medium';
    if (lowCredibilityDomains.some(d => domain.includes(d))) return 'low';
    
    // Default to medium for unknown domains
    return 'medium';
  };

  const determineDomainBias = (domain: string): string => {
    // Map of domain to bias
    const domainBiasMap: Record<string, string> = {
      'nytimes.com': 'slight-left',
      'wsj.com': 'slight-right',
      'foxnews.com': 'moderate-right',
      'breitbart.com': 'extreme-right',
      'huffpost.com': 'moderate-left',
      'dailykos.com': 'moderate-left',
      'reuters.com': 'neutral',
      'apnews.com': 'neutral',
      'bbc.com': 'slight-left',
      'cnn.com': 'moderate-left'
    };
    
    // Check if domain matches any in our map
    for (const [key, value] of Object.entries(domainBiasMap)) {
      if (domain.includes(key)) return value;
    }
    
    // Default to neutral for unknown domains
    return 'neutral';
  };

  const isDomainFactChecked = (domain: string): boolean => {
    // List of domains known to have fact-checking processes
    const factCheckedDomains = [
      'nytimes.com', 'wsj.com', 'reuters.com', 'apnews.com',
      'bbc.com', 'washingtonpost.com', 'cnn.com', 'foxnews.com',
      'nature.com', 'science.org', 'nejm.org', 'ieee.org', 'nih.gov', 'cdc.gov'
    ];
    
    return factCheckedDomains.some(d => domain.includes(d));
  };
  
  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };
  
  // Generate dummy data for demonstration
  const generateDummySourcesData = (): Source[] => {
    const dummySources: Source[] = [
      { domain: 'wikipedia.org', url: 'https://wikipedia.org', credibility: 'high', appearance: 12, bias: 'neutral', factChecked: 'Yes', lastUpdated: '2023-11-15' },
      { domain: 'nytimes.com', url: 'https://nytimes.com', credibility: 'high', appearance: 8, bias: 'slight-left', factChecked: 'Yes', lastUpdated: '2023-12-02' },
      { domain: 'wsj.com', url: 'https://wsj.com', credibility: 'high', appearance: 6, bias: 'slight-right', factChecked: 'Yes', lastUpdated: '2023-11-28' },
      { domain: 'bbc.com', url: 'https://bbc.com', credibility: 'high', appearance: 9, bias: 'slight-left', factChecked: 'Yes', lastUpdated: '2023-12-01' },
      { domain: 'reuters.com', url: 'https://reuters.com', credibility: 'high', appearance: 7, bias: 'neutral', factChecked: 'Yes', lastUpdated: '2023-11-30' },
      { domain: 'cnn.com', url: 'https://cnn.com', credibility: 'medium', appearance: 8, bias: 'moderate-left', factChecked: 'Yes', lastUpdated: '2023-11-25' },
      { domain: 'foxnews.com', url: 'https://foxnews.com', credibility: 'medium', appearance: 7, bias: 'moderate-right', factChecked: 'Yes', lastUpdated: '2023-11-24' },
      { domain: 'medium.com', url: 'https://medium.com', credibility: 'medium', appearance: 5, bias: 'moderate-left', factChecked: 'No', lastUpdated: '2023-10-15' },
      { domain: 'buzzfeed.com', url: 'https://buzzfeed.com', credibility: 'low', appearance: 3, bias: 'moderate-left', factChecked: 'No', lastUpdated: '2023-09-20' },
      { domain: 'infowars.com', url: 'https://infowars.com', credibility: 'low', appearance: 2, bias: 'extreme-right', factChecked: 'No', lastUpdated: '2023-08-18' },
    ];
    
    return dummySources;
  };
  
  const extractDomains = (sources: Source[]): Domain[] => {
    const domains: Record<string, Domain> = {};
    
    sources.forEach(source => {
      const domain = source.domain;
      if (!domains[domain]) {
        domains[domain] = {
          name: domain,
          count: 0,
          credibility: source.credibility,
          bias: source.bias,
          factChecked: source.factChecked,
        };
      }
      domains[domain].count += 1;
    });
    
    return Object.values(domains);
  };
  
  const calculateDomainScores = (domains: Domain[]): ChartData[] => {
    // Count the number of sources in each credibility category
    const credibilityCounts: Record<string, number> = {
      high: domains.filter(d => d.credibility === 'high').length,
      medium: domains.filter(d => d.credibility === 'medium').length,
      low: domains.filter(d => d.credibility === 'low').length,
      unknown: domains.filter(d => !d.credibility).length,
    };
    
    // Convert to chart data format
    return [
      { name: 'High Credibility', value: credibilityCounts.high, color: COLORS.high },
      { name: 'Medium Credibility', value: credibilityCounts.medium, color: COLORS.medium },
      { name: 'Low Credibility', value: credibilityCounts.low, color: COLORS.low },
      { name: 'Unknown', value: credibilityCounts.unknown, color: COLORS.unknown },
    ].filter(item => item.value > 0);
  };
  
  const openSourceDetails = (source: Source): void => {
    setSelectedSource(source);
    fetchSourceDetails(source);
  };
  
  const fetchSourceDetails = async (source: Source): Promise<void> => {
    // In a real implementation, this would fetch detailed information about the source
    // For now, we'll simulate it
    setSourceDetails({
      name: source.domain,
      fullName: getDomainFullName(source.domain),
      description: getSourceDescription(source.domain, source.credibility),
      credibilityScore: getCredibilityScoreDetails(source.credibility),
      biasAnalysis: getBiasAnalysis(source.bias),
      factCheckingPolicy: source.factChecked === 'Yes' ? 
        'Has formal fact-checking processes' : 
        'No formal fact-checking process identified',
      transparencyRating: getTransparencyRating(source),
      recentControversies: getSourceControversies(source.domain),
      expertOpinions: getExpertOpinionsOnSource(source.domain, source.credibility),
    });
  };
  
  // Helper functions for source details
  const getDomainFullName = (domain: string): string => {
    const domainMap: Record<string, string> = {
      'wikipedia.org': 'Wikipedia',
      'nytimes.com': 'The New York Times',
      'wsj.com': 'The Wall Street Journal',
      'bbc.com': 'British Broadcasting Corporation',
      'reuters.com': 'Reuters News Agency',
      'cnn.com': 'Cable News Network',
      'foxnews.com': 'Fox News',
      'medium.com': 'Medium',
      'buzzfeed.com': 'BuzzFeed',
      'infowars.com': 'InfoWars',
    };
    
    return domainMap[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  };
  
  const getSourceDescription = (domain: string, credibility: string): string => {
    const descriptions: Record<string, string> = {
      'wikipedia.org': 'A free online encyclopedia created and edited by volunteers around the world.',
      'nytimes.com': 'American daily newspaper based in New York City with worldwide influence and readership.',
      'wsj.com': 'Business-focused, English-language international daily newspaper based in New York City.',
      'bbc.com': 'British public service broadcaster, providing impartial news and information.',
      'reuters.com': 'International news organization and provider of financial markets data.',
      'cnn.com': 'American news-based pay television channel headquartered in Atlanta.',
      'foxnews.com': 'American conservative cable television news channel.',
      'medium.com': 'Online publishing platform developed by Evan Williams and launched in August 2012.',
      'buzzfeed.com': 'American Internet media, news and entertainment company focused on digital media.',
      'infowars.com': 'American far-right website and conspiracy theory platform operated by Alex Jones.',
    };
    
    if (descriptions[domain]) {
      return descriptions[domain];
    }
    
    // Generic description based on credibility
    const credibilityDescriptions: Record<string, string> = {
      'high': 'A generally reliable source with established fact-checking procedures.',
      'medium': 'A source that may contain accurate information but should be verified with additional sources.',
      'low': 'A source with known issues in accuracy, bias, or misinformation that requires significant verification.',
    };
    
    return credibilityDescriptions[credibility] || 'No detailed information available for this source.';
  };
  
  const getCredibilityScoreDetails = (credibility: string): CredibilityScore => {
    const details: Record<string, CredibilityScore> = {
      'high': {
        score: '8-10/10',
        description: 'Information from this source is generally reliable and can be trusted. The source has established fact-checking processes and a history of accurate reporting.',
        recommendations: 'Still appropriate to verify key facts with additional sources, especially for complex topics.',
      },
      'medium': {
        score: '5-7/10',
        description: 'Information may be accurate but should be treated with moderate caution. The source has mixed reliability or less rigorous fact-checking.',
        recommendations: 'Check against other reputable sources to verify information before citing or sharing.',
      },
      'low': {
        score: '1-4/10',
        description: 'Information should be treated with significant skepticism. The source has a history of inaccuracy, misinformation, or extreme bias.',
        recommendations: 'Seek multiple reliable sources to verify any claims before accepting or sharing.',
      },
    };
    
    return details[credibility] || {
      score: 'Unknown',
      description: 'Insufficient information to evaluate this source.',
      recommendations: 'Treat with caution and verify with established reliable sources.',
    };
  };
  
  const getBiasAnalysis = (bias: string): BiasAnalysis => {
    const biasInfo: Record<string, BiasAnalysis> = {
      'extreme-left': {
        description: 'Strongly promotes left-wing/progressive viewpoints with minimal consideration of opposing perspectives.',
        impact: 'May present facts selectively to support progressive narratives.',
      },
      'moderate-left': {
        description: 'Generally leans left in selection and presentation of topics, but with more balanced coverage.',
        impact: 'Sometimes underrepresents conservative viewpoints or arguments.',
      },
      'slight-left': {
        description: 'Subtle left-leaning tendencies in topic selection and framing, but generally balanced coverage.',
        impact: 'Slight bias usually appears in opinion content rather than news reporting.',
      },
      'neutral': {
        description: 'Presents information with minimal political bias in either direction.',
        impact: 'Focuses on factual reporting rather than partisan framing.',
      },
      'slight-right': {
        description: 'Subtle right-leaning tendencies in topic selection and framing, but generally balanced coverage.',
        impact: 'Slight bias usually appears in opinion content rather than news reporting.',
      },
      'moderate-right': {
        description: 'Generally leans right in selection and presentation of topics, but with more balanced coverage.',
        impact: 'Sometimes underrepresents progressive viewpoints or arguments.',
      },
      'extreme-right': {
        description: 'Strongly promotes right-wing/conservative viewpoints with minimal consideration of opposing perspectives.',
        impact: 'May present facts selectively to support conservative narratives.',
      },
    };
    
    return biasInfo[bias] || {
      description: 'Bias evaluation not available',
      impact: 'Unknown',
    };
  };
  
  const getTransparencyRating = (source: Source): string => {
    // Assign rating based on various factors
    if (source.credibility === 'high' && source.factChecked === 'Yes') {
      return 'High';
    } else if (source.credibility === 'low') {
      return 'Low';
    } else {
      return 'Medium';
    }
  };
  
  const getSourceControversies = (domain: string): string[] => {
    const controversies: Record<string, string[]> = {
      'wikipedia.org': ['Occasional vandalism of pages', 'Disputes over neutrality in politically sensitive topics'],
      'nytimes.com': ['Controversial 2020 editorial that led to editor\'s resignation', 'Criticized for coverage of WMDs in Iraq'],
      'foxnews.com': ['Multiple lawsuits regarding election coverage', 'FCC complaints about partisan coverage'],
      'infowars.com': ['Multiple defamation lawsuits', 'Banned from major social media platforms for policy violations'],
      'buzzfeed.com': ['Criticism over unverified Trump-Russia dossier publication', 'Questions about clickbait content quality'],
    };
    
    return controversies[domain] || ['No major controversies documented'];
  };
  
  const getExpertOpinionsOnSource = (domain: string, credibility: string): string[] => {
    if (credibility === 'high') {
      return [
        'Journalism review boards typically rate this source as reliable',
        'Frequently cited in academic and professional research',
        'Generally adheres to established journalistic standards'
      ];
    } else if (credibility === 'medium') {
      return [
        'Mixed reviews from media watchdog organizations',
        'Some content meets high journalistic standards while other content may not',
        'Sometimes cited in academic research with additional verification'
      ];
    } else {
      return [
        'Rated poorly by independent fact-checking organizations',
        'Rarely cited in academic or professional research',
        'Often criticized for failing to meet basic journalistic standards'
      ];
    }
  };
  
  // Close the source details panel
  const closeSourceDetails = (): void => {
    setSelectedSource(null);
    setSourceDetails(null);
  };
  
  // Toggle the credibility panel
  const toggleCredibilityPanel = (): void => {
    setShowCredibility(!showCredibility);
    if (!credibilityData && !showCredibility) {
      fetchCredibilityData(activeChatId || '');
    }
  };
  
  // Get color for credibility badge
  const getCredibilityColor = (credibility: string): string => {
    return COLORS[credibility] || COLORS.unknown;
  };
  
  // Render credibility badge
  const renderCredibilityBadge = (credibility: string): JSX.Element => {
    const color = getCredibilityColor(credibility);
    const label = credibility.charAt(0).toUpperCase() + credibility.slice(1);
    
    return (
      <span 
        className="credibility-badge" 
        style={{ 
          backgroundColor: color,
          color: 'white',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {label}
      </span>
    );
  };

  // Pop out functionality
  const handlePopOut = () => {
    setIsPoppedOut(!isPoppedOut);
    
    // Set starting position in the middle right of the screen
    if (!isPoppedOut) {
      setPosition({ 
        x: window.innerWidth - size.width - 50,
        y: Math.max(50, window.innerHeight / 2 - size.height / 2)
      });
    }
  };

  // Mouse down handler for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPoppedOut && (e.target as HTMLElement).closest(".credibility-panel-header")) {
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (isPoppedOut) {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeDirection(direction);
      setDragOffset({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  // Mouse move and up handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isPoppedOut) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing && isPoppedOut) {
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        // Handle different resize directions
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, size.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, size.width - deltaX);
          newX = position.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, size.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(200, size.height - deltaY);
          newY = position.y + deltaY;
        }
        
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        setDragOffset({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragOffset, isPoppedOut, position, size]);

  return (
    <>
      {/* Menu item in sidebar (update this part in your Sidebar component) */}
      <div className="menu-item" onClick={toggleCredibilityPanel}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>Credibility Analysis</span>
      </div>
      
      {/* Credibility Panel */}
      {showCredibility && (
        <div
          ref={panelRef}
          className={`credibility-panel ${isPoppedOut ? "popped-out" : ""}`}
          style={
            isPoppedOut
              ? {
                  position: "absolute",
                  top: `${position.y}px`,
                  left: `${position.x}px`,
                  width: `${size.width}px`,
                  height: `${size.height}px`,
                  zIndex: 1000,
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                  border: "1px solid #333",
                }
              : {}
          }
          onMouseDown={handleMouseDown}
        >
          <div className="credibility-panel-header">
            <h3>Source Credibility Analysis</h3>
            <div className="panel-controls">
              <button
                className="panel-control-button"
                title="Pop out"
                onClick={handlePopOut}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
              <button 
                className="panel-control-button" 
                onClick={() => setShowCredibility(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="credibility-loading">
              <div className="loading-spinner"></div>
              <p>Analyzing sources and credibility...</p>
            </div>
          ) : credibilityData ? (
            <div className="credibility-content">
              {/* Summary Section */}
              <div className="credibility-summary">
                <h4>Credibility Overview</h4>
                <div className="credibility-chart">
                  <ResponsiveContainer width="100%" height={220}>
  <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
    <Pie
      data={domainScores}
      cx="50%"
      cy="50%"
      labelLine={true}
      outerRadius={70}
      fill="#8884d8"
      dataKey="value"
      label={({ name, percent }) => {
        return `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`;
      }}
    >
      {domainScores.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip />
    <Legend verticalAlign="bottom" height={36} />
  </PieChart>
</ResponsiveContainer>
                </div>
                
                <div className="credibility-summary-text">
                  <p>
                  <strong>Analysis Summary:</strong> {domainScores.length === 0 ? (
                      "No sources detected to analyze."
                    ) : (domainScores.find(d => d.name === 'High Credibility')?.value ?? 0) > 
                       (domainScores.find(d => d.name === 'Low Credibility')?.value ?? 0) ? (
                      "The majority of sources have good credibility ratings."
                    ) : (domainScores.find(d => d.name === 'Low Credibility')?.value ?? 0) > 
                         (domainScores.find(d => d.name === 'High Credibility')?.value ?? 0) ? (
                      "Be cautious: many sources have low credibility ratings."
                    ) : (
                      "Sources have mixed credibility ratings."
                    )}
                  </p>
                  <p>
                    <strong>Recommendation:</strong> {domainScores.length === 0 ? (
                      "No specific recommendations available."
                    ) : (domainScores.find(d => d.name === 'Low Credibility')?.value ?? 0) > 0 ? (
                      "Verify claims with additional high-credibility sources."
                    ) : (
                      "Information is generally from reliable sources, but confirming with additional sources is still good practice."
                    )}
                  </p>
                </div>
              </div>
              
              {/* Sources List */}
              <div className="credibility-sources">
                <h4>Sources Used ({credibilityData.length})</h4>
                <div className="sources-list">
                {credibilityData.map((source, index) => (
  <div 
    key={index} 
    className="source-item" 
    onClick={() => openSourceDetails(source)}
  >
    <div className="source-domain">
      <span title={source.domain}>{source.domain}</span>
      {renderCredibilityBadge(source.credibility)}
    </div>
    <div className="source-meta">
      <span title={`Bias: ${source.bias.charAt(0).toUpperCase() + source.bias.slice(1)}`}>
        Bias: {source.bias.charAt(0).toUpperCase() + source.bias.slice(1)}
      </span>
      <span title={`Fact-checked: ${source.factChecked}`}>
        Fact-checked: {source.factChecked}
      </span>
    </div>
  </div>
))}
                </div>
              </div>
              
              {/* Statement Analysis - can be expanded in a real implementation */}
              {statements.length > 0 && (
                <div className="statement-analysis">
                  <h4>Statement Analysis</h4>
                  <div className="statements-list">
                    {statements.map((statement, index) => (
                      <div key={index} className="statement-item">
                        <p>"{statement.substring(0, 100)}..."</p>
                        <div className="statement-verdict">
                          {/* In a real implementation, this would show the verification status */}
                          <span>Status: Needs verification</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-credibility-data">
              <p>No source data available for analysis.</p>
              <button onClick={() => fetchCredibilityData(activeChatId || '')}>
                Analyze Sources
              </button>
            </div>
          )}
          
          {/* Resize handles for popped out mode */}
          {isPoppedOut && (
            <>
              <div 
                className="resize-handle resize-e" 
                onMouseDown={(e) => handleResizeStart(e, 'e')}
              ></div>
              <div 
                className="resize-handle resize-w" 
                onMouseDown={(e) => handleResizeStart(e, 'w')}
              ></div>
              <div 
                className="resize-handle resize-n" 
                onMouseDown={(e) => handleResizeStart(e, 'n')}
              ></div>
              <div 
                className="resize-handle resize-s" 
                onMouseDown={(e) => handleResizeStart(e, 's')}
              ></div>
              <div 
                className="resize-handle resize-ne" 
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              ></div>
              <div 
                className="resize-handle resize-nw" 
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              ></div>
              <div 
                className="resize-handle resize-se" 
                onMouseDown={(e) => handleResizeStart(e, 'se')}
              ></div>
              <div 
                className="resize-handle resize-sw" 
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              ></div>
            </>
          )}
        </div>
      )}
      
      {/* Source Details Modal */}
      {selectedSource && sourceDetails && (
        <div className="source-details-modal">
<div className="modal-content" style={{ maxWidth: '100%', overflow: 'hidden' }}>
<div className="modal-header">
              <h3>{sourceDetails.fullName}</h3>
              <button onClick={closeSourceDetails}>×</button>
            </div>
            <div className="modal-body">
              
              <div className="source-details-section">
                <h4>Source Overview</h4>
                <p>{sourceDetails.description}</p>
                <div className="source-badge-container">
                  {renderCredibilityBadge(selectedSource.credibility)}
                  <span className="source-bias-label">Bias: {selectedSource.bias.charAt(0).toUpperCase() + selectedSource.bias.slice(1)}</span>
                </div>
              </div>
              
              <div className="source-details-section">
                <h4>Credibility Analysis</h4>
                <p><strong>Score:</strong> {sourceDetails.credibilityScore.score}</p>
                <p>{sourceDetails.credibilityScore.description}</p>
                <p><strong>Recommendation:</strong> {sourceDetails.credibilityScore.recommendations}</p>
              </div>
              
              <div className="source-details-section">
                <h4>Bias Analysis</h4>
                <p>{sourceDetails.biasAnalysis.description}</p>
                <p><strong>Potential impact on content:</strong> {sourceDetails.biasAnalysis.impact}</p>
              </div>
              
              <div className="source-details-section">
                <h4>Fact-checking</h4>
                <p>{sourceDetails.factCheckingPolicy}</p>
                <p><strong>Transparency Rating:</strong> {sourceDetails.transparencyRating}</p>
              </div>
              
              <div className="source-details-section">
                <h4>Recent Controversies</h4>
                <ul>
                  {sourceDetails.recentControversies.map((controversy, index) => (
                    <li key={index}>{controversy}</li>
                  ))}
                </ul>
              </div>
              
              <div className="source-details-section">
                <h4>Expert Opinions</h4>
                <ul>
                  {sourceDetails.expertOpinions.map((opinion, index) => (
                    <li key={index}>{opinion}</li>
                  ))}
                </ul>
              </div>
              
              <div className="source-details-section">
  <h4>Original URL</h4>
  <a 
    href={selectedSource.url} 
    target="_blank" 
    rel="noopener noreferrer"
    style={{ 
      wordBreak: 'break-all', 
      display: 'inline-block', 
      maxWidth: '100%' 
    }}
  >
    {selectedSource.url}
  </a>
</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CredibilityFeature;