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
const newRecordElement = document.getElementById('new-record');

// Модальное окно игры
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.getElementById('close-game-btn');
const launchGameBtn = document.getElementById('launch-game-btn');

// Видео элементы
const playerVideo = document.createElement('video');
playerVideo.src = 'lv_0_20260125005509.mp4'; // Твое видео
playerVideo.loop = true;
playerVideo.muted = true;
playerVideo.playsInline = true;
playerVideo.preload = 'auto';

// Массив звезд для фона
let stars = [];

// Состояние игры
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
let lastTime = 0;
let animationId;
let hasShown500Record = localStorage.getItem('shown500Record') === 'true' || false;

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

// Препятствия (ночные цвета)
const obstacles = {
    types: [
        { width: 20, height: 40, color: '#2d3748' }, // Темно-серый
        { width: 30, height: 50, color: '#4a5568' }, // Серый
        { width: 44, height: 44, color: '#2c5282' }  // Синий (птица)
    ]
};

let obstaclesArray = [];
let clouds = [];
let groundOffset = 0;

// Настройки игры
const gameSettings = {
    baseSpeed: 4,
    currentSpeed: 4,
    spawnTimer: 0,
    spawnInterval: 1000,
    minGap: 150,
    speedIncrease: 0.001
};

// ========================================
// СОЗДАНИЕ ЗВЕЗД ДЛЯ НОЧНОГО ФОНА
// ========================================
function createStars() {
    stars = [];
    const starCount = 100; // Количество звезд
    
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7), // Только в верхней части
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
    console.log('🎮 Инициализация игры (Ночная версия)...');
    
    // Устанавливаем размеры canvas
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Создаем звезды
    createStars();
    
    // Настраиваем игрока
    player.groundY = canvas.height - player.height - 10;
    player.y = player.groundY;
    player.currentFrame = 0;
    player.frameTimer = 0;
    
    // Загружаем рекорд
    highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    // Сбрасываем настройки
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    
    // Создаем облака (ночные облака)
    clouds = [];
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: 30 + Math.random() * 100,
            width: 40 + Math.random() * 60,
            speed: 0.5 + Math.random() * 1
        });
    }
    
    // Очищаем препятствия
    obstaclesArray = [];
    
    // Сбрасываем счет
    score = 0;
    scoreElement.textContent = 0;
    
    // Показываем меню
    menuScreen.classList.remove('hidden');
    pauseScreen.classList.remove('show');
    
    // Рисуем меню
    drawMenuScreen();
    
    // Настраиваем обработчики событий
    setupGameEventListeners();
}

// ========================================
// РИСОВАНИЕ МЕНЮ (НОЧНАЯ ТЕМА)
// ========================================
function drawMenuScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ночной фон
    drawNightSky();
    
    // Заголовок
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌙 Ночной динозавр', canvas.width / 2, 80);
    
    // Подзаголовок
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Беги под луной! Пробел или ↑ для прыжка', canvas.width / 2, 120);
    
    // Рекорд
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, 180);
    
    // Предупреждение о скримере
    if (!hasShown500Record) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#f87171';
        ctx.fillText('⚠️ 500 очков = СЮРПРИЗ!', canvas.width / 2, 220);
    }
    
    // Управление
    ctx.font = '14px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ПРОБЕЛ или СТРЕЛКА ↑ - Прыжок', canvas.width / 2, 270);
    ctx.fillText('СТРЕЛКА ↓ - Пригнуться', canvas.width / 2, 300);
    ctx.fillText('P - Пауза', canvas.width / 2, 330);
    
    // Цель
    ctx.font = 'italic 14px Arial';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('🎯 Достигни 500 очков для сюрприза!', canvas.width / 2, 380);
}

// ========================================
// РИСОВАНИЕ НОЧНОГО НЕБА
// ========================================
function drawNightSky() {
    // Темный градиент неба
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e293b');
    skyGradient.addColorStop(1, '#334155');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    // Рисуем звезды
    drawStars();
    
    // Рисуем луну
    drawMoon();
}

