// Основные элементы DOM игры
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Элементы интерфейса игры
const menuScreen = document.getElementById('menu-screen');
const pauseScreen = document.getElementById('pause-screen');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const menuHighScoreElement = document.getElementById('menu-high-score');
const pauseScoreElement = document.getElementById('pause-score');

// Модальное окно игры
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.getElementById('close-game-btn');

// Глобальные переменные игры
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
let lastTime = 0;
let animationId;
let hasShown300Record = false;

// Игрок
const player = {
    x: 50,
    y: 0,
    width: 60,
    height: 60,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.8,
    jumpPower: -15,
    groundY: 0,
    color: '#4CAF50'
};

// Препятствия и окружение
let obstaclesArray = [];
let clouds = [];
let stars = [];
let groundOffset = 0;

// Настройки игры
const gameSettings = {
    baseSpeed: 6,
    currentSpeed: 6,
    spawnTimer: 0,
    spawnInterval: 1200,
    minGap: 180,
    speedIncrease: 0.003,
    lastScoreSound: 0
};

// ========================================
// ОСНОВНЫЕ ФУНКЦИИ ИГРЫ
// ========================================

function initGame() {
    console.log('🎮 Инициализация игры...');
    
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight || 400;
    
    // Инициализация элементов
    player.groundY = canvas.height - player.height - 10;
    player.y = player.groundY;
    
    highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
    if (highScoreElement) highScoreElement.textContent = `Рекорд: ${highScore}`;
    if (menuHighScoreElement) menuHighScoreElement.textContent = highScore;
    
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    
    // Создание окружения
    createStars();
    createClouds();
    
    obstaclesArray = [];
    score = 0;
    if (scoreElement) scoreElement.textContent = 0;
    hasShown300Record = false;
    
    if (menuScreen) menuScreen.classList.remove('hidden');
    if (pauseScreen) pauseScreen.classList.remove('show');
    
    drawMenuScreen();
    setupGameEventListeners();
    
    console.log('✅ Игра инициализирована!');
}

function createStars() {
    stars = [];
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7),
            size: Math.random() * 2 + 1,
            brightness: Math.random() * 0.8 + 0.2
        });
    }
}

function createClouds() {
    clouds = [];
    for (let i = 0; i < 4; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: 30 + Math.random() * 100,
            width: 50 + Math.random() * 80,
            speed: 0.8 + Math.random() * 1.5
        });
    }
}

// ========================================
// УПРАВЛЕНИЕ ИГРОЙ
// ========================================

function setupGameEventListeners() {
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (menuBtn) menuBtn.addEventListener('click', returnToMenu);
    if (closeGameBtn) closeGameBtn.addEventListener('click', closeGameModal);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    canvas.addEventListener('click', handleCanvasClick);
    
    // Обработка клика вне модального окна
    if (gameModal) {
        gameModal.addEventListener('click', function(e) {
            if (e.target === gameModal) {
                closeGameModal();
            }
        });
    }
}

function closeGameModal() {
    if (gameModal) gameModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    gameRunning = false;
    gamePaused = false;
    if (animationId) cancelAnimationFrame(animationId);
}

function handleKeyDown(e) {
    if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
        return;
    }
    
    if (!gameRunning || gamePaused) return;
    
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
        e.preventDefault();
    } else if (e.code === 'ArrowDown') {
        duck(true);
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown') {
        duck(false);
    }
}

function handleCanvasClick(e) {
    if (!gameRunning || gamePaused) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (clickX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
        setTimeout(() => duck(false), 300);
    }
}

function jump() {
    if (!player.jumping && gameRunning && !gamePaused) {
        player.jumping = true;
        player.velocity = player.jumpPower;
        player.ducking = false;
    }
}

function duck(start) {
    if (gameRunning && !gamePaused) {
        player.ducking = start;
    }
}

// ========================================
// ИГРОВОЙ ПРОЦЕСС
// ========================================

function startGame() {
    if (gameRunning) return;
    
    if (menuScreen) menuScreen.classList.add('hidden');
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstaclesArray = [];
    if (scoreElement) scoreElement.textContent = 0;
    hasShown300Record = false;
    
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.velocity = 0;
    
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    gameSettings.lastScoreSound = 0;
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        if (pauseScreen) {
            pauseScreen.classList.add('show');
            if (pauseScoreElement) pauseScoreElement.textContent = Math.floor(score);
        }
    } else {
        if (pauseScreen) pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function restartGame() {
    if (pauseScreen) pauseScreen.classList.remove('show');
    startGame();
}

function returnToMenu() {
    if (pauseScreen) pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    initGame();
}

// ========================================
// ИГРОВОЙ ЦИКЛ
// ========================================

function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    updateGame(deltaTime);
    drawGame();
    
    animationId = requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    score += gameSettings.currentSpeed * 0.15;
    if (scoreElement) scoreElement.textContent = Math.floor(score);
    
    // Скример при 300 очках
    if (Math.floor(score) >= 300 && !hasShown300Record) {
        show300Scrimer();
        hasShown300Record = true;
        return;
    }
    
    gameSettings.currentSpeed += gameSettings.speedIncrease;
    
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    updateClouds();
    
    groundOffset = (groundOffset - gameSettings.currentSpeed) % 24;
    
    checkCollisions();
    
    if (score > highScore) {
        highScore = Math.floor(score);
        if (highScoreElement) highScoreElement.textContent = `Рекорд: ${highScore}`;
        if (menuHighScoreElement) menuHighScoreElement.textContent = highScore;
    }
}

function updatePlayer(deltaTime) {
    if (player.jumping) {
        player.velocity += player.gravity;
        player.y += player.velocity;
        
        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.jumping = false;
            player.velocity = 0;
        }
    }
    
    if (player.ducking && !player.jumping) {
        player.height = 35;
        player.y = player.groundY + 25;
    } else if (!player.jumping) {
        player.height = 60;
        player.y = player.groundY;
    }
}

function updateObstacles(deltaTime) {
    gameSettings.spawnTimer += deltaTime;
    
    if (gameSettings.spawnTimer > gameSettings.spawnInterval) {
        gameSettings.spawnTimer = 0;
        
        const types = [
            { width: 25, height: 45, color: '#2d3748' },
            { width: 35, height: 55, color: '#4a5568' },
            { width: 50, height: 50, color: '#2c5282' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const isBird = type.width === 50;
        
        obstaclesArray.push({
            x: canvas.width,
            y: isBird ? canvas.height - type.height - 80 : canvas.height - type.height - 10,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: gameSettings.currentSpeed,
            isBird: isBird
        });
        
        gameSettings.spawnInterval = Math.max(500, 1200 - Math.floor(score / 100) * 60);
    }
    
    for (let i = obstaclesArray.length - 1; i >= 0; i--) {
        obstaclesArray[i].x -= obstaclesArray[i].speed;
        
        if (obstaclesArray[i].x + obstaclesArray[i].width < 0) {
            obstaclesArray.splice(i, 1);
        }
    }
}

function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = 30 + Math.random() * 120;
        }
    }
}

function checkCollisions() {
    for (let obstacle of obstaclesArray) {
        const playerRight = player.x + player.width - 15;
        const playerLeft = player.x + 15;
        const playerBottom = player.y + player.height - 10;
        const playerTop = player.y + 10;
        
        const obstacleRight = obstacle.x + obstacle.width - 8;
        const obstacleLeft = obstacle.x + 8;
        const obstacleBottom = obstacle.y + obstacle.height - 8;
        const obstacleTop = obstacle.y + 8;
        
        if (playerRight > obstacleLeft &&
            playerLeft < obstacleRight &&
            playerBottom > obstacleTop &&
            playerTop < obstacleBottom) {
            
            gameOver();
            return;
        }
    }
}

// ========================================
// СКРИМЕР ПРИ 300 ОЧКАХ (ПРОСТАЯ ВЕРСИЯ)
// ========================================

function show300Scrimer() {
    gameRunning = false;
    gamePaused = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    // Создаем модальное окно для скримера
    const scrimerModal = document.createElement('div');
    scrimerModal.id = 'scrimer-modal';
    scrimerModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    `;
    
    const scaryText = document.createElement('div');
    scaryText.style.cssText = `
        color: #ff0000;
        font-size: 72px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 0 30px #ff0000;
        margin-bottom: 30px;
    `;
    scaryText.textContent = '💀 СКРИМЕР! 💀';
    
    const message = document.createElement('div');
    message.style.cssText = `
        color: white;
        font-size: 24px;
        text-align: center;
        margin-bottom: 30px;
    `;
    message.textContent = '🎊 Поздравляем с 300 очками!';
    
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '✕ ЗАКРЫТЬ';
    skipBtn.style.cssText = `
        background: rgba(255,0,0,0.8);
        color: white;
        border: none;
        font-size: 20px;
        padding: 15px 30px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        border: 3px solid white;
    `;
    skipBtn.addEventListener('click', function() {
        scrimerModal.remove();
        alert('🎊 Поздравляем с 300 очками! Игра окончена!');
        returnToMenu();
    });
    
    scrimerModal.appendChild(scaryText);
    scrimerModal.appendChild(message);
    scrimerModal.appendChild(skipBtn);
    document.body.appendChild(scrimerModal);
    
    // Автоматическое закрытие через 10 секунд
    setTimeout(() => {
        if (document.body.contains(scrimerModal)) {
            scrimerModal.remove();
            alert('🎊 Поздравляем с 300 очками! Игра окончена!');
            returnToMenu();
        }
    }, 10000);
}

function gameOver() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    setTimeout(() => {
        if (menuScreen) {
            menuScreen.classList.remove('hidden');
            if (menuHighScoreElement) menuHighScoreElement.textContent = highScore;
        }
    }, 1500);
}

// ========================================
// ОТРИСОВКА
// ========================================

function drawMenuScreen() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawNightSky();
    
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🦕 Бегущий динозавр', canvas.width / 2, 80);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Достигни 300 очков и получи скример!', canvas.width / 2, 120);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, 180);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#f87171';
    ctx.fillText('⚠️ 300 очков = СКРИМЕР!', canvas.width / 2, 220);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ПРОБЕЛ или СТРЕЛКА ↑ - Прыжок', canvas.width / 2, 270);
    ctx.fillText('СТРЕЛКА ↓ - Пригнуться', canvas.width / 2, 300);
    ctx.fillText('P - Пауза', canvas.width / 2, 330);
}

function drawGame() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawNightSky();
    drawClouds();
    drawGround();
    drawObstacles();
    drawPlayer();
    
    if (!hasShown300Record) {
        const remaining = 300 - Math.floor(score);
        if (remaining <= 100) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`🎯 До скримера: ${remaining}`, 15, 35);
        }
    }
}

function drawNightSky() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e293b');
    skyGradient.addColorStop(1, '#334155');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    for (let star of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Луна
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawClouds() {
    for (let cloud of clouds) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 8, cloud.width * 0.25, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 25, 0, canvas.height);
    groundGradient.addColorStop(0, '#1e293b');
    groundGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 25, canvas.width, 25);
    
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < canvas.width; i += 25) {
        for (let j = 0; j < 5; j++) {
            ctx.fillRect(i + groundOffset + j * 5, canvas.height - 25 + j, 2, 5 - j);
        }
    }
}

function drawObstacles() {
    for (let obstacle of obstaclesArray) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        ctx.fillStyle = '#1e293b';
        if (!obstacle.isBird) {
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    obstacle.x + 5 + i * (obstacle.width - 10) / 3,
                    obstacle.y + 5,
                    3,
                    obstacle.height - 10
                );
            }
        } else {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                   obstacle.width/2 - 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2 - 6, obstacle.y + obstacle.height/2 - 6, 3, 0, Math.PI * 2);
            ctx.arc(obstacle.x + obstacle.width/2 + 6, obstacle.y + obstacle.height/2 - 6, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    
    if (player.ducking) {
        // Пригнувшийся динозавр
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Голова
        ctx.fillRect(player.x + player.width - 15, player.y - 5, 20, 15);
        
        // Глаз
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(player.x + player.width - 5, player.y + 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(player.x + player.width - 5, player.y + 3, 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Стоящий динозавр
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Ноги (анимация бега)
        const legOffset = Math.sin(Date.now() / 100) * 5;
        
        // Передняя нога
        ctx.fillRect(player.x + 10, player.y + player.height, 8, -20 + legOffset);
        // Задняя нога
        ctx.fillRect(player.x + player.width - 18, player.y + player.height, 8, -20 - legOffset);
        
        // Голова
        ctx.fillRect(player.x + player.width - 10, player.y - 15, 20, 20);
        
        // Глаз
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(player.x + player.width, player.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(player.x + player.width, player.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Улыбка
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width, player.y + 2, 5, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Спинные пластины
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#3b8c3b' : '#4CAF50';
            ctx.beginPath();
            ctx.moveTo(player.x + 15 + i * 10, player.y
