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
  faGear, 
  faSync, 
  faCopy, 
  faRotateLeft, 
  faTimes, 
  faChevronRight,
  faChevronDown,
  faChevronUp
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
  planetIndex,
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
        <div className="planet-card glass-panel interactive" onClick={preventProp}>
          <span className="planet-subtitle">Planet {planetIndex + 1}</span>
          <span className="planet-title">{planetName}</span>
        </div>

        <button 
          className="settings-menu-btn glass-btn interactive"
          onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
          title="Customize & Save"
        >
          <FontAwesomeIcon icon={faGear} />
        </button>
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

      {/* Bottom Area: Controls Info & Warp Actions */}
      <div className="action-area">
        {/* Desktop Controls Helper */}
        <div className="desktop-controls-info">
          <span>Keyboard: WASD / Arrow Keys to move • SPACE to jump</span>
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
      </div>

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
    </div>
  );
};
export default HUD;
