import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as THREE from 'three';
import RadarMap from './RadarMap';
import { 
  faStar, 
  faTowerBroadcast, 
  faFaceSmile, 
  faMountain, 
  faMusic, 
  faSync, 
  faCopy, 
  faRotateLeft, 
  faTimes, 
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faPause,
  faVolumeHigh,
  faVolumeMute
} from '@fortawesome/free-solid-svg-icons';
import type { Quest } from '../types';

// Map quest icon strings to Font Awesome icons
const iconMap: { [key: string]: any } = {
  'star': faStar,
  'tower-broadcast': faTowerBroadcast,
  'face-smile': faFaceSmile,
  'mountain': faMountain,
  'music': faMusic,
};

interface HUDProps {
  planetName: string;
  planetIndex: number;
  quests: Quest[];
  color: string;
  accessory: string;
  customColors: string[];
  colorIndex: number;
  accessories: string[];
  accessoryIndex: number;
  syncCode: string;
  allQuestsCompleted: boolean;
  warpNext: () => void;
  loadCode: (code: string) => boolean;
  selectColor: (idx: number) => void;
  selectAccessory: (idx: number) => void;
  resetGame: () => void;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  seed: number;
}

export const HUD: React.FC<HUDProps> = ({
  planetName,
  planetIndex: _planetIndex,
  quests,
  color: _color,
  accessory: _accessory,
  customColors,
  colorIndex,
  accessories,
  accessoryIndex,
  syncCode,
  allQuestsCompleted,
  warpNext,
  loadCode,
  selectColor,
  selectAccessory,
  resetGame,
  playerPositionRef,
  seed,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [questsExpanded, setQuestsExpanded] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );
  const [inputCode, setInputCode] = useState('');
  const [syncError, setSyncError] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const completedQuestsCount = quests.filter((q) => q.completed).length;

  const [audioMuted, setAudioMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluffy_audio_muted');
      const isMuted = saved === 'true';
      (window as any).audioMuted = isMuted;
      return isMuted;
    }
    return false;
  });

  const [gamePaused, setGamePaused] = useState(false);

  const toggleAudioMuted = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !audioMuted;
    setAudioMuted(nextVal);
    if (typeof window !== 'undefined') {
      (window as any).audioMuted = nextVal;
      localStorage.setItem('fluffy_audio_muted', String(nextVal));
    }
  };

  const toggleGamePaused = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !gamePaused;
    setGamePaused(nextVal);
    if (typeof window !== 'undefined') {
      (window as any).gamePaused = nextVal;
    }
  };

  const handleMobileJump = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (typeof window !== 'undefined' && (window as any).gameInput) {
      (window as any).gameInput.keys.space = true;
      setTimeout(() => {
        if ((window as any).gameInput) {
          (window as any).gameInput.keys.space = false;
        }
      }, 120);
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadCode = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = loadCode(inputCode);
    if (success) {
      setSyncSuccess(true);
      setSyncError(false);
      setInputCode('');
      setTimeout(() => {
        setSyncSuccess(false);
        setShowSettings(false);
      }, 1500);
    } else {
      setSyncError(true);
      setSyncSuccess(false);
      setTimeout(() => setSyncError(false), 2000);
    }
  };

  const preventProp = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="game-ui">
      {/* Top Bar */}
      <div className="top-bar">
        {/* Top Left: Planet Pill Card */}
        <div className="planet-pill-card glass-panel interactive" onClick={preventProp}>
          <div className="planet-pill-icon-container">
            <span>🪐</span>
          </div>
          <span className="planet-pill-title">{planetName}</span>
        </div>

        {/* Top Center: Quest Diamond Tracker */}
        <div className="quest-tracker-center interactive" onClick={preventProp}>
          <div className="quest-tracker-title">{quests.length} Quests</div>
          <div className="quest-tracker-diamonds">
            {quests.map((quest, idx) => (
              <React.Fragment key={quest.id}>
                {idx > 0 && <span className="tracker-connector">⬥</span>}
                <div 
                  className={`tracker-diamond-wrapper ${quest.completed ? 'completed' : ''}`}
                  title={`${quest.title}: ${quest.completed ? 'Completed' : `${quest.currentCount}/${quest.targetCount}`}`}
                >
                  <div className="tracker-diamond-circle">
                    <span className="tracker-diamond-star">✦</span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Top Right: Buttons Group */}
        <div className="top-right-buttons-container">
          <button 
            className="code-sync-btn interactive"
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            title="Stardust Customize & Save Sync Code"
          >
            <span>⭐ CODE</span>
          </button>
          
          <button 
            className="hud-round-btn interactive"
            onClick={toggleGamePaused}
            title={gamePaused ? "Resume Game" : "Pause Game"}
          >
            <FontAwesomeIcon icon={faPause} />
          </button>

          <button 
            className="hud-round-btn interactive"
            onClick={toggleAudioMuted}
            title={audioMuted ? "Unmute Sound" : "Mute Sound"}
          >
            <FontAwesomeIcon icon={audioMuted ? faVolumeMute : faVolumeHigh} />
          </button>
        </div>
      </div>

      {/* Radar Mini-Map (Floating Top-Right below settings) */}
      <RadarMap seed={seed} playerPositionRef={playerPositionRef} />

      {/* Quest Log Overlay (Left Side) */}
      <div className="hud-side-panel">
        <div 
          className={`quest-log-card glass-panel interactive ${questsExpanded ? 'expanded' : 'collapsed'}`} 
          onClick={(e) => {
            preventProp(e);
            setQuestsExpanded(!questsExpanded);
          }}
          style={{ cursor: 'pointer' }}
          title={questsExpanded ? "Collapse quest details" : "Expand quest details"}
        >
          <div className="quest-log-header" style={{ margin: 0, borderBottom: questsExpanded ? undefined : 'none', paddingBottom: questsExpanded ? undefined : '0px' }}>
            <span>Planet Quests</span>
            <span className="quest-progress-summary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {completedQuestsCount}/{quests.length}
              <FontAwesomeIcon icon={questsExpanded ? faChevronUp : faChevronDown} className="mobile-chevron" />
            </span>
          </div>

          <ul className="quest-list" onClick={(e) => e.stopPropagation()}>
            {quests.map((quest) => (
              <li 
                key={quest.id} 
                className={`quest-item ${quest.completed ? 'completed' : ''}`}
              >
                <div className="quest-icon">
                  <FontAwesomeIcon icon={iconMap[quest.icon] || faStar} />
                </div>
                <div className="quest-details">
                  <div className="quest-title-text">{quest.title}</div>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {quest.description}
                  </span>
                </div>
                <span className="quest-counter">
                  {quest.currentCount}/{quest.targetCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Area: Controls Info */}
      <div className="action-area">
        {/* Desktop Controls Helper */}
        <div className="desktop-controls-info">
          <span>Keyboard: WASD / Arrow Keys to move • SPACE to jump</span>
        </div>
      </div>

      {/* Warp Button when all quests are complete */}
      {allQuestsCompleted && (
        <div className="warp-ready-banner glass-panel interactive" onClick={preventProp}>
          <span className="warp-ready-text">
            ✨ Planet Harmony Achieved! ✨
          </span>
          <button className="warp-ready-btn" onClick={warpNext}>
            Warp to Next Planet <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}

      {/* Customize & Save Sync Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content glass-panel interactive" onClick={preventProp}>
            <button className="modal-close-btn" onClick={() => setShowSettings(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h2 className="modal-title">Stardust Customize</h2>

            {/* Customization Section */}
            <div className="modal-section">
              <span className="modal-section-title">Fluffy Color</span>
              <div className="color-picker">
                {customColors.map((col, idx) => (
                  <div
                    key={col}
                    className={`color-dot ${colorIndex === idx ? 'active' : ''}`}
                    style={{ backgroundColor: col }}
                    onClick={() => selectColor(idx)}
                  />
                ))}
              </div>
            </div>

            <div className="modal-section">
              <span className="modal-section-title">Accessory</span>
              <div className="accessory-picker">
                {accessories.map((acc, idx) => (
                  <div
                    key={acc}
                    className={`accessory-option ${accessoryIndex === idx ? 'active' : ''}`}
                    onClick={() => selectAccessory(idx)}
                  >
                    {acc === 'none' ? 'No accessory' : acc}
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Code Section */}
            <div className="modal-section">
              <span className="modal-section-title">Save & Sync Device</span>
              <div className="sync-code-container">
                <span style={{ fontSize: '0.75rem', color: '#555', textAlign: 'center' }}>
                  Copy your sync code to resume on another device:
                </span>
                <div className="sync-code-value">{syncCode}</div>
                <button className="glass-btn" style={{ justifyContent: 'center' }} onClick={handleCopyCode}>
                  <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <form onSubmit={handleLoadCode} className="sync-code-container" style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#555', textAlign: 'center' }}>
                  Load code from another device:
                </span>
                <div className="sync-input-row">
                  <input
                    type="text"
                    className="sync-input"
                    placeholder="Paste FLUFFY-... code"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  />
                  <button type="submit" className="glass-btn" style={{ padding: '8px' }}>
                    <FontAwesomeIcon icon={faSync} />
                  </button>
                </div>
                {syncError && (
                  <span style={{ fontSize: '0.7rem', color: '#d32f2f', textAlign: 'center', fontWeight: 'bold' }}>
                    Invalid Sync Code!
                  </span>
                )}
                {syncSuccess && (
                  <span style={{ fontSize: '0.7rem', color: '#2e7d32', textAlign: 'center', fontWeight: 'bold' }}>
                    Progress Loaded Successfully!
                  </span>
                )}
              </form>
            </div>

            {/* Reset Progress Section */}
            <div className="modal-section" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px' }}>
              <button 
                className="glass-btn" 
                style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f', borderColor: 'rgba(211,47,47,0.2)', justifyContent: 'center' }}
                onClick={() => {
                  if (confirm('Reset all progress? This will delete your local saves!')) {
                    resetGame();
                    setShowSettings(false);
                  }
                }}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Jump Paw Button (Visible only on mobile via CSS) */}
      <button 
        className="mobile-jump-paw-btn interactive"
        onTouchStart={handleMobileJump}
        onClick={handleMobileJump}
        title="Jump"
      >
        🐾
      </button>

      {/* Game Paused Overlay */}
      {gamePaused && (
        <div 
          className="paused-overlay interactive" 
          onClick={(e) => {
            e.stopPropagation();
            setGamePaused(false);
            if (typeof window !== 'undefined') {
              (window as any).gamePaused = false;
            }
          }}
        >
          <div className="paused-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="paused-title">Game Paused</h2>
            <p className="paused-subtitle">Tap below or anywhere outside to resume</p>
            <button 
              className="paused-resume-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setGamePaused(false);
                if (typeof window !== 'undefined') {
                  (window as any).gamePaused = false;
                }
              }}
            >
              Resume Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default HUD;
