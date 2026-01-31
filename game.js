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
// ВИДЕО ЭЛЕМЕНТЫ (ТВОИ ФАЙЛЫ)
// ========================================
const playerVideo = document.createElement('video');
playerVideo.src = 'lv_0_20260125005509.mp4'; // Твоё видео динозавра
playerVideo.loop = true;
playerVideo.muted = false;
playerVideo.playsInline = true;
playerVideo.preload = 'auto';

let videoLoaded = false;
let videoError = false;

playerVideo.addEventListener('loadeddata', function() {
    console.log('✅ Видео динозавра загружено!');
    videoLoaded = true;
});

playerVideo.addEventListener('error', function() {
    console.error('❌ Ошибка загрузки видео динозавра');
    videoError = true;
    // Показываем сообщение
    if (menuScreen) {
        menuScreen.innerHTML += '<p style="color:#f87171;margin-top:10px;">⚠️ Видео не загрузилось, но игра работает!</p>';
    }
});

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
    width: 80, // Увеличил для видео
    height: 80,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.8,
    jumpPower: -15,
    groundY: 0
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
    addSoundButton();
    
    console.log('✅ Игра инициализирована!');
    
    // Пробуем загрузить видео
    if (!videoLoaded && !videoError) {
        playerVideo.load();
    }
}

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

function addSoundButton() {
    if (document.getElementById('sound-toggle-btn')) return;
    
    const soundBtn = document.createElement('button');
    soundBtn.id = 'sound-toggle-btn';
    soundBtn.textContent = '🔊';
    soundBtn.title = 'Включить/выключить звук';
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
        playerVideo.muted = !playerVideo.muted;
        this.textContent = playerVideo.muted ? '🔇' : '🔊';
        this.title = playerVideo.muted ? 'Включить звук' : 'Выключить звук';
    });
    
    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
        gameUI.appendChild(soundBtn);
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
    
    // Останавливаем видео
    playerVideo.pause();
    playerVideo.currentTime = 0;
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
    
    // Запускаем видео динозавра
    if (videoLoaded) {
        playerVideo.currentTime = 0;
        playerVideo.play().catch(e => {
            console.log('Ошибка воспроизведения видео:', e);
        });
    }
    
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
        
        // Пауза видео
        if (videoLoaded) {
            playerVideo.pause();
        }
    } else {
        if (pauseScreen) pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        
        // Возобновляем видео
        if (videoLoaded) {
            playerVideo.play().catch(e => {
                console.log('Ошибка возобновления видео:', e);
            });
        }
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
    
    // Останавливаем видео
    if (videoLoaded) {
        playerVideo.pause();
        playerVideo.currentTime = 0;
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
        player.height = 40;
        player.y = player.groundY + 40;
    } else if (!player.jumping) {
        player.height = 80;
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
        const playerRight = player.x + player.width - 20;
        const playerLeft = player.x + 20;
        const playerBottom = player.y + player.height - 20;
        const playerTop = player.y + 20;
        
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
// СКРИМЕР ПРИ 300 ОЧКАХ (С ВИДЕО)
// ========================================

function show300Scrimer() {
    gameRunning = false;
    gamePaused = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    // Останавливаем видео динозавра
    if (videoLoaded) {
        playerVideo.pause();
        playerVideo.currentTime = 0;
    }
    
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
    
    let count = 3;
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdown.textContent = count;
        } else {
            clearInterval(countdownInterval);
            showVideoScrimer(scrimerModal);
        }
    }, 1000);
}

