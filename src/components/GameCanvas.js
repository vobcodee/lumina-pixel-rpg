"use client";

import { useEffect, useRef, useState } from 'react';
import { generateAssets } from '../utils/assets';

export default function GameCanvas({ onStateChange, isPaused, gameActive, onGameOver }) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const assetsRef = useRef({});
  
  // Game states and systems inside ref to avoid React render delay in game loop
  const stateRef = useRef({
    player: {
      x: 64,
      y: 64,
      width: 24,
      height: 24,
      speed: 3,
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      potions: 2,
      attackPower: 15,
      direction: 'down',
      isAttacking: false,
      attackCooldown: 0,
      attackRadius: 36,
      damageCooldown: 0
    },
    enemies: [],
    loot: [],
    particles: [],
    level: 1,
    mapWidth: 720,
    mapHeight: 480,
    tileSize: 48,
    map: [],
    portalSpawned: false,
    portal: { x: 0, y: 0, radius: 24 },
    input: {
      w: false,
      a: false,
      s: false,
      d: false,
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false
    }
  });

  // Sound Synthesizer via Web Audio API
  const playSound = (type) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'heal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'loot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'levelUp') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'attack') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'defeat') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.warn("Audio Context failed to start:", e);
    }
  };

  // Generate Map tiles
  const generateMap = (level) => {
    const state = stateRef.current;
    const cols = state.mapWidth / state.tileSize;
    const rows = state.mapHeight / state.tileSize;
    const map = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        // Borders are walls
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          row.push('wall');
        } else if (r > 2 && r < rows - 3 && c > 2 && c < cols - 3 && Math.random() < 0.08) {
          // Occasional obstacles inside
          row.push('tree');
        } else {
          row.push('grass');
        }
      }
      map.push(row);
    }
    state.map = map;
  };

  // Spawn slimes and obstacles
  const spawnEnemiesAndLoot = (level) => {
    const state = stateRef.current;
    state.enemies = [];
    state.loot = [];
    state.portalSpawned = false;

    // Normal slimes
    const slimeCount = 3 + level * 2;
    for (let i = 0; i < slimeCount; i++) {
      let x, y;
      do {
        x = Math.random() * (state.mapWidth - 150) + 75;
        y = Math.random() * (state.mapHeight - 150) + 75;
      } while (checkTileCollision(x, y, 24, 24) || Math.hypot(x - state.player.x, y - state.player.y) < 150);

      state.enemies.push({
        id: `slime_${i}`,
        x,
        y,
        width: 28,
        height: 28,
        hp: 30 + level * 10,
        maxHp: 30 + level * 10,
        speed: 1.0 + Math.random() * 0.5 + (level * 0.1),
        type: 'slime',
        damage: 10 + level * 2,
        color: '#48cae4'
      });
    }

    // Boss slime on every 3rd level
    if (level % 3 === 0) {
      let x, y;
      do {
        x = Math.random() * (state.mapWidth - 200) + 100;
        y = Math.random() * (state.mapHeight - 200) + 100;
      } while (checkTileCollision(x, y, 48, 48) || Math.hypot(x - state.player.x, y - state.player.y) < 200);

      state.enemies.push({
        id: `boss_${level}`,
        x,
        y,
        width: 54,
        height: 54,
        hp: 150 + level * 50,
        maxHp: 150 + level * 50,
        speed: 1.2,
        type: 'slime_boss',
        damage: 25 + level * 5,
        color: '#7209b7'
      });
    }

    // Spawn some initial treasure chests
    const chestCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < chestCount; i++) {
      let x, y;
      do {
        x = Math.random() * (state.mapWidth - 150) + 75;
        y = Math.random() * (state.mapHeight - 150) + 75;
      } while (checkTileCollision(x, y, 20, 20));

      state.loot.push({
        type: 'chest',
        x,
        y,
        width: 24,
        height: 24
      });
    }
  };

  // Check collision with wall/tree tiles
  const checkTileCollision = (x, y, width, height) => {
    const state = stateRef.current;
    const ts = state.tileSize;

    // Check corners of the bounding box
    const points = [
      { x, y },
      { x: x + width, y },
      { x, y: y + height },
      { x: x + width, y: y + height }
    ];

    for (let p of points) {
      const c = Math.floor(p.x / ts);
      const r = Math.floor(p.y / ts);

      if (c < 0 || c >= state.mapWidth / ts || r < 0 || r >= state.mapHeight / ts) {
        return true;
      }

      const cell = state.map[r]?.[c];
      if (cell === 'wall' || cell === 'tree') {
        return true;
      }
    }
    return false;
  };

  // Check intersection of two rects
  const rectsIntersect = (r1, r2) => {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  // Level Up logic
  const addXP = (amount) => {
    const state = stateRef.current;
    const p = state.player;
    p.xp += amount;
    if (p.xp >= p.xpToNextLevel) {
      p.xp -= p.xpToNextLevel;
      p.level += 1;
      p.xpToNextLevel = Math.floor(p.xpToNextLevel * 1.5);
      p.maxHp += 20;
      p.hp = p.maxHp;
      p.attackPower += 5;
      playSound('levelUp');
      createFloatingText("LEVEL UP!", p.x + p.width/2, p.y - 10, '#ffb703', 24);
    }
  };

  // Visual floating damage indicators
  const createFloatingText = (text, x, y, color = '#ffb703', size = 16) => {
    stateRef.current.particles.push({
      type: 'text',
      text,
      x,
      y,
      vx: (Math.random() - 0.5) * 1,
      vy: -1.5,
      alpha: 1,
      color,
      size,
      life: 45
    });
  };

  // Action: Heal using potion
  const usePotion = () => {
    const state = stateRef.current;
    const p = state.player;
    if (p.potions > 0 && p.hp < p.maxHp) {
      p.potions -= 1;
      const healAmount = Math.floor(p.maxHp * 0.4);
      p.hp = Math.min(p.maxHp, p.hp + healAmount);
      playSound('heal');
      createFloatingText(`+${healAmount} HP`, p.x + p.width / 2, p.y, '#38b000');
      notifyParentState();
    }
  };

  const notifyParentState = () => {
    const p = stateRef.current.player;
    onStateChange({
      hp: p.hp,
      maxHp: p.maxHp,
      level: p.level,
      xp: p.xp,
      xpToNextLevel: p.xpToNextLevel,
      gold: p.gold,
      potions: p.potions,
      attackPower: p.attackPower,
      gameLevel: stateRef.current.level
    });
  };

  // Register public access methods to parent
  useEffect(() => {
    window.usePotionFromOutside = usePotion;
    window.gameDebugState = stateRef;
    return () => {
      delete window.usePotionFromOutside;
      delete window.gameDebugState;
    };
  }, []);

  // Set up Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = stateRef.current;
      if (!gameActive || isPaused) return;

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        state.input[key] = true;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key)) {
        state.input[e.key] = true;
      }
      if (e.code === 'Space') {
        state.input.Space = true;
        e.preventDefault();
      }
      // H key to quick heal
      if (key === 'h') {
        usePotion();
      }
    };

    const handleKeyUp = (e) => {
      const state = stateRef.current;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        state.input[key] = false;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key)) {
        state.input[e.key] = false;
      }
      if (e.code === 'Space') {
        state.input.Space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive, isPaused]);

  // Main Game Loop and Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Procedural sprites
    assetsRef.current = generateAssets();

    // Start Level 1
    stateRef.current.level = 1;
    generateMap(1);
    spawnEnemiesAndLoot(1);
    notifyParentState();

    const update = () => {
      if (!gameActive || isPaused) return;

      const state = stateRef.current;
      const p = state.player;

      // Handle attack cooldowns
      if (p.attackCooldown > 0) p.attackCooldown--;
      if (p.damageCooldown > 0) p.damageCooldown--;

      // Movement vector calculation
      let dx = 0;
      let dy = 0;

      if (state.input.w || state.input.ArrowUp) {
        dy = -1;
        p.direction = 'up';
      }
      if (state.input.s || state.input.ArrowDown) {
        dy = 1;
        p.direction = 'down';
      }
      if (state.input.a || state.input.ArrowLeft) {
        dx = -1;
        p.direction = 'left';
      }
      if (state.input.d || state.input.ArrowRight) {
        dx = 1;
        p.direction = 'right';
      }

      // Diagonal speed adjustment
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Move player with collision checking
      const nextX = p.x + dx * p.speed;
      const nextY = p.y + dy * p.speed;

      if (!checkTileCollision(nextX, p.y, p.width, p.height)) {
        p.x = nextX;
      }
      if (!checkTileCollision(p.x, nextY, p.width, p.height)) {
        p.y = nextY;
      }

      // Trigger player melee attack
      if (state.input.Space && p.attackCooldown === 0) {
        p.isAttacking = true;
        p.attackCooldown = 25; // cooldown frames
        playSound('attack');

        // Check hits on enemies
        let attackX = p.x + p.width / 2;
        let attackY = p.y + p.height / 2;

        if (p.direction === 'up') attackY -= p.attackRadius;
        if (p.direction === 'down') attackY += p.attackRadius;
        if (p.direction === 'left') attackX -= p.attackRadius;
        if (p.direction === 'right') attackX += p.attackRadius;

        state.enemies.forEach((enemy) => {
          const enemyCenterX = enemy.x + enemy.width / 2;
          const enemyCenterY = enemy.y + enemy.height / 2;
          const dist = Math.hypot(attackX - enemyCenterX, attackY - enemyCenterY);

          if (dist < p.attackRadius + enemy.width / 2) {
            // Apply damage
            const dmg = p.attackPower + Math.floor(Math.random() * 6);
            enemy.hp -= dmg;
            playSound('hit');
            createFloatingText(`-${dmg}`, enemyCenterX, enemy.y - 10, '#e63946');

            // Draw hit particle spark
            state.particles.push({
              type: 'spark',
              x: enemyCenterX,
              y: enemyCenterY,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#f4f4f9',
              life: 15
            });
          }
        });

        // Set short timeout to clear attacking frame visual
        setTimeout(() => {
          p.isAttacking = false;
        }, 150);
      }

      // Update enemies (Slime AI)
      state.enemies.forEach((enemy, index) => {
        // Simple chase logic
        const dxToPlayer = p.x - enemy.x;
        const dyToPlayer = p.y - enemy.y;
        const distance = Math.hypot(dxToPlayer, dyToPlayer);

        if (distance < 240) { // Chase trigger distance
          const speedFactor = distance > 0 ? enemy.speed / distance : 0;
          const ex = enemy.x + dxToPlayer * speedFactor;
          const ey = enemy.y + dyToPlayer * speedFactor;

          if (!checkTileCollision(ex, enemy.y, enemy.width, enemy.height)) {
            enemy.x = ex;
          }
          if (!checkTileCollision(enemy.x, ey, enemy.width, enemy.height)) {
            enemy.y = ey;
          }
        }

        // Deal damage to player on touch
        if (rectsIntersect(p, enemy) && p.damageCooldown === 0) {
          p.hp = Math.max(0, p.hp - enemy.damage);
          p.damageCooldown = 40; // temporary invincibility
          playSound('hit');
          createFloatingText(`-${enemy.damage} HP`, p.x + p.width/2, p.y - 10, '#ffb5a7');

          if (p.hp <= 0) {
            playSound('defeat');
            onGameOver();
          }
          notifyParentState();
        }
      });

      // Filter out dead enemies
      state.enemies = state.enemies.filter((enemy) => {
        if (enemy.hp <= 0) {
          // Drop coins/XP
          addXP(enemy.type === 'slime_boss' ? 100 : 25);
          p.gold += enemy.type === 'slime_boss' ? 50 : 10;
          playSound('loot');

          // Drop potential potion/loot
          if (Math.random() < 0.25 || enemy.type === 'slime_boss') {
            state.loot.push({
              type: Math.random() < 0.4 ? 'potion' : 'coin',
              x: enemy.x,
              y: enemy.y,
              width: 18,
              height: 18
            });
          }
          notifyParentState();
          return false;
        }
        return true;
      });

      // Handle Loot collection
      state.loot = state.loot.filter((item) => {
        const itemRect = { x: item.x, y: item.y, width: item.width, height: item.height };
        if (rectsIntersect(p, itemRect)) {
          playSound('loot');
          if (item.type === 'chest') {
            const coins = 15 + Math.floor(Math.random() * 20);
            p.gold += coins;
            createFloatingText(`+${coins} Gold`, item.x, item.y - 10, '#ffb703');
            if (Math.random() < 0.5) {
              p.potions += 1;
              createFloatingText(`+1 Potion`, item.x, item.y - 25, '#7209b7');
            }
          } else if (item.type === 'coin') {
            p.gold += 5;
            createFloatingText(`+5 Gold`, item.x, item.y - 10, '#ffb703');
          } else if (item.type === 'potion') {
            p.potions += 1;
            createFloatingText(`+1 Potion`, item.x, item.y - 10, '#7209b7');
          }
          notifyParentState();
          return false;
        }
        return true;
      });

      // Level Cleared / Spawn portal logic
      if (state.enemies.length === 0 && !state.portalSpawned) {
        state.portalSpawned = true;
        // Spawn portal in center
        state.portal.x = state.mapWidth / 2 - 12;
        state.portal.y = state.mapHeight / 2 - 12;
        createFloatingText("PORTAL OPENED", state.portal.x, state.portal.y - 15, '#4cc9f0', 20);
      }

      // Next level transition on portal touch
      if (state.portalSpawned) {
        const portalRect = { x: state.portal.x, y: state.portal.y, width: 24, height: 24 };
        if (rectsIntersect(p, portalRect)) {
          state.level += 1;
          generateMap(state.level);
          spawnEnemiesAndLoot(state.level);
          p.x = 64;
          p.y = 64;
          playSound('levelUp');
          createFloatingText(`Stage ${state.level}`, p.x, p.y - 10, '#4cc9f0', 22);
          notifyParentState();
        }
      }

      // Update floating elements/particles
      state.particles.forEach((part) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life--;
        if (part.type === 'text') {
          part.alpha = Math.max(0, part.life / 45);
        }
      });
      state.particles = state.particles.filter((part) => part.life > 0);
    };

    const draw = () => {
      const state = stateRef.current;
      const p = state.player;
      const ts = state.tileSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Grid Tiles
      const cols = state.mapWidth / ts;
      const rows = state.mapHeight / ts;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tile = state.map[r]?.[c] || 'grass';
          const spriteImg = assetsRef.current[tile] || assetsRef.current.grass;
          ctx.drawImage(spriteImg, c * ts, r * ts, ts, ts);
        }
      }

      // Render Portal
      if (state.portalSpawned) {
        const portalSprite = assetsRef.current.portal;
        ctx.drawImage(portalSprite, state.portal.x, state.portal.y, 36, 36);
        
        // Portal hover particle effects
        ctx.fillStyle = 'rgba(76, 201, 240, 0.4)';
        ctx.beginPath();
        ctx.arc(state.portal.x + 18, state.portal.y + 18, 18 + Math.sin(Date.now() / 100) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Loot items
      state.loot.forEach((item) => {
        const itemSprite = assetsRef.current[item.type];
        if (itemSprite) {
          ctx.drawImage(itemSprite, item.x, item.y, item.width, item.height);
        }
      });

      // Render Enemies
      state.enemies.forEach((enemy) => {
        const enemySprite = assetsRef.current[enemy.type] || assetsRef.current.slime;
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy health bar
        if (enemy.hp < enemy.maxHp) {
          ctx.fillStyle = '#1a1c2e';
          ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
          ctx.fillStyle = '#e63946';
          const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * hpPct, 4);
        }
      });

      // Render Sword slash visual
      if (p.isAttacking) {
        ctx.strokeStyle = 'rgba(244, 244, 249, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        let startAngle = 0;
        let endAngle = Math.PI;

        if (p.direction === 'up') { startAngle = Math.PI * 1.2; endAngle = Math.PI * 1.8; }
        if (p.direction === 'down') { startAngle = Math.PI * 0.2; endAngle = Math.PI * 0.8; }
        if (p.direction === 'left') { startAngle = Math.PI * 0.7; endAngle = Math.PI * 1.3; }
        if (p.direction === 'right') { startAngle = Math.PI * 1.7; endAngle = Math.PI * 2.3; }

        ctx.arc(
          p.x + p.width / 2,
          p.y + p.height / 2,
          p.attackRadius,
          startAngle,
          endAngle
        );
        ctx.stroke();
      }

      // Render Player
      const playerSprite = assetsRef.current[`player_${p.direction}`] || assetsRef.current.player_down;
      
      // Flash player red if recently hit (damage cooldown)
      if (p.damageCooldown > 0 && Math.floor(p.damageCooldown / 4) % 2 === 0) {
        // Draw normal and then add red tint Overlay
        ctx.drawImage(playerSprite, p.x, p.y, p.width, p.height);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(230, 57, 70, 0.5)';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.drawImage(playerSprite, p.x, p.y, p.width, p.height);
      }

      // Render Particles/Text
      state.particles.forEach((part) => {
        if (part.type === 'text') {
          ctx.save();
          ctx.globalAlpha = part.alpha;
          ctx.fillStyle = part.color;
          ctx.font = `bold ${part.size}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(part.text, part.x, part.y);
          ctx.restore();
        } else if (part.type === 'spark') {
          ctx.fillStyle = part.color;
          ctx.fillRect(part.x, part.y, 3, 3);
        }
      });
    };

    const loop = () => {
      update();
      draw();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameActive, isPaused]);

  return (
    <div className="relative border-4 border-slate-700 bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={720}
        height={480}
        className="block max-w-full h-auto"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
