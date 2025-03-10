import React from 'react';

// This component provides placeholder SVGs for the homepage
// These would be replaced with actual image files in production

export const HeroAnalysisSVG = () => (
  <svg width="500" height="400" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    <rect x="50" y="50" width="400" height="80" rx="8" fill="#333" />
    <rect x="70" y="70" width="200" height="20" rx="4" fill="#2196f3" />
    <rect x="70" y="100" width="150" height="10" rx="2" fill="#64b5f6" opacity="0.7" />
    
    <rect x="50" y="150" width="400" height="80" rx="8" fill="#333" />
    <rect x="70" y="170" width="180" height="20" rx="4" fill="#0d47a1" />
    <rect x="70" y="200" width="130" height="10" rx="2" fill="#64b5f6" opacity="0.7" />
    
    <rect x="50" y="250" width="400" height="80" rx="8" fill="#333" />
    <rect x="70" y="270" width="220" height="20" rx="4" fill="#2196f3" />
    <rect x="70" y="300" width="160" height="10" rx="2" fill="#64b5f6" opacity="0.7" />
    
    <circle cx="430" cy="70" r="10" fill="#0d47a1" />
    <circle cx="430" cy="170" r="10" fill="#2196f3" />
    <circle cx="430" cy="270" r="10" fill="#0d47a1" />
  </svg>
);

export const WorkflowSVG = () => (
  <svg width="800" height="300" viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* First stage */}
    <rect x="50" y="100" width="180" height="100" rx="8" fill="#333" />
    <text x="140" y="150" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">Input Content</text>
    
    {/* Arrow */}
    <path d="M 230 150 L 290 150" stroke="#2196f3" strokeWidth="2" />
    <path d="M 290 150 L 280 145 L 280 155 Z" fill="#2196f3" />
    
    {/* Second stage */}
    <rect x="290" y="100" width="180" height="100" rx="8" fill="#333" />
    <text x="380" y="150" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">AI Analysis</text>
    
    {/* Arrow */}
    <path d="M 470 150 L 530 150" stroke="#2196f3" strokeWidth="2" />
    <path d="M 530 150 L 520 145 L 520 155 Z" fill="#2196f3" />
    
    {/* Third stage */}
    <rect x="530" y="100" width="180" height="100" rx="8" fill="#333" />
    <text x="620" y="150" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">Review Results</text>
  </svg>
);

export const EducationSVG = () => (
  <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Brain outline */}
    <ellipse cx="200" cy="150" rx="120" ry="100" fill="none" stroke="#2196f3" strokeWidth="2" />
    
    {/* Brain paths */}
    <path d="M 160 90 Q 200 120 240 90" fill="none" stroke="#0d47a1" strokeWidth="2" />
    <path d="M 150 120 Q 200 150 250 120" fill="none" stroke="#0d47a1" strokeWidth="2" />
    <path d="M 140 150 Q 200 180 260 150" fill="none" stroke="#0d47a1" strokeWidth="2" />
    <path d="M 140 180 Q 200 210 260 180" fill="none" stroke="#0d47a1" strokeWidth="2" />
    
    {/* Neurons */}
    <circle cx="160" cy="90" r="5" fill="#2196f3" />
    <circle cx="240" cy="90" r="5" fill="#2196f3" />
    <circle cx="150" cy="120" r="5" fill="#2196f3" />
    <circle cx="250" cy="120" r="5" fill="#2196f3" />
    <circle cx="140" cy="150" r="5" fill="#2196f3" />
    <circle cx="260" cy="150" r="5" fill="#2196f3" />
    <circle cx="140" cy="180" r="5" fill="#2196f3" />
    <circle cx="260" cy="180" r="5" fill="#2196f3" />
    
    {/* Light bulb */}
    <circle cx="200" cy="150" r="30" fill="#0d47a1" opacity="0.7" />
    <path d="M 185 180 L 185 200 L 215 200 L 215 180 Z" fill="#2196f3" />
  </svg>
);