function showVideoScrimer(modal) {
    modal.innerHTML = '';
    
    // Создаем элемент видео для скримера
    const scrimerVideo = document.createElement('video');
    scrimerVideo.src = 'scrimer.mp4'; // Твоё видео скримера
    scrimerVideo.autoplay = true;
    scrimerVideo.controls = false;
    scrimerVideo.muted = false;
    scrimerVideo.playsInline = true;
    scrimerVideo.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        background: #000;
    `;
    
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '✕ ПРОПУСТИТЬ';
    skipBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,0,0,0.8);
        color: white;
        border: none;
        font-size: 18px;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        border: 2px solid white;
        z-index: 10000;
    `;
    
    skipBtn.addEventListener('click', function() {
        scrimerVideo.pause();
        modal.remove();
        alert('🎊 Поздравляем с 300 очками! Игра окончена!');
        returnToMenu();
    });
    
    modal.appendChild(scrimerVideo);
    modal.appendChild(skipBtn);
    
    // Обработка окончания видео
    scrimerVideo.addEventListener('ended', function() {
        modal.remove();
        alert('🎊 Поздравляем с 300 очками! Игра окончена!');
        returnToMenu();
    });
    
    // Обработка ошибки загрузки видео
    scrimerVideo.addEventListener('error', function() {
        modal.innerHTML = `
            <div style="color: white; text-align: center; padding: 50px;">
                <h1 style="font-size: 48px; color: #ff0000; margin-bottom: 20px;">💀 СКРИМЕР! 💀</h1>
                <p style="font-size: 24px; margin-bottom: 30px;">🎊 Поздравляем с 300 очками!</p>
                <p style="font-size: 18px; color: #ccc; margin-bottom: 40px;">(Видео скримера не загрузилось)</p>
                <button onclick="this.parentElement.parentElement.remove(); alert('🎊 Поздравляем с 300 очками!'); window.location.reload()" 
                        style="background: #338ef5; color: white; border: none; padding: 15px 30px; font-size: 20px; border-radius: 10px; cursor: pointer;">
                    НАЗАД В МЕНЮ
                </button>
            </div>
        `;
    });
    
    // Автоматическое закрытие через 30 секунд (на всякий случай)
    setTimeout(() => {
        if (document.body.contains(modal)) {
            modal.remove();
            alert('🎊 Поздравляем с 300 очками! Игра окончена!');
            returnToMenu();
        }
    }, 30000);
}

function gameOver() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // Останавливаем видео
    if (videoLoaded) {
        playerVideo.pause();
        playerVideo.currentTime = 0;
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
    ctx.fillText('P - Пауза | M - Звук', canvas.width / 2, 330);
    
    // Показываем статус видео
    if (videoError) {
        ctx.fillStyle = '#f87171';
        ctx.font = '12px Arial';
        ctx.fillText('⚠️ Видео не загрузилось', canvas.width / 2, 380);
    } else if (videoLoaded) {
        ctx.fillStyle = '#10b981';
        ctx.font = '12px Arial';
        ctx.fillText('✅ Видео готово', canvas.width / 2, 380);
    }
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
    
    const time = Date.now() * 0.001;
    for (let star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
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
    // Пробуем нарисовать видео, если оно загружено
    if (videoLoaded && playerVideo.readyState >= 2) {
        try {
            // Сохраняем состояние контекста
            ctx.save();
            
            // Добавляем анимацию прыжка
            let drawY = player.y;
            if (player.jumping) {
                // Эффект прыжка
                const jumpBounce = Math.sin(Date.now() / 50) * 2;
                drawY += jumpBounce;
            }
            
            // Рисуем видео
            ctx.drawImage(playerVideo, player.x, drawY, player.width, player.height);
            
            // Восстанавливаем состояние контекста
            ctx.restore();
            return;
        } catch (error) {
            console.log('Ошибка отрисовки видео:', error);
            videoError = true;
        }
    }
    
    // Если видео не загружено, рисуем простого динозавра
    drawFallbackDinosaur();
}

function drawFallbackDinosaur() {
    ctx.fillStyle = '#4CAF50';
    
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
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================

window.addEventListener('load', function() {
    console.log('Страница загружена');
    
    // Проверяем элементы
    if (!canvas) {
        console.error('Canvas элемент не найден!');
        return;
    }
    
    if (!gameModal) {
        console.error('Модальное окно игры не найдено!');
        return;
    }
    
    // Загружаем видео заранее
    playerVideo.load();
    
    // Инициализируем обработчики
    if (launchGameBtn) {
        launchGameBtn.addEventListener('click', function() {
            console.log('Кнопка запуска игры нажата');
            gameModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Даем время на отрисовку модального окна
            setTimeout(() => {
                initGame();
            }, 100);
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', closeGameModal);
    }
    
    console.log('Игра готова к запуску');
});
