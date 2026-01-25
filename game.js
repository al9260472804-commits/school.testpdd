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

// Настройки игры
const GAME_CONFIG = {
    SCRIMER_TRIGGER: 300, // СКРИМЕР на 300 очков
    INITIAL_SPEED: 4,
    SPEED_INCREASE: 0.001,
    MIN_SPAWN_INTERVAL: 600
};

// ВИДЕО ЭЛЕМЕНТ - ВОЗВРАЩАЕМ!
const playerVideo = document.createElement('video');
playerVideo.src = 'lv_0_20260125005509.mp4';
playerVideo.loop = true;
playerVideo.muted = false;
playerVideo.playsInline = true;
playerVideo.preload = 'auto';

// ========================================
// СИСТЕМА ЗВУКОВ
// ========================================
const audioManager = {
    sounds: {},
    music: null,
    enabled: true,
    
    init: function() {
        this.sounds = {
            jump: this.createAudio('jump.mp3'),
            collision: this.createAudio('collision.mp3'),
            duck: this.createAudio('duck.mp3'),
            score: this.createAudio('score.mp3'),
            click: this.createAudio('click.mp3')
        };
        
        this.music = this.createAudio('background-music.mp3', true);
        this.music.volume = 0.3;
        
        this.preloadSounds();
    },
    
    createAudio: function(src, loop = false) {
        const audio = new Audio();
        audio.src = src;
        audio.loop = loop;
        audio.preload = 'auto';
        return audio;
    },
    
    preloadSounds: function() {
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
        this.music.load();
    },
    
    play: function(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    },
    
    playMusic: function() {
        if (!this.enabled) return;
        
        this.music.currentTime = 0;
        this.music.play().catch(e => {});
    },
    
    pauseMusic: function() {
        this.music.pause();
    },
    
    stopMusic: function() {
        this.music.pause();
        this.music.currentTime = 0;
    },
    
    resumeMusic: function() {
        if (!this.enabled) return;
        
        this.music.play().catch(e => {});
    },
    
    toggleSound: function() {
        this.enabled = !this.enabled;
        
        if (!this.enabled) {
            this.pauseMusic();
        } else if (gameRunning && !gamePaused) {
            this.resumeMusic();
        }
        
        localStorage.setItem('soundEnabled', this.enabled);
        
        return this.enabled;
    },
    
    setVolume: function(volume) {
        this.music.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
        localStorage.setItem('gameVolume', volume);
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
let hasShownScrimer = localStorage.getItem('hasShownScrimer') === 'true' || false;

// Игрок
const player = {
    x: 50,
    y: 0,
    width: 44,
    height: 47,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.6,
    jumpPower: -10,
    groundY: 0,
    currentFrame: 0,
    frameTimer: 0,
    frameInterval: 100
};

// Препятствия
const obstacles = {
    types: [
        { width: 20, height: 40, color: '#2d3748' },
        { width: 30, height: 50, color: '#4a5568' },
        { width: 44, height: 44, color: '#2c5282' }
    ]
};

let obstaclesArray = [];
let clouds = [];
let groundOffset = 0;

// Настройки игры
const gameSettings = {
    baseSpeed: GAME_CONFIG.INITIAL_SPEED,
    currentSpeed: GAME_CONFIG.INITIAL_SPEED,
    spawnTimer: 0,
    spawnInterval: 1000,
    minGap: 150,
    speedIncrease: GAME_CONFIG.SPEED_INCREASE,
    lastScoreSound: 0
};

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
    player.currentFrame = 0;
    player.frameTimer = 0;
    
    highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    gameSettings.lastScoreSound = 0;
    
    clouds = [];
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: 30 + Math.random() * 100,
            width: 40 + Math.random() * 60,
            speed: 0.5 + Math.random() * 1
        });
    }
    
    obstaclesArray = [];
    score = 0;
    scoreElement.textContent = 0;
    
    menuScreen.classList.remove('hidden');
    pauseScreen.classList.remove('show');
    
    audioManager.init();
    
    const soundEnabled = localStorage.getItem('soundEnabled');
    if (soundEnabled !== null) {
        audioManager.enabled = soundEnabled === 'true';
    }
    
    const volume = localStorage.getItem('gameVolume');
    if (volume) {
        audioManager.setVolume(parseFloat(volume));
    }
    
    // Загружаем видео динозавра
    playerVideo.load();
    
    drawMenuScreen();
    setupGameEventListeners();
    addSoundButton();
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
        audioManager.play('click');
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
    ctx.fillText('🌙 Бегущий динозавр', canvas.width / 2, 80);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Беги под луной! Пробел или ↑ для прыжка', canvas.width / 2, 120);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, 180);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ПРОБЕЛ или СТРЕЛКА ↑ - Прыжок', canvas.width / 2, 240);
    ctx.fillText('СТРЕЛКА ↓ - Пригнуться', canvas.width / 2, 270);
    ctx.fillText('P - Пауза', canvas.width / 2, 300);
    ctx.fillText('M - Вкл/Выкл звук', canvas.width / 2, 330);
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
        
        if (star.size > 1.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawMoon() {
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.arc(canvas.width - 115, 70, 5, 0, Math.PI * 2);
    ctx.arc(canvas.width - 95, 90, 8, 0, Math.PI * 2);
    ctx.arc(canvas.width - 85, 65, 6, 0, Math.PI * 2);
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
    
    canvas.addEventListener('touchstart', function(e) {
        if (!gameRunning || gamePaused) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        
        if (touchX > canvas.width / 2) {
            jump();
        } else {
            duck(true);
            setTimeout(() => duck(false), 300);
        }
    }, { passive: false });
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
        audioManager.play('jump');
    }
}

