import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './EnhancedHomePage.css';
import supabase from '../../supabaseClient';
import { getPlaceholderImage } from './PlaceholderImages.tsx';

const EnhancedHomePage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'journalists' | 'researchers'>('students');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeDemoTab, setActiveDemoTab] = useState('misinformation');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [showVideo, setShowVideo] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stats, setStats] = useState({
    claimsAnalyzed: 0,
    sourcesChecked: 0,
    usersCount: 0,
    universitiesCount: 0
  });
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Counter animation function
  const animateCounter = (target: HTMLElement, end: number, duration: number) => {
    const start = 0;
    const startTime = performance.now();
    
    function updateCounter(currentTime: number) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentCount = Math.floor(progress * (end - start) + start);
      
      target.textContent = currentCount.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }
    
    requestAnimationFrame(updateCounter);
  };

  // Observe elements for animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  // Simulate stat counter animation
  useEffect(() => {
    const counterElements = document.querySelectorAll('.stat-counter');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const targetValue = parseInt(target.getAttribute('data-target') || '0', 10);
          animateCounter(target, targetValue, 2000);
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.1 });

    counterElements.forEach(el => {
      observer.observe(el);
    });

    return () => {
      counterElements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  // Initialize stats
  useEffect(() => {
    setStats({
      claimsAnalyzed: 0,
      sourcesChecked: 0,
      usersCount: 0,
      universitiesCount: 0
    });
  }, []);

  // Handle scroll position for sticky header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    };
    checkAuth();
  }, []);

  // Handle video player
  const handlePlayVideo = () => {
    setShowVideo(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
          .then(() => setVideoPlaying(true))
          .catch(err => console.error("Error playing video:", err));
      }
    }, 100);
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowVideo(false);
    setVideoPlaying(false);
  };

  // Handle newsletter subscription
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulating API call
    setTimeout(() => {
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setNewsletterSuccess(false);
      }, 5000);
    }, 1000);
  };

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Demo content for different tabs
  const getDemoContent = () => {
    switch (activeDemoTab) {
      case 'misinformation':
        return {
          title: "Detect Misinformation in Real-Time",
          description: "Veritas scans statements and automatically identifies false or misleading information by cross-referencing multiple trusted sources. Catch misinformation before it spreads.",
          image: "demo-misinformation.svg"
        };
      case 'credibility':
        return {
          title: "Source Credibility Analysis",
          description: "Not all sources are equal. Veritas evaluates the credibility of sources based on historical accuracy, transparency, and reliability metrics to help you make better-informed decisions.",
          image: "demo-credibility.svg"
        };
      case 'screen':
        return {
          title: "Analyze Videos and Screen Content",
          description: "Use screen capture mode to analyze live presentations, news broadcasts, or online videos. Veritas transcribes and fact-checks content in real-time, highlighting claims as they occur.",
          image: "demo-screen.svg"
        };
      case 'timeline':
        return {
          title: "Track Claims Over Time",
          description: "See how information evolves with our Timeline Graph feature. Monitor the frequency of accurate vs. inaccurate claims and get comprehensive reports on trustworthiness.",
          image: "demo-timeline.svg"
        };
      default:
        return {
          title: "Detect Misinformation in Real-Time",
          description: "Veritas scans statements and automatically identifies false or misleading information by cross-referencing multiple trusted sources. Catch misinformation before it spreads.",
          image: "demo-misinformation.svg"
        };
    }
  };

  // FAQ data
  const faqData = [
    {
      question: "How does Veritas verify the accuracy of information?",
      answer: "Veritas uses a multi-layered approach to verify information accuracy. First, it analyzes the statement to identify specific claims. Then, it cross-references these claims against a vast database of verified facts and trusted sources. For complex topics, it evaluates multiple perspectives and primary sources, providing confidence scores and highlighting any potential inaccuracies or missing context."
    },
    {
      question: "Can Veritas analyze spoken content in videos?",
      answer: "Yes, Veritas can analyze spoken content in videos using our advanced speech-to-text technology. The screen capture feature allows you to analyze presentations, news broadcasts, podcasts, and other video content in real-time. The system transcribes the audio, identifies claims, and provides fact-checking results as the content plays."
    },
    {
      question: "How does the source credibility rating work?",
      answer: "The source credibility rating evaluates information sources based on multiple factors: historical accuracy, transparency in methodology, expertise in the subject matter, potential biases, and peer recognition. Each source receives a comprehensive score that helps you understand its reliability. The system is continuously updated to reflect changing credibility patterns in the information landscape."
    },
    {
      question: "Is Veritas suitable for academic research?",
      answer: "Absolutely. Veritas is widely used in academic settings for research verification, source evaluation, and teaching media literacy. The platform offers specialized tools for researchers, including citation analysis, methodology verification, and integration with reference management software. Many universities partner with us to provide Veritas accounts to their students and faculty."
    },
    {
      question: "Can I use Veritas for my organization or team?",
      answer: "Yes, Veritas offers Enterprise plans specifically designed for organizations and teams. These plans include additional features like team management, customized verification workflows, API access, and detailed analytics. We also provide custom onboarding and training for organizations to maximize the benefits of the platform."
    },
    {
      question: "How often is Veritas's knowledge base updated?",
      answer: "Veritas's knowledge base is continuously updated in real-time. Our system integrates with trusted news sources, academic databases, and fact-checking organizations to ensure the most current information is available. For rapidly evolving topics, Veritas clearly indicates the timestamp of the latest information and updates verification results as new information becomes available."
    }
  ];

  const demoContent = getDemoContent();

  return (
    <div className="enhanced-homepage">
      {/* Video Modal */}
      {showVideo && (
        <div className="video-modal">
          <div className="video-container">
            <button className="close-video-btn" onClick={closeVideo}>×</button>
            <video 
              ref={videoRef}
              controls
              className="feature-video"
              poster="/video-thumbnail.jpg"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`enhanced-header ${scrollPosition > 50 ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo-container">
            <div className="veritasso-logo">
              <div className="veritasso-infinity">
                <div className="veritasso-left"></div>
                <div className="veritasso-right"></div>
                <div className="veritasso-bridge"></div>
              </div>
            </div>
            <span className="logo-text">veritas</span>
          </div>
          
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <button onClick={() => scrollToSection(heroRef)} className="nav-link">Home</button>
            <button onClick={() => scrollToSection(featuresRef)} className="nav-link">Features</button>
            <button onClick={() => scrollToSection(demoRef)} className="nav-link">How It Works</button>
            <button onClick={() => scrollToSection(useCasesRef)} className="nav-link">Use Cases</button>
            <button onClick={() => scrollToSection(pricingRef)} className="nav-link">Pricing</button>
            <button onClick={() => scrollToSection(faqRef)} className="nav-link">FAQ</button>
            {isLoggedIn ? (
              <Link to="/app" className="nav-button">Dashboard</Link>
            ) : (
              <Link to="/signin" className="nav-button">Sign In</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="enhanced-hero">
        <div className="hero-background">
          <div className="hero-particles"></div>
          <div className="hero-gradient"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text-container animate-on-scroll">
            <h1>
              <span className="gradient-text">Truth</span> at your fingertips
            </h1>
            <p className="hero-subtitle">Harness the power of AI to analyze claims, verify sources, and protect yourself from misinformation in real-time.</p>
            <div className="hero-buttons">
              {isLoggedIn ? (
                <Link to="/app" className="primary-btn">Go to Dashboard</Link>
              ) : (
                <Link to="/signup" className="primary-btn">Start Free Trial</Link>
              )}
              <button onClick={handlePlayVideo} className="secondary-btn video-btn">
                <svg viewBox="0 0 24 24" className="play-icon">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" />
                </svg>
                Watch Demo
              </button>
            </div>
          </div>
          
          <div className="hero-image-container animate-on-scroll">
            <div className="floating-elements">
              <div className="floating-element true-claim">
                <span className="element-icon"></span>
                <span className="element-text">Verified Claim</span>
              </div>
              <div className="floating-element false-claim">
                <span className="element-icon"></span>
                <span className="element-text">False Information</span>
              </div>
              <div className="floating-element source">
                <span className="element-icon"></span>
                <span className="element-text">Credible Source</span>
              </div>
            </div>
            <div className="hero-device">
              {getPlaceholderImage("hero-analysis.svg")}
              <div className="pulsing-dot"></div>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <div className="arrow-scroll">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item animate-on-scroll">
            <div className="stat-value">
              <span className="stat-counter" data-target={stats.claimsAnalyzed}>0</span>+
            </div>
            <div className="stat-label">Claims Analyzed</div>
          </div>
          <div className="stat-item animate-on-scroll">
            <div className="stat-value">
              <span className="stat-counter" data-target={stats.sourcesChecked}>0</span>+
            </div>
            <div className="stat-label">Sources Checked</div>
          </div>
          <div className="stat-item animate-on-scroll">
            <div className="stat-value">
              <span className="stat-counter" data-target={stats.usersCount}>0</span>+
            </div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-item animate-on-scroll">
            <div className="stat-value">
              <span className="stat-counter" data-target={stats.universitiesCount}>0</span>+
            </div>
            <div className="stat-label">Partner Universities</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="enhanced-features">
        <div className="section-heading animate-on-scroll">
          <span className="section-subtitle">Key Capabilities</span>
          <h2>Features that <span className="gradient-text">empower you</span></h2>
          <p>Cut through the noise with AI-powered tools that verify claims, evaluate sources, and reveal insights</p>
        </div>
        
        <div className="feature-grid">
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Real-time Analysis</h3>
            <p>Analyze statements instantly as they happen, with AI detecting claims and verifying accuracy within seconds.</p>
          </div>
          
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h3>Source Credibility</h3>
            <p>Understand where information comes from with detailed source evaluation and reliability scoring.</p>
          </div>
          
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3>Screen Capture</h3>
            <p>Record your screen to analyze live presentations, news broadcasts, or videos with automatic transcription.</p>
          </div>
          
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <h3>Timeline Graph</h3>
            <p>Visualize patterns of accuracy over time with interactive graphs showing claim verification history.</p>
          </div>
          
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </div>
            <h3>Context Analysis</h3>
            <p>Get the full picture with additional context, relevant background, and nuanced perspectives on complex topics.</p>
          </div>
          
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3>Team Collaboration</h3>
            <p>Share analysis results, collaborate on fact-checking, and maintain a shared workspace for verified content.</p>
          </div>
        </div>
        
        <div className="advanced-features animate-on-scroll">
          <h3>Advanced Capabilities</h3>
          <div className="advanced-features-grid">
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Multi-language support</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>API integration</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Custom verification rules</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Batch processing</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Exportable reports</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Priority processing</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Historical archives</span>
            </div>
            <div className="advanced-feature">
              <span className="check-icon">✓</span>
              <span>Citation generation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="enhanced-comparison animate-on-scroll">
        <div className="section-heading">
          <span className="section-subtitle">Performance</span>
          <h2>Leading the industry in <span className="gradient-text">speed & accuracy</span></h2>
          <p>Veritas processes information faster and more accurately than other AI solutions</p>
        </div>
        
        <div className="comparison-chart">
          <div className="comparison-bar-container">
            <div className="comparison-label">
              <span className="company">veritas </span>
              <span className="value"></span>
            </div>
            <div className="comparison-bar">
              <div className="bar-fill veritas" style={{width: '90%'}}></div>
            </div>
          </div>
          
          <div className="comparison-bar-container">
            <div className="comparison-label">
              <span className="company"></span>
              <span className="value"></span>
            </div>
            <div className="comparison-bar">
              <div className="bar-fill llama" style={{width: '60%'}}></div>
            </div>
          </div>
          
          <div className="comparison-bar-container">
            <div className="comparison-label">
              <span className="company"></span>
              <span className="value"></span>
            </div>
            <div className="comparison-bar">
              <div className="bar-fill gpt" style={{width: '40%'}}></div>
            </div>
          </div>
          
          <div className="comparison-bar-container">
            <div className="comparison-label">
              <span className="company"></span>
              <span className="value"></span>
            </div>
            <div className="comparison-bar">
              <div className="bar-fill o1" style={{width: '20%'}}></div>
            </div>
          </div>
        </div>
        
        <div className="comparison-features">
          <div className="accuracy-comparison">
            <div className="comparison-feature-title">Accuracy Rates</div>
            <div className="comparison-feature-box">
              <div className="comparison-feature-item">
                <span className="feature-brand veritas">Veritas</span>
                <div className="feature-bar-container">
                  <div className="feature-bar" style={{width: '94%'}}></div>
                </div>
              </div>
              <div className="comparison-feature-item">
                <span className="feature-brand others">Industry Average</span>
                <div className="feature-bar-container">
                  <div className="feature-bar" style={{width: '78%'}}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="source-comparison">
            <div className="comparison-feature-title">Sources Analyzed</div>
            <div className="comparison-feature-box">
              <div className="comparison-feature-item">
                <span className="feature-brand veritas">Veritas</span>
                <div className="feature-bar-container">
                  <div className="feature-bar" style={{width: '90%'}}></div>
                </div>
              </div>
              <div className="comparison-feature-item">
                <span className="feature-brand others">Industry Average</span>
                <div className="feature-bar-container">
                  <div className="feature-bar" style={{width: '30%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section ref={demoRef} className="demo-section">
        <div className="section-heading animate-on-scroll">
          <span className="section-subtitle">See It In Action</span>
          <h2>How <span className="gradient-text">Veritas</span> Works</h2>
          <p>Experience the power of AI-driven fact-checking and source analysis</p>
        </div>
        
        <div className="demo-tabs animate-on-scroll">
          <button 
            className={`demo-tab ${activeDemoTab === 'misinformation' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('misinformation')}
          >
            Misinformation Detection
          </button>
          <button 
            className={`demo-tab ${activeDemoTab === 'credibility' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('credibility')}
          >
            Source Credibility
          </button>
          <button 
            className={`demo-tab ${activeDemoTab === 'screen' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('screen')}
          >
            Screen Capture
          </button>
          <button 
            className={`demo-tab ${activeDemoTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('timeline')}
          >
            Timeline Analysis
          </button>
        </div>
        
        <div className="demo-content animate-on-scroll">
          <div className="demo-info">
            <h3>{demoContent.title}</h3>
            <p>{demoContent.description}</p>
            <button className="try-feature-btn" onClick={() => isLoggedIn ? window.location.href = '/app' : window.location.href = '/signup'}>
              Try It Now
              <svg viewBox="0 0 24 24" className="arrow-icon">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="demo-preview">
            {getPlaceholderImage(demoContent.image)}
            <div className="demo-interactions">
              <div className="interaction-dot"></div>
              <div className="interaction-dot"></div>
              <div className="interaction-dot"></div>
            </div>
          </div>
        </div>
        
        <div className="workflow-steps animate-on-scroll">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h4>Input Content</h4>
            <p>Enter text, upload documents, or use screen capture to analyze media in real-time</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h4>AI Processing</h4>
            <p>Our advanced AI identifies claims and cross-references against trusted sources</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h4>Verification</h4>
            <p>Claims are verified with accuracy scores and links to supporting evidence</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <h4>Insights</h4>
            <p>Get detailed analysis, source credibility scores, and contextual information</p>
          </div>
        </div>
      </section>

      {/* Use Cases / Audience Tabs */}
      <section ref={useCasesRef} className="use-cases-section">
        <div className="section-heading animate-on-scroll">
          <span className="section-subtitle">Made For Everyone</span>
          <h2>Who uses <span className="gradient-text">Veritas</span>?</h2>
          <p>Customized solutions for different needs across education, media, and research</p>
        </div>
        
        <div className="audience-tabs animate-on-scroll">
          <button 
            className={`audience-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <svg viewBox="0 0 24 24" className="tab-icon">
              <path d="M12 3L1 9l11 6 9-4.91V17c0 .5.5 1 1 1s1-.5 1-1v-7l-10-6z" />
              <path d="M5 13.18v4L12 21l7-3.82v-4" />
            </svg>
            <span>Students & Educators</span>
          </button>
          
          <button 
            className={`audience-tab ${activeTab === 'journalists' ? 'active' : ''}`}
            onClick={() => setActiveTab('journalists')}
          >
            <svg viewBox="0 0 24 24" className="tab-icon">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"></path>
              <path d="M10 4v16M4 8h16M4 16h16"></path>
            </svg>
            <span>Journalists & Media</span>
          </button>
          
          <button 
            className={`audience-tab ${activeTab === 'researchers' ? 'active' : ''}`}
            onClick={() => setActiveTab('researchers')}
          >
            <svg viewBox="0 0 24 24" className="tab-icon">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <span>Researchers & Analysts</span>
          </button>
        </div>
        
        <div className="use-case-content animate-on-scroll">
          {activeTab === 'students' && (
            <div className="use-case-panel">
              <div className="use-case-image">
                {getPlaceholderImage("students-image.svg")}
              </div>
              <div className="use-case-info">
                <h3>Empowering Students & Educators</h3>
                <p>Veritas gives students and educators the tools to develop critical thinking skills and digital literacy in an age of information overload.</p>
                <ul className="use-case-features">
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Research Verification</h4>
                      <p>Quickly verify sources for research papers and projects with confidence</p>
                    </div>
                  </li>
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Media Literacy</h4>
                      <p>Build critical thinking skills by understanding how to evaluate information</p>
                    </div>
                  </li>
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Classroom Tools</h4>
                      <p>Special features for educators to create exercises and track student progress</p>
                    </div>
                  </li>
                </ul>
                <div className="use-case-cta">
                  <Link to="/education" className="learn-more-btn">Learn About Education Plans</Link>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'journalists' && (
            <div className="use-case-panel">
              <div className="use-case-image">
                {getPlaceholderImage("journalists-image.svg")}
              </div>
              <div className="use-case-info">
                <h3>Essential for Journalism & Media</h3>
                <p>Veritas helps journalists maintain accuracy, verify sources, and build trust in an era where speed often competes with truth.</p>
                <ul className="use-case-features">
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Rapid Fact-Checking</h4>
                      <p>Verify facts in real-time during breaking news and live reporting</p>
                    </div>
                  </li>
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Interview Analysis</h4>
                      <p>Review statements from interviews and press conferences for accuracy</p>
                    </div>
                  </li>
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Data Verification</h4>
                      <p>Check statistics, quotes, and data points against primary sources</p>
                    </div>
                  </li>
                </ul>
                <div className="use-case-cta">
                  <Link to="/media" className="learn-more-btn">Explore Media Solutions</Link>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'researchers' && (
            <div className="use-case-panel">
              <div className="use-case-image">
                {getPlaceholderImage("researchers-image.svg")}
              </div>
              <div className="use-case-info">
                <h3>Powerful Tools for Researchers</h3>
                <p>Veritas provides researchers and analysts with advanced verification tools to maintain integrity and save time in their work.</p>
                <ul className="use-case-features">
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Citation Verification</h4>
                      <p>Automatically check citations against original sources for accuracy</p>
                    </div>
                  </li>
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>Methodology Analysis</h4>
                      <p>Evaluate research methodologies and data integrity in published studies</p>
                    </div>
                  </li>
                  <li>
                    <span className="use-case-icon"></span>
                    <div>
                      <h4>API Integration</h4>
                      <p>Connect Veritas to research workflows with our comprehensive API</p>
                    </div>
                  </li>
                </ul>
                <div className="use-case-cta">
                  <Link to="/research" className="learn-more-btn">Discover Research Tools</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Integrations Section */}
      <section className="integrations-section animate-on-scroll">
        <div className="section-heading">
          <span className="section-subtitle">Seamless Workflow</span>
          <h2>Works with your <span className="gradient-text">favorite tools</span></h2>
          <p>Integrate Veritas with the applications and services you already use  Underdevelopement</p>
        </div>
        
        <div className="integration-grid">
          <div className="integration-item">
            {getPlaceholderImage("apple-news.svg")}
            <span>Apple News</span>
          </div>
          <div className="integration-item">
            {getPlaceholderImage("google-news.svg")}
            <span>Google News</span>
          </div>
          <div className="integration-item">
            {getPlaceholderImage("youtube.svg")}
            <span>Youtube</span>
          </div>
          <div className="integration-item">
            {getPlaceholderImage("twitter.svg")}
            <span>Twitter</span>
          </div>
          <div className="integration-item">
            {getPlaceholderImage("teams.svg")}
            <span>Teams</span>
          </div>
          <div className="integration-item">
            {getPlaceholderImage("zoom.svg")}
            <span>Zoom</span>
          </div>
          <div className="integration-item">
            {getPlaceholderImage("yelp.svg")}
            <span>Yelp</span>
          </div>
        </div>
        
        <div className="api-callout">
          <div className="api-info">
            <h3>Developer API</h3>
            <p>Build your own integrations with comprehensive API. Access the full power of Veritas verification in your custom applications.</p>
            <Link to="/developers" className="text-link">
              Currently Underdevelopment
              <svg viewBox="0 0 24 24" className="link-arrow">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="api-code">
            <pre className="code-sample">
              <code>{`// Veritas API Example
const veritas = require('veritas-api');
const client = new veritas.Client({ apiKey: 'YOUR_API_KEY' });

// Verify a claim
const result = await client.verify({
  text: "The Earth is getting warmer each decade.",
  options: { 
    detail: "high",
    includeSources: true 
  }
});

console.log(result.accuracy); // 0.92
console.log(result.sources);  // Array of source objects`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className="testimonials-section">
        <div className="section-heading animate-on-scroll">
          <span className="section-subtitle">What People Say</span>
          <h2>Trusted by <span className="gradient-text">thousands</span></h2>
          <p>Hear from our users across education, journalism, and research</p>
        </div>
        
        <div className="testimonials-grid animate-on-scroll">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <svg className="quote-icon" viewBox="0 0 24 24">
                <path d="M10 11H4V5h6v6zm10 0h-6V5h6v6zm-10 10H4v-6h6v6zm10 0h-6v-6h6v6z" />
              </svg>
              <p>"quote"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                {getPlaceholderImage("avatar1.jpg")}
              </div>
              <div className="author-info">
                <h4>User</h4>
                <p>Status</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <svg className="quote-icon" viewBox="0 0 24 24">
                <path d="M10 11H4V5h6v6zm10 0h-6V5h6v6zm-10 10H4v-6h6v6zm10 0h-6v-6h6v6z" />
              </svg>
              <p>"quote"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                {getPlaceholderImage("avatar2.jpg")}
              </div>
              <div className="author-info">
                <h4>User</h4>
                <p>Status</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <svg className="quote-icon" viewBox="0 0 24 24">
                <path d="M10 11H4V5h6v6zm10 0h-6V5h6v6zm-10 10H4v-6h6v6zm10 0h-6v-6h6v6z" />
              </svg>
              <p>"quote"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                {getPlaceholderImage("avatar3.jpg")}
              </div>
              <div className="author-info">
                <h4>User</h4>
                <p>Status</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="university-logos animate-on-scroll">
          {getPlaceholderImage("")}
          {getPlaceholderImage("")}
          {getPlaceholderImage("")}
          {getPlaceholderImage("")}
          {getPlaceholderImage("")}
          {getPlaceholderImage("")}
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="enhanced-pricing">
        <div className="section-heading animate-on-scroll">
          <span className="section-subtitle">Flexible Plans</span>
          <h2>Simple, transparent <span className="gradient-text">pricing</span></h2>
          <p>Underdevelopment</p>
        </div>
        
        <div className="pricing-toggle animate-on-scroll">
          <span className={selectedPlan === 'monthly' ? 'active' : ''}>Monthly</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={selectedPlan === 'annual'} 
              onChange={() => setSelectedPlan(selectedPlan === 'monthly' ? 'annual' : 'monthly')}
            />
            <span className="slider round"></span>
          </label>
          <span className={selectedPlan === 'annual' ? 'active' : ''}>Annual <span className="save-badge">Save 20%</span></span>
        </div>
        
        <div className="pricing-grid animate-on-scroll">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Free</h3>
              <div className="pricing-price">
                <span className="price">$0</span>
                <span className="period">/month</span>
              </div>
              <p className="pricing-description">Perfect for casual users looking to try out basic verification features</p>
            </div>
            <ul className="pricing-features">
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>50 claims verified per month</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Basic source evaluation</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Text analysis only</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>7-day history</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Community support</span>
              </li>
            </ul>
            <div className="pricing-cta">
              <Link to="/signup" className="pricing-button secondary">Get Started</Link>
            </div>
          </div>
          
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-header">
              <h3>Pro</h3>
              <div className="pricing-price">
                <span className="price">${selectedPlan === 'monthly' ? '12' : '9.60'}</span>
                <span className="period">/{selectedPlan === 'monthly' ? 'month' : 'month, billed annually'}</span>
              </div>
              <p className="pricing-description">For professionals who need comprehensive verification tools</p>
            </div>
            <ul className="pricing-features">
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Unlimited claims verification</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Advanced source credibility</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Screen capture analysis</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Timeline visualization</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>30-day history</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Priority processing</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Export & sharing options</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Email & chat support</span>
              </li>
            </ul>
            <div className="pricing-cta">
              <Link to="/signup?plan=pro" className="pricing-button primary">Start Free Trial</Link>
            </div>
          </div>
          
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Enterprise</h3>
              <div className="pricing-price">
                <span className="custom-price">Custom</span>
              </div>
              <p className="pricing-description">For organizations with advanced needs and larger teams</p>
            </div>
            <ul className="pricing-features">
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Everything in Pro</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Team management</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>SSO & advanced security</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Unlimited history</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Custom integrations</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>API access with high quota</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Dedicated account manager</span>
              </li>
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Custom training & support</span>
              </li>
            </ul>
            <div className="pricing-cta">
              <Link to="/contact-sales" className="pricing-button secondary">Contact Sales</Link>
            </div>
          </div>
        </div>
        
        <div className="pricing-note animate-on-scroll">
          <p>Looking for educational discounts? <a href="/education-pricing">Check our special plans for students and educators</a></p>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="faq-section">
        <div className="section-heading animate-on-scroll">
          <span className="section-subtitle">Questions?</span>
          <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
          <p>Get answers to common questions about Veritas</p>
        </div>
        
        <div className="faq-container animate-on-scroll">
          {faqData.map((item, index) => (
            <div className={`faq-item ${activeFaq === index ? 'active' : ''}`} key={index}>
              <div className="faq-question" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                <h3>{item.question}</h3>
                <svg className="faq-icon" viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="more-questions animate-on-scroll">
          <h3>Still have questions?</h3>
          <p>We're here to help. Contact our support team for more information.</p>
          <Link to="/contact" className="contact-button">Contact Support</Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section animate-on-scroll">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h2>Stay informed about misinformation</h2>
            <p>Join our newsletter to receive updates on the latest verification tools, media literacy tips, and insights into information quality.</p>
            
            {newsletterSuccess ? (
              <div className="newsletter-success">
                <svg className="success-icon" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 9 11 15 8 12" />
                </svg>
                <p>Thank you for subscribing! Check your inbox soon for a confirmation.</p>
              </div>
            ) : (
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit" className="subscribe-button">Subscribe</button>
              </form>
            )}
            
            <p className="newsletter-privacy">We respect your privacy. Unsubscribe at any time.</p>
          </div>
          <div className="newsletter-image">
            {getPlaceholderImage("newsletter.svg")}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content animate-on-scroll">
          <h2>Ready to experience the power of AI-powered verification?</h2>
          <p>Join thousands of professionals who trust Veritas to navigate today's complex information landscape.</p>
          {isLoggedIn ? (
            <Link to="/app" className="cta-button">Go to Dashboard</Link>
          ) : (
            <Link to="/signup" className="cta-button">Start Your Free Trial</Link>
          )}
          <p className="cta-note">No credit card required for free tier. Pro trial lasts 14 days.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="enhanced-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="veritasso-logo">
                  <div className="veritasso-infinity">
                    <div className="veritasso-left"></div>
                    <div className="veritasso-right"></div>
                    <div className="veritasso-bridge"></div>
                  </div>
                </div>
                <span className="footer-logo-text">Veritas</span>
              </div>
              <p className="footer-tagline">Bringing truth to life with AI-powered verification</p>
              <div className="social-links">
                <a href="" aria-label="Twitter" className="social-link">
                  <svg viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </a>
                <a href="" aria-label="LinkedIn" className="social-link">
                  <svg viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
                <a href="" aria-label="GitHub" className="social-link">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
                <a href="" aria-label="YouTube" className="social-link">
                  <svg viewBox="0 0 24 24">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33A29 29 0 0 0 22.54 6.42z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <ul>
                  <li><a href="/features">Features</a></li>
                  <li><a href="/pricing">Pricing</a></li>
                  <li><a href="/integrations">Integrations</a></li>
                  <li><a href="/roadmap">Roadmap</a></li>
                  <li><a href="/changelog">Changelog</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Solutions</h4>
                <ul>
                  <li><a href="/education">Education</a></li>
                  <li><a href="/journalism">Journalism</a></li>
                  <li><a href="/research">Research</a></li>
                  <li><a href="/business">Business</a></li>
                  <li><a href="/government">Government</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><a href="/blog">Blog</a></li>
                  <li><a href="/guides">Guides</a></li>
                  <li><a href="/webinars">Webinars</a></li>
                  <li><a href="/case-studies">Case Studies</a></li>
                  <li><a href="/help-center">Help Center</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/team">Team</a></li>
                  <li><a href="/careers">Careers</a></li>
                  <li><a href="/contact">Contact</a></li>
                  <li><a href="/press">Press</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/terms">Terms of Service</a></li>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/security">Security</a></li>
                  <li><a href="/dpa">DPA</a></li>
                  <li><a href="/cookies">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} Veritas AI, Inc. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="/accessibility">Accessibility</a>
              <a href="/sitemap">Sitemap</a>
              <div className="language-selector">
                <span className="current-language">English (US)</span>
                <svg viewBox="0 0 24 24" className="language-arrow">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedHomePage;