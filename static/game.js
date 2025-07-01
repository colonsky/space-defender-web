// Optimized Space Defender Game
// Performance optimizations: object pooling, efficient rendering, minimal allocations

(function() {
  'use strict';
  
  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SPEED = 5;
  const BULLET_SPEED = 7;
  const ENEMY_SPEED = 2;
  const MAX_BULLETS = 20;
  const MAX_ENEMIES = 10;
  
  // Game state
  let canvas, ctx, gameRunning = false;
  let score = 0, frame = 0;
  let keys = {};
  
  // Object pools for performance
  const bulletPool = [];
  const enemyPool = [];
  const activeBullets = [];
  const activeEnemies = [];
  
  // Player object
  const player = {
    x: CANVAS_WIDTH / 2 - 15,
    y: CANVAS_HEIGHT - 50,
    width: 30,
    height: 30,
    color: '#00ff00'
  };
  
  // Initialize object pools
  function initPools() {
    for (let i = 0; i < MAX_BULLETS; i++) {
      bulletPool.push({
        x: 0, y: 0, active: false,
        width: 3, height: 10, color: '#ffff00'
      });
    }
    
    for (let i = 0; i < MAX_ENEMIES; i++) {
      enemyPool.push({
        x: 0, y: 0, active: false,
        width: 25, height: 25, color: '#ff0000'
      });
    }
  }
  
  // Get object from pool
  function getBullet() {
    return bulletPool.find(b => !b.active);
  }
  
  function getEnemy() {
    return enemyPool.find(e => !e.active);
  }
  
  // Game initialization
  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Optimize canvas
    ctx.imageSmoothingEnabled = false;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    initPools();
    setupEventListeners();
    gameRunning = true;
    gameLoop();
  }
  
  // Event listeners
  function setupEventListeners() {
    // Use efficient key handling
    window.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        shoot();
      }
    }, false);
    
    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    }, false);
    
    // Touch controls for mobile
    canvas.addEventListener('touchstart', handleTouch, false);
    canvas.addEventListener('touchmove', handleTouch, false);
  }
  
  function handleTouch(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, x - player.width / 2));
    
    if (frame % 10 === 0) shoot(); // Auto-shoot on mobile
  }
  
  // Player movement
  function updatePlayer() {
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.x = Math.max(0, player.x - PLAYER_SPEED);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      player.x = Math.min(CANVAS_WIDTH - player.width, player.x + PLAYER_SPEED);
    }
  }
  
  // Shooting system
  function shoot() {
    const bullet = getBullet();
    if (bullet) {
      bullet.x = player.x + player.width / 2 - bullet.width / 2;
      bullet.y = player.y;
      bullet.active = true;
      activeBullets.push(bullet);
    }
  }
  
  // Update bullets
  function updateBullets() {
    for (let i = activeBullets.length - 1; i >= 0; i--) {
      const bullet = activeBullets[i];
      bullet.y -= BULLET_SPEED;
      
      if (bullet.y < -bullet.height) {
        bullet.active = false;
        activeBullets.splice(i, 1);
      }
    }
  }
  
  // Spawn enemies
  function spawnEnemy() {
    if (frame % 60 === 0 && activeEnemies.length < MAX_ENEMIES) {
      const enemy = getEnemy();
      if (enemy) {
        enemy.x = Math.random() * (CANVAS_WIDTH - enemy.width);
        enemy.y = -enemy.height;
        enemy.active = true;
        activeEnemies.push(enemy);
      }
    }
  }
  
  // Update enemies
  function updateEnemies() {
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
      const enemy = activeEnemies[i];
      enemy.y += ENEMY_SPEED;
      
      if (enemy.y > CANVAS_HEIGHT) {
        enemy.active = false;
        activeEnemies.splice(i, 1);
      }
    }
  }
  
  // Collision detection (optimized)
  function checkCollisions() {
    // Bullet-enemy collisions
    for (let i = activeBullets.length - 1; i >= 0; i--) {
      const bullet = activeBullets[i];
      
      for (let j = activeEnemies.length - 1; j >= 0; j--) {
        const enemy = activeEnemies[j];
        
        if (bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y) {
          
          // Collision detected
          bullet.active = false;
          enemy.active = false;
          activeBullets.splice(i, 1);
          activeEnemies.splice(j, 1);
          score += 10;
          updateScore();
          break;
        }
      }
    }
    
    // Player-enemy collisions
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
      const enemy = activeEnemies[i];
      
      if (player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y) {
        
        // Game over
        gameOver();
        return;
      }
    }
  }
  
  // Optimized rendering
  function render() {
    // Clear canvas efficiently
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw bullets
    ctx.fillStyle = '#ffff00';
    for (const bullet of activeBullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    
    // Draw enemies
    ctx.fillStyle = '#ff0000';
    for (const enemy of activeEnemies) {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  }
  
  function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
  }
  
  function gameOver() {
    gameRunning = false;
    alert(`Game Over! Final Score: ${score}`);
    // Reset game
    score = 0;
    activeBullets.length = 0;
    activeEnemies.length = 0;
    bulletPool.forEach(b => b.active = false);
    enemyPool.forEach(e => e.active = false);
    updateScore();
    gameRunning = true;
  }
  
  // Main game loop with requestAnimationFrame
  function gameLoop() {
    if (!gameRunning) return;
    
    frame++;
    
    updatePlayer();
    updateBullets();
    spawnEnemy();
    updateEnemies();
    checkCollisions();
    render();
    
    requestAnimationFrame(gameLoop);
  }
  
  // Initialize game when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();