function drawStars() {
    const time = Date.now() * 0.001;
    
    for (let star of stars) {
        // Мерцание звезд
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Эффект сияния для некоторых звезд
        if (star.size > 1.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawMoon() {
    // Луна
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Кратеры на луне
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.arc(canvas.width - 115, 70, 5, 0, Math.PI * 2);
    ctx.arc(canvas.width - 95, 90, 8, 0, Math.PI * 2);
    ctx.arc(canvas.width - 85, 65, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Свечение луны
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
    // Управление кнопками
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    // Управление игрой
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Клик по canvas (для мобильных)
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
        console.log('🦘 Прыжок под луной!');
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
    
    console.log('🚀 Начало ночной игры');
    
    menuScreen.classList.add('hidden');
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstaclesArray = [];
    scoreElement.textContent = 0;
    
    // Сброс игрока
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.velocity = 0;
    player.currentFrame = 0;
    
    // Сброс настроек игры
    gameSettings.currentSpeed = gameSettings.baseSpeed;
    gameSettings.spawnTimer = 0;
    
    // Запуск видео персонажа
    playerVideo.currentTime = 0;
    playerVideo.play().catch(e => {
        console.log('Не удалось запустить видео персонажа:', e);
    });
    
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
        
        // Пауза видео
        playerVideo.pause();
    } else {
        pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        
        // Возобновление видео
        playerVideo.play().catch(e => {
            console.log('Не удалось возобновить видео:', e);
        });
    }
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    console.log('🔄 Перезапуск игры');
    
    pauseScreen.classList.remove('show');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToMenu() {
    console.log('🏠 Возврат в меню');
    
    pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
        console.log(`🎉 Новый рекорд: ${highScore}!`);
    }
    
    // Пауза видео
    playerVideo.pause();
    
    // Сбрасываем игру
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
    // Увеличение счета
    score += gameSettings.currentSpeed * 0.1;
    scoreElement.textContent = Math.floor(score);
    
    // Увеличение скорости со временем
    gameSettings.currentSpeed += gameSettings.speedIncrease;
    
    // Обновляем игрока
    updatePlayer(deltaTime);
    
    // Обновляем препятствия
    updateObstacles(deltaTime);
    
    // Обновляем облака
    updateClouds();
    
    // Движение земли
    groundOffset = (groundOffset - gameSettings.currentSpeed) % 24;
    
    // Проверка столкновений
    checkCollisions();
    
    // Проверка на достижение 500 очков (скример)
    if (Math.floor(score) >= 500 && !hasShown500Record) {
        showScrimer();
        return;
    }
    
    // Обновляем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
        
        // Показываем сообщение о новом рекорде
        if (Math.floor(score) % 100 === 0 && score > 0) {
            showNewRecord();
        }
    }
}

function updatePlayer(deltaTime) {
    // Анимация бега
    if (!player.jumping && !player.ducking) {
        player.frameTimer += deltaTime;
        if (player.frameTimer > player.frameInterval) {
            player.frameTimer = 0;
            player.currentFrame = (player.currentFrame + 1) % 2;
        }
    }
    
    // Физика прыжка
    if (player.jumping) {
        player.velocity += player.gravity;
        player.y += player.velocity;
        
        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.jumping = false;
            player.velocity = 0;
        }
    }
    
    // Приседание
    if (player.ducking && !player.jumping) {
        player.height = 25;
        player.y = player.groundY + 22;
    } else if (!player.jumping) {
        player.height = 47;
        player.y = player.groundY;
    }
}

function updateObstacles(deltaTime) {
    // Таймер для создания препятствий
    gameSettings.spawnTimer += deltaTime;
    
    // Создаем новое препятствие
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
            glow: Math.random() > 0.7 // Некоторые препятствия светятся
        });
        
        // Уменьшаем интервал между препятствиями
        gameSettings.spawnInterval = Math.max(600, 1000 - Math.floor(score / 100) * 40);
    }
    
    // Двигаем препятствия
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
    // Упрощенные коллизии
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
// СКРИМЕР ПРИ 500 ОЧКАХ
// ========================================
function showScrimer() {
    console.log('🎬 Показываем скример на 500 очков!');
    
    // Останавливаем игру
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Пауза видео персонажа
    playerVideo.pause();
    
    // Сохраняем, что уже показали скример
    hasShown500Record = true;
    localStorage.setItem('shown500Record', 'true');
    
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
    `;
    
    // Сообщение перед скримером
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
    warningMsg.textContent = '🎉 ПОЗДРАВЛЯЕМ! 500 ОЧКОВ!\n\nЧерез 3 секунды...';
    
    scrimerModal.appendChild(warningMsg);
    document.body.appendChild(scrimerModal);
    
    // Через 3 секунды показываем скример
    setTimeout(() => {
        warningMsg.remove();
        
        // Создаем видео элемент для скримера
        const scrimerVideoElement = document.createElement('video');
        scrimerVideoElement.id = 'scrimer-video';
        scrimerVideoElement.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            background: #000;
        `;
        scrimerVideoElement.autoplay = true;
        scrimerVideoElement.controls = false;
        
        // ТЫ ДОБАВИШЬ СВОЮ ССЫЛКУ ЗДЕСЬ:
        scrimerVideoElement.src = 'ТВОЯ_ССЫЛКА_НА_СКРИМЕР_ВИДЕО.mp4';
        
        // Добавляем обработчики
        scrimerVideoElement.addEventListener('ended', function() {
            scrimerModal.remove();
            alert('🎊 Отличная работа! Ты достиг 500 очков!\nТеперь продолжай играть!');
            hasShown500Record = true;
            returnToMenu();
        });
        
        scrimerVideoElement.addEventListener('error', function() {
            console.log('Ошибка загрузки скримера');
            scrimerModal.remove();
            alert('🎊 Поздравляем! Ты достиг 500 очков!\n(Видео скримера не загрузилось)');
            hasShown500Record = true;
            returnToMenu();
        });
        
        // Кнопка закрытия
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
            alert('🎊 Поздравляем с 500 очками!');
            hasShown500Record = true;
            returnToMenu();
        });
        
        scrimerModal.appendChild(scrimerVideoElement);
        scrimerModal.appendChild(closeBtn);
        
        // Пытаемся воспроизвести видео
        setTimeout(() => {
            scrimerVideoElement.play().catch(e => {
                console.log('Не удалось воспроизвести скример:', e);
                scrimerModal.remove();
                alert('🎊 500 очков! Так держать!');
                returnToMenu();
            });
        }, 500);
        
    }, 3000); // 3 секунды задержки
}

