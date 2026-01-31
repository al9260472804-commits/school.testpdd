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
const launchGameBtn = document.getElementById('launch-game-btn');

// ========================================
// СИСТЕМА ЗВУКОВ (без файлов - просто заглушки)
// ========================================
const audioManager = {
    enabled: true,
    
    init: function() {
        // Просто инициализируем без файлов
    },
    
    play: function(soundName) {
        if (!this.enabled) return;
        // Заглушка для звуков
    },
    
    playMusic: function() {
        if (!this.enabled) return;
    },
    
    pauseMusic: function() {
        // Заглушка
    },
    
    stopMusic: function() {
        // Заглушка
    },
    
    toggleSound: function() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }
};

// Массив звезд для фона
let stars = [];

// Состояние игры
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

// Препятствия
let obstaclesArray = [];
let clouds = [];
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
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================================
function initGame() {
    console.log('🎮 Инициализация игры...');
    
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.height || 400;
    
    createStars();
    
    player.groundY = canvas.height - player.height - 10;
    player.y = player.groundY;
    
    highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    gameSettings.lastScoreSound = 0;
    
    clouds = [];
    for (let i = 0; i < 4; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: 30 + Math.random() * 100,
            width: 50 + Math.random() * 80,
            speed: 0.8 + Math.random() * 1.5
        });
    }
    
    obstaclesArray = [];
    score = 0;
    scoreElement.textContent = 0;
    hasShown300Record = false;
    
    menuScreen.classList.remove('hidden');
    pauseScreen.classList.remove('show');
    
    audioManager.init();
    
    const soundEnabled = localStorage.getItem('soundEnabled');
    if (soundEnabled !== null) {
        audioManager.enabled = soundEnabled === 'true';
    }
    
    drawMenuScreen();
    setupGameEventListeners();
    addSoundButton();
}

// ========================================
// СОЗДАНИЕ ЗВЕЗД
// ========================================
function createStars() {
    stars = [];
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7),
            size: Math.random() * 2 + 1,
            brightness: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

// ========================================
// ДОБАВЛЕНИЕ КНОПКИ ЗВУКА
// ========================================
function addSoundButton() {
    if (document.getElementById('sound-toggle-btn')) return;
    
    const soundBtn = document.createElement('button');
    soundBtn.id = 'sound-toggle-btn';
    soundBtn.textContent = audioManager.enabled ? '🔊' : '🔇';
    soundBtn.title = audioManager.enabled ? 'Выключить звук' : 'Включить звук';
    soundBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 70px;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid #475569;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    `;
    
    soundBtn.addEventListener('click', function() {
        const enabled = audioManager.toggleSound();
        this.textContent = enabled ? '🔊' : '🔇';
        this.title = enabled ? 'Выключить звук' : 'Включить звук';
    });
    
    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
        gameUI.appendChild(soundBtn);
    }
}

// ========================================
// РИСОВАНИЕ МЕНЮ
// ========================================
function drawMenuScreen() {
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
    ctx.fillText('M - Вкл/Выкл звук', canvas.width / 2, 360);
}

// ========================================
// РИСОВАНИЕ НОЧНОГО НЕБА
// ========================================
function drawNightSky() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e293b');
    skyGradient.addColorStop(1, '#334155');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    drawStars();
    drawMoon();
}

function drawStars() {
    const time = Date.now() * 0.001;
    
    for (let star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMoon() {
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    const moonGlow = ctx.createRadialGradient(
        canvas.width - 100, 80, 30,
        canvas.width - 100, 80, 60
    );
    moonGlow.addColorStop(0, 'rgba(254, 243, 199, 0.5)');
    moonGlow.addColorStop(1, 'rgba(254, 243, 199, 0)');
    
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 60, 0, Math.PI * 2);
    ctx.fill();
}

// ========================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ========================================
function setupGameEventListeners() {
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    canvas.addEventListener('click', function(e) {
        if (!gameRunning || gamePaused) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        if (clickX > canvas.width / 2) {
            jump();
        } else {
            duck(true);
            setTimeout(() => duck(false), 300);
        }
    });
}

// ========================================
// УПРАВЛЕНИЕ ИГРОЙ
// ========================================
function handleKeyDown(e) {
    if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
        return;
    }
    
    if (e.code === 'KeyM') {
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.click();
        }
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
// ЗАПУСК ИГРЫ
// ========================================
function startGame() {
    if (gameRunning) return;
    
    menuScreen.classList.add('hidden');
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstaclesArray = [];
    scoreElement.textContent = 0;
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

// ========================================
// ПАУЗА ИГРЫ
// ========================================
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        pauseScreen.classList.add('show');
        pauseScoreElement.textContent = Math.floor(score);
    } else {
        pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    pauseScreen.classList.remove('show');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToMenu() {
    pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
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

// ========================================
// ОБНОВЛЕНИЕ ИГРЫ
// ========================================
function updateGame(deltaTime) {
    score += gameSettings.currentSpeed * 0.15;
    scoreElement.textContent = Math.floor(score);
    
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
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
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
            { width: 50, height: 50, color: '#2c5282' },
            { width: 40, height: 70, color: '#1e40af' }
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
// СКРИМЕР ПРИ 300 ОЧКАХ
// ========================================
function show300Scrimer() {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
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
    
    const warningMsg = document.createElement('div');
    warningMsg.style.cssText = `
        color: #fff;
        font-size: 42px;
        font-weight: bold;
        text-align: center;
        z-index: 10000;
        background: rgba(255, 0, 0, 0.8);
        padding: 30px 50px;
        border-radius: 15px;
        animation: pulse 0.5s infinite alternate;
        margin-bottom: 30px;
        border: 5px solid white;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    warningMsg.textContent = '🎉 300 ОЧКОВ!\nСКРИМЕР...';
    
    const countdown = document.createElement('div');
    countdown.style.cssText = `
        color: #ff6b6b;
        font-size: 64px;
        font-weight: bold;
        margin: 20px 0;
        text-shadow: 0 0 20px #ff0000;
    `;
    countdown.textContent = '3';
    
    scrimerModal.appendChild(warningMsg);
    scrimerModal.appendChild(countdown);
    document.body.appendChild(scrimerModal);
    
    // Обратный отсчет
    let count = 3;
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdown.textContent = count;
        } else {
            clearInterval(countdownInterval);
            showFinalScrimer(scrimerModal);
        }
    }, 1000);
}

function showFinalScrimer(modal) {
    modal.innerHTML = '';
    
    const scaryText = document.createElement('div');
    scaryText.style.cssText = `
        color: #ff0000;
        font-size: 72px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 0 30px #ff0000;
        animation: shake 0.5s infinite;
        margin-bottom: 30px;
    `;
    scaryText.textContent = '💀 СКРИМЕР! 💀';
    
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '✕ ПРОПУСТИТЬ СКРИМЕР';
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
        modal.remove();
        alert('🎊 Поздравляем с 300 очками! Игра окончена!');
        returnToMenu();
    });
    
    modal.appendChild(scaryText);
    modal.appendChild(skipBtn);
    
    // Добавляем стиль для тряски
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
    `;
    modal.appendChild(style);
    
    // Автоматическое закрытие через 10 секунд
    setTimeout(() => {
        modal.remove();
        alert('🎊 Поздравляем с 300 очками! Игра окончена!');
        returnToMenu();
    }, 10000);
}

// ========================================
// КОНЕЦ ИГРЫ
// ========================================
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
        menuHighScoreElement.textContent = highScore;
    }, 1500);
}

// ========================================
// ОТРИСОВКА ИГРЫ
// ========================================
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawNightSky();
    drawClouds();
    drawGround();
    drawObstacles();
    drawPlayer();
    
    // Показываем счетчик до 300 очков
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
    
    // Рисуем траву
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < canvas.width; i += 25) {
        for (let j = 0; j < 5; j++) {
            ctx.fillRect(i + groundOffset + j * 5, canvas.height - 25 + j, 2, 5 - j);
        }
    }
}

function drawObstacles() {
    for (let obstacle of obstaclesArray) {
        // Добавляем свечение для препятствий на высоких скоростях
        if (gameSettings.currentSpeed > 8) {
            const glow = ctx.createRadialGradient(
                obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 0,
                obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, obstacle.width * 1.5
            );
            glow.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y - obstacle.height/2, 
                        obstacle.width * 2, obstacle.height * 2);
        }
        
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Добавляем детали
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
            // Для птиц
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                   obstacle.width/2 - 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Глаза
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2 - 6, obstacle.y + obstacle.height/2 - 6, 3, 0, Math.PI * 2);
            ctx.arc(obstacle.x + obstacle.width/2 + 6, obstacle.y + obstacle.height/2 - 6, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Клюв
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height/2);
            ctx.lineTo(obstacle.x + obstacle.width + 8, obstacle.y + obstacle.height/2);
            ctx.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height/2 + 8);
            ctx.fill();
        }
    }
}

function drawPlayer() {
    // Рисуем динозавра
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
            ctx.moveTo(player.x + 15 + i * 10, player.y);
            ctx.lineTo(player.x + 20 + i * 10, player.y - 15);
            ctx.lineTo(player.x + 25 + i * 10, player.y);
            ctx.fill();
        }
    }
    
    // Добавляем свечение если набрано много очков
    if (score > 150) {
        const glowColor = score > 250 ? '#ff0000' : '#ff9900';
        const glow = ctx.createRadialGradient(
            player.x + player.width/2, player.y + player.height/2, 0,
            player.x + player.width/2, player.y + player.height/2, player.width * 1.5
        );
        glow.addColorStop(0, glowColor + '40');
        glow.addColorStop(1, glowColor + '00');
        
        ctx.fillStyle = glow;
        ctx.fillRect(player.x - player.width/2, player.y - player.height/2, 
                    player.width * 2, player.height * 2);
    }
}

// ========================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
// ========================================
function setupModalControls() {
    if (launchGameBtn) {
        launchGameBtn.addEventListener('click', function() {
            gameModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            initGame();
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', function() {
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
        });
    }
    
    if (gameModal) {
        gameModal.addEventListener('click', function(e) {
            if (e.target === gameModal) {
                gameModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                
                gameRunning = false;
                gamePaused = false;
                cancelAnimationFrame(animationId);
            }
        });
    }
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================
window.addEventListener('load', function() {
    setupModalControls();
});