// Demo content SVGs
export const DemoMisinformationSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Document with highlighted text */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Header */}
    <rect x="70" y="70" width="150" height="20" rx="4" fill="#2196f3" />
    
    {/* Text lines */}
    <rect x="70" y="110" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="130" width="340" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="150" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Highlighted false claim */}
    <rect x="70" y="180" width="200" height="15" rx="2" fill="#F44336" opacity="0.3" />
    <rect x="70" y="180" width="200" height="15" rx="2" stroke="#F44336" strokeWidth="1" fill="none" />
    <rect x="300" y="180" width="130" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* More text */}
    <rect x="70" y="210" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="230" width="300" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="250" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Verification badge */}
    <circle cx="450" cy="180" r="15" fill="#F44336" />
    <text x="450" y="185" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">✗</text>
  </svg>
);

export const DemoCredibilitySVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Source credibility meter */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Source name */}
    <rect x="70" y="70" width="180" height="20" rx="4" fill="#2196f3" />
    
    {/* Credibility meter */}
    <rect x="70" y="110" width="360" height="30" rx="15" fill="#222" />
    <rect x="70" y="110" width="290" height="30" rx="15" fill="#4CAF50" />
    
    {/* Credibility score */}
    <circle cx="360" cy="125" r="20" fill="#0d47a1" />
    <text x="360" y="130" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16"></text>
    
    {/* Metrics */}
    <rect x="70" y="160" width="110" height="15" rx="2" fill="#64b5f6" opacity="0.7" />
    <rect x="70" y="185" width="360" height="10" rx="2" fill="#4CAF50" opacity="0.5" />
    
    <rect x="70" y="210" width="110" height="15" rx="2" fill="#64b5f6" opacity="0.7" />
    <rect x="70" y="235" width="360" height="10" rx="2" fill="#FFEB3B" opacity="0.5" />
    
    <rect x="70" y="260" width="110" height="15" rx="2" fill="#64b5f6" opacity="0.7" />
    <rect x="70" y="285" width="360" height="10" rx="2" fill="#4CAF50" opacity="0.5" />
  </svg>
);

export const DemoScreenSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Video screen */}
    <rect x="50" y="50" width="400" height="200" rx="8" fill="#111" />
    
    {/* Video content */}
    <rect x="70" y="70" width="360" height="160" fill="#222" />
    
    {/* Person silhouette */}
    <circle cx="250" cy="120" r="25" fill="#0d47a1" />
    <rect x="225" y="145" width="50" height="45" rx="5" fill="#0d47a1" />
    
    {/* Caption with verification */}
    <rect x="50" y="260" width="400" height="40" rx="8" fill="#333" />
    <rect x="70" y="275" width="250" height="10" rx="2" fill="#64b5f6" opacity="0.7" />
    
    {/* Verification badge */}
    <circle cx="430" cy="275" r="15" fill="#4CAF50" />
    <text x="430" y="280" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">✓</text>
  </svg>
);

export const DemoTimelineSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Graph */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Grid lines */}
    <line x1="70" y1="100" x2="430" y2="100" stroke="#444" strokeWidth="1" />
    <line x1="70" y1="150" x2="430" y2="150" stroke="#444" strokeWidth="1" />
    <line x1="70" y1="200" x2="430" y2="200" stroke="#444" strokeWidth="1" />
    <line x1="70" y1="250" x2="430" y2="250" stroke="#444" strokeWidth="1" />
    
    <line x1="100" y1="80" x2="100" y2="270" stroke="#444" strokeWidth="1" />
    <line x1="180" y1="80" x2="180" y2="270" stroke="#444" strokeWidth="1" />
    <line x1="260" y1="80" x2="260" y2="270" stroke="#444" strokeWidth="1" />
    <line x1="340" y1="80" x2="340" y2="270" stroke="#444" strokeWidth="1" />
    <line x1="420" y1="80" x2="420" y2="270" stroke="#444" strokeWidth="1" />
    
    {/* Timeline graph - accuracy trend */}
    <path d="M 100 200 L 180 150 L 260 230 L 340 120 L 420 160" fill="none" stroke="#2196f3" strokeWidth="3" />
    
    {/* Data points */}
    <circle cx="100" cy="200" r="6" fill="#0d47a1" />
    <circle cx="180" cy="150" r="6" fill="#0d47a1" />
    <circle cx="260" cy="230" r="6" fill="#0d47a1" />
    <circle cx="340" cy="120" r="6" fill="#0d47a1" />
    <circle cx="420" cy="160" r="6" fill="#0d47a1" />
    
    {/* X and Y axis */}
    <line x1="70" y1="270" x2="430" y2="270" stroke="#fff" strokeWidth="2" />
    <line x1="70" y1="80" x2="70" y2="270" stroke="#fff" strokeWidth="2" />
    
    {/* Axis labels */}
    <text x="250" y="290" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="12">Timeline</text>
    <text x="45" y="170" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="12" transform="rotate(-90 45 170)">Accuracy</text>
  </svg>
);

