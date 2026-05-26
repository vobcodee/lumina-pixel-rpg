"use client";

import { useState } from 'react';
import GameCanvas from '../components/GameCanvas';
import styles from '../styles/Game.module.css';

export default function Home() {
  const [gameState, setGameState] = useState({
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gold: 0,
    potions: 2,
    attackPower: 15,
    gameLevel: 1
  });

  const [gameActive, setGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleStateChange = (newState) => {
    setGameState(newState);
  };

  const startGame = () => {
    setGameState({
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      potions: 2,
      attackPower: 15,
      gameLevel: 1
    });
    setGameActive(true);
    setIsPaused(false);
    setIsGameOver(false);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setGameActive(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Safe window-level action call to components/GameCanvas.js
  const handleQuickHeal = () => {
    if (typeof window !== 'undefined' && window.usePotionFromOutside) {
      window.usePotionFromOutside();
    }
  };

  // Simulate keyboard events for mobile touch controls
  const handleTouchKey = (key, type) => {
    if (typeof window === 'undefined') return;
    const codeMap = {
      w: 'KeyW',
      a: 'KeyA',
      s: 'KeyS',
      d: 'KeyD',
      ' ': 'Space'
    };
    const event = new KeyboardEvent(type, {
      key: key === ' ' ? ' ' : key,
      code: codeMap[key] || key,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  return (
    <main className={styles.container}>
      <h1 className={`${styles.title} ${styles.pixelFont}`}>LUMINA</h1>
      <p className={styles.subtitle}>Quest for the Pixel Core</p>

      <div className={styles.gameWrapper}>
        {/* Game Play Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <GameCanvas
              onStateChange={handleStateChange}
              isPaused={isPaused}
              gameActive={gameActive}
              onGameOver={handleGameOver}
            />

            {/* Start Screen Overlay */}
            {!gameActive && !isGameOver && (
              <div className={styles.overlay}>
                <h2 className={`${styles.overlayTitle} ${styles.pixelFont}`}>CHOOSE YOUR DESTINY</h2>
                <p className={styles.overlayText}>
                  Step into the procedural dungeon, defend against pixel slimes, gather gold treasures, level up, and find the glowing Pixel Core to travel deeper.
                </p>
                <button className={styles.btn} onClick={startGame}>
                  START GAME
                </button>
              </div>
            )}

            {/* Pause Screen Overlay */}
            {gameActive && isPaused && (
              <div className={styles.overlay}>
                <h2 className={`${styles.overlayTitle} ${styles.pixelFont}`}>GAME PAUSED</h2>
                <p className={styles.overlayText}>Take a breath. The dungeon awaits your return.</p>
                <button className={styles.btn} onClick={togglePause}>
                  RESUME
                </button>
              </div>
            )}

            {/* Game Over Screen Overlay */}
            {isGameOver && (
              <div className={styles.overlay}>
                <h2 className={`${styles.overlayTitle} ${styles.pixelFont}`} style={{ color: '#e63946' }}>DEFEAT</h2>
                <p className={styles.overlayText}>
                  You fell on Stage {gameState.gameLevel}. Level reached: {gameState.level}. Gold gathered: {gameState.gold}.
                </p>
                <button className={styles.btn} onClick={startGame}>
                  TRY AGAIN
                </button>
              </div>
            )}
          </div>

          {/* Virtual Mobile Controls */}
          {gameActive && !isPaused && (
            <div className={styles.mobileControls}>
              {/* D-Pad */}
              <div className={styles.dpad}>
                <button 
                  className={styles.dpadBtn} 
                  style={{ gridArea: 'up' }}
                  onTouchStart={() => handleTouchKey('w', 'keydown')}
                  onTouchEnd={() => handleTouchKey('w', 'keyup')}
                  onMouseDown={() => handleTouchKey('w', 'keydown')}
                  onMouseUp={() => handleTouchKey('w', 'keyup')}
                  onMouseLeave={() => handleTouchKey('w', 'keyup')}
                >
                  ▲
                </button>
                <button 
                  className={styles.dpadBtn} 
                  style={{ gridArea: 'left' }}
                  onTouchStart={() => handleTouchKey('a', 'keydown')}
                  onTouchEnd={() => handleTouchKey('a', 'keyup')}
                  onMouseDown={() => handleTouchKey('a', 'keydown')}
                  onMouseUp={() => handleTouchKey('a', 'keyup')}
                  onMouseLeave={() => handleTouchKey('a', 'keyup')}
                >
                  ◀
                </button>
                <button 
                  className={styles.dpadBtn} 
                  style={{ gridArea: 'right' }}
                  onTouchStart={() => handleTouchKey('d', 'keydown')}
                  onTouchEnd={() => handleTouchKey('d', 'keyup')}
                  onMouseDown={() => handleTouchKey('d', 'keydown')}
                  onMouseUp={() => handleTouchKey('d', 'keyup')}
                  onMouseLeave={() => handleTouchKey('d', 'keyup')}
                >
                  ▶
                </button>
                <button 
                  className={styles.dpadBtn} 
                  style={{ gridArea: 'down' }}
                  onTouchStart={() => handleTouchKey('s', 'keydown')}
                  onTouchEnd={() => handleTouchKey('s', 'keyup')}
                  onMouseDown={() => handleTouchKey('s', 'keydown')}
                  onMouseUp={() => handleTouchKey('s', 'keyup')}
                  onMouseLeave={() => handleTouchKey('s', 'keyup')}
                >
                  ▼
                </button>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionArea}>
                <button 
                  className={styles.mobileAttackBtn}
                  onTouchStart={() => handleTouchKey(' ', 'keydown')}
                  onTouchEnd={() => handleTouchKey(' ', 'keyup')}
                  onMouseDown={() => handleTouchKey(' ', 'keydown')}
                  onMouseUp={() => handleTouchKey(' ', 'keyup')}
                >
                  SWING
                </button>
                <button 
                  className={styles.mobileHealBtn}
                  onClick={handleQuickHeal}
                  disabled={gameState.potions <= 0 || gameState.hp >= gameState.maxHp}
                >
                  🧪 HEAL ({gameState.potions})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side HUD Panel */}
        <div className={`${styles.panel} ${styles.sidePanel}`}>
          <div className={styles.hudHeader}>
            <h2 className={styles.pixelFont}>HERO STATUS</h2>
          </div>

          <div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>STAGE:</span>
              <span className={`${styles.statVal} ${styles.pixelFont}`} style={{ color: '#4cc9f0' }}>{gameState.gameLevel}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>LEVEL:</span>
              <span className={`${styles.statVal} ${styles.pixelFont}`}>{gameState.level}</span>
            </div>
          </div>

          {/* HP Bar */}
          <div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>HEALTH POINTS:</span>
            </div>
            <div className={styles.barContainer}>
              <div
                className={styles.hpBar}
                style={{ width: `${(gameState.hp / gameState.maxHp) * 100}%` }}
              />
              <span className={styles.barText}>{gameState.hp}/{gameState.maxHp}</span>
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>EXPERIENCE POINTS:</span>
            </div>
            <div className={styles.barContainer}>
              <div
                className={styles.xpBar}
                style={{ width: `${(gameState.xp / gameState.xpToNextLevel) * 100}%` }}
              />
              <span className={styles.barText}>{gameState.xp}/{gameState.xpToNextLevel}</span>
            </div>
          </div>

          {/* Inventory / Shop */}
          <div className={styles.hudHeader}>
            <h2 className={styles.pixelFont}>BAG & GEAR</h2>
          </div>

          <div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>GOLD COINS:</span>
              <span className={`${styles.statVal} ${styles.pixelFont}`} style={{ color: '#ffb703' }}>🪙 {gameState.gold}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>ATTACK POWER:</span>
              <span className={`${styles.statVal} ${styles.pixelFont}`} style={{ color: '#e63946' }}>⚔️ {gameState.attackPower}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.controlsGrid}>
            <button
              onClick={handleQuickHeal}
              disabled={!gameActive || isPaused || gameState.potions <= 0 || gameState.hp >= gameState.maxHp}
              className={`${styles.btn} ${(!gameActive || isPaused || gameState.potions <= 0 || gameState.hp >= gameState.maxHp) ? styles.disabledBtn : ''}`}
            >
              💊 HEAL ({gameState.potions})
            </button>
            <button
              onClick={togglePause}
              disabled={!gameActive}
              className={`${styles.btn} ${!gameActive ? styles.disabledBtn : ''}`}
            >
              {isPaused ? '▶️ PLAY' : '⏸️ PAUSE'}
            </button>
          </div>

          {/* Interactive hints */}
          <div className={styles.instructions}>
            <p><span className={styles.keycap}>W</span> <span className={styles.keycap}>A</span> <span className={styles.keycap}>S</span> <span className={styles.keycap}>D</span> or <span className={styles.keycap}>▲</span> <span className={styles.keycap}>▼</span> <span className={styles.keycap}>◀</span> <span className={styles.keycap}>▶</span> to Walk</p>
            <p><span className={styles.keycap}>SPACEBAR</span> to Attack</p>
            <p><span className={styles.keycap}>H</span> to Consume Potion</p>
          </div>
        </div>
      </div>
    </main>
  );
}