// ========================================
// КОНЕЦ ИГРЫ
// ========================================
function gameOver() {
    console.log('💀 Конец игры. Счет:', Math.floor(score));
    
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
        console.log(`🎉 Установлен новый рекорд: ${highScore}!`);
    }
    
    // Пауза видео
    playerVideo.pause();
    
    // Показываем меню через секунду
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
        menuHighScoreElement.textContent = highScore;
    }, 1000);
}

// ========================================
// ОТРИСОВКА ИГРЫ (НОЧНАЯ ТЕМА)
// ========================================
function drawGame() {
    // Очищаем экран
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ночное небо с звездами и луной
    drawNightSky();
    
    // Облака (ночные)
    drawClouds();
    
    // Земля
    drawGround();
    
    // Препятствия
    drawObstacles();
    
    // Игрок
    drawPlayer();
    
    // Отсчет до скримера (если еще не показан)
    if (!hasShown500Record && score < 500) {
        const remaining = 500 - Math.floor(score);
        if (remaining <= 100) {
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`🎯 До сюрприза: ${remaining}`, 10, 25);
        }
    }
}

function drawClouds() {
    // Ночные облака (темные)
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
    // Темная земля
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 20, 0, canvas.height);
    groundGradient.addColorStop(0, '#1e293b');
    groundGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // Разметка (светящаяся)
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < canvas.width; i += 24) {
        // Эффект свечения
        const glow = ctx.createRadialGradient(
            i + groundOffset + 6, canvas.height - 10, 0,
            i + groundOffset + 6, canvas.height - 10, 8
        );
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(i + groundOffset - 8, canvas.height - 18, 24, 16);
        
        // Сама линия
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(i + groundOffset, canvas.height - 10, 12, 3);
    }
}

