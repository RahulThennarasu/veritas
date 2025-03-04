import React from "react";

interface MainContentProps {
  showSidePanel: boolean;
  statement: string;
  setStatement: (statement: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  startCapture: () => void;
  transcript: string;
  analysis: string;
  sources: string[];
  getTopEmotions: () => { [key: string]: number };
  showScreenPopup: boolean;
  popupPosition: { x: number; y: number };
  popupRef: React.RefObject<HTMLDivElement>;
  handleDragStart: (e: React.MouseEvent) => void;
  handleDrag: (e: React.MouseEvent) => void;
  handleDragEnd: () => void;
  popOutWindow: () => void;
  closePopup: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const MainContent: React.FC<MainContentProps> = ({
  showSidePanel,
  statement,
  setStatement,
  handleSubmit,
  loading,
  startCapture,
  transcript,
  analysis,
  sources,
  getTopEmotions,
  showScreenPopup,
  popupPosition,
  popupRef,
  handleDragStart,
  handleDrag,
  handleDragEnd,
  popOutWindow,
  closePopup,
  videoRef,
}) => {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Happy Late Night";
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    if (hour < 22) return "Good Evening";
    return "Happy Late Night";
  };

  const getUserName = () => {
    return "User";
  };

  const suggestions = [
    {
      icon: "",
      title: "",
    },
    {
      icon: "",
      title: "",
    },
    {
      icon: "",
      title: "",
    },
  ];

  return (
    <div
      className={`main-content ${
        showSidePanel ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <div className="content-wrapper">
        <div className="greeting-section">
          <div className="wrap">
            <div className="infinity"></div>
            <div className="infinity">
            <div className="infinity-ring-outer"></div>
            <div className="infinity-ring-middle"></div>
            <div className="infinity-ring-inner"></div>
            <div className="infinity-core"></div>
            <div className="infinity-glow"></div>
            <div className="infinity-spark"></div>
            <div className="infinity-spark"></div>
            <div className="infinity-spark"></div>
            <div className="infinity-spark"></div>
            </div>
          </div>
          <h1 className="greeting-text">
            {getTimeOfDay()}, {getUserName()}
          </h1>
        </div>

        <div className="suggestion-cards">
          {suggestions.map((suggestion, index) => (
            <div className="card" key={index}>
              <div className="card-icon">{suggestion.icon}</div>
              <div className="card-title">{suggestion.title}</div>
            </div>
          ))}
        </div>

        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="message-input-container">
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Enter your passage or statements to Veritas..."
                rows={1}
                className="message-input"
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button
                type="button"
                className="screen-capture-button"
                onClick={startCapture}
                title="Screen Capture"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="14"
                    rx="2"
                    ry="2"
                  ></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </button>
              {statement && (
                <button
                  type="submit"
                  className="send-button"
                  disabled={loading}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                  </svg>
                </button>
              )}
            </div>
          </form>
          <div className="buddi-footer">
            <p>
              Veritas may make mistakes. Check important info and please
              report any bugs.
            </p>
          </div>
        </div>

        {transcript && (
          <div className="result-box">
            <h2>Transcript</h2>
            <p>{transcript}</p>
          </div>
        )}

        {showScreenPopup && (
          <div
            ref={popupRef}
            className="screen-popup"
            style={{
              left: popupPosition.x,
              top: popupPosition.y,
            }}
          >
            <div
              className="popup-header"
              onMouseDown={handleDragStart}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
            >
              <h3>Screen Capture</h3>
              <div className="popup-controls">
                <button
                  onClick={popOutWindow}
                  className="popup-button"
                  title="Pop Out"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </button>
                <button
                  onClick={closePopup}
                  className="popup-button"
                  title="Close"
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
            <video
              ref={videoRef}
              autoPlay
              className="popup-video"
            ></video>
          </div>
        )}

        {analysis && (
          <div className="result-box">
            <h2>Analysis</h2>
            <p>{analysis}</p>

            {sources.length > 0 && (
              <>
                <h2>Relevant Sources</h2>
                <ul>
                  {sources.map((url, index) => (
                    <li key={index}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {Object.keys(getTopEmotions()).length > 0 && (
          <div className="emotion-box">
            <h2>Emotion Analysis</h2>
            {Object.entries(getTopEmotions()).map(([emotion, score]) => (
              <div
                key={emotion}
                className="emotion-bar"
                data-emotion={emotion}
              >
                <span>{emotion}</span>
                <div
                  className="bar"
                  style={
                    {
                      "--emotion-width": `${score * 100}%`,
                    } as React.CSSProperties
                  }
                ></div>
                <span className="score">{score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;