export const JournalistsSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* News layout */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Header */}
    <rect x="70" y="70" width="180" height="25" rx="4" fill="#2196f3" />
    
    {/* Article */}
    <rect x="70" y="115" width="250" height="165" rx="4" fill="#222" />
    <rect x="90" y="135" width="210" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="160" width="210" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="185" width="210" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="210" width="170" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="235" width="210" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Verification panel */}
    <rect x="340" y="115" width="110" height="165" rx="4" fill="#0d47a1" opacity="0.7" />
    <circle cx="395" cy="145" r="20" fill="#4CAF50" />
    <text x="395" y="150" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">✓</text>
    
    <rect x="360" y="180" width="70" height="10" rx="2" fill="#fff" opacity="0.6" />
    <rect x="360" y="200" width="70" height="10" rx="2" fill="#fff" opacity="0.6" />
    <rect x="360" y="220" width="70" height="10" rx="2" fill="#fff" opacity="0.6" />
    <rect x="360" y="240" width="70" height="10" rx="2" fill="#fff" opacity="0.6" />
  </svg>
);

export const ResearchersSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Research dashboard */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Header */}
    <rect x="70" y="70" width="240" height="25" rx="4" fill="#2196f3" />
    
    {/* Citation analysis */}
    <rect x="70" y="115" width="175" height="165" rx="4" fill="#222" />
    <rect x="90" y="135" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="160" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="185" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="210" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="235" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Citation graph */}
    <rect x="265" y="115" width="175" height="165" rx="4" fill="#0d47a1" opacity="0.3" />
    
    {/* Network diagram */}
    <circle cx="295" cy="150" r="10" fill="#2196f3" />
    <circle cx="355" cy="175" r="15" fill="#2196f3" />
    <circle cx="385" cy="225" r="12" fill="#2196f3" />
    <circle cx="325" cy="210" r="8" fill="#2196f3" />
    <circle cx="410" cy="155" r="10" fill="#2196f3" />
    
    <line x1="295" y1="150" x2="355" y2="175" stroke="#64b5f6" strokeWidth="2" />
    <line x1="355" y1="175" x2="385" y2="225" stroke="#64b5f6" strokeWidth="2" />
    <line x1="355" y1="175" x2="325" y2="210" stroke="#64b5f6" strokeWidth="2" />
    <line x1="355" y1="175" x2="410" y2="155" stroke="#64b5f6" strokeWidth="2" />
    <line x1="325" y1="210" x2="385" y2="225" stroke="#64b5f6" strokeWidth="2" />
  </svg>
);

export const StudentsSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Student dashboard */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Header */}
    <rect x="70" y="70" width="200" height="25" rx="4" fill="#2196f3" />
    
    {/* Assignment panel */}
    <rect x="70" y="115" width="175" height="165" rx="4" fill="#222" />
    <rect x="90" y="135" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="160" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="90" y="185" width="135" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Verification badge */}
    <circle cx="115" cy="225" r="15" fill="#4CAF50" />
    <text x="115" y="230" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="16">✓</text>
    <rect x="140" y="220" width="85" height="15" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Progress chart */}
    <rect x="265" y="115" width="175" height="165" rx="4" fill="#0d47a1" opacity="0.3" />
    
    {/* Bar chart */}
    <rect x="285" y="145" width="20" height="115" rx="2" fill="#2196f3" />
    <rect x="315" y="175" width="20" height="85" rx="2" fill="#2196f3" />
    <rect x="345" y="155" width="20" height="105" rx="2" fill="#2196f3" />
    <rect x="375" y="135" width="20" height="125" rx="2" fill="#2196f3" />
    <rect x="405" y="185" width="20" height="75" rx="2" fill="#2196f3" />
    
    {/* X axis */}
    <line x1="275" y1="260" x2="425" y2="260" stroke="#fff" strokeWidth="1" />
  </svg>
);