function drawObstacles() {
    for (let obstacle of obstaclesArray) {
        // Тело препятствия
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Свечение для некоторых препятствий
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
        
        // Детали для кактуса
        if (!obstacle.isBird) {
            ctx.fillStyle = '#1e293b';
            // Вертикальные полоски
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    obstacle.x + 3 + i * (obstacle.width - 6) / 3,
                    obstacle.y + 3,
                    2,
                    obstacle.height - 6
                );
            }
        } else {
            // Ночная птица
            ctx.fillStyle = '#1e40af';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                   obstacle.width/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Глаза (светящиеся)
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2 - 5, obstacle.y + obstacle.height/2 - 5, 3, 0, Math.PI * 2);
            ctx.arc(obstacle.x + obstacle.width/2 + 5, obstacle.y + obstacle.height/2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Клюв
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
    // Пытаемся нарисовать видео
    if (playerVideo.readyState >= 2) {
        try {
            ctx.save();
            
            // Добавляем свечение вокруг игрока ночью
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
            
            // Рисуем видео
            if (player.ducking) {
                ctx.drawImage(playerVideo, player.x, player.y, player.width, player.height);
            } else {
                // Анимация бега
                const bounce = player.jumping ? 0 : Math.sin(Date.now() / 100) * 2;
                ctx.drawImage(playerVideo, player.x, player.y + bounce, player.width, player.height);
            }
            
            ctx.restore();
            return;
        } catch (error) {
            console.log('Ошибка рисования видео:', error);
        }
    }
    
    // Запасной вариант: ночной динозавр
    drawNightDinosaur();
}

function drawNightDinosaur() {
    // Тело динозавра (темное)
    ctx.fillStyle = '#374151';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Свечение при высоком счете
    if (score > 300) {
        ctx.fillStyle = `rgba(249, 115, 22, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
        ctx.fillRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
    }
    
    // Ноги
    ctx.fillStyle = '#4b5563';
    const legOffset = player.currentFrame * 3;
    
    // Передняя нога
    ctx.fillRect(player.x + 5, player.y + player.height - 5, 8, 10);
    // Задняя нога
    ctx.fillRect(player.x + player.width - 13, player.y + player.height - 5 + legOffset, 8, 10);
    
    // Голова
    ctx.fillRect(player.x + player.width - 10, player.y, 12, 15);
    
    // Глаз (светящийся)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 3, player.y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачок
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 3, player.y + 5, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Рот
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + 12);
    ctx.lineTo(player.x + player.width - 3, player.y + 12);
    ctx.stroke();
    
    // Спинные пластины (светящиеся)
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
// НОВЫЙ РЕКОРД
// ========================================
function showNewRecord() {
    newRecordElement.classList.add('show');
    
    setTimeout(() => {
        newRecordElement.classList.remove('show');
    }, 1500);
}

// ========================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
// ========================================
function setupModalControls() {
    if (launchGameBtn) {
        launchGameBtn.addEventListener('click', function() {
            console.log('🎮 Запуск ночной игры');
            gameModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            initGame();
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', function() {
            console.log('❌ Закрытие игры');
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Останавливаем игру
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
            
            // Пауза видео
            playerVideo.pause();
        });
    }
    
    if (gameModal) {
        gameModal.addEventListener('click', function(e) {
            if (e.target === gameModal) {
                gameModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                
                // Останавливаем игру
                gameRunning = false;
                gamePaused = false;
                cancelAnimationFrame(animationId);
                
                // Пауза видео
                playerVideo.pause();
            }
        });
    }
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================
window.addEventListener('load', function() {
    console.log('✅ Страница загружена (Ночная версия)');
    
    // Настраиваем управление модальным окном
    setupModalControls();
    
    // Предзагрузка видео персонажа
    playerVideo.load();
    
    console.log('🌙 Ночная игра готова!');
    console.log('⚠️  Скример на 500 очков');
    console.log('🌟  Звезды, луна и свечение!');
});
