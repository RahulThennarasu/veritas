import React, { useState, useEffect, JSX } from 'react';
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
  
  // Colors for credibility scores
  const COLORS: Record<string, string> = {
    high: '#4caf50',
    medium: '#ff9800',
    low: '#f44336',
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
  
  // Generate sources data based on statements
  const generateSourcesFromStatements = (statements: string[]): Source[] => {
    // Extract potential source domains from statements
    const sources: Source[] = [];
    const patterns = [
      /https?:\/\/([^\/]+)\/[^\s]*/g,  // URLs
      /from\s+([^,\.]+)/ig,           // "from Source" patterns
      /according to\s+([^,\.]+)/ig,   // "according to Source" patterns
      /cited by\s+([^,\.]+)/ig,       // "cited by Source" patterns
    ];
    
    statements.forEach(statement => {
      if (typeof statement !== 'string') return;
      
      patterns.forEach(pattern => {
        const matches = [...String(statement).matchAll(pattern)];
        matches.forEach(match => {
          if (match && match[1]) {
            const domain = match[1].toLowerCase().trim();
            if (domain && domain.length > 2) {
              sources.push({
                domain: domain,
                url: match[0].startsWith('http') ? match[0] : `https://${domain}.com`,
                credibility: getRandomCredibilityScore(),
                appearance: Math.floor(Math.random() * 5) + 1,
                bias: getRandomBiasLevel(),
                factChecked: Math.random() > 0.5 ? 'Yes' : 'No',
                lastUpdated: getRandomDate(),
              });
            }
          }
        });
      });
    });
    
    // If no sources found in statements, return dummy data
    return sources.length > 0 ? sources : generateDummySourcesData();
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
  
  // Helper functions
  const getRandomCredibilityScore = (): string => {
    const scores = ['high', 'medium', 'low'];
    const weights = [0.5, 0.3, 0.2]; // More high than low
    
    let random = Math.random();
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return scores[i];
      }
      random -= weights[i];
    }
    
    return scores[0];
  };
  
  const getRandomBiasLevel = (): string => {
    const biases = ['extreme-left', 'moderate-left', 'slight-left', 'neutral', 'slight-right', 'moderate-right', 'extreme-right'];
    const weights = [0.05, 0.15, 0.2, 0.2, 0.2, 0.15, 0.05]; // More in the middle
    
    let random = Math.random();
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return biases[i];
      }
      random -= weights[i];
    }
    
    return biases[3]; // Default to neutral
  };
  
  const getRandomDate = (): string => {
    const start = new Date('2023-01-01');
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
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
  
  // Render the credibility feature
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
      
      {/* Credibility Panel (could be a modal or a slide-in panel) */}
      {showCredibility && (
        <div className="credibility-panel">
          <div className="credibility-panel-header">
            <h3>Source Credibility Analysis</h3>
            <button className="close-button" onClick={toggleCredibilityPanel}>×</button>
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
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={domainScores}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {domainScores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="credibility-summary-text">
  <p>
    <strong>Analysis Summary:</strong> {domainScores.length === 0 ? (
      "No sources detected to analyze."
    ) : (domainScores.find(d => d.name === 'High Credibility')?.value ?? 0) > 
       (domainScores.find(d => d.name === 'Low Credibility')?.value ?? 0) ? (
      "Most sources referenced have high credibility ratings. The information is likely reliable."
    ) : (
      "Several sources have questionable credibility. Verify this information with additional reliable sources."
    )}
  </p>
</div>
              </div>
              
              {/* Sources List */}
              <div className="sources-list">
                <h4>Referenced Sources</h4>
                {credibilityData.length === 0 ? (
                  <p>No sources detected in this conversation.</p>
                ) : (
                  <table className="sources-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Credibility</th>
                        <th>Bias</th>
                        <th>Fact-Checked</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credibilityData.map((source, index) => (
                        <tr key={index}>
                          <td>{source.domain}</td>
                          <td>{renderCredibilityBadge(source.credibility)}</td>
                          <td>{source.bias.replace('-', ' ')}</td>
                          <td>{source.factChecked}</td>
                          <td>
                            <button 
                              className="view-details-button"
                              onClick={() => openSourceDetails(source)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Recommendations */}
              <div className="credibility-recommendations">
                <h4>Recommendations</h4>
                <ul>
                  {domainScores.length === 0 ? (
                    <li>No sources detected. Consider adding references to support claims.</li>
                  ) : (domainScores.find(d => d.name === 'Low Credibility')?.value ?? 0) > 0 ? (
                    <>
                      <li>Some sources have low credibility ratings. Seek verification from more reliable sources.</li>
                      <li>Cross-check key claims with established fact-checking organizations.</li>
                      <li>Be cautious about sharing this information without additional verification.</li>
                    </>
                  ) : (
                    <>
                      <li>The sources appear generally reliable based on our analysis.</li>
                      <li>As with all information, critical thinking and verification are still recommended.</li>
                      <li>Consider the potential bias orientation when evaluating the information.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="credibility-empty">
              <p>No credibility data available. Start a conversation to analyze sources.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Source Details Modal */}
      {selectedSource && sourceDetails && (
        <div className="source-details-modal">
          <div className="source-details-header">
            <h3>{sourceDetails.fullName}</h3>
            <button className="close-button" onClick={closeSourceDetails}>×</button>
          </div>
          
          <div className="source-details-content">
            <div className="source-overview">
              <div className="source-credibility">
                <h4>Credibility Rating</h4>
                <div className="credibility-meter">
                  <div 
                    className="credibility-fill" 
                    style={{
                      width: selectedSource.credibility === 'high' ? '80%' : 
                             selectedSource.credibility === 'medium' ? '50%' : '20%',
                      backgroundColor: getCredibilityColor(selectedSource.credibility)
                    }}
                  ></div>
                </div>
                <div className="credibility-score">
                  <span>{sourceDetails.credibilityScore.score}</span>
                </div>
              </div>
              
              <div className="source-description">
                <p>{sourceDetails.description}</p>
              </div>
            </div>
            
            <div className="source-detail-sections">
              <div className="detail-section">
                <h4>Credibility Assessment</h4>
                <p>{sourceDetails.credibilityScore.description}</p>
                <p><strong>Recommendation:</strong> {sourceDetails.credibilityScore.recommendations}</p>
              </div>
              
              <div className="detail-section">
                <h4>Bias Analysis</h4>
                <p><strong>Orientation:</strong> {selectedSource.bias.replace('-', ' ')}</p>
                <p>{sourceDetails.biasAnalysis.description}</p>
                <p><strong>Potential Impact:</strong> {sourceDetails.biasAnalysis.impact}</p>
              </div>
              
              <div className="detail-section">
                <h4>Fact-Checking & Transparency</h4>
                <p><strong>Fact-Checking Policy:</strong> {sourceDetails.factCheckingPolicy}</p>
                <p><strong>Transparency Rating:</strong> {getTransparencyRating(selectedSource)}</p>
              </div>
              
              <div className="detail-section">
                <h4>Known Controversies</h4>
                <ul>
                  {sourceDetails.recentControversies.map((controversy, index) => (
                    <li key={index}>{controversy}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h4>Expert Opinions</h4>
                <ul>
                  {sourceDetails.expertOpinions.map((opinion, index) => (
                    <li key={index}>{opinion}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="source-actions">
              <button className="primary-button">View Related Articles</button>
              <button className="secondary-button">Find Alternative Sources</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CredibilityFeature;