function duck(start) {
    if (gameRunning && !gamePaused) {
        player.ducking = start;
        if (start) {
            audioManager.play('duck');
        }
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
    
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.velocity = 0;
    player.currentFrame = 0;
    
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    gameSettings.lastScoreSound = 0;
    
    // Запускаем видео динозавра
    playerVideo.currentTime = 0;
    playerVideo.play().catch(e => {
        console.log('Ошибка воспроизведения видео:', e);
    });
    
    audioManager.playMusic();
    audioManager.play('click');
    
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
        
        // Пауза для видео и музыки
        playerVideo.pause();
        audioManager.pauseMusic();
        audioManager.play('click');
    } else {
        pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        
        // Возобновляем видео и музыку
        playerVideo.play().catch(e => {});
        audioManager.resumeMusic();
        audioManager.play('click');
    }
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    pauseScreen.classList.remove('show');
    audioManager.play('click');
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
    
    // Останавливаем видео и музыку
    playerVideo.pause();
    playerVideo.currentTime = 0;
    audioManager.stopMusic();
    audioManager.play('click');
    
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
    score += gameSettings.currentSpeed * 0.1;
    scoreElement.textContent = Math.floor(score);
    
    if (Math.floor(score) % 100 === 0 && Math.floor(score) > gameSettings.lastScoreSound) {
        audioManager.play('score');
        gameSettings.lastScoreSound = Math.floor(score);
    }
    
    gameSettings.currentSpeed += gameSettings.speedIncrease;
    
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    updateClouds();
    
    groundOffset = (groundOffset - gameSettings.currentSpeed) % 24;
    
    checkCollisions();
    
    // Проверка на скример при 300 очках (скрытая функция)
    if (Math.floor(score) >= GAME_CONFIG.SCRIMER_TRIGGER && !hasShownScrimer) {
        showScrimer();
        return;
    }
    
    if (score > highScore) {
        highScore = Math.floor(score);
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
    }
}

function updatePlayer(deltaTime) {
    if (!player.jumping && !player.ducking) {
        player.frameTimer += deltaTime;
        if (player.frameTimer > player.frameInterval) {
            player.frameTimer = 0;
            player.currentFrame = (player.currentFrame + 1) % 2;
        }
    }
    
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
        player.height = 25;
        player.y = player.groundY + 22;
    } else if (!player.jumping) {
        player.height = 47;
        player.y = player.groundY;
    }
}

