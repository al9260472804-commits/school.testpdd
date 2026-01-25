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

// Видео для скримера (ты добавишь ссылку)
const scrimerVideo = document.createElement('video');
scrimerVideo.loop = false;
scrimerVideo.muted = false;
scrimerVideo.playsInline = true;
scrimerVideo.preload = 'auto';

// Состояние игры
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
let lastTime = 0;
let animationId;
let hasShown1500Record = localStorage.getItem('shown1500Record') === 'true' || false;

// Игрок (как в Chrome динозаврике)
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
    frameInterval: 100 // ms между кадрами
};

// Препятствия
const obstacles = {
    types: [
        { width: 20, height: 40, color: '#535353' }, // Маленькое
        { width: 30, height: 50, color: '#535353' }, // Среднее
        { width: 44, height: 44, color: '#535353' }  // Большое (птица)
    ]
};

let obstaclesArray = [];
let clouds = [];
let groundOffset = 0;

// Настройки игры (как в Chrome)
const gameSettings = {
    baseSpeed: 4,
    currentSpeed: 4,
    spawnTimer: 0,
    spawnInterval: 1000, // ms между препятствиями
    minGap: 150,
    speedIncrease: 0.001
};

// ========================================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================================
function initGame() {
    console.log('🎮 Инициализация игры...');
    
    // Устанавливаем размеры canvas
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
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
    
    // Создаем облака
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
// РИСОВАНИЕ МЕНЮ
// ========================================
function drawMenuScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон как в Chrome
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Заголовок
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🦖 Бегущий динозавр', canvas.width / 2, 80);
    
    // Подзаголовок
    ctx.font = '16px Arial';
    ctx.fillText('Как в Chrome! Пробел или ↑ для прыжка', canvas.width / 2, 120);
    
    // Рекорд
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, 180);
    
    // Управление
    ctx.font = '14px Arial';
    ctx.fillText('ПРОБЕЛ или СТРЕЛКА ↑ - Прыжок', canvas.width / 2, 240);
    ctx.fillText('СТРЕЛКА ↓ - Пригнуться', canvas.width / 2, 270);
    ctx.fillText('P - Пауза', canvas.width / 2, 300);
    
    // Цель
    ctx.font = 'italic 14px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('🎯 Попробуй набрать 1500 очков!', canvas.width / 2, 350);
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
        console.log('🦘 Прыжок!');
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
    
    console.log('🚀 Начало игры');
    
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
    
    // Проверка на достижение 1500 очков (скример)
    if (Math.floor(score) >= 1500 && !hasShown1500Record) {
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
    // Анимация бега (переключение кадров)
    if (!player.jumping && !player.ducking) {
        player.frameTimer += deltaTime;
        if (player.frameTimer > player.frameInterval) {
            player.frameTimer = 0;
            player.currentFrame = (player.currentFrame + 1) % 2; // 2 кадра для анимации бега
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
    
    // Создаем новое препятствие каждые spawnInterval миллисекунд
    if (gameSettings.spawnTimer > gameSettings.spawnInterval) {
        gameSettings.spawnTimer = 0;
        
        // Случайный тип препятствия
        const type = obstacles.types[Math.floor(Math.random() * obstacles.types.length)];
        const isBird = type.width === 44; // Если это птица, она летит выше
        
        obstaclesArray.push({
            x: canvas.width,
            y: isBird ? canvas.height - type.height - 70 : canvas.height - type.height - 10,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: gameSettings.currentSpeed,
            isBird: isBird
        });
        
        // Уменьшаем интервал между препятствиями с ростом счета
        gameSettings.spawnInterval = Math.max(500, 1000 - Math.floor(score / 100) * 50);
    }
    
    // Двигаем препятствия
    for (let i = obstaclesArray.length - 1; i >= 0; i--) {
        obstaclesArray[i].x -= obstaclesArray[i].speed;
        
        // Удаляем препятствия, которые вышли за экран
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
    // Упрощенные коллизии (прямоугольник-прямоугольник)
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
// СКРИМЕР ПРИ 1500 ОЧКАХ
// ========================================
function showScrimer() {
    console.log('🎬 Показываем скример!');
    
    // Останавливаем игру
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Пауза видео персонажа
    playerVideo.pause();
    
    // Сохраняем, что уже показали скример
    hasShown1500Record = true;
    localStorage.setItem('shown1500Record', 'true');
    
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
    
    // Создаем видео элемент для скримера
    const scrimerVideoElement = document.createElement('video');
    scrimerVideoElement.id = 'scrimer-video';
    scrimerVideoElement.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        background: #000;
    `;
    scrimerVideoElement.autoplay = true;
    
    // ТЫ ДОБАВИШЬ СВОЮ ССЫЛКУ ЗДЕСЬ:
    // scrimerVideoElement.src = 'ТВОЯ_ССЫЛКА_НА_СКРИМЕР_ВИДЕО.mp4';
    // Пока что поставим заглушку
    scrimerVideoElement.innerHTML = `
        <source src="" type="video/mp4">
        Ваш браузер не поддерживает видео.
    `;
    
    // Когда видео закончится, закрываем скример
    scrimerVideoElement.addEventListener('ended', function() {
        scrimerModal.remove();
        returnToMenu();
    });
    
    // Если ошибка, тоже закрываем
    scrimerVideoElement.addEventListener('error', function() {
        alert('Ошибка загрузки видео скримера. Продолжаем игру!');
        scrimerModal.remove();
        returnToMenu();
    });
    
    // Кнопка закрытия
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        font-size: 24px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10000;
    `;
    closeBtn.addEventListener('click', function() {
        scrimerModal.remove();
        returnToMenu();
    });
    
    scrimerModal.appendChild(scrimerVideoElement);
    scrimerModal.appendChild(closeBtn);
    document.body.appendChild(scrimerModal);
    
    // Пытаемся воспроизвести видео
    setTimeout(() => {
        if (scrimerVideoElement.src) {
            scrimerVideoElement.play().catch(e => {
                console.log('Ошибка воспроизведения скримера:', e);
                scrimerModal.remove();
                returnToMenu();
            });
        } else {
            // Если нет ссылки, просто закрываем
            scrimerModal.remove();
            returnToMenu();
        }
    }, 1000);
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
// ОТРИСОВКА ИГРЫ (как в Chrome)
// ========================================
function drawGame() {
    // Очищаем экран
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон (белый как в Chrome)
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Облака
    drawClouds();
    
    // Земля
    drawGround();
    
    // Препятствия
    drawObstacles();
    
    // Игрок
    drawPlayer();
    
    // Отладочная информация (можно убрать)
    if (score > 1000) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '12px Arial';
        ctx.fillText(`🎯 До скримера: ${1500 - Math.floor(score)}`, 10, 20);
    }
}

function drawClouds() {
    ctx.fillStyle = '#f0f0f0';
    for (let cloud of clouds) {
        // Простые облака
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 5, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    // Земля (серая полоса)
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    
    // Разметка (пунктирная линия)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < canvas.width; i += 24) {
        ctx.fillRect(i + groundOffset, canvas.height - 10, 12, 2);
    }
}

function drawObstacles() {
    for (let obstacle of obstaclesArray) {
        // Тело препятствия
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Детали для кактуса
        if (!obstacle.isBird) {
            ctx.fillStyle = '#4a4a4a';
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
            // Для птицы - крылья
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                   obstacle.width/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Клюв
            ctx.fillStyle = '#ff8c00';
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
            
            // Если пригнулся, масштабируем видео
            if (player.ducking) {
                ctx.drawImage(playerVideo, player.x, player.y, player.width, player.height);
            } else {
                // Анимация бега: небольшое смещение по Y для эффекта бега
                const bounce = player.jumping ? 0 : Math.sin(Date.now() / 100) * 2;
                ctx.drawImage(playerVideo, player.x, player.y + bounce, player.width, player.height);
            }
            
            ctx.restore();
            return;
        } catch (error) {
            console.log('Ошибка рисования видео:', error);
        }
    }
    
    // Запасной вариант: динозавр как в Chrome
    drawDinosaur();
}

function drawDinosaur() {
    // Тело динозавра
    ctx.fillStyle = '#535353';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Ноги (анимация бега)
    ctx.fillStyle = '#535353';
    const legOffset = player.currentFrame * 3;
    
    // Передняя нога
    ctx.fillRect(player.x + 5, player.y + player.height - 5, 8, 10);
    // Задняя нога
    ctx.fillRect(player.x + player.width - 13, player.y + player.height - 5 + legOffset, 8, 10);
    
    // Голова
    ctx.fillRect(player.x + player.width - 10, player.y, 12, 15);
    
    // Глаз
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + player.width - 3, player.y + 4, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + player.width - 2, player.y + 5, 2, 2);
    
    // Рот
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + 12);
    ctx.lineTo(player.x + player.width - 3, player.y + 12);
    ctx.stroke();
    
    // Спинные пластины
    for (let i = 0; i < 4; i++) {
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
            console.log('🎮 Запуск игры');
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
    console.log('✅ Страница загружена');
    
    // Настраиваем управление модальным окном
    setupModalControls();
    
    // Предзагрузка видео персонажа
    playerVideo.load();
    
    console.log('🎮 Игра готова!');
    console.log('🦖 Динозавр как в Chrome');
    console.log('🎯 При 1500 очках - скример!');
});

// ========================================
// ИНСТРУКЦИЯ ДЛЯ ДОБАВЛЕНИЯ СКРИМЕРА
// ========================================
/*
Чтобы добавить видео скримера:
1. Замени строку в функции showScrimer():
   Вместо: scrimerVideoElement.src = ''
   Напиши: scrimerVideoElement.src = 'ТВОЯ_ССЫЛКА_НА_ВИДЕО.mp4'
   
2. Или добавь source теги:
   scrimerVideoElement.innerHTML = `
     <source src="ТВОЯ_ССЫЛКА.mp4" type="video/mp4">
     <source src="ТВОЯ_ССЫЛКА.webm" type="video/webm">
   `;
*/