export const NewsletterSVG = () => (
  <svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a" rx="16" ry="16" />
    
    {/* Newsletter */}
    <rect x="50" y="50" width="400" height="250" rx="8" fill="#333" />
    
    {/* Header */}
    <rect x="70" y="70" width="240" height="30" rx="4" fill="#2196f3" />
    
    {/* Content */}
    <rect x="70" y="120" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="140" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="160" width="360" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    <rect x="70" y="180" width="240" height="10" rx="2" fill="#64b5f6" opacity="0.6" />
    
    {/* Email input */}
    <rect x="70" y="220" width="240" height="40" rx="6" fill="#222" stroke="#64b5f6" strokeWidth="1" />
    <rect x="90" y="235" width="120" height="10" rx="2" fill="#64b5f6" opacity="0.3" />
    
    {/* Subscribe button */}
    <rect x="320" y="220" width="110" height="40" rx="6" fill="#0d47a1" />
    <rect x="345" y="235" width="60" height="10" rx="2" fill="#fff" opacity="0.8" />
    
    {/* Email icon */}
    <rect x="390" y="70" width="40" height="30" rx="4" fill="#0d47a1" />
    <polyline points="390,70 410,90 430,70" fill="none" stroke="#64b5f6" strokeWidth="2" />
  </svg>
);

// University logos
export const UniversityLogo = ({ name }: { name: string }) => (
  <svg width="120" height="60" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="transparent" />
    <rect x="10" y="10" width="100" height="40" rx="4" fill="#333" opacity="0.5" />
    <text x="60" y="35" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="12" fontWeight="bold">{name}</text>
  </svg>
);

// Placeholder for integration logos
export const PlaceholderLogo = ({ name }: { name: string }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#333" rx="8" />
    <text x="24" y="28" textAnchor="middle" fill="#fff" fontFamily="Arial" fontSize="10">{name.length > 10 ? name.substring(0, 8) + '..' : name}</text>
  </svg>
);

// Avatar for testimonials
export const AvatarPlaceholder = ({ id }: { id: string }) => (
  <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="30" fill={id === 'avatar1' ? '#2196f3' : id === 'avatar2' ? '#0d47a1' : '#64b5f6'} />
    <circle cx="30" cy="20" r="10" fill="#222" />
    <path d="M 10 55 C 10 40 50 40 50 55" fill="#222" />
  </svg>
);

// Export a function to be used in place of real image sources
export const getPlaceholderImage = (name: string) => {
  // Extract name without path and extension
  const baseName = name.split('/').pop()?.split('.')[0] || 'Logo';
  
  switch(name) {
    case "hero-analysis.svg":
      return <HeroAnalysisSVG />;
    case "workflow.svg":
      return <WorkflowSVG />;
    case "education.svg":
    case "students-image.svg":
      return <StudentsSVG />;
    case "journalists-image.svg":
      return <JournalistsSVG />;
    case "researchers-image.svg":
      return <ResearchersSVG />;
    case "newsletter.svg":
      return <NewsletterSVG />;
    case "demo-misinformation.svg":
      return <DemoMisinformationSVG />;
    case "demo-credibility.svg":
      return <DemoCredibilitySVG />;
    case "demo-screen.svg":
      return <DemoScreenSVG />;
    case "demo-timeline.svg":
      return <DemoTimelineSVG />;
    case "avatar1.jpg":
    case "avatar2.jpg":
    case "avatar3.jpg":
      return <AvatarPlaceholder id={baseName} />;
    default:
      // For university logos
      if (baseName.includes("logo")) {
        if (baseName.includes("harvard") || baseName.includes("stanford") || 
            baseName.includes("oxford") || baseName.includes("michigan") || 
            baseName.includes("ucla") || baseName.includes("waterloo")) {
          return <UniversityLogo name={baseName.replace("-logo", "").toUpperCase()} />;
        }
      }
      return <PlaceholderLogo name={baseName} />;
  }
};