function updateObstacles(deltaTime) {
    gameSettings.spawnTimer += deltaTime;
    
    if (gameSettings.spawnTimer > gameSettings.spawnInterval) {
        gameSettings.spawnTimer = 0;
        
        const type = obstacles.types[Math.floor(Math.random() * obstacles.types.length)];
        const isBird = type.width === 44;
        
        obstaclesArray.push({
            x: canvas.width,
            y: isBird ? canvas.height - type.height - 70 : canvas.height - type.height - 10,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: gameSettings.currentSpeed,
            isBird: isBird,
            glow: Math.random() > 0.7
        });
        
        gameSettings.spawnInterval = Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, 1000 - Math.floor(score / 100) * 40);
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
            cloud.y = 30 + Math.random() * 100;
        }
    }
}

function checkCollisions() {
    for (let obstacle of obstaclesArray) {
        const playerRight = player.x + player.width - 10;
        const playerLeft = player.x + 10;
        const playerBottom = player.y + player.height - 5;
        const playerTop = player.y + 5;
        
        const obstacleRight = obstacle.x + obstacle.width - 5;
        const obstacleLeft = obstacle.x + 5;
        const obstacleBottom = obstacle.y + obstacle.height - 5;
        const obstacleTop = obstacle.y + 5;
        
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
// СКРИМЕР ПРИ 300 ОЧКАХ (СКРЫТЫЙ)
// ========================================
function showScrimer() {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    playerVideo.pause();
    audioManager.stopMusic();
    
    hasShownScrimer = true;
    localStorage.setItem('hasShownScrimer', 'true');
    
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
    `;
    
    const warningMsg = document.createElement('div');
    warningMsg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        z-index: 10000;
        background: rgba(0,0,0,0.7);
        padding: 20px;
        border-radius: 10px;
        animation: pulse 1s infinite;
    `;
    warningMsg.textContent = '🎉 ПОЗДРАВЛЯЕМ! ТЫ ДОСТИГ 300 ОЧКОВ!\n\nЧерез 3 секунды...';
    
    scrimerModal.appendChild(warningMsg);
    document.body.appendChild(scrimerModal);
    
    setTimeout(() => {
        warningMsg.remove();
        
        const scrimerVideoElement = document.createElement('video');
        scrimerVideoElement.id = 'scrimer-video';
        scrimerVideoElement.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            background: #000;
        `;
        scrimerVideoElement.autoplay = true;
        scrimerVideoElement.controls = false;
        
        // ВСТАВЬ ЗДЕСЬ СВОЁ ВИДЕО СКРИМЕРА!
        scrimerVideoElement.src = 'ТВОЁ_СКРИМЕР_ВИДЕО.mp4';
        
        scrimerVideoElement.addEventListener('ended', function() {
            scrimerModal.remove();
            alert('🎊 Отличная работа! Ты достиг 300 очков!\nТеперь продолжай играть!');
            returnToMenu();
        });
        
        scrimerVideoElement.addEventListener('error', function() {
            scrimerModal.remove();
            alert('🎊 Поздравляем! Ты достиг 300 очков!\n(Видео скримера не загрузилось)');
            returnToMenu();
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ ПРОПУСТИТЬ';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,0,0,0.7);
            color: white;
            border: none;
            font-size: 16px;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10000;
            font-weight: bold;
        `;
        closeBtn.addEventListener('click', function() {
            scrimerVideoElement.pause();
            scrimerModal.remove();
            alert('🎊 300 очков! Так держать!');
            returnToMenu();
        });
        
        scrimerModal.appendChild(scrimerVideoElement);
        scrimerModal.appendChild(closeBtn);
        
        setTimeout(() => {
            scrimerVideoElement.play().catch(e => {
                scrimerModal.remove();
                alert('🎊 300 очков! Так держать!');
                returnToMenu();
            });
        }, 500);
        
    }, 3000);
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
    
    audioManager.play('collision');
    setTimeout(() => {
        audioManager.stopMusic();
    }, 500);
    
    playerVideo.pause();
    
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
        menuHighScoreElement.textContent = highScore;
    }, 1000);
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
}

function drawClouds() {
    for (let cloud of clouds) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 5, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 20, 0, canvas.height);
    groundGradient.addColorStop(0, '#1e293b');
    groundGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < canvas.width; i += 24) {
        const glow = ctx.createRadialGradient(
            i + groundOffset + 6, canvas.height - 10, 0,
            i + groundOffset + 6, canvas.height - 10, 8
        );
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(i + groundOffset - 8, canvas.height - 18, 24, 16);
        
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(i + groundOffset, canvas.height - 10, 12, 3);
    }
}

function drawObstacles() {
    for (let obstacle of obstaclesArray) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        if (obstacle.glow) {
            const glow = ctx.createRadialGradient(
                obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 0,
                obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, obstacle.width
            );
            glow.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
            glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(obstacle.x - 5, obstacle.y - 5, obstacle.width + 10, obstacle.height + 10);
        }
        
        if (!obstacle.isBird) {
            ctx.fillStyle = '#1e293b';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    obstacle.x + 3 + i * (obstacle.width - 6) / 3,
                    obstacle.y + 3,
                    2,
                    obstacle.height - 6
                );
            }
        } else {
            ctx.fillStyle = '#1e40af';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                   obstacle.width/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2 - 5, obstacle.y + obstacle.height/2 - 5, 3, 0, Math.PI * 2);
            ctx.arc(obstacle.x + obstacle.width/2 + 5, obstacle.y + obstacle.height/2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height/2);
            ctx.lineTo(obstacle.x + obstacle.width + 5, obstacle.y + obstacle.height/2);
            ctx.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height/2 + 5);
            ctx.fill();
        }
    }
}

function drawPlayer() {
    // Пробуем нарисовать видео динозавра
    if (playerVideo.readyState >= 2) {
        try {
            ctx.save();
            
            // Добавляем эффект свечения при высоком счете
            if (score > 200) {
                const glow = ctx.createRadialGradient(
                    player.x + player.width/2, player.y + player.height/2, 0,
                    player.x + player.width/2, player.y + player.height/2, player.width
                );
                glow.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
                glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
                
                ctx.fillStyle = glow;
                ctx.fillRect(player.x - 10, player.y - 10, player.width + 20, player.height + 20);
            }
            
            // Рисуем видео динозавра
            if (player.ducking) {
                ctx.drawImage(playerVideo, player.x, player.y, player.width, player.height);
            } else {
                // Добавляем небольшую анимацию прыжка
                const bounce = player.jumping ? 0 : Math.sin(Date.now() / 100) * 2;
                ctx.drawImage(playerVideo, player.x, player.y + bounce, player.width, player.height);
            }
            
            ctx.restore();
            return;
        } catch (error) {
            console.log('Ошибка отрисовки видео:', error);
            // Если видео не загрузилось, рисуем динозавра через графику
        }
    }
    
    // Резервный вариант: рисуем графического динозавра
    drawFallbackDinosaur();
}

function drawFallbackDinosaur() {
    ctx.fillStyle = '#374151';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    if (score > 200) {
        ctx.fillStyle = `rgba(249, 115, 22, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
        ctx.fillRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
    }
    
    ctx.fillStyle = '#4b5563';
    const legOffset = player.currentFrame * 3;
    
    ctx.fillRect(player.x + 5, player.y + player.height - 5, 8, 10);
    ctx.fillRect(player.x + player.width - 13, player.y + player.height - 5 + legOffset, 8, 10);
    
    ctx.fillRect(player.x + player.width - 10, player.y, 12, 15);
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 3, player.y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 3, player.y + 5, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + 12);
    ctx.lineTo(player.x + player.width - 3, player.y + 12);
    ctx.stroke();
    
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(player.x + 10 + i * 8, player.y);
        ctx.lineTo(player.x + 14 + i * 8, player.y - 8);
        ctx.lineTo(player.x + 18 + i * 8, player.y);
        ctx.fill();
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
            
            playerVideo.pause();
            audioManager.stopMusic();
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
                
                playerVideo.pause();
                audioManager.stopMusic();
            }
        });
    }
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================
window.addEventListener('load', function() {
    setupModalControls();
    // Предзагружаем видео при загрузке страницы
    playerVideo.load().catch(e => {
        console.log('Ошибка загрузки видео:', e);
    